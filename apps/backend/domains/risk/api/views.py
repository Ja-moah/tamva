from __future__ import annotations

from typing import Any

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from domains.identity.api.permissions import HasPermission
from domains.risk.api.serializers import RiskEventDetailSerializer, RiskEventSerializer
from domains.risk.models import RiskEvent
from packages.common.api import require_institution_id
from packages.common.filtering import FilteredListMixin, FilterSpec, filter_parameters

FILTERS = (
    FilterSpec("decision", "decision", "choice", choices=tuple(RiskEvent.Decision.values)),
    FilterSpec("severity", "reasons__severity", distinct=True, description="Reason severity."),
    FilterSpec("reason_code", "reasons__code", distinct=True),
    FilterSpec("score_min", "score", "decimal", "gte", description="Risk score, 0-1000."),
    FilterSpec("score_max", "score", "decimal", "lte"),
    FilterSpec("customer", "customer_id", "uuid"),
    FilterSpec("customer_id", "customer_id", "uuid", description="Alias of `customer`."),
    FilterSpec("date_from", "evaluated_at", "datetime", "gte"),
    FilterSpec("date_to", "evaluated_at", "datetime", "lte"),
)
ORDERING = {
    "evaluated_at": "evaluated_at",
    "score": "score",
    "decision": "decision",
    "confidence": "confidence",
}


@extend_schema_view(
    list=extend_schema(parameters=filter_parameters(FILTERS, ordering_fields=ORDERING))
)
class RiskEventViewSet(
    FilteredListMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    """Institution-facing, read-only. Risk decisions are produced by the
    pipeline (domains.risk.services.evaluate_risk); this surface only
    retrieves already-computed, immutable results.
    """

    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "risk:read"
    queryset = RiskEvent.objects.none()  # schema-introspection fallback only
    filter_specs = FILTERS
    ordering_fields = ORDERING
    default_ordering = ("-evaluated_at", "id")

    def get_serializer_class(self) -> type[RiskEventSerializer]:
        if self.action == "retrieve":
            return RiskEventDetailSerializer
        return RiskEventSerializer

    def get_queryset(self) -> Any:
        institution_id = require_institution_id(self.request)
        queryset = (
            RiskEvent.objects.filter(institution_id=institution_id)
            .select_related(
                "policy_version__policy", "ruleset_version", "model_version__model_definition"
            )
            .prefetch_related("reasons")
        )
        return queryset
