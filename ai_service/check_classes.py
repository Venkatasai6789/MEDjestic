from ultralytics import YOLO
import json
import os

best_path = os.path.join(os.path.dirname(__file__), 'best.pt')
if os.path.exists(best_path):
    try:
        model = YOLO(best_path)
        print("MODEL_CLASSES:", model.names)
    except Exception as e:
        print("ERROR:", e)
else:
    print("best.pt not found")
