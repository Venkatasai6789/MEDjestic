import sys
import os
sys.path.insert(0, os.path.abspath("ai_service"))

import cv2
import torch
import numpy as np
from model_loader import load_model, get_model
from preprocessing import preprocess_crop
from config import DISPLAY_NAMES, INVALID_CLASS_INDEX

load_model()
model = get_model()

img_path = r"C:\Users\HARSHA VARDHAN BALA\Downloads\images (6).jpg"
img = cv2.imread(img_path)

# Test candidate crops
test_crops = [
    ("Syringe Left", [108, 103, 270, 278]),
    ("Syringe Right", [331, 118, 611, 254]),
    ("Gloves Center", [245, 45, 539, 362]),
    ("Glove Top", [344, 54, 551, 253]),
    ("Full Bin", [144, 14, 591, 413]),
]

print("\n--- ViT-B/16 Classification for each crop ---")
for name, box in test_crops:
    x1, y1, x2, y2 = box
    crop = img[y1:y2, x1:x2]
    crop_tensor = preprocess_crop(crop) # [2, 3, 224, 224]
    
    with torch.no_grad():
        logits = model(crop_tensor)
        probs_all = torch.softmax(logits, dim=1).cpu().numpy()
        probs = probs_all.mean(axis=0)
    
    probs[INVALID_CLASS_INDEX] = 0.0
    probs /= probs.sum()
    
    sorted_idx = np.argsort(probs)[::-1]
    top1_name = DISPLAY_NAMES.get(sorted_idx[0])
    top1_conf = probs[sorted_idx[0]]
    top2_name = DISPLAY_NAMES.get(sorted_idx[1])
    top2_conf = probs[sorted_idx[1]]
    top3_name = DISPLAY_NAMES.get(sorted_idx[2])
    top3_conf = probs[sorted_idx[2]]
    
    print(f"\n{name} {box}:")
    print(f"  1. {top1_name} ({top1_conf*100:.1f}%)")
    print(f"  2. {top2_name} ({top2_conf*100:.1f}%)")
    print(f"  3. {top3_name} ({top3_conf*100:.1f}%)")
