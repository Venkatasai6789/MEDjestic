import sys
import os
sys.path.insert(0, os.path.abspath("ai_service"))

import cv2
from preprocessing import preprocess_image_bytes
from inference import run_two_stage_inference
from postprocessing import build_multi_object_response
from model_loader import load_model

load_model()

img_path = r"C:\Users\HARSHA VARDHAN BALA\Downloads\images (6).jpg"
with open(img_path, "rb") as f:
    img_bytes = f.read()

_, _, img_bgr = preprocess_image_bytes(img_bytes)
dets, runtime, fallback = run_two_stage_inference(img_bgr)
resp = build_multi_object_response(dets, img_bgr, runtime=runtime, fallback_reason=fallback)

print("=" * 60)
print(f"RESULTS FOR {os.path.basename(img_path)}:")
print("=" * 60)
print(f"Primary detectedType: {resp['detectedType']} ({resp['confidence']*100:.1f}%)")
print(f"Total itemsCount:     {resp['itemsCount']}")
print(f"Runtime:              {resp['runtime']}")
print(f"Fallback reason:      {resp['gpu_fallback_reason']}")
print(f"Stream breakdown:     {resp['streamBreakdown']}")
print("\nIndividual Detections:")
for i, d in enumerate(resp['detections'][:8]):
    print(f"  #{i+1}: {d['label']} ({d['confidence']*100:.1f}%) Box: {d['box']} Category: {d['category']}")
