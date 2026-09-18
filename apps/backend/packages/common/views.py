from django.db import connections
from django.db.utils import OperationalError
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
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
        try:
            with connections["default"].cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except OperationalError:
            return Response({"status": "unhealthy", "database": "unavailable"}, status=503)
        return Response({"status": "ok", "database": "ok"})
