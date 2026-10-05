from huggingface_hub import HfApi
import json

TOKEN = "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"
REPO_ID = "Venkat6789/medjestic-ai"

api = HfApi(token=TOKEN)
files = api.list_repo_files(repo_id=REPO_ID, repo_type="space")
print("Files in Hugging Face Space:")
for f in files:
    print(f"  - {f}")

space_runtime = api.get_space_runtime(repo_id=REPO_ID)
print("\nSpace Runtime:")
print(f"  Stage: {space_runtime.stage}")
print(f"  Hardware: {space_runtime.hardware}")
print(f"  Raw: {space_runtime}")
