#!/bin/sh
set -eu

if [ "${WAIT_FOR_DATABASE:-true}" = "true" ]; then
  python - <<'PY'
import os
import time
import psycopg
from urllib.parse import urlparse

database_url = os.environ["DATABASE_URL"]
for attempt in range(30):
    try:
        with psycopg.connect(database_url):
            break
    except psycopg.OperationalError:
        if attempt == 29:
            raise
        time.sleep(1)
PY
fi

exec "$@"

