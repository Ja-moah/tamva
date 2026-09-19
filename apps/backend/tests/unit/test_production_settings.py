import os
import subprocess
import sys
from pathlib import Path

import pytest

from config.settings.validation import validate_production_environment

BACKEND_DIR = Path(__file__).resolve().parents[2]

VALID_ENV = {
    "DJANGO_SECRET_KEY": "k3Yq9-Zx7vLm2pWn8RtB4dFh6JsC1aGe5UoIy0NcXbVzAwMqPrTlEuHgOjSfDk",
    "DJANGO_ALLOWED_HOSTS": "api.example.org",
    "DATABASE_URL": "postgresql://u:p@db:5432/tamva?sslmode=require",
    "REDIS_URL": "redis://redis:6379/0",
    "CORS_ALLOWED_ORIGINS": "https://app.example.org,https://admin.example.org",
    "CSRF_TRUSTED_ORIGINS": "https://admin.example.org",
    "EMAIL_HOST": "smtp.provider.example",
    "EMAIL_HOST_USER": "user",
    "EMAIL_HOST_PASSWORD": "pw",
    "DEFAULT_FROM_EMAIL": "TAMVA <no-reply@example.org>",
    "RECOVERY_LINK_BASE": "https://app.example.org/reset-password",
    "EXPORT_STORAGE_BACKEND": "s3",
    "AWS_STORAGE_BUCKET_NAME": "tamva-private",
}


def test_valid_environment_has_no_problems():
    assert validate_production_environment(VALID_ENV) == []


@pytest.mark.parametrize(
    ("override", "needle"),
    [
        ({"DJANGO_SECRET_KEY": ""}, "DJANGO_SECRET_KEY"),
        ({"DJANGO_SECRET_KEY": "unsafe-development-key"}, "placeholder"),
        ({"DJANGO_SECRET_KEY": "change-me-please"}, "placeholder"),
        ({"DJANGO_SECRET_KEY": "a" * 60}, "too weak"),
        ({"DJANGO_SECRET_KEY": "short-but-varied-1234"}, "too weak"),
        ({"DJANGO_ALLOWED_HOSTS": ""}, "DJANGO_ALLOWED_HOSTS"),
        ({"DJANGO_ALLOWED_HOSTS": "*"}, "wildcard"),
        ({"DJANGO_ALLOWED_HOSTS": "localhost"}, "local"),
        ({"DATABASE_URL": ""}, "DATABASE_URL"),
        ({"REDIS_URL": ""}, "REDIS_URL"),
        ({"CORS_ALLOWED_ORIGINS": ""}, "CORS_ALLOWED_ORIGINS"),
        ({"CORS_ALLOWED_ORIGINS": "*"}, "wildcard"),
        ({"CORS_ALLOWED_ORIGINS": "http://app.example.org"}, "https"),
        ({"CORS_ALLOWED_ORIGINS": "https://localhost"}, "local"),
        ({"CSRF_TRUSTED_ORIGINS": ""}, "CSRF_TRUSTED_ORIGINS"),
        ({"CSRF_TRUSTED_ORIGINS": "https://*.example.org"}, "wildcard"),
        ({"CSRF_TRUSTED_ORIGINS": "https://admin.example.org/path"}, "https"),
        ({"EMAIL_BACKEND": "django.core.mail.backends.console.EmailBackend"}, "EMAIL_BACKEND"),
        ({"EMAIL_HOST": "localhost"}, "EMAIL_HOST"),
        ({"EMAIL_HOST_PASSWORD": ""}, "EMAIL_HOST_USER"),
        ({"DEFAULT_FROM_EMAIL": "TAMVA <no-reply@tamva.invalid>"}, "DEFAULT_FROM_EMAIL"),
        ({"RECOVERY_LINK_BASE": ""}, "RECOVERY_LINK_BASE"),
        ({"RECOVERY_LINK_BASE": "http://app.example.org/reset"}, "plain http"),
        ({"EXPORT_STORAGE_BACKEND": "filesystem"}, "EXPORT_STORAGE_BACKEND"),
        ({"AWS_STORAGE_BUCKET_NAME": ""}, "AWS_STORAGE_BUCKET_NAME"),
    ],
)
def test_unsafe_environment_is_reported(override, needle):
    problems = validate_production_environment({**VALID_ENV, **override})
    assert any(needle in problem for problem in problems), problems


def test_problems_never_echo_secret_values():
    secret = "a-very-secret-value-that-must-not-leak-1234567890abcdef"
    env = {**VALID_ENV, "DJANGO_SECRET_KEY": secret, "EMAIL_HOST_PASSWORD": ""}
    assert all(secret not in problem for problem in validate_production_environment(env))


def _import_settings(module: str, env: dict[str, str]) -> subprocess.CompletedProcess[str]:
    clean = {k: v for k, v in os.environ.items() if k not in VALID_ENV and k != "DJANGO_DEBUG"}
    return subprocess.run(
        [sys.executable, "-c", f"import {module} as s; print(s.DEBUG, s.SECURE_HSTS_PRELOAD)"],
        cwd=BACKEND_DIR,
        env={**clean, **env},
        capture_output=True,
        text=True,
        timeout=60,
        check=False,
    )


def test_production_refuses_to_start_with_bad_environment():
    result = _import_settings("config.settings.production", {"DJANGO_SECRET_KEY": "x"})
    assert result.returncode != 0
    assert "Refusing to start" in result.stderr


def test_production_starts_with_valid_environment_and_safe_defaults():
    result = _import_settings("config.settings.production", VALID_ENV)
    assert result.returncode == 0, result.stderr
    assert result.stdout.split() == ["False", "False"]  # DEBUG off, HSTS preload opt-in


def test_staging_shares_the_production_validation():
    result = _import_settings("config.settings.staging", {"DJANGO_SECRET_KEY": "x"})
    assert result.returncode != 0
