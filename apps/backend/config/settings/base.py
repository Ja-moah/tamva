import os
from pathlib import Path
from typing import Any

import dj_database_url
from corsheaders.defaults import default_headers

BASE_DIR = Path(__file__).resolve().parents[2]
REPO_ROOT = BASE_DIR.parent.parent


def _read_version() -> str:
    """The release version lives in one file (VERSION at the repo root, copied into images)."""
    for candidate in (BASE_DIR / "VERSION", REPO_ROOT / "VERSION"):
        if candidate.exists():
            return candidate.read_text().strip()
    return "0.0.0"


def env_bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).lower() in {"1", "true", "yes", "on"}


def env_list(name: str, default: str = "") -> list[str]:
    return [item.strip() for item in os.getenv(name, default).split(",") if item.strip()]


SECRET_KEY = os.getenv("DJANGO_SECRET_KEY", "unsafe-development-key")
DEBUG = env_bool("DJANGO_DEBUG")
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1")

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]
THIRD_PARTY_APPS = ["corsheaders", "rest_framework", "drf_spectacular"]
DOMAIN_APPS = [
    "domains.identity.apps.IdentityConfig",
    "domains.partner.apps.PartnerConfig",
    "domains.consent.apps.ConsentConfig",
    "domains.security.apps.SecurityConfig",
    "domains.connector.apps.ConnectorConfig",
    "domains.normalisation.apps.NormalisationConfig",
    "domains.ledger.apps.LedgerConfig",
    "domains.counterparty.apps.CounterpartyConfig",
    "domains.profile.apps.ProfileConfig",
    "domains.feature.apps.FeatureConfig",
    "domains.confidence.apps.ConfidenceConfig",
    "domains.rules.apps.RulesConfig",
    "domains.modeling.apps.ModelingConfig",
    "domains.risk.apps.RiskConfig",
    "domains.case.apps.CaseConfig",
    "domains.passport.apps.PassportConfig",
    "domains.graph.apps.GraphConfig",
    "domains.audit.apps.AuditConfig",
    "domains.notifications.apps.NotificationsConfig",
    "domains.operations.apps.OperationsConfig",
    "domains.customer.apps.CustomerConfig",
    "packages.events.apps.EventsConfig",
]
INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + DOMAIN_APPS

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "packages.observability.middleware.RequestContextMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "packages.observability.middleware.TenantContextMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"
TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    }
]
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"

DATABASES = {
    "default": dj_database_url.config(
        default="postgresql://tamva:tamva@localhost:5432/tamva",
        conn_max_age=int(os.getenv("DB_CONN_MAX_AGE", "60")),
        conn_health_checks=True,
    )
}
# Fail fast instead of hanging: connect and per-statement timeouts (ms; 0 disables).
# SSL is requested in DATABASE_URL (?sslmode=require|verify-full).
DATABASES["default"].setdefault("OPTIONS", {})["connect_timeout"] = int(
    os.getenv("DB_CONNECT_TIMEOUT_SECONDS", "10")
)
if _statement_timeout := int(os.getenv("DB_STATEMENT_TIMEOUT_MS", "0")):
    DATABASES["default"]["OPTIONS"]["options"] = f"-c statement_timeout={_statement_timeout}"

AUTH_USER_MODEL = "identity.User"
AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True
STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

# Generated export artifacts. Never served directly: downloads go through an
# authenticated, audited endpoint. Point default storage at a private bucket in
# production; this local path is only the development/test default.
MEDIA_ROOT = BASE_DIR / "media"
EXPORT_RETENTION_HOURS = int(os.getenv("EXPORT_RETENTION_HOURS", "24"))
EXPORT_MAX_ROWS = int(os.getenv("EXPORT_MAX_ROWS", "50000"))
EXPORT_LINK_TTL_SECONDS = int(os.getenv("EXPORT_LINK_TTL_SECONDS", "300"))
# Must exceed CELERY_TASK_TIME_LIMIT: past this a PENDING/RUNNING export is failed, not waited on.
EXPORT_STALE_MINUTES = int(os.getenv("EXPORT_STALE_MINUTES", "15"))

# Safe deployment metadata surfaced by GET /api/v1/meta/version/.
# Account recovery: deep link the customer app handles; delivery uses Django's
# email framework (configure EMAIL_BACKEND / DEFAULT_FROM_EMAIL per environment).
RECOVERY_LINK_BASE = os.getenv("RECOVERY_LINK_BASE", "tamva://reset-password")
RECOVERY_TOKEN_LIFETIME_MINUTES = int(os.getenv("RECOVERY_TOKEN_LIFETIME_MINUTES", "60"))
DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "TAMVA <no-reply@tamva.invalid>")

