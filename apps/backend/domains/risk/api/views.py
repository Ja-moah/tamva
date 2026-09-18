from __future__ import annotations

from typing import Any

from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from domains.identity.api.permissions import HasPermission
from domains.risk.api.serializers import RiskEventDetailSerializer, RiskEventSerializer
from domains.risk.models import RiskEvent
from packages.common.api import require_institution_id


class RiskEventViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """Institution-facing, read-only. Risk decisions are produced by the
    pipeline (domains.risk.services.evaluate_risk); this surface only
    retrieves already-computed, immutable results.
    """

    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "risk:read"
    queryset = RiskEvent.objects.none()  # schema-introspection fallback only

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
            .order_by("-evaluated_at")
        )
        customer_id = self.request.query_params.get("customer_id")
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        return queryset
