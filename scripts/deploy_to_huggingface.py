import os
import sys
import time
from huggingface_hub import HfApi

sys.stdout.reconfigure(encoding='utf-8')

TOKEN = "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"
REPO_ID = "Venkat6789/medjestic-ai"
SOURCE_DIR = os.path.abspath("ai_service")

def deploy():
    print("=" * 60)
    print(f"🚀 Deploying MEDjestic to Hugging Face Space: {REPO_ID}")
    print("=" * 60)
    
    api = HfApi(token=TOKEN)
    
    files_to_upload = [
        ("app.py", "app.py"),
        ("config.py", "config.py"),
        ("model_loader.py", "model_loader.py"),
        ("preprocessing.py", "preprocessing.py"),
        ("inference.py", "inference.py"),
        ("postprocessing.py", "postprocessing.py"),
        ("confidence.py", "confidence.py"),
        ("detector.py", "detector.py"),
        ("tracker.py", "tracker.py"),
        ("video_processor.py", "video_processor.py"),
        ("class_names.json", "class_names.json"),
        ("requirements.txt", "requirements.txt"),
        ("README.md", "README.md"),
        ("models/yolo11m.pt", "models/yolo11m.pt"),
        # ("models/best_model.pth", "models/best_model.pth"),  # Already on remote Space
    ]
    
    print("\nUploading codebase and model weights...")
    for local_rel, remote_path in files_to_upload:
        local_path = os.path.join(SOURCE_DIR, local_rel)
        if not os.path.exists(local_path):
            print(f"  [SKIP] File not found: {local_path}")
            continue
            
        size_mb = os.path.getsize(local_path) / (1024 * 1024)
        print(f"  Uploading {local_rel} ({size_mb:.1f} MB) -> {remote_path}...")
        try:
            api.upload_file(
                path_or_fileobj=local_path,
                path_in_repo=remote_path,
                repo_id=REPO_ID,
                repo_type="space",
                token=TOKEN
            )
            print(f"  [DONE] {local_rel}")
        except Exception as e:
            print(f"  [ERROR on {local_rel}]: {e}")
            
    print("\n" + "=" * 60)
    print("🎉 DEPLOYMENT UPLOAD COMPLETE!")
    print(f"  Space URL:     https://huggingface.co/spaces/{REPO_ID}")
    print(f"  Live REST API: https://venkat6789-medjestic-ai.hf.space")
    print("=" * 60)

if __name__ == "__main__":
    deploy()
