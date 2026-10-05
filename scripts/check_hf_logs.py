from huggingface_hub import HfApi

TOKEN = "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"
REPO_ID = "Venkat6789/medjestic-ai"

api = HfApi(token=TOKEN)
try:
    # Check if there is a get_space_runtime or similar
    info = api.space_info(repo_id=REPO_ID)
    print("Space Info:")
    print("  Author:", info.author)
    print("  ID:", info.id)
    print("  Runtime:", info.runtime)
    print("  Hardware:", info.runtime.get("hardware") if isinstance(info.runtime, dict) else getattr(info.runtime, 'hardware', None))
    print("  Stage:", info.runtime.get("stage") if isinstance(info.runtime, dict) else getattr(info.runtime, 'stage', None))
except Exception as e:
    print("Error getting space info:", e)
