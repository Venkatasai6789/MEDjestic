from ultralytics import YOLOWorld
import cv2
import os

img_path = r"C:\Users\HARSHA VARDHAN BALA\Downloads\images (6).jpg"
img = cv2.imread(img_path)
print("Image loaded:", img.shape)

model_path = "yolov8s-worldv2.pt"
print(f"Loading {model_path}...")
model = YOLOWorld(model_path)

# Set custom medical waste classes
medical_classes = [
    "syringe",
    "needle",
    "medical glove",
    "rubber glove",
    "latex glove",
    "surgical mask",
    "gauze",
    "plastic packaging",
    "medical container",
    "vial",
    "tweezers"
]
model.set_classes(medical_classes)

print("\nPredicting on images (6).jpg with YOLO-World...")
results = model.predict(img, conf=0.05, device='cpu', verbose=False)

if results and len(results) > 0 and results[0].boxes is not None:
    boxes = results[0].boxes
    print(f"Found {len(boxes)} boxes:")
    for i, b in enumerate(boxes):
        cls_id = int(b.cls[0])
        cls_name = medical_classes[cls_id] if cls_id < len(medical_classes) else str(cls_id)
        conf = float(b.conf[0])
        xyxy = [int(v) for v in b.xyxy[0].tolist()]
        print(f"  Box {i+1}: {cls_name} ({conf:.3f}) -> {xyxy}")
else:
    print("No boxes detected.")
