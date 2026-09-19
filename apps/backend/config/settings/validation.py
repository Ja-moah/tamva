"""Fail-fast validation of a production-like environment.

Pure and dependency-free so it can be unit-tested with plain dictionaries. Returns
every problem at once so an operator fixes the environment in one pass. Secret
values are never echoed in the messages.
"""

from __future__ import annotations

from collections.abc import Mapping
from urllib.parse import urlparse

WEAK_SECRETS = frozenset(
    {"unsafe-development-key", "development-only-change-me", "changeme", "change-me", "secret"}
)
MIN_SECRET_LENGTH = 50
MIN_SECRET_DISTINCT_CHARACTERS = 12
NON_DELIVERING_EMAIL_BACKENDS = frozenset(
    {
        "django.core.mail.backends.console.EmailBackend",
        "django.core.mail.backends.locmem.EmailBackend",
        "django.core.mail.backends.filebased.EmailBackend",
        "django.core.mail.backends.dummy.EmailBackend",
    }
)
LOCAL_HOSTS = frozenset({"localhost", "127.0.0.1", "::1", "0.0.0.0"})


def _items(value: str) -> list[str]:
    return [item.strip() for item in value.split(",") if item.strip()]


def _secret_problems(secret: str) -> list[str]:
    problems = []
    if secret.lower() in WEAK_SECRETS or secret.lower().startswith(("change", "replace")):
        problems.append("DJANGO_SECRET_KEY is a placeholder; generate a real one")
    elif len(secret) < MIN_SECRET_LENGTH or len(set(secret)) < MIN_SECRET_DISTINCT_CHARACTERS:
        problems.append(
            f"DJANGO_SECRET_KEY is too weak (need >= {MIN_SECRET_LENGTH} characters "
            f"and >= {MIN_SECRET_DISTINCT_CHARACTERS} distinct ones)"
        )
    return problems


def _origin_problems(name: str, value: str) -> list[str]:
    origins = _items(value)
    if not origins:
        return [f"{name} must list the exact https origins in use"]
    problems = []
    for origin in origins:
        parsed = urlparse(origin)
        if origin == "*" or "*" in origin:
            problems.append(f"{name} must not contain wildcards")
        elif parsed.scheme != "https" or not parsed.hostname or parsed.path not in {"", "/"}:
            problems.append(f"{name} entries must be bare https origins (got {origin!r})")
        elif parsed.hostname in LOCAL_HOSTS:
            problems.append(f"{name} must not contain local hosts")
    return problems


def validate_production_environment(env: Mapping[str, str]) -> list[str]:
    problems: list[str] = _secret_problems(env.get("DJANGO_SECRET_KEY", ""))

    hosts = _items(env.get("DJANGO_ALLOWED_HOSTS", ""))
    if not hosts:
        problems.append("DJANGO_ALLOWED_HOSTS must be set")
    elif any(host in {"*", ".*"} for host in hosts):
        problems.append("DJANGO_ALLOWED_HOSTS must not be a wildcard")
    elif any(host in LOCAL_HOSTS for host in hosts):
        problems.append("DJANGO_ALLOWED_HOSTS must not contain local hosts")

    for name in ("DATABASE_URL", "REDIS_URL"):
        if not env.get(name):
            problems.append(f"{name} must be set")

    problems += _origin_problems("CORS_ALLOWED_ORIGINS", env.get("CORS_ALLOWED_ORIGINS", ""))
    problems += _origin_problems("CSRF_TRUSTED_ORIGINS", env.get("CSRF_TRUSTED_ORIGINS", ""))

    backend = env.get("EMAIL_BACKEND", "django.core.mail.backends.smtp.EmailBackend")
    if backend in NON_DELIVERING_EMAIL_BACKENDS:
        problems.append("EMAIL_BACKEND does not deliver mail; configure a real provider")
    elif backend.endswith("smtp.EmailBackend"):
        if env.get("EMAIL_HOST", "localhost") in LOCAL_HOSTS:
            problems.append("EMAIL_HOST must point at a real SMTP provider")
        if not env.get("EMAIL_HOST_USER") or not env.get("EMAIL_HOST_PASSWORD"):
            problems.append("EMAIL_HOST_USER and EMAIL_HOST_PASSWORD must be set")
    from_email = env.get("DEFAULT_FROM_EMAIL", "")
    if not from_email or from_email.endswith(".invalid>"):
        problems.append("DEFAULT_FROM_EMAIL must be a real sender address")

    link = env.get("RECOVERY_LINK_BASE", "")
    if not link:
        problems.append("RECOVERY_LINK_BASE must be set (the reset link customers open)")
    elif link.startswith("http://"):
        problems.append("RECOVERY_LINK_BASE must not use plain http")

    if env.get("EXPORT_STORAGE_BACKEND", "filesystem") != "s3":
        problems.append("EXPORT_STORAGE_BACKEND must be 's3' (private object storage)")
    elif not env.get("AWS_STORAGE_BUCKET_NAME"):
        problems.append("AWS_STORAGE_BUCKET_NAME must be set")
    return problems