APP_VERSION = os.getenv("APP_VERSION") or _read_version()
APP_RELEASE = os.getenv("APP_RELEASE", "")
APP_ENVIRONMENT = os.getenv("APP_ENVIRONMENT", "development")
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK: dict[str, Any] = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "packages.auth.bearer.BearerTokenAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ],
    "EXCEPTION_HANDLER": "packages.common.exceptions.api_exception_handler",
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_PAGINATION_CLASS": "packages.common.pagination.DefaultPagination",
    "DEFAULT_THROTTLE_CLASSES": [
        "rest_framework.throttling.ScopedRateThrottle",
        # Backstops: a ceiling per signed-in user and per anonymous client IP.
        "rest_framework.throttling.UserRateThrottle",
        "rest_framework.throttling.AnonRateThrottle",
    ],
    # Rates are configuration, not code: override per-environment via env vars.
    "DEFAULT_THROTTLE_RATES": {
        "auth": os.getenv("THROTTLE_RATE_AUTH", "20/min"),
        "credential_ops": os.getenv("THROTTLE_RATE_CREDENTIAL_OPS", "20/min"),
        "connector_sync": os.getenv("THROTTLE_RATE_CONNECTOR_SYNC", "30/min"),
        "risk_evaluation": os.getenv("THROTTLE_RATE_RISK_EVALUATION", "60/min"),
        "passport_share_access": os.getenv("THROTTLE_RATE_PASSPORT_ACCESS", "30/min"),
        "security_observation": os.getenv("THROTTLE_RATE_SECURITY_OBSERVATION", "120/min"),
        "export": os.getenv("THROTTLE_RATE_EXPORT", "10/min"),
        "registration": os.getenv("THROTTLE_RATE_REGISTRATION", "10/hour"),
        "recovery": os.getenv("THROTTLE_RATE_RECOVERY", "10/hour"),
        "bulk": os.getenv("THROTTLE_RATE_BULK", "20/min"),
        "customer_write": os.getenv("THROTTLE_RATE_CUSTOMER_WRITE", "30/min"),
        "user": os.getenv("THROTTLE_RATE_USER", "600/min"),
        "anon": os.getenv("THROTTLE_RATE_ANON", "120/min"),
    },
}
_API_DESCRIPTION = """\
Financial identity and trust infrastructure.

**Authentication.** Cookie session: `POST /api/v1/auth/login/` with
`{identifier, password}`. Unsafe methods must echo the `csrftoken` cookie in the
`X-CSRFToken` header.

**Tenancy.** Institution-scoped endpoints require `X-Institution-ID: <uuid>`;
the caller must be an active member. Authorization is decided by the backend
from the caller's roles (see `GET /api/v1/me/`), never by the client.

**Tracing.** Send `X-Request-ID` (any string up to 128 chars) or one is
generated. It is echoed on every response and in every error envelope.

**Idempotency.** Bulk mutations accept `Idempotency-Key`. The same key with the
same body replays the original response (`Idempotent-Replay: true`); the same key
with a different body is a `409`.

**Pagination.** List endpoints return `{count, next, previous, results}` and
accept `page` and `page_size` (max 100).

**Filtering and sorting.** Filters are query parameters documented per endpoint.
Unknown parameters are rejected with `400`, not ignored. `ordering` takes a
comma-separated allow-listed field list; prefix `-` for descending.

**Errors.** `{"error": {"code", "message", "request_id", "details"}}`.

**Rate limits.** Sensitive scopes (auth, credential operations, bulk, export,
risk evaluation, passport access, security observation) are throttled and
answer `429` with `Retry-After`. Limits are deployment configuration.

**Scores.** Financial Confidence is 0-100 (higher = stronger verified financial
confidence). Risk Score is 0-1000 (higher = higher risk). They are unrelated.
"""

SPECTACULAR_SETTINGS = {
    "TITLE": "TAMVA API",
    "DESCRIPTION": _API_DESCRIPTION,
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
    "ENUM_NAME_OVERRIDES": {
        "CaseStatusEnum": "domains.case.models.Case.Status",
        "CaseSourceEnum": "domains.case.models.Case.Source",
        "ConnectionStatusEnum": "domains.connector.models.InstitutionConnection.Status",
        "PassportShareStatusEnum": "domains.passport.models.PassportShare.Status",
        "ConsentStatusEnum": "domains.consent.models.Consent.Status",
        "PassportSectionCodeEnum": "domains.passport.models.PassportSectionCode",
        "ActiveDisabledStatusEnum": "domains.partner.models.PartnerEnvironment.Status",
    },
}
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS")
# Headers TAMVA clients send, and headers they must be able to read back.
CORS_ALLOW_HEADERS = (
    *default_headers,
    "x-request-id",
    "x-api-version",
    "x-institution-id",
    "idempotency-key",
)
CORS_EXPOSE_HEADERS = ["X-Request-ID", "X-API-Version", "Idempotent-Replay", "Retry-After"]
# Bearer auth carries no ambient credentials, so cross-origin cookies are not enabled.
CORS_ALLOW_CREDENTIALS = env_bool("CORS_ALLOW_CREDENTIALS", False)
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CACHES = {
    "default": {"BACKEND": "django.core.cache.backends.redis.RedisCache", "LOCATION": REDIS_URL}
}
# Client IPs (throttling, audit) come from X-Forwarded-For; trust exactly this many proxies.
NUM_PROXIES = int(os.getenv("DJANGO_NUM_PROXIES", "1" if env_bool("DJANGO_BEHIND_PROXY") else "0"))
REST_FRAMEWORK["NUM_PROXIES"] = NUM_PROXIES or None

