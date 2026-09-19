from django.conf import settings
from django.core.cache import cache
from django.db import connections
from django.db.utils import OperationalError
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from packages.common.capabilities import CAPABILITIES


def _database_ok() -> bool:
    try:
        with connections["default"].cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        return True
    except OperationalError:
        return False


def _cache_ok() -> bool:
    try:
        cache.set("healthcheck", "1", timeout=5)
        return cache.get("healthcheck") == "1"
    except Exception:  # any cache backend failure means "not ready"
        return False


class LivenessView(APIView):
    """Process is up and can serve requests. No dependency checks: a
    dependency outage must not make the orchestrator restart healthy pods.
    """

    authentication_classes: list[type] = []
    permission_classes = [AllowAny]

    @extend_schema(
        responses=inline_serializer(
            name="LivenessResponse", fields={"status": serializers.CharField()}
        )
    )
    def get(self, request: object) -> Response:
        return Response({"status": "ok"})


class ReadinessView(APIView):
    """Required dependencies (PostgreSQL, Redis) are reachable. Optional
    external vendor APIs are deliberately not checked here — a vendor
    outage should not take the whole service out of rotation.
    """

    authentication_classes: list[type] = []
    permission_classes = [AllowAny]

    @extend_schema(
        responses=inline_serializer(
            name="ReadinessResponse",
            fields={
                "status": serializers.CharField(),
                "database": serializers.CharField(),
                "cache": serializers.CharField(),
            },
        )
    )
    def get(self, request: object) -> Response:
        database_ok = _database_ok()
        cache_ok = _cache_ok()
        if database_ok and cache_ok:
            return Response({"status": "ok", "database": "ok", "cache": "ok"})
        return Response(
            {
                "status": "unhealthy",
                "database": "ok" if database_ok else "unavailable",
                "cache": "ok" if cache_ok else "unavailable",
            },
            status=503,
        )


class HealthView(APIView):
    """Kept for backward compatibility with existing external health checks;
    equivalent to ReadinessView. Prefer /health/live/ and /health/ready/.
    """

    authentication_classes: list[type] = []
    permission_classes = [AllowAny]

    @extend_schema(
        responses=inline_serializer(
            name="HealthResponse",
            fields={
                "status": serializers.CharField(),
                "database": serializers.CharField(),
            },
        )
    )
    def get(self, request: object) -> Response:
        if _database_ok():
            return Response({"status": "ok", "database": "ok"})
        return Response({"status": "unhealthy", "database": "unavailable"}, status=503)


class CapabilitiesView(APIView):
    """Authenticated manifest of which product capabilities are actually
    available, so clients render accurately instead of guessing."""

    @extend_schema(
        responses=inline_serializer(
            name="CapabilitiesResponse",
            fields={
                "data": serializers.DictField(child=serializers.CharField()),
            },
        )
    )
    def get(self, request: object) -> Response:
        return Response({"data": {code: state.value for code, state in CAPABILITIES.items()}})


class VersionView(APIView):
    """Safe, unauthenticated deployment metadata so clients can label the
    environment truthfully. Never returns hostnames, settings or secrets."""

    permission_classes = [AllowAny]
    authentication_classes: list[type] = []

    @extend_schema(
        responses=inline_serializer(
            name="VersionResponse",
            fields={
                "data": inline_serializer(
                    name="VersionInfo",
                    fields={
                        "api_version": serializers.CharField(),
                        "application_version": serializers.CharField(),
                        "environment": serializers.CharField(),
                        "release": serializers.CharField(allow_blank=True),
                    },
                )
            },
        )
    )
    def get(self, request: object) -> Response:
        return Response(
            {
                "data": {
                    "api_version": "v1",
                    "application_version": settings.APP_VERSION,
                    "environment": settings.APP_ENVIRONMENT,
                    "release": settings.APP_RELEASE,
                }
            }
        )
