try:
    import spaces
except ImportError:
    class _MockSpaces:
        def GPU(self, fn=None, **kwargs):
            if fn is not None:
                return fn
            def decorator(f):
                return f
            return decorator
    spaces = _MockSpaces()

import torch
import numpy as np
import cv2
from model_loader import get_model, get_device
from detector import detect_candidate_boxes, box_iou
from preprocessing import preprocess_crop, preprocess_image_bytes
from config import DISPLAY_NAMES, INVALID_CLASS_INDEX, CONFIDENCE_THRESHOLD, MARGIN_THRESHOLD

@spaces.GPU(duration=30)
def _infer_vit_cuda(model, tensor):
    """Executes batched ViT forward pass under active ZeroGPU allocation."""
    if next(model.parameters()).device.type != 'cuda':
        model.to('cuda')
    if tensor.device.type != 'cuda':
        tensor = tensor.to('cuda')
    with torch.inference_mode():
        logits = model(tensor)
        probs_all = torch.softmax(logits, dim=1).cpu().numpy()
    return probs_all

def infer_vit_batch(batch_tensor):
    """Executes batched ViT forward pass with automatic ZeroGPU-first and CPU fallback.
    
    1. Attempts GPU execution if CUDA is available and ZeroGPU quota permits.
    2. Instantly falls back to multi-core CPU if quota is reached or CUDA error occurs.
    
    Returns:
        tuple: (probs_all: np.ndarray, runtime: str, fallback_reason: str or None)
    """
    model = get_model()
    probs_all = None
    runtime = "cpu"
    fallback_reason = None

    # 1. Attempt GPU execution if CUDA is available and quota permits
    if torch.cuda.is_available():
        try:
            probs_all = _infer_vit_cuda(model, batch_tensor)
            runtime = "gpu"
        except Exception as e:
            fallback_reason = str(e)
            print(f"[FALLBACK] ZeroGPU quota/limit reached ({e}). Seamlessly running on multi-core CPU...")
            probs_all = None

    # 2. CPU Fallback execution (guaranteed to succeed without any quota restrictions)
    if probs_all is None:
        runtime = "cpu"
        if next(model.parameters()).device.type != 'cpu':
            model.to('cpu')
        if batch_tensor.device.type != 'cpu':
            batch_tensor = batch_tensor.to('cpu')
        with torch.inference_mode():
            logits = model(batch_tensor)
            probs_all = torch.softmax(logits, dim=1).cpu().numpy()

    return probs_all, runtime, fallback_reason

def run_vit_inference(tensor):
    """Compatibility helper for single-specimen ViT inference."""
    probs_all, _, _ = infer_vit_batch(tensor)
    if probs_all.ndim == 2 and probs_all.shape[0] > 1:
        probs = probs_all.mean(axis=0)
    else:
        probs = probs_all[0] if probs_all.ndim == 2 else probs_all

    # Zero out invalid .DS_Store index
    if len(probs) > INVALID_CLASS_INDEX:
        probs[INVALID_CLASS_INDEX] = 0.0
    total = probs.sum()
    if total > 0:
        probs = probs / total

    # Sort candidates
    sorted_indices = np.argsort(probs)[::-1]
    top1_idx = int(sorted_indices[0])
    top1_conf = float(probs[top1_idx])
    top2_idx = int(sorted_indices[1]) if len(sorted_indices) > 1 else -1
    top2_conf = float(probs[top2_idx]) if top2_idx >= 0 else 0.0

    predicted_class = DISPLAY_NAMES.get(top1_idx, "Medical Waste")

    is_uncertain = False
    uncertainty_reason = None
    if top1_conf < CONFIDENCE_THRESHOLD:
        is_uncertain = True
        uncertainty_reason = f'Moderate confidence ({top1_conf:.1%}). Clinical confirmation recommended.'
    elif (top1_conf - top2_conf) < MARGIN_THRESHOLD and top2_idx >= 0:
        is_uncertain = True
        top2_name = DISPLAY_NAMES.get(top2_idx, 'Unknown')
        uncertainty_reason = f'Ambiguous: {predicted_class} ({top1_conf:.1%}) vs {top2_name} ({top2_conf:.1%})'

    all_probs = {}
    for idx, prob in enumerate(probs):
        name = DISPLAY_NAMES.get(idx)
        if name is not None:
            all_probs[name] = round(float(prob), 4)

    return {
        'predicted_class': predicted_class,
        'confidence': round(top1_conf, 4),
        'all_probabilities': all_probs,
        'is_uncertain': is_uncertain,
        'uncertainty_reason': uncertainty_reason,
        'raw_index': top1_idx
    }

