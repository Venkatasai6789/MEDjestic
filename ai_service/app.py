# Hugging Face ZeroGPU compatibility - MUST be imported before any other module
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

import os
import sys
import uuid
import datetime
import traceback
import asyncio
import io
import json

import torch
from fastapi import FastAPI, APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import gradio as gr
from PIL import Image

# Monkeypatch Gradio client schema bug with boolean additionalProperties in Gradio 5.x
try:
    import gradio_client.utils
    _orig_get_type = gradio_client.utils.get_type
    def _patched_get_type(schema):
        if isinstance(schema, bool):
            return "bool"
        return _orig_get_type(schema)
    gradio_client.utils.get_type = _patched_get_type

    _orig_json_schema = gradio_client.utils._json_schema_to_python_type
    def _patched_json_schema(schema, defs=None):
        if isinstance(schema, bool):
            return "dict" if schema else "None"
        return _orig_json_schema(schema, defs)
    gradio_client.utils._json_schema_to_python_type = _patched_json_schema
except Exception:
    pass

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from config import (
    MODEL_FULL_NAME, MODEL_VERSION, MODEL_NAME,
    HOST, PORT, VALID_CLASSES,
    CONFIDENCE_THRESHOLD, MARGIN_THRESHOLD
)
from model_loader import load_model, is_model_loaded, get_device
from preprocessing import preprocess_image_bytes, validate_image_bytes
from inference import run_two_stage_inference
from postprocessing import build_multi_object_response, draw_multi_object_annotations
from tracker import ObjectTracker
from video_processor import create_job, get_job_status, get_job_result

# ZeroGPU probe function
@spaces.GPU
def probe_gpu():
    """Startup probe function for ZeroGPU supervisor detection."""
    return None

# Load models at startup
print(f"[STARTUP] Initializing Two-Stage Multi-Object AI System ({MODEL_FULL_NAME})...")
try:
    load_model()
    print("[STARTUP] Models loaded successfully.")
except Exception as e:
    print(f"[STARTUP] WARNING: Model loading failed: {e}")
    traceback.print_exc()

# Per-session tracker for webcam frames (maintains persistent track_id across frames)
_webcam_tracker = ObjectTracker(iou_thresh=0.25, max_lost=25, alpha=0.35)

# Router for all MEDjestic REST API endpoints
api_router = APIRouter()


@api_router.get("/health")
async def health():
    device = str(get_device()) if is_model_loaded() else "unknown"
    loaded = is_model_loaded()
    status_code = 200 if loaded else 503
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "healthy" if loaded else "unhealthy",
            "model_loaded": loaded,
            "model_version": MODEL_VERSION,
            "model_name": MODEL_FULL_NAME,
            "pipeline": "Two-Stage Multi-Object Detection (YOLO) + ViT-B/16 Classification + ByteTrack",
            "device": device,
            "timestamp": datetime.datetime.now().isoformat()
        }
    )


@api_router.get("/model/info")
async def model_info():
    if not is_model_loaded():
        raise HTTPException(status_code=503, detail="Model not loaded")
    return {
        "model": MODEL_FULL_NAME,
        "architecture": "Two-Stage: YOLO Multi-Object Detector + Vision Transformer (ViT-B/16) + ByteTrack",
        "version": MODEL_VERSION,
        "type": "multi_object_detection_and_classification",
        "num_classes": len(VALID_CLASSES),
        "classes": VALID_CLASSES,
        "device": str(get_device()),
        "runtime": "huggingface",
        "capabilities": {
            "image_classification": True,
            "object_detection": True,
            "bounding_boxes": True,
            "tracking": True,
            "video_processing": True
        },
        "coordinate_system": "absolute_pixel_coordinates [x1, y1, x2, y2]"
    }


@api_router.post("/predict")
async def predict(image: UploadFile = File(...)):
    """Detect and classify multiple medical waste items in an uploaded image.
    
    Stage 1 (Detector): YOLO object detector locates all candidate waste objects.
    Stage 2 (Classifier): Fine-tuned ViT-B/16 classifies each cropped bounding box.
    Returns full response matching CameraScanner.jsx schema with boundingBoxes,
    individual detections, per-crop probabilities, and annotated visual.
    """
    if not is_model_loaded():
        raise HTTPException(status_code=503, detail="AI model not loaded. Service unavailable.")
    
    if not image.filename:
        raise HTTPException(status_code=400, detail="No image file provided")
    
    image_bytes = await image.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty image file")
    
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image too large. Maximum 10MB.")
    
    if not validate_image_bytes(image_bytes):
        raise HTTPException(status_code=400, detail="Invalid image format. Supported: JPG, JPEG, PNG, WebP")
    
    try:
        _, _, img_bgr = preprocess_image_bytes(image_bytes)
        detections, runtime, fallback_reason = await asyncio.to_thread(run_two_stage_inference, img_bgr)
        response = build_multi_object_response(detections, img_bgr, source="image", runtime=runtime, fallback_reason=fallback_reason)
        response['request_id'] = str(uuid.uuid4())
        response['source'] = 'image'
        return response
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")


