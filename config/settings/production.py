import os

import sentry_sdk

from config.settings.base import *  # noqa: F403
from config.settings.base import env_bool

DEBUG = False
if SECRET_KEY in {"unsafe-development-key", "development-only-change-me"}:  # noqa: F405
    raise RuntimeError("DJANGO_SECRET_KEY must be set in production")
if not ALLOWED_HOSTS:  # noqa: F405
    raise RuntimeError("DJANGO_ALLOWED_HOSTS must be set in production")
if not os.getenv("DATABASE_URL"):
    raise RuntimeError("DATABASE_URL must be set in production")
if not os.getenv("REDIS_URL"):
    raise RuntimeError("REDIS_URL must be set in production")

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_SSL_REDIRECT = env_bool("DJANGO_SECURE_SSL_REDIRECT", True)
SECURE_PROXY_SSL_HEADER = (
    ("HTTP_X_FORWARDED_PROTO", "https") if env_bool("DJANGO_BEHIND_PROXY") else None
)

if sentry_dsn := os.getenv("SENTRY_DSN"):
    sentry_sdk.init(dsn=sentry_dsn, send_default_pii=False, traces_sample_rate=0.0)
