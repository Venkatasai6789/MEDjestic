---
title: MEDjestic Medical Waste ViT Inference
emoji: 🏥
colorFrom: blue
colorTo: indigo
sdk: gradio
sdk_version: 5.20.0
app_file: app.py
pinned: false
license: mit
---

# MEDjestic Clinical Medical Waste AI Inference Service

Production-ready deep learning cloud service providing real-time Vision Transformer (ViT-B/16) inference for clinical, hazardous, and hospital waste segregation.

## API Endpoints

- `GET /health` - Service heartbeat and model verification
- `GET /model/info` - Architecture metadata and class taxonomy
- `POST /predict` - Real-time image classification (multipart `image`)
- `POST /predict/frame` - Webcam frame classification with temporal smoothing
- `POST /video/upload` - Asynchronous video stream processing (MP4, MOV, WebM)
- `GET /video/{job_id}/status` - Background processing status
- `GET /video/{job_id}/result` - Video analytics summary and class breakdown
