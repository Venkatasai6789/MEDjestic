import os
import json

# Model configuration
MODEL_VERSION = "1.0.0"
MODEL_NAME = "MEDjestic-ViT-B16"
MODEL_FULL_NAME = f"{MODEL_NAME}-v{MODEL_VERSION}"
MODEL_PATH = os.environ.get("MODEL_PATH", os.path.join(os.path.dirname(__file__), "models", "best_model.pth"))

# Confidence thresholds (calibrated for 12-class ViT classification)
CONFIDENCE_THRESHOLD = float(os.environ.get("CONFIDENCE_THRESHOLD", "0.20"))
MARGIN_THRESHOLD = float(os.environ.get("MARGIN_THRESHOLD", "0.05"))  # top1-top2 margin for uncertain

# Original model classes (13 including .DS_Store at index 7)
ORIGINAL_MODEL_CLASSES = [
    '(BT) Body Tissue or Organ',
    '(GE) Glass equipment-packaging 551',
    '(ME) Metal equipment -packaging',
    '(OW) Organic wastes',
    '(PE) Plastic equipment-packaging',
    '(PP) Paper equipment-packaging',
    '(SN) Syringe needles',
    '.DS_Store',  # INDEX 7 - INVALID - filesystem artifact
    'Gauze',
    'Gloves',
    'Mask',
    'Syringe',
    'Tweezers'
]

# Clean display names mapped from original indices
DISPLAY_NAMES = {
    0: 'Body Tissue or Organ',
    1: 'Glass Equipment',
    2: 'Metal Equipment',
    3: 'Organic Waste',
    4: 'Plastic Equipment',
    5: 'Paper Equipment',
    6: 'Syringe Needles',
    7: None,  # .DS_Store - INVALID
    8: 'Gauze',
    9: 'Gloves',
    10: 'Masks',
    11: 'Syringes',
    12: 'Tweezers'
}

INVALID_CLASS_INDEX = 7  # .DS_Store
NUM_ORIGINAL_CLASSES = 13

# Valid class names for production
VALID_CLASSES = [name for name in DISPLAY_NAMES.values() if name is not None]

# CORS origins
ALLOWED_ORIGINS = os.environ.get("ALLOWED_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:5000").split(",")

# Server config
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "7860"))  # HuggingFace Spaces default port

# Load waste metadata from class_names.json
def load_waste_metadata():
    json_path = os.path.join(os.path.dirname(__file__), "class_names.json")
    if os.path.exists(json_path):
        with open(json_path, "r") as f:
            data = json.load(f)
        return data.get("waste_metadata", {})
    return {}

WASTE_METADATA = load_waste_metadata()
