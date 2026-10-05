from huggingface_hub import HfApi
import sys

TOKEN = "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"
REPO_ID = "Venkat6789/medjestic-ai"

api = HfApi(token=TOKEN)
try:
    log_gen = api.fetch_space_logs(repo_id=REPO_ID)
    lines = []
    # Collect recent lines
    for line in log_gen:
        lines.append(line)
        if len(lines) > 200:
            lines.pop(0)
    print(f"Read {len(lines)} log lines:")
    for l in lines[-50:]:
        sys.stdout.buffer.write(l.encode("utf-8", errors="replace") + b"\n")
except Exception as e:
    print("Error fetching logs:", e)