@api_router.post("/predict/frame")
async def predict_frame(image: UploadFile = File(...)):
    """Classify a webcam frame with ByteTrack persistent multi-object tracking.
    
    Maintains stable track_id across consecutive frames and applies
    EMA probability smoothing to eliminate label flickering.
    """
    if not is_model_loaded():
        raise HTTPException(status_code=503, detail="AI model not loaded. Service unavailable.")
    
    image_bytes = await image.read()
    if len(image_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty frame")
    
    if not validate_image_bytes(image_bytes):
        raise HTTPException(status_code=400, detail="Invalid image format")
    
    try:
        _, _, img_bgr = preprocess_image_bytes(image_bytes)
        detections, runtime, fallback_reason = await asyncio.to_thread(run_two_stage_inference, img_bgr, _webcam_tracker)
        response = build_multi_object_response(detections, img_bgr, source="webcam", runtime=runtime, fallback_reason=fallback_reason)
        response['request_id'] = str(uuid.uuid4())
        response['source'] = 'webcam'
        response['stabilized'] = True
        return response
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Frame inference error: {str(e)}")


@api_router.post("/video/upload")
async def video_upload(video: UploadFile = File(...)):
    """Upload a video for asynchronous frame-by-frame two-stage detection & tracking."""
    if not is_model_loaded():
        raise HTTPException(status_code=503, detail="AI model not loaded.")
    
    if not video.filename:
        raise HTTPException(status_code=400, detail="No video file provided")
    
    allowed_ext = {'.mp4', '.mov', '.webm', '.avi', '.mkv'}
    ext = os.path.splitext(video.filename)[1].lower()
    if ext not in allowed_ext:
        raise HTTPException(status_code=400, detail=f"Unsupported video format. Allowed: {', '.join(allowed_ext)}")
    
    video_bytes = await video.read()
    if len(video_bytes) == 0:
        raise HTTPException(status_code=400, detail="Empty video file")
    
    if len(video_bytes) > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Video too large. Maximum 50MB.")
    
    job_id = create_job(video_bytes, video.filename)
    return {
        "job_id": job_id,
        "status": "queued",
        "message": "Video processing started with Two-Stage Multi-Object Tracker"
    }


@api_router.get("/video/{job_id}/status")
async def video_status(job_id: str):
    status = get_job_status(job_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Job not found")
    return status


@api_router.get("/video/{job_id}/result")
async def video_result(job_id: str):
    status = get_job_status(job_id)
    if status is None:
        raise HTTPException(status_code=404, detail="Job not found")
    if status['status'] != 'completed':
        return {"status": status['status'], "progress": status['progress'], "message": "Processing not yet complete"}
    
    result = get_job_result(job_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Result not found")
    return result


# ============================================
# Gradio Blocks UI (for ZeroGPU supervisor & Web UI)
# ============================================

with gr.Blocks(title="MEDjestic Multi-Object Waste AI") as demo:
    gr.Markdown("# 🏥 MEDjestic Two-Stage Multi-Object Waste Detection & Tracking")
    gr.Markdown("Two-Stage Architecture: **YOLO Detector** + **ViT-B/16 Classifier** + **ByteTrack Tracking**.")
    with gr.Row():
        with gr.Column():
            input_img = gr.Image(type="pil", label="Upload Medical Waste Photograph")
            btn = gr.Button("Scan & Detect Specimen", variant="primary")
        with gr.Column():
            output_annotated = gr.Image(type="pil", label="AI Traced Bounding Boxes")
            output_label = gr.Label(label="Primary Specimen Probabilities")
            output_json = gr.Code(language="json", label="Structured Detections API Schema")
    
    def gradio_predict(img):
        if img is None:
            return None, None, json.dumps({"error": "No image provided"})
        try:
            buf = io.BytesIO()
            img.save(buf, format="JPEG")
            img_bytes = buf.getvalue()
            
            _, _, img_bgr = preprocess_image_bytes(img_bytes)
            dets, runtime, fallback_reason = run_two_stage_inference(img_bgr)
            
            resp = build_multi_object_response(dets, img_bgr, source="gradio", runtime=runtime, fallback_reason=fallback_reason)
            annotated_bgr = draw_multi_object_annotations(img_bgr, dets)
            import cv2
            annotated_rgb = cv2.cvtColor(annotated_bgr, cv2.COLOR_BGR2RGB)
            pil_annotated = Image.fromarray(annotated_rgb)
            primary_probs = resp.get('all_probabilities', {})
            return pil_annotated, primary_probs, json.dumps(resp, indent=2)
        except Exception as e:
            traceback.print_exc()
            return None, {"Error": 1.0}, json.dumps({"error": str(e)}, indent=2)

    btn.click(gradio_predict, inputs=[input_img], outputs=[output_annotated, output_label, output_json], api_name="predict")

# FastAPI Application for standalone ASGI deployment
fastapi_app = FastAPI(title="MEDjestic AI Service", version=MODEL_VERSION)
fastapi_app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
fastapi_app.include_router(api_router)

# Mount Gradio app on FastAPI for ASGI mode
app = gr.mount_gradio_app(fastapi_app, demo, path="/ui")

if __name__ == "__main__":
    # When launched directly by Hugging Face Spaces runtime via `python app.py`
    demo.queue(default_concurrency_limit=10)
    app_instance, local_url, _ = demo.launch(
        server_name="0.0.0.0",
        server_port=PORT,
        ssr_mode=False,
        prevent_thread_lock=True
    )
    # Insert API routes at front of router
    for r in reversed(api_router.routes):
        app_instance.router.routes.insert(0, r)
    demo.block_thread()
