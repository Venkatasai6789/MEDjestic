import requests

HF_URL = "https://venkat6789-medjestic-ai.hf.space"
headers = {
    "Origin": "http://localhost:5173",
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "content-type"
}

print("=== 1. Testing OPTIONS /predict (Preflight) ===")
try:
    r = requests.options(f"{HF_URL}/predict", headers=headers, timeout=10)
    print(f"Status: {r.status_code}")
    print("Response headers:")
    for k, v in r.headers.items():
        if "access-control" in k.lower():
            print(f"  {k}: {v}")
except Exception as e:
    print("OPTIONS failed:", e)

print("\n=== 2. Testing GET /health with Origin ===")
try:
    r = requests.get(f"{HF_URL}/health", headers={"Origin": "http://localhost:5173"}, timeout=10)
    print(f"Status: {r.status_code}")
    print("Response headers:")
    for k, v in r.headers.items():
        if "access-control" in k.lower():
            print(f"  {k}: {v}")
except Exception as e:
    print("GET failed:", e)
