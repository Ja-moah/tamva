from __future__ import annotations

from typing import Any

from django.db.models import Case as SqlCase
from django.db.models import IntegerField, Value, When
from drf_spectacular.utils import extend_schema, extend_schema_view, inline_serializer
from rest_framework import mixins, serializers, status, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from domains.identity.api.permissions import HasPermission
from domains.partner.models import Institution
from domains.security.api.serializers import (
    CustomerDeviceSerializer,
    LocationObservationSerializer,
    ObservationSerializer,
    SecurityEventSerializer,
)
from domains.security.models import (
    CustomerDevice,
    LocationObservation,
    SecurityEvent,
    TrustState,
)
from domains.security.services import ingest_observation
from packages.common.api import require_institution_id
from packages.common.filtering import FilteredListMixin, FilterSpec, filter_parameters
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


EVENT_FILTERS = (
    FilterSpec("category", "category", "choice", choices=tuple(SecurityEvent.Category.values)),
    FilterSpec("severity", "severity", "choice", choices=tuple(SecurityEvent.Severity.values)),
    FilterSpec("customer", "customer_id", "uuid"),
    FilterSpec("source", "source"),
    FilterSpec("date_from", "occurred_at", "datetime", "gte"),
    FilterSpec("date_to", "occurred_at", "datetime", "lte"),
)
EVENT_ORDERING = {"occurred_at": "occurred_at", "severity": "severity_rank", "category": "category"}
SEVERITY_RANK = SqlCase(
    When(severity=SecurityEvent.Severity.INFO, then=Value(1)),
    When(severity=SecurityEvent.Severity.WARNING, then=Value(2)),
    When(severity=SecurityEvent.Severity.HIGH, then=Value(3)),
    When(severity=SecurityEvent.Severity.CRITICAL, then=Value(4)),
    default=Value(0),
    output_field=IntegerField(),
)


@extend_schema_view(
    list=extend_schema(parameters=filter_parameters(EVENT_FILTERS, ordering_fields=EVENT_ORDERING))
)
class SecurityEventViewSet(
    FilteredListMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    """Read-only. Events are produced by backend services from evidence;
    dark-web, breach and account-takeover detections do not exist yet
    (see `/capabilities/`) and are never synthesized here."""

    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "security:read"
    serializer_class = SecurityEventSerializer
    queryset = SecurityEvent.objects.none()  # schema-introspection fallback only
    filter_specs = EVENT_FILTERS
    ordering_fields = EVENT_ORDERING
    default_ordering = ("-occurred_at", "id")

    def get_queryset(self) -> Any:
        return SecurityEvent.objects.filter(
            institution_id=require_institution_id(self.request)
        ).annotate(severity_rank=SEVERITY_RANK)


DEVICE_FILTERS = (
    FilterSpec("customer", "customer_id", "uuid"),
    FilterSpec("status", "status", "choice", choices=tuple(TrustState.values)),
    FilterSpec("source", "device__source"),
    FilterSpec("last_seen_from", "last_seen_at", "datetime", "gte"),
    FilterSpec("last_seen_to", "last_seen_at", "datetime", "lte"),
)
DEVICE_ORDERING = {
    "last_seen_at": "last_seen_at",
    "first_seen_at": "first_seen_at",
    "observation_count": "observation_count",
}


@extend_schema_view(
    list=extend_schema(
        parameters=filter_parameters(DEVICE_FILTERS, ordering_fields=DEVICE_ORDERING)
    )
)
class CustomerDeviceViewSet(FilteredListMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "security:read"
    serializer_class = CustomerDeviceSerializer
    queryset = CustomerDevice.objects.none()
    filter_specs = DEVICE_FILTERS
    ordering_fields = DEVICE_ORDERING
    default_ordering = ("-last_seen_at", "id")

    def get_queryset(self) -> Any:
        return CustomerDevice.objects.filter(
            institution_id=require_institution_id(self.request)
        ).select_related("device")


LOCATION_FILTERS = (
    FilterSpec("customer", "customer_id", "uuid"),
    FilterSpec("country_code", "country_code"),
    FilterSpec("source", "source"),
    FilterSpec("date_from", "observed_at", "datetime", "gte"),
    FilterSpec("date_to", "observed_at", "datetime", "lte"),
)
LOCATION_ORDERING = {"observed_at": "observed_at", "confidence": "confidence"}


@extend_schema_view(
    list=extend_schema(
        parameters=filter_parameters(LOCATION_FILTERS, ordering_fields=LOCATION_ORDERING)
    )
)
class LocationObservationViewSet(FilteredListMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "security:read"
    serializer_class = LocationObservationSerializer
    queryset = LocationObservation.objects.none()
    filter_specs = LOCATION_FILTERS
    ordering_fields = LOCATION_ORDERING
    default_ordering = ("-observed_at", "id")

    def get_queryset(self) -> Any:
        return LocationObservation.objects.filter(
            institution_id=require_institution_id(self.request)
        )
