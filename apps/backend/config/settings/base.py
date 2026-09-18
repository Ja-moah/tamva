import os
from pathlib import Path

import dj_database_url

BASE_DIR = Path(__file__).resolve().parents[2]


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
    "domains.connector.apps.ConnectorConfig",
    "domains.normalisation.apps.NormalisationConfig",
    "domains.ledger.apps.LedgerConfig",
    "domains.profile.apps.ProfileConfig",
    "domains.feature.apps.FeatureConfig",
    "domains.rules.apps.RulesConfig",
    "domains.modeling.apps.ModelingConfig",
    "domains.risk.apps.RiskConfig",
    "domains.case.apps.CaseConfig",
    "domains.passport.apps.PassportConfig",
    "domains.graph.apps.GraphConfig",
    "domains.audit.apps.AuditConfig",
    "domains.notifications.apps.NotificationsConfig",
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
        conn_max_age=60,
        conn_health_checks=True,
    )
}

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
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

REST_FRAMEWORK = {
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
    "EXCEPTION_HANDLER": "packages.common.exceptions.api_exception_handler",
    "DEFAULT_PERMISSION_CLASSES": ["rest_framework.permissions.IsAuthenticated"],
    "DEFAULT_PAGINATION_CLASS": "packages.common.pagination.DefaultPagination",
    "DEFAULT_THROTTLE_CLASSES": ["rest_framework.throttling.ScopedRateThrottle"],
    # Rates are configuration, not code: override per-environment via env vars.
    "DEFAULT_THROTTLE_RATES": {
        "auth": os.getenv("THROTTLE_RATE_AUTH", "20/min"),
        "credential_ops": os.getenv("THROTTLE_RATE_CREDENTIAL_OPS", "20/min"),
        "connector_sync": os.getenv("THROTTLE_RATE_CONNECTOR_SYNC", "30/min"),
        "risk_evaluation": os.getenv("THROTTLE_RATE_RISK_EVALUATION", "60/min"),
        "passport_share_access": os.getenv("THROTTLE_RATE_PASSPORT_ACCESS", "30/min"),
    },
}
SPECTACULAR_SETTINGS = {
    "TITLE": "TAMVA API",
    "DESCRIPTION": "Financial Identity & Trust Infrastructure",
    "VERSION": "1.0.0",
    "SERVE_INCLUDE_SCHEMA": False,
}
CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS")
CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS")

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
CACHES = {
    "default": {"BACKEND": "django.core.cache.backends.redis.RedisCache", "LOCATION": REDIS_URL}
}
CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1")
CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/2")
CELERY_TASK_ACKS_LATE = True
CELERY_TASK_REJECT_ON_WORKER_LOST = True
CELERY_TASK_TRACK_STARTED = True
CELERY_BROKER_CONNECTION_RETRY_ON_STARTUP = True
CELERY_BEAT_SCHEDULE = {
    "dispatch-pending-outbox-events": {
        "task": "packages.events.tasks.dispatch_pending_outbox_events",
        "schedule": float(os.getenv("OUTBOX_DISPATCH_INTERVAL_SECONDS", "15")),
    }
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