def run_two_stage_inference(img_bgr, tracker=None):
    """Run Two-Stage Multi-Object Detection + ViT Crop Classification.
    
    Stage 1: YOLO detectors locate candidate object bounding boxes.
    Stage 2: ViT-B/16 classifies all candidate crops in a SINGLE batched forward pass.
    Stage 3: Optional ByteTrack tracker associates objects across frames.
    
    Returns:
        tuple: (filtered_detections: list, runtime: str, fallback_reason: str or None)
    """
    h, w = img_bgr.shape[:2]
    
    # 1. Stage 1: Get candidate proposal bounding boxes
    proposals = detect_candidate_boxes(img_bgr)
    
    valid_proposals = []
    crop_tensors = []
    
    for prop in proposals:
        x1, y1, x2, y2 = prop['box']
        bw = x2 - x1
        bh = y2 - y1
        if bw < 15 or bh < 15:
            continue
            
        crop_bgr = img_bgr[y1:y2, x1:x2]
        if crop_bgr.size == 0:
            continue
            
        # Generates [2, 3, 224, 224] tensor (direct resize + standard crop)
        crop_t = preprocess_crop(crop_bgr)
        crop_tensors.append(crop_t)
        valid_proposals.append(prop)

    candidate_detections = []
    runtime = "cpu"
    fallback_reason = None

    # 2. Stage 2: Batch inference on all candidate crops in ONE forward pass
    if crop_tensors:
        batch_tensor = torch.cat(crop_tensors, dim=0)  # Shape: [2 * K, 3, 224, 224]
        probs_all, runtime, fallback_reason = infer_vit_batch(batch_tensor)
        
        for i, prop in enumerate(valid_proposals):
            # Average the 2 views for this crop
            p1 = probs_all[2 * i]
            p2 = probs_all[2 * i + 1]
            probs = ((p1 + p2) / 2.0).copy()
            
            # Zero out invalid .DS_Store index
            if len(probs) > INVALID_CLASS_INDEX:
                probs[INVALID_CLASS_INDEX] = 0.0
            total = probs.sum()
            if total > 0:
                probs = probs / total
                
            sorted_indices = np.argsort(probs)[::-1]
            top1_idx = int(sorted_indices[0])
            top1_conf = float(probs[top1_idx])
            top2_idx = int(sorted_indices[1]) if len(sorted_indices) > 1 else -1
            top2_conf = float(probs[top2_idx]) if top2_idx >= 0 else 0.0
            
            predicted_class = DISPLAY_NAMES.get(top1_idx, "Medical Waste")
            
            is_uncertain = False
            uncertainty_reason = None
            if top1_conf < CONFIDENCE_THRESHOLD:
                is_uncertain = True
                uncertainty_reason = f'Moderate confidence ({top1_conf:.1%}). Clinical confirmation recommended.'
            elif (top1_conf - top2_conf) < MARGIN_THRESHOLD and top2_idx >= 0:
                is_uncertain = True
                top2_name = DISPLAY_NAMES.get(top2_idx, 'Unknown')
                uncertainty_reason = f'Ambiguous: {predicted_class} ({top1_conf:.1%}) vs {top2_name} ({top2_conf:.1%})'
                
            all_probs = {}
            for idx, prob in enumerate(probs):
                name = DISPLAY_NAMES.get(idx)
                if name is not None:
                    all_probs[name] = round(float(prob), 4)
                    
            bw = prop['box'][2] - prop['box'][0]
            bh = prop['box'][3] - prop['box'][1]
            area_ratio = (bw * bh) / float(w * h)
            
            if top1_conf >= 0.22:
                candidate_detections.append({
                    'box': prop['box'],
                    'label': predicted_class,
                    'confidence': round(top1_conf, 4),
                    'all_probabilities': all_probs,
                    'is_uncertain': is_uncertain,
                    'uncertainty_reason': uncertainty_reason,
                    'area_ratio': area_ratio,
                    'source': prop.get('source', 'stage1')
                })

    # If multiple distinct small objects exist, discard giant container boxes (>55% image area)
    small_objects = [d for d in candidate_detections if d.get('area_ratio', 1.0) <= 0.45]
    if len(small_objects) >= 2:
        candidate_detections = [d for d in candidate_detections if d.get('area_ratio', 1.0) <= 0.55]

    # 3. Non-Maximum Suppression to remove duplicate boxes (pure IoU matching - no containment suppression!)
    candidate_detections = sorted(candidate_detections, key=lambda x: x['confidence'], reverse=True)
    filtered_detections = []
    for cd in candidate_detections:
        overlap = False
        for fd in filtered_detections:
            iou = box_iou(cd['box'], fd['box'])
            if iou > 0.38:
                overlap = True
                break
        if not overlap:
            filtered_detections.append(cd)

    # 4. If no candidate detections survived, fall back to whole image
    if not filtered_detections:
        full_tensor = preprocess_crop(img_bgr)
        probs_all, runtime, fallback_reason = infer_vit_batch(full_tensor)
        probs = probs_all.mean(axis=0).copy()
        if len(probs) > INVALID_CLASS_INDEX:
            probs[INVALID_CLASS_INDEX] = 0.0
        total = probs.sum()
        if total > 0:
            probs = probs / total
        sorted_indices = np.argsort(probs)[::-1]
        top1_idx = int(sorted_indices[0])
        top1_conf = float(probs[top1_idx])
        predicted_class = DISPLAY_NAMES.get(top1_idx, "Medical Waste")
        all_probs = {DISPLAY_NAMES.get(idx): round(float(prob), 4) for idx, prob in enumerate(probs) if DISPLAY_NAMES.get(idx) is not None}
        filtered_detections.append({
            'box': [0, 0, w, h],
            'label': predicted_class,
            'confidence': round(top1_conf, 4),
            'all_probabilities': all_probs,
            'is_uncertain': top1_conf < CONFIDENCE_THRESHOLD,
            'uncertainty_reason': None,
            'source': 'full_fallback'
        })

    # 5. Assign IDs
    for idx, det in enumerate(filtered_detections):
        det['id'] = idx + 1
        det['track_id'] = idx + 1

    # 6. Apply Tracker if provided (for webcam frames & video)
    if tracker is not None:
        filtered_detections = tracker.update(filtered_detections)

    return filtered_detections, runtime, fallback_reason
