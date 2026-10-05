import sys
import os
sys.path.insert(0, os.path.abspath("ai_service"))

import cv2
import torch
import numpy as np
from ultralytics import YOLO
from model_loader import load_model, get_model
from preprocessing import preprocess_crop
from config import DISPLAY_NAMES, INVALID_CLASS_INDEX

# 1. Load ViT model
load_model()
vit_model = get_model()

# 2. Load detector
detector_path = "yolo11m.pt"
print(f"Loading {detector_path}...")
det = YOLO(detector_path)

img_path = r"C:\Users\HARSHA VARDHAN BALA\Downloads\images (6).jpg"
img = cv2.imread(img_path)
h, w = img.shape[:2]

# Run detector
res = det.predict(img, conf=0.03, device='cpu', verbose=False)
boxes = []
if res and len(res) > 0 and res[0].boxes is not None:
    for b in res[0].boxes:
        xyxy = [int(v) for v in b.xyxy[0].tolist()]
        x1 = max(0, min(w - 1, xyxy[0]))
        y1 = max(0, min(h - 1, xyxy[1]))
        x2 = max(0, min(w, xyxy[2]))
        y2 = max(0, min(h, xyxy[3]))
        bw = x2 - x1
        bh = y2 - y1
        area = bw * bh
        # Keep non-trivial boxes
        if bw >= 20 and bh >= 20:
            boxes.append({'box': [x1, y1, x2, y2], 'det_conf': float(b.conf[0]), 'cls': det.names[int(b.cls[0])]})

print(f"\nRaw detector boxes: {len(boxes)}")
for b in boxes:
    print(f"  {b['cls']} ({b['det_conf']:.2f}) -> {b['box']}")

# Add adaptive contour proposals to catch any missed items
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
for block_size in [25, 45]:
    thresh = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, block_size, 4)
    kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
    dilated = cv2.dilate(thresh, kernel, iterations=1)
    contours, _ = cv2.findContours(dilated, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    for c in contours:
        x, y, bw, bh = cv2.boundingRect(c)
        area = bw * bh
        if (w * h * 0.015) <= area <= (w * h * 0.35) and bw >= 25 and bh >= 25:
            boxes.append({'box': [x, y, x + bw, y + bh], 'det_conf': 0.20, 'cls': 'contour'})

# Classify each proposal with ViT
crop_tensors = []
valid_props = []
for p in boxes:
    x1, y1, x2, y2 = p['box']
    crop = img[y1:y2, x1:x2]
    if crop.size == 0:
        continue
    t = preprocess_crop(crop)
    crop_tensors.append(t)
    valid_props.append(p)

batch_tensor = torch.cat(crop_tensors, dim=0)
with torch.no_grad():
    logits = vit_model(batch_tensor)
    probs_all = torch.softmax(logits, dim=1).cpu().numpy()

detections = []
for i, prop in enumerate(valid_props):
    p1 = probs_all[2 * i]
    p2 = probs_all[2 * i + 1]
    probs = ((p1 + p2) / 2.0).copy()
    probs[INVALID_CLASS_INDEX] = 0.0
    probs /= probs.sum()
    
    top1_idx = int(np.argmax(probs))
    top1_conf = float(probs[top1_idx])
    lbl = DISPLAY_NAMES.get(top1_idx, "Medical Waste")
    
    # Don't keep whole-image/container boxes if smaller objects are present
    bw = prop['box'][2] - prop['box'][0]
    bh = prop['box'][3] - prop['box'][1]
    is_giant = (bw * bh) > (w * h * 0.65)
    
    if top1_conf >= 0.25 and not is_giant:
        detections.append({
            'box': prop['box'],
            'label': lbl,
            'confidence': round(top1_conf, 4),
            'det_source': prop['cls']
        })

print(f"\nViT Classified Detections (before NMS): {len(detections)}")
for d in detections:
    print(f"  {d['label']} ({d['confidence']}) from {d['det_source']} -> {d['box']}")

# NMS with IoU deduplication only (NO containment suppression of smaller objects!)
detections = sorted(detections, key=lambda x: x['confidence'], reverse=True)
final_dets = []

def box_iou(b1, b2):
    x1 = max(b1[0], b2[0])
    y1 = max(b1[1], b2[1])
    x2 = min(b1[2], b2[2])
    y2 = min(b1[3], b2[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    a1 = (b1[2] - b1[0]) * (b1[3] - b1[1])
    a2 = (b2[2] - b2[0]) * (b2[3] - b2[1])
    return inter / float(a1 + a2 - inter) if (a1 + a2 - inter) > 0 else 0

for d in detections:
    overlap = False
    for fd in final_dets:
        if box_iou(d['box'], fd['box']) > 0.40:
            overlap = True
            break
    if not overlap:
        final_dets.append(d)

print(f"\nFinal Non-Overlapping Multi-Object Detections: {len(final_dets)}")
for i, d in enumerate(final_dets):
    print(f"  #{i+1}: {d['label']} ({d['confidence']*100:.1f}%) Box: {d['box']} [{d['det_source']}]")
