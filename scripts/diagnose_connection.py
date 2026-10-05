import requests
import json
import os
import sys

HF_URL = "https://venkat6789-medjestic-ai.hf.space"
LOCAL_AI_URL = "http://localhost:7860"
LOCAL_SERVER_URL = "http://localhost:5000"
LOCAL_FRONTEND_URL = "http://localhost:5173"

print("=" * 60)
print("1. TESTING HUGGING FACE SPACE ENDPOINTS")
print("=" * 60)

try:
    print(f"Pinging {HF_URL}/health ...")
    r = requests.get(f"{HF_URL}/health", timeout=10)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text[:500]}")
except Exception as e:
    print(f"[FAILED] Hugging Face /health: {e}")

try:
    print(f"\nPinging {HF_URL}/model/info ...")
    r = requests.get(f"{HF_URL}/model/info", timeout=10)
    print(f"Status: {r.status_code}")
    print(f"Response: {r.text[:500]}")
except Exception as e:
    print(f"[FAILED] Hugging Face /model/info: {e}")

test_img_path = r"C:\Users\HARSHA VARDHAN BALA\Downloads\images (1).jpg"
if os.path.exists(test_img_path):
    print(f"\nTesting {HF_URL}/predict with {test_img_path} ...")
    try:
        with open(test_img_path, "rb") as f:
            files = {"image": ("test.jpg", f, "image/jpeg")}
            r = requests.post(f"{HF_URL}/predict", files=files, timeout=35)
        print(f"Status: {r.status_code}")
        if r.status_code == 200:
            data = r.json()
            print("Successfully received prediction:")
            print(f"  Detected Type: {data.get('detectedType')}")
            print(f"  Confidence: {data.get('confidence')}")
            print(f"  Items Count: {data.get('itemsCount')}")
            print(f"  Runtime: {data.get('runtime')}")
            print(f"  Bounding Boxes: {len(data.get('boundingBoxes', []))}")
            for i, det in enumerate(data.get('detections', [])[:3]):
                print(f"    - Detection #{i+1}: {det.get('label')} ({det.get('confidence')}) Box: {det.get('box')}")
        else:
            print(f"Error text: {r.text[:500]}")
    except Exception as e:
        print(f"[FAILED] Hugging Face /predict: {e}")
else:
    print(f"Image not found at {test_img_path}")

print("\n" + "=" * 60)
print("2. TESTING LOCAL AI SERVICE (PORT 7860)")
print("=" * 60)
try:
    r = requests.get(f"{LOCAL_AI_URL}/health", timeout=5)
    print(f"Status: {r.status_code}, Response: {r.text[:200]}")
except Exception as e:
    print(f"[FAILED] Local AI /health: {e}")

print("\n" + "=" * 60)
print("3. TESTING LOCAL BACKEND (EXPRESS PORT 5000)")
print("=" * 60)
try:
    r = requests.get(f"{LOCAL_SERVER_URL}/api/health", timeout=5)
    print(f"Status: {r.status_code}, Response: {r.text[:200]}")
except Exception as e:
    print(f"[FAILED] Express /api/health: {e}")

print("\n" + "=" * 60)
print("4. TESTING LOCAL FRONTEND (VITE PORT 5173)")
print("=" * 60)
try:
    r = requests.get(f"{LOCAL_FRONTEND_URL}", timeout=5)
    print(f"Status: {r.status_code}, Head content: {r.text[:200]}")
except Exception as e:
    print(f"[FAILED] Frontend: {e}")
