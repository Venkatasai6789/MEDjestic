import io
import cv2
import numpy as np
from PIL import Image
import torch
from torchvision import transforms
from model_loader import get_transform

# Direct full-frame resize (ensures all parts of the specimen crop are visible to the transformer)
_direct_transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def preprocess_crop(crop_bgr):
    """Convert an image crop (BGR numpy array) to preprocessed ViT tensor batch [2, 3, 224, 224]."""
    rgb = cv2.cvtColor(crop_bgr, cv2.COLOR_BGR2RGB)
    pil_crop = Image.fromarray(rgb)
    
    crop_transform = get_transform()
    t_crop = crop_transform(pil_crop)
    t_direct = _direct_transform(pil_crop)
    
    tensor = torch.stack([t_direct, t_crop])
    return tensor

def preprocess_image_bytes(image_bytes: bytes):
    """Convert raw image bytes to PIL Image, full tensor, and original BGR image.
    
    Returns:
        tuple: (pil_image, tensor, original_bgr)
    """
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if img_bgr is None:
        pil_img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        img_bgr = cv2.cvtColor(np.array(pil_img), cv2.COLOR_RGB2BGR)
    else:
        pil_img = Image.fromarray(cv2.cvtColor(img_bgr, cv2.COLOR_BGR2RGB))
    
    crop_transform = get_transform()
    t_crop = crop_transform(pil_img)
    t_direct = _direct_transform(pil_img)
    
    tensor = torch.stack([t_direct, t_crop])
    return pil_img, tensor, img_bgr

def validate_image_bytes(image_bytes: bytes) -> bool:
    """Check if bytes represent a valid image."""
    try:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            Image.open(io.BytesIO(image_bytes)).verify()
        return True
    except Exception:
        return False
