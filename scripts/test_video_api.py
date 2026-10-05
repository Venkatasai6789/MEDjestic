import requests
import time
import os
import cv2

HF_URL = "https://venkat6789-medjestic-ai.hf.space"

# Create a small test video
vid_path = "test_vid.mp4"
img = cv2.imread(r"C:\Users\HARSHA VARDHAN BALA\Downloads\images (1).jpg")
if img is None:
    img = (cv2.randn(cv2.Mat((240, 320, 3), cv2.CV_8UC3), 128, 50))
vh, vw = img.shape[:2]
out = cv2.VideoWriter(vid_path, cv2.VideoWriter_fourcc(*'mp4v'), 10, (vw, vh))
for _ in range(15):
    out.write(img)
out.release()

print("1. Uploading video to HF Space...")
with open(vid_path, "rb") as f:
    files = {"video": ("test_vid.mp4", f, "video/mp4")}
    r = requests.post(f"{HF_URL}/video/upload", files=files, timeout=20)

print("Upload response:", r.status_code, r.text)
if r.status_code == 200:
    job_id = r.json()["job_id"]
    print(f"Polling job {job_id}...")
    for i in range(20):
        time.sleep(2)
        sr = requests.get(f"{HF_URL}/video/{job_id}/status")
        status_data = sr.json()
        print(f"  [{i+1}] Status: {status_data.get('status')} | Progress: {status_data.get('progress')}")
        if status_data.get("status") == "completed":
            res = requests.get(f"{HF_URL}/video/{job_id}/result").json()
            print("Completed result:", res.get("dominant_class"), res.get("processing"))
            break
        elif status_data.get("status") == "failed":
            print("Job failed:", status_data)
            break

if os.path.exists(vid_path):
    os.remove(vid_path)
