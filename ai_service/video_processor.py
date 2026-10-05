import os
import uuid
import json
import time
import threading
import tempfile
import cv2
import numpy as np
from inference import run_two_stage_inference
from tracker import ObjectTracker
from postprocessing import get_metadata, MODEL_FULL_NAME

# Job storage (in-memory for Hugging Face Spaces)
_jobs = {}
_jobs_lock = threading.Lock()

def create_job(video_bytes: bytes, filename: str) -> str:
    """Create a new video processing job."""
    job_id = str(uuid.uuid4())
    
    with _jobs_lock:
        _jobs[job_id] = {
            'id': job_id,
            'status': 'queued',
            'progress': 0,
            'filename': filename,
            'created_at': time.time(),
            'result': None,
            'error': None
        }
    
    thread = threading.Thread(
        target=_process_video,
        args=(job_id, video_bytes, filename),
        daemon=True
    )
    thread.start()
    
    return job_id

def get_job_status(job_id: str) -> dict:
    with _jobs_lock:
        job = _jobs.get(job_id)
    if job is None:
        return None
    return {
        'id': job['id'],
        'status': job['status'],
        'progress': job['progress'],
        'filename': job['filename']
    }

def get_job_result(job_id: str) -> dict:
    with _jobs_lock:
        job = _jobs.get(job_id)
    if job is None:
        return None
    return job.get('result')

def _process_video(job_id: str, video_bytes: bytes, filename: str):
    """Process video using two-stage detector + ViT classifier + ObjectTracker."""
    try:
        _update_job(job_id, status='processing', progress=5)
        
        suffix = os.path.splitext(filename)[1] or '.mp4'
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(video_bytes)
            tmp_path = tmp.name
        
        try:
            cap = cv2.VideoCapture(tmp_path)
            if not cap.isOpened():
                raise RuntimeError(f"Cannot open video file: {filename}")
            
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            duration = total_frames / fps if fps > 0 else 0
            
            _update_job(job_id, progress=10)
            
            sample_interval = max(1, int(fps / 2))  # ~2 samples per second
            
            tracker = ObjectTracker(iou_thresh=0.25, max_lost=30, alpha=0.3)
            all_detected_objects = {}  # track_id -> dict(label, conf, count)
            frame_results = []
            frames_processed = 0
            frame_idx = 0
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                if frame_idx % sample_interval == 0:
                    # Run Two-Stage Multi-Object Inference + Tracker
                    dets, _, _ = run_two_stage_inference(frame, tracker=tracker)
                    
                    frame_det_summary = []
                    for d in dets:
                        tid = d.get('track_id', 1)
                        lbl = d['label']
                        cnf = d['confidence']
                        box = d['box']
                        
                        if tid not in all_detected_objects:
                            all_detected_objects[tid] = {'label': lbl, 'confidence': cnf, 'occurrences': 1, 'box': box}
                        else:
                            all_detected_objects[tid]['occurrences'] += 1
                            if cnf > all_detected_objects[tid]['confidence']:
                                all_detected_objects[tid]['confidence'] = cnf
                                all_detected_objects[tid]['label'] = lbl
                                
                        frame_det_summary.append({
                            'track_id': tid,
                            'class': lbl,
                            'confidence': round(cnf, 3),
                            'box': box
                        })
                    
                    if frame_det_summary:
                        frame_results.append({
                            'frame': frame_idx,
                            'time_sec': round(frame_idx / fps, 2),
                            'detections': frame_det_summary
                        })
                    
                    frames_processed += 1
                
                frame_idx += 1
                
                if total_frames > 0:
                    progress = 10 + int((frame_idx / total_frames) * 85)
                    _update_job(job_id, progress=min(progress, 95))
            
            cap.release()
            
            # Aggregate classes from tracked unique objects
            class_counts = {}
            for tid, tinfo in all_detected_objects.items():
                lbl = tinfo['label']
                class_counts[lbl] = class_counts.get(lbl, 0) + 1
            
            dominant_class = max(class_counts, key=class_counts.get) if class_counts else "Medical Waste"
            
            result = {
                'job_id': job_id,
                'filename': filename,
                'video_info': {
                    'duration_sec': round(duration, 2),
                    'fps': round(fps, 1),
                    'width': width,
                    'height': height,
                    'total_frames': total_frames
                },
                'processing': {
                    'frames_sampled': frames_processed,
                    'sample_interval': sample_interval,
                    'model_used': f"{MODEL_FULL_NAME} + ByteTrack"
                },
                'detections_summary': {
                    'total_classified_frames': len(frame_results),
                    'unique_objects_tracked': len(all_detected_objects),
                    'classes': class_counts
                },
                'frame_detections': frame_results[:100],
                'dominant_class': dominant_class
            }
            
            _update_job(job_id, status='completed', progress=100, result=result)
            
        finally:
            try:
                os.unlink(tmp_path)
            except:
                pass
    
    except Exception as e:
        _update_job(job_id, status='failed', error=str(e))

def _update_job(job_id: str, **kwargs):
    with _jobs_lock:
        if job_id in _jobs:
            _jobs[job_id].update(kwargs)
