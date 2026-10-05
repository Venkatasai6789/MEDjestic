import os
import sys
import time
from huggingface_hub import HfApi

sys.stdout.reconfigure(encoding='utf-8')

TOKEN = "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"
REPO_ID = "Venkat6789/MEDjestic-medical-waste-model"

def upload():
    print(f"Uploading files to Hugging Face Model Repository: https://huggingface.co/{REPO_ID}")
    api = HfApi(token=TOKEN)
    
    # Upload folder with auto retry
    for attempt in range(1, 4):
        try:
            print(f"\n[Attempt {attempt}] Uploading model directory...")
            api.upload_folder(
                folder_path=os.path.abspath("ai_service"),
                repo_id=REPO_ID,
                repo_type="model",
                allow_patterns=["MODEL_CARD.md", "class_names.json", "config.py", "models/best_model.pth"],
                token=TOKEN
            )
            print("\n[SUCCESS] Model repository uploaded successfully!")
            print(f"URL: https://huggingface.co/{REPO_ID}")
            return
        except Exception as e:
            print(f"  Attempt {attempt} failed: {e}")
            time.sleep(3)
            
    print("\nCould not complete in 3 attempts.")

if __name__ == "__main__":
    upload()
