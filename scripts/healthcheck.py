"""Container liveness probe. Django rejects requests whose Host is not in
DJANGO_ALLOWED_HOSTS (even from localhost), so the probe presents the first allowed host."""

import os
import sys
import urllib.request

host = next((h.strip() for h in os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",") if h.strip()), "")
host = host.lstrip(".") or "127.0.0.1"
path = sys.argv[1] if len(sys.argv) > 1 else "/health/live/"
request = urllib.request.Request(
    f"http://127.0.0.1:8000{path}", headers={"Host": host, "X-Forwarded-Proto": "https"}
)
try:
    with urllib.request.urlopen(request, timeout=3) as response:  # noqa: S310
        sys.exit(0 if response.status == 200 else 1)
except Exception:
    sys.exit(1)
