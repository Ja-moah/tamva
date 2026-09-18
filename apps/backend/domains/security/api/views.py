from __future__ import annotations

from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from domains.identity.api.permissions import HasPermission
from domains.partner.models import Institution
from domains.security.api.serializers import ObservationSerializer
from domains.security.services import ingest_observation
from packages.common.api import require_institution_id
from packages.observability.context import request_id_var


class ObservationView(APIView):
    """Trusted institutional/client integrations submit what they observed.

    The caller never asserts a verdict: whether an observation produces a
    signal (NEW_DEVICE, UNUSUAL_LOCATION, feature flags) is decided by the
    backend from the evidence.
    """

    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "security:observe"
    throttle_scope = "security_observation"

    @extend_schema(
        request=ObservationSerializer,
        responses={
            200: inline_serializer(
                name="ObservationReused",
                fields={"data": serializers.DictField(child=serializers.CharField())},
            ),
            201: inline_serializer(
                name="ObservationCreated",
                fields={"data": serializers.DictField(child=serializers.CharField())},
            ),
        },
    )
    def post(self, request: Request) -> Response:
        institution = Institution.objects.get(id=require_institution_id(request))
        serializer = ObservationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        observation_type = data["type"]
        payload = dict(data[observation_type.lower()])
        result = ingest_observation(
            institution=institution,
            actor=request.user,
            observation_type=observation_type,
            customer_id=data["customer_id"],
            source=data["source"],
            source_event_id=data["source_event_id"],
            observed_at=data["observed_at"],
            payload=payload,
            request_id=request_id_var.get(),
        )
        return Response(
            {
                "data": {
                    "type": result.observation_type,
                    "observation_id": str(result.observation_id),
                    "created": str(result.created).lower(),
                }
            },
            status=status.HTTP_201_CREATED if result.created else status.HTTP_200_OK,
        )
