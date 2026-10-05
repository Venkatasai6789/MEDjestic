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

# Load ViT model
load_model()
vit_model = get_model()

# Copy yolo11m.pt to ai_service/models if not present
src_m = "yolo11m.pt"
dst_m = os.path.join("ai_service", "models", "yolo11m.pt")
if os.path.exists(src_m) and not os.path.exists(dst_m):
    import shutil
    shutil.copy(src_m, dst_m)
    print(f"Copied {src_m} -> {dst_m}")

def box_iou(b1, b2):
    x1 = max(b1[0], b2[0])
    y1 = max(b1[1], b2[1])
    x2 = min(b1[2], b2[2])
    y2 = min(b1[3], b2[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    a1 = (b1[2] - b1[0]) * (b1[3] - b1[1])
    a2 = (b2[2] - b2[0]) * (b2[3] - b2[1])
    return inter / float(a1 + a2 - inter) if (a1 + a2 - inter) > 0 else 0

def nms_iou(boxes, iou_thresh=0.40):
    if not boxes:
        return []
    sorted_b = sorted(boxes, key=lambda x: x.get('conf', 0.5), reverse=True)
    keep = []
    for b in sorted_b:
        overlap = False
        for k in keep:
            if box_iou(b['box'], k['box']) > iou_thresh:
                overlap = True
                break
        if not overlap:
            keep.append(b)
    return keep

# Load detector models
models_dict = {}
detector_configs = [
    ("yolo11m", os.path.join("ai_service", "models", "yolo11m.pt")),
    ("waste", os.path.join("ai_service", "models", "waste_detector.pt")),
    ("mask", os.path.join("ai_service", "models", "mask_detector.pt")),
    ("glove", os.path.join("ai_service", "models", "glove_detector.pt")),
]

for name, p in detector_configs:
    if os.path.exists(p):
        models_dict[name] = YOLO(p)
        print(f"[OK] Loaded {name} from {p}")

def extract_adaptive_contour_proposals(img_bgr):
    h, w = img_bgr.shape[:2]
    total_area = w * h
    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    proposals = []
    
    # 1. Multi-scale adaptive thresholding to extract individual equipment contours
    for block_size in [21, 35, 51]:
        for C_val in [3, 7]:
            thresh = cv2.adaptiveThreshold(
                gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
                cv2.THRESH_BINARY_INV, block_size, C_val
            )
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
            dilated = cv2.dilate(thresh, kernel, iterations=1)
            contours, _ = cv2.findContours(dilated, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
            for c in contours:
                x, y, bw, bh = cv2.boundingRect(c)
                area = bw * bh
                aspect = bw / float(bh)
                # Keep individual items between 0.8% and 35% of total image area
                if (total_area * 0.008) <= area <= (total_area * 0.35):
                    if bw >= 25 and bh >= 25:
                        pad_x = int(bw * 0.06)
                        pad_y = int(bh * 0.06)
                        x1 = max(0, x - pad_x)
                        y1 = max(0, y - pad_y)
                        x2 = min(w, x + bw + pad_x)
                        y2 = min(h, y + bh + pad_y)
                        proposals.append({
                            'box': [x1, y1, x2, y2],
                            'conf': 0.25,
                            'source': 'adaptive_contour'
                        })
    return proposals

def run_test_on_image(img_path):
    img = cv2.imread(img_path)
    if img is None:
        print("Cannot read:", img_path)
        return
    h, w = img.shape[:2]
    print(f"\n=======================================================")
    print(f"Testing: {os.path.basename(img_path)} ({w}x{h})")
    print(f"=======================================================")
    
    raw_proposals = []
    
    # 1. YOLO detectors
    for name, model in models_dict.items():
        try:
            # Sensitive conf threshold to catch slender instruments & equipment
            conf = 0.035 if name in ['yolo11m', 'waste'] else 0.06
            res = model.predict(img, conf=conf, device='cpu', verbose=False)
            if res and len(res) > 0 and res[0].boxes is not None:
                for b in res[0].boxes:
                    xyxy = [int(v) for v in b.xyxy[0].tolist()]
                    x1 = max(0, min(w - 1, xyxy[0]))
                    y1 = max(0, min(h - 1, xyxy[1]))
                    x2 = max(0, min(w, xyxy[2]))
                    y2 = max(0, min(h, xyxy[3]))
                    bw, bh = x2 - x1, y2 - y1
                    if bw >= 20 and bh >= 20:
                        raw_proposals.append({
                            'box': [x1, y1, x2, y2],
                            'conf': float(b.conf[0]),
                            'source': f'yolo_{name}'
                        })
        except Exception as e:
            print(f"Detector error {name}: {e}")
            
    # 2. Adaptive contour proposals
    contour_props = extract_adaptive_contour_proposals(img)
    raw_proposals.extend(contour_props)
    
    # 3. NMS on proposals
    clean_proposals = nms_iou(raw_proposals, iou_thresh=0.50)
    print(f"Clean candidate proposals: {len(clean_proposals)}")
    
    # 4. ViT forward pass in batch
    crop_tensors = []
    valid_props = []
    for p in clean_proposals:
        x1, y1, x2, y2 = p['box']
        crop = img[y1:y2, x1:x2]
        if crop.size == 0:
            continue
        t = preprocess_crop(crop)
        crop_tensors.append(t)
        valid_props.append(p)
        
    if not crop_tensors:
        print("No crops to classify.")
        return
        
    batch_tensor = torch.cat(crop_tensors, dim=0)
    with torch.no_grad():
        logits = vit_model(batch_tensor)
        probs_all = torch.softmax(logits, dim=1).cpu().numpy()
        
    candidate_dets = []
    for i, prop in enumerate(valid_props):
        p1 = probs_all[2 * i]
        p2 = probs_all[2 * i + 1]
        probs = ((p1 + p2) / 2.0).copy()
        probs[INVALID_CLASS_INDEX] = 0.0
        probs /= probs.sum()
        
        sorted_idx = np.argsort(probs)[::-1]
        top1_idx = int(sorted_idx[0])
        top1_conf = float(probs[top1_idx])
        lbl = DISPLAY_NAMES.get(top1_idx, "Medical Waste")
        
        bw = prop['box'][2] - prop['box'][0]
        bh = prop['box'][3] - prop['box'][1]
        area_ratio = (bw * bh) / float(w * h)
        
        # Don't let a giant box (>55% of image) swallow items if small items exist
        if top1_conf >= 0.22:
            candidate_dets.append({
                'box': prop['box'],
                'label': lbl,
                'confidence': round(top1_conf, 4),
                'area_ratio': area_ratio,
                'source': prop['source']
            })
            
    # If smaller valid items (<45% area) exist, discard giant boxes (>55% area)
    small_items = [d for d in candidate_dets if d['area_ratio'] <= 0.45]
    if len(small_items) >= 2:
        candidate_dets = [d for d in candidate_dets if d['area_ratio'] <= 0.55]
        
    # NMS with pure IoU (NO containment suppression!)
    candidate_dets = sorted(candidate_dets, key=lambda x: x['confidence'], reverse=True)
    final_dets = []
    for cd in candidate_dets:
        overlap = False
        for fd in final_dets:
            if box_iou(cd['box'], fd['box']) > 0.38:
                overlap = True
                break
        if not overlap:
            final_dets.append(cd)
            
    print(f"Final Detected Items: {len(final_dets)}")
    for i, d in enumerate(final_dets):
        print(f"  Item #{i+1}: {d['label']:22s} ({d['confidence']*100:.1f}%) Box: {d['box']} [{d['source']}]")

run_test_on_image(r"C:\Users\HARSHA VARDHAN BALA\Downloads\images (6).jpg")
run_test_on_image(r"C:\Users\HARSHA VARDHAN BALA\Downloads\images (1).jpg")
run_test_on_image(r"C:\Users\HARSHA VARDHAN BALA\Downloads\images (5).jpg")
