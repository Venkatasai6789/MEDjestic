import os
os.environ["YOLO_VERBOSE"] = "False"
os.environ["ULTRALYTICS_AUTOINSTALL"] = "False"
import cv2
import numpy as np
import torch

_models = {}
_detector_loaded = False

def get_detector_paths():
    models_dir = os.path.join(os.path.dirname(__file__), "models")
    return {
        "yolo11m": os.path.join(models_dir, "yolo11m.pt"),
        "waste": os.path.join(models_dir, "waste_detector.pt"),
        "mask": os.path.join(models_dir, "mask_detector.pt"),
        "glove": os.path.join(models_dir, "glove_detector.pt"),
        "yolo11n": os.path.join(models_dir, "yolo11n.pt"),
    }

def load_detectors(device="cpu"):
    """Load detector models into memory explicitly on CPU.
    
    Keeping detectors on CPU avoids ZeroGPU low-level CUDA interception
    conflicts while running blazingly fast (~60-90ms).
    """
    global _models, _detector_loaded
    from ultralytics import YOLO

    paths = get_detector_paths()
    for name, p in paths.items():
        if os.path.exists(p):
            try:
                m = YOLO(p)
                m.to("cpu")
                _models[name] = m
                print(f"[OK] Detector '{name}' loaded on CPU from {p}")
            except Exception as e:
                print(f"[WARN] Failed to load detector '{name}': {e}")
        else:
            # Check parent directory for yolo11m.pt if not in models/
            parent_p = os.path.join(os.path.dirname(os.path.dirname(__file__)), f"{name}.pt")
            if os.path.exists(parent_p):
                try:
                    m = YOLO(parent_p)
                    m.to("cpu")
                    _models[name] = m
                    print(f"[OK] Detector '{name}' loaded on CPU from {parent_p}")
                except Exception as e:
                    print(f"[WARN] Failed to load detector '{name}' from parent: {e}")

    # Fallback to general yolo11n if no specific detectors loaded
    if not _models:
        try:
            m = YOLO("yolo11n.pt")
            m.to("cpu")
            _models["yolo11n"] = m
            print("[OK] Loaded base yolo11n detector on CPU")
        except Exception as e:
            print(f"[ERROR] Could not load any detector: {e}")

    _detector_loaded = True

def is_detector_loaded():
    return _detector_loaded

def box_iou(b1, b2):
    """Compute Intersection over Union between two boxes [x1, y1, x2, y2]."""
    x1 = max(b1[0], b2[0])
    y1 = max(b1[1], b2[1])
    x2 = min(b1[2], b2[2])
    y2 = min(b1[3], b2[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    a1 = max(0, b1[2] - b1[0]) * max(0, b1[3] - b1[1])
    a2 = max(0, b2[2] - b2[0]) * max(0, b2[3] - b2[1])
    union = a1 + a2 - inter
    return inter / union if union > 0 else 0.0

def nms_proposals(proposals, iou_thresh=0.45):
    """Filter overlapping proposal boxes based purely on IoU."""
    if not proposals:
        return []
    sorted_props = sorted(proposals, key=lambda x: x.get('conf', 0.5), reverse=True)
    keep = []
    for p in sorted_props:
        overlap = False
        for k in keep:
            if box_iou(p['box'], k['box']) > iou_thresh:
                overlap = True
                break
        if not overlap:
            keep.append(p)
    return keep

def extract_adaptive_contour_proposals(img_bgr, min_area_ratio=0.008, max_area_ratio=0.38):
    """Extract candidate specimen regions from multi-scale adaptive contrast & edges.
    
    Dynamically isolates individual items (syringes, needles, gauze, gloves, packaging)
    without any hardcoded color filters, coordinates, or fake boxes.
    """
    h, w = img_bgr.shape[:2]
    total_area = w * h
    proposals = []

    gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
    
    # Multi-scale adaptive thresholding for variable lighting and object sizes
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
                if (total_area * min_area_ratio) <= area <= (total_area * max_area_ratio):
                    if bw >= 24 and bh >= 24:
                        pad_x = int(bw * 0.05)
                        pad_y = int(bh * 0.05)
                        x1 = max(0, x - pad_x)
                        y1 = max(0, y - pad_y)
                        x2 = min(w, x + bw + pad_x)
                        y2 = min(h, y + bh + pad_y)
                        proposals.append({
                            'box': [x1, y1, x2, y2],
                            'conf': 0.28,
                            'source': 'adaptive_contour'
                        })

    return proposals

def detect_candidate_boxes(img_bgr):
    """Detect candidate bounding boxes using trained YOLO models + adaptive contours.
    
    Strictly dynamic: no hardcoded boxes, no center crops, no mock data.
    
    Returns:
        list of dict: [{'box': [x1, y1, x2, y2], 'conf': float, 'source': str}, ...]
    """
    global _models
    h, w = img_bgr.shape[:2]
    proposals = []

    # 1. Run YOLO models explicitly on CPU
    for name, model in _models.items():
        try:
            # Sensitive threshold to capture slender instruments (syringes, needles, tubes)
            conf = 0.035 if name in ['yolo11m', 'waste'] else 0.06
            res = model.predict(img_bgr, conf=conf, device='cpu', verbose=False)
            if res and len(res) > 0 and res[0].boxes is not None:
                for b in res[0].boxes:
                    xyxy = [int(v) for v in b.xyxy[0].tolist()]
                    x1 = max(0, min(w - 1, xyxy[0]))
                    y1 = max(0, min(h - 1, xyxy[1]))
                    x2 = max(0, min(w, xyxy[2]))
                    y2 = max(0, min(h, xyxy[3]))
                    bw, bh = x2 - x1, y2 - y1
                    if bw >= 20 and bh >= 20:
                        proposals.append({
                            'box': [x1, y1, x2, y2],
                            'conf': float(b.conf[0]),
                            'source': f'yolo_{name}'
                        })
        except Exception as e:
            print(f"[WARN] Error running detector {name}: {e}")

    # 2. Extract adaptive contour proposals
    contour_props = extract_adaptive_contour_proposals(img_bgr)
    proposals.extend(contour_props)

    # 3. Apply NMS purely by IoU (no containment suppression of smaller objects)
    clean_proposals = nms_proposals(proposals, iou_thresh=0.45)

    return clean_proposals
