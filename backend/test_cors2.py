import urllib.request, json

req = urllib.request.Request(
    "http://127.0.0.1:8000/api/v1/auth/login",
    method="OPTIONS",
    headers={
        "Origin": "http://localhost:5174",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    }
)
try:
    with urllib.request.urlopen(req) as r:
        print(f"Status: {r.status}")
        for k, v in r.headers.items():
            print(f"  {k}: {v}")
except urllib.error.HTTPError as e:
    print(f"HTTP {e.code}: {e.reason}")
    body = e.read().decode()
    print(f"Body: {body}")
    for k, v in e.headers.items():
        print(f"  {k}: {v}")
