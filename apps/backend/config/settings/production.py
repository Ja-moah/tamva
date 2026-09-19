import os

import sentry_sdk

from config.settings.base import *  # noqa: F403
from config.settings.base import env_bool
from config.settings.validation import validate_production_environment

if _problems := validate_production_environment(os.environ):
    raise RuntimeError(
        "Refusing to start: invalid production configuration:\n  - " + "\n  - ".join(_problems)
    )

DEBUG = False

# Transport security. TLS terminates at the reverse proxy, which must set
# X-Forwarded-Proto and strip any client-supplied copy (see docs/operations/DEPLOYMENT.md).
SECURE_SSL_REDIRECT = env_bool("DJANGO_SECURE_SSL_REDIRECT", True)
SECURE_PROXY_SSL_HEADER = (
    ("HTTP_X_FORWARDED_PROTO", "https") if env_bool("DJANGO_BEHIND_PROXY") else None
)
SECURE_REDIRECT_EXEMPT = [r"^health/"]  # probes reach the container over plain http
SECURE_HSTS_SECONDS = int(os.getenv("DJANGO_HSTS_SECONDS", "31536000"))
SECURE_HSTS_INCLUDE_SUBDOMAINS = env_bool("DJANGO_HSTS_INCLUDE_SUBDOMAINS", True)
# Preload is effectively irreversible; only enable it deliberately.
SECURE_HSTS_PRELOAD = env_bool("DJANGO_HSTS_PRELOAD", False)
# security.W021 (HSTS preload) is a deliberate, documented opt-in; see DJANGO_HSTS_PRELOAD.
if not SECURE_HSTS_PRELOAD:
    SILENCED_SYSTEM_CHECKS = ["security.W021"]
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_REFERRER_POLICY = "same-origin"
SECURE_CROSS_ORIGIN_OPENER_POLICY = "same-origin"
X_FRAME_OPTIONS = "DENY"

# Cookies (Admin session and CSRF). The CSRF cookie stays script-readable by design:
# the Admin client echoes it in X-CSRFToken.
SESSION_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
CSRF_COOKIE_SECURE = True
CSRF_COOKIE_HTTPONLY = False
CSRF_COOKIE_SAMESITE = "Lax"

# Production serves JSON only: no browsable API, and no developer surfaces unless enabled.
REST_FRAMEWORK["DEFAULT_RENDERER_CLASSES"] = ["rest_framework.renderers.JSONRenderer"]  # noqa: F405
API_DOCS_ENABLED = env_bool("API_DOCS_ENABLED", False)
DJANGO_ADMIN_ENABLED = env_bool("DJANGO_ADMIN_ENABLED", False)

APP_ENVIRONMENT = os.getenv("APP_ENVIRONMENT", "production")

if sentry_dsn := os.getenv("SENTRY_DSN"):
    sentry_sdk.init(
        dsn=sentry_dsn,
        send_default_pii=False,
        traces_sample_rate=0.0,
        release=os.getenv("APP_RELEASE") or None,
        environment=APP_ENVIRONMENT,
    )
