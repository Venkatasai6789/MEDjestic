import torch
import torch.nn as nn
from torchvision.models import vit_b_16, ViT_B_16_Weights
import os
from config import MODEL_PATH, NUM_ORIGINAL_CLASSES, MODEL_FULL_NAME
from detector import load_detectors

_model = None
_transform = None
_device = None
_model_loaded = False

def get_device():
    global _device
    if _device is None:
        # Prioritize CPU to eliminate Hugging Face ZeroGPU quota limits and hangs
        force_cpu = os.environ.get("FORCE_CPU", "true").lower() == "true"
        if force_cpu:
            _device = torch.device("cpu")
        else:
            _device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    return _device

def build_model():
    """Build ViT-B/16 model with same architecture as training."""
    weights = ViT_B_16_Weights.DEFAULT
    model = vit_b_16(weights=weights)
    # Replace classification head to match training (13 classes including .DS_Store)
    model.heads.head = nn.Linear(in_features=768, out_features=NUM_ORIGINAL_CLASSES)
    return model, weights

def load_model():
    """Load ViT classifier and YOLO detectors at startup. Do NOT call per-request."""
    global _model, _transform, _model_loaded
    
    device = get_device()
    model, weights = build_model()
    
    model_file = MODEL_PATH
    if not os.path.exists(model_file):
        try:
            from huggingface_hub import hf_hub_download
            print("[INFO] Fetching ViT model weights from Venkat6789/MEDjestic-medical-waste-model...")
            model_file = hf_hub_download(
                repo_id="Venkat6789/MEDjestic-medical-waste-model",
                filename="best_model.pth"
            )
        except Exception as e:
            print(f"[WARN] Hugging Face Hub download failed: {e}")

    if os.path.exists(model_file):
        state_dict = torch.load(model_file, map_location=device, weights_only=True)
        model.load_state_dict(state_dict)
        print(f"[OK] {MODEL_FULL_NAME} loaded from {model_file}")
    else:
        print(f"[WARN] Model weights not found. Using pretrained ViT-B/16 base weights.")
    
    model.to(device)
    model.eval()
    _model = model
    
    # Use same transforms as training (from pretrained weights)
    _transform = weights.transforms()
    _model_loaded = True
    
    print(f"[OK] ViT Model ready on {device}. Classes: {NUM_ORIGINAL_CLASSES}")

    # Load Stage 1 YOLO detectors explicitly on CPU (avoids ZeroGPU CUDA emulation conflicts)
    try:
        load_detectors(device="cpu")
        print("[OK] Stage 1 YOLO Detectors initialized on CPU.")
    except Exception as e:
        print(f"[WARN] Error initializing Stage 1 detectors: {e}")

def get_model():
    if _model is None:
        raise RuntimeError("Model not loaded. Call load_model() at startup.")
    return _model

def get_transform():
    if _transform is None:
        raise RuntimeError("Transform not loaded. Call load_model() at startup.")
    return _transform

def is_model_loaded():
    return _model_loaded
