from ultralytics import YOLO
import cv2
import os

img_path = r"C:\Users\HARSHA VARDHAN BALA\Downloads\images (6).jpg"
img = cv2.imread(img_path)

models_to_test = [
    r"hf_test_models\sharktide_waste-detection\weights\best.pt",
    r"hf_test_models\HrutikAdsare_waste-detection-yolov8\best.pt",
    r"hf_test_models\gloves\best.pt",
    r"hf_test_models\masks\best.pt",
    r"yolo11m.pt",
]

for p in models_to_test:
    if not os.path.exists(p):
        print("Not found:", p)
        continue
    print(f"\n================ Model: {p} ================")
    m = YOLO(p)
    print("Class names in model:", m.names)
    res = m.predict(img, conf=0.03, device='cpu', verbose=False)
    if res and len(res) > 0 and res[0].boxes is not None:
        boxes = res[0].boxes
        print(f"Boxes detected (conf >= 0.03): {len(boxes)}")
        for b in boxes:
            c_id = int(b.cls[0])
            c_name = m.names.get(c_id, str(c_id))
            conf = float(b.conf[0])
            xyxy = [int(v) for v in b.xyxy[0].tolist()]
            print(f"  {c_name} ({conf:.3f}) -> {xyxy}")
    else:
        print("No boxes detected.")
