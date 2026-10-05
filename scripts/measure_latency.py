import requests
import time
import os

HF_URL = "https://venkat6789-medjestic-ai.hf.space"
images = [
    r"C:\Users\HARSHA VARDHAN BALA\Downloads\images (1).jpg",
    r"C:\Users\HARSHA VARDHAN BALA\Downloads\images (2).jpg",
    r"C:\Users\HARSHA VARDHAN BALA\Downloads\images (3).jpg",
    r"C:\Users\HARSHA VARDHAN BALA\Downloads\images (5).jpg",
]

for img_path in images:
    if not os.path.exists(img_path):
        continue
    filename = os.path.basename(img_path)
    print(f"\n--- Testing {filename} ---")
    t0 = time.time()
    try:
        with open(img_path, "rb") as f:
            files = {"image": (filename, f, "image/jpeg")}
            r = requests.post(f"{HF_URL}/predict", files=files, timeout=60)
        dt = time.time() - t0
        print(f"Status: {r.status_code} in {dt:.2f}s")
        if r.status_code == 200:
            data = r.json()
            print(f"Runtime: {data.get('runtime')} | Fallback reason: {data.get('gpu_fallback_reason')}")
            print(f"Detected: {data.get('detectedType')} ({data.get('confidence')}) | Items: {data.get('itemsCount')}")
            print(f"Bounding boxes count: {len(data.get('boundingBoxes', []))}")
        else:
            print(f"Error: {r.text[:300]}")
    except Exception as e:
        print(f"Exception after {time.time() - t0:.2f}s: {e}")