# Surfaces that are conveniences for developers, not product: off unless enabled.
API_DOCS_ENABLED = env_bool("API_DOCS_ENABLED", True)
DJANGO_ADMIN_ENABLED = env_bool("DJANGO_ADMIN_ENABLED", True)

EMAIL_BACKEND = os.getenv("EMAIL_BACKEND", "django.core.mail.backends.smtp.EmailBackend")
EMAIL_HOST = os.getenv("EMAIL_HOST", "localhost")
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", True)
EMAIL_TIMEOUT = int(os.getenv("EMAIL_TIMEOUT_SECONDS", "10"))

# Private artifacts (exports). "filesystem" is for development/tests only; production
# uses an S3-compatible private bucket (AWS S3, MinIO, R2, ...).
EXPORT_STORAGE_BACKEND = os.getenv("EXPORT_STORAGE_BACKEND", "filesystem")
if EXPORT_STORAGE_BACKEND == "s3":
    STORAGES = {
        "default": {
            "BACKEND": "storages.backends.s3.S3Storage",
            "OPTIONS": {
                "bucket_name": os.environ["AWS_STORAGE_BUCKET_NAME"],
                "endpoint_url": os.getenv("AWS_S3_ENDPOINT_URL") or None,
                "region_name": os.getenv("AWS_S3_REGION_NAME") or None,
                "access_key": os.getenv("AWS_ACCESS_KEY_ID") or None,
                "secret_key": os.getenv("AWS_SECRET_ACCESS_KEY") or None,
                "addressing_style": os.getenv("AWS_S3_ADDRESSING_STYLE", "auto"),
                # Never public: no ACLs, signed URLs only, short expiry, no overwrites.
                "default_acl": None,
                "querystring_auth": True,
                "querystring_expire": int(os.getenv("AWS_QUERYSTRING_EXPIRE", "60")),
                "file_overwrite": False,
                "signature_version": "s3v4",
                "object_parameters": (
                    {"ServerSideEncryption": os.environ["AWS_S3_SSE"]}
                    if os.getenv("AWS_S3_SSE")
                    else {}
                ),
            },
        },
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    }
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")
CELERY_TASK_ACKS_LATE = True
# One task at a time per worker slot: exports can be long, and a prefetched
# backlog would sit behind them.
CELERY_WORKER_PREFETCH_MULTIPLIER = 1
# Hard limits so a wedged task cannot hold a worker forever.
CELERY_TASK_SOFT_TIME_LIMIT = int(os.getenv("CELERY_TASK_SOFT_TIME_LIMIT", "300"))
CELERY_TASK_TIME_LIMIT = int(os.getenv("CELERY_TASK_TIME_LIMIT", "360"))
# Redelivery window for unacknowledged tasks (must exceed the hard limit).
CELERY_BROKER_TRANSPORT_OPTIONS = {"visibility_timeout": 3600}
CELERY_TASK_DEFAULT_RETRY_DELAY = 30
CELERY_TASK_REJECT_ON_WORKER_LOST = True
CELERY_TASK_TRACK_STARTED = True
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True
CELERY_BEAT_SCHEDULE = {
    "purge-expired-exports": {
        "task": "domains.operations.tasks.purge_expired_exports",
        "schedule": 3600.0,
    },
    "fail-stale-exports": {
        "task": "domains.operations.tasks.fail_stale_exports",
        "schedule": 300.0,
    },
    "dispatch-pending-outbox-events": {
        "task": "packages.events.tasks.dispatch_pending_outbox_events",
        "schedule": float(os.getenv("OUTBOX_DISPATCH_INTERVAL_SECONDS", "15")),
    },
}

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "filters": {"request_context": {"()": "packages.observability.logging.RequestContextFilter"}},
    "formatters": {
        "json": {
            "()": "pythonjsonlogger.json.JsonFormatter",
            "fmt": (
                "%(asctime)s %(levelname)s %(name)s %(message)s "
                "%(request_id)s %(tenant_id)s %(user_id)s %(event)s"
            ),
            "rename_fields": {"asctime": "timestamp", "levelname": "level", "name": "logger"},
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "json",
            "filters": ["request_context"],
        }
    },
    "root": {"handlers": ["console"], "level": os.getenv("LOG_LEVEL", "INFO")},
}
