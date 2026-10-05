import requests

TOKEN = "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"
REPO_ID = "Venkat6789/medjestic-ai"

headers = {"Authorization": f"Bearer {TOKEN}"}

# Test log endpoint
url = f"https://huggingface.co/api/spaces/{REPO_ID}/logs"
r = requests.get(url, headers=headers)
print("Logs status:", r.status_code)
if r.status_code == 200:
    lines = r.text.strip().split("\n")
    print(f"Total lines: {len(lines)}")
    print("Last 30 lines of logs:")
    for line in lines[-30:]:
        print(line)
else:
    print("Response:", r.text[:500])
