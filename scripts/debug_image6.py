import sys
import os
sys.path.insert(0, os.path.abspath("ai_service"))

import cv2
import numpy as np
from detector import get_detector_paths, load_detectors, _models, detect_candidate_boxes
from model_loader import load_model, get_model
from ultralytics import YOLO

img_path = r"C:\Users\HARSHA VARDHAN BALA\Downloads\images (6).jpg"
if not os.path.exists(img_path):
    print("File not found:", img_path)
    sys.exit(1)

img = cv2.imread(img_path)
h, w = img.shape[:2]
print(f"Loaded image: {img_path} ({w}x{h})")

# Load detectors
load_detectors()
print("Loaded models:", list(_models.keys()))

# Run each detector individually with very low confidence
for name, model in _models.items():
    print(f"\n--- Detector: {name} ---")
    results = model.predict(img, conf=0.01, device='cpu', verbose=False)
    if results and len(results) > 0 and results[0].boxes is not None:
        boxes = results[0].boxes
        print(f"Total raw boxes found with conf >= 0.01: {len(boxes)}")
        for i, b in enumerate(boxes[:10]):
            cls_id = int(b.cls[0])
            cls_name = model.names.get(cls_id, str(cls_id)) if hasattr(model, 'names') else str(cls_id)
            conf = float(b.conf[0])
            xyxy = [int(v) for v in b.xyxy[0].tolist()]
            print(f"  Box {i+1}: class={cls_name} ({cls_id}) conf={conf:.3f} xyxy={xyxy}")
    else:
        print("No boxes found.")

# Now run detect_candidate_boxes
proposals = detect_candidate_boxes(img)
print(f"\nTotal candidate proposals returned: {len(proposals)}")
for i, p in enumerate(proposals):
    print(f"  Proposal {i+1}: {p}")
