from __future__ import annotations

from typing import Any

from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from domains.audit.api.serializers import AuditEventSerializer
from domains.audit.models import AuditEvent
from domains.identity.api.permissions import HasPermission
from packages.common.api import require_institution_id
from packages.common.filtering import FilteredListMixin, FilterSpec, filter_parameters

FILTERS = (
    FilterSpec("action", "action"),
    FilterSpec("outcome", "outcome", "choice", choices=tuple(AuditEvent.Outcome.values)),
    FilterSpec("actor", "actor_id", "uuid"),
    FilterSpec("date_from", "created_at", "datetime", "gte"),
    FilterSpec("date_to", "created_at", "datetime", "lte"),
)
ORDERING = {"created_at": "created_at", "action": "action", "outcome": "outcome"}


@extend_schema_view(
    list=extend_schema(parameters=filter_parameters(FILTERS, ordering_fields=ORDERING))
)
class AuditEventViewSet(FilteredListMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    """Append-only trail, read-only here. Only events tagged with the active
    institution are visible; platform-level events are not."""

    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "audit:read"
    serializer_class = AuditEventSerializer
    queryset = AuditEvent.objects.none()
    filter_specs = FILTERS
    ordering_fields = ORDERING
    default_ordering = ("-created_at", "id")

    def get_queryset(self) -> Any:
        return AuditEvent.objects.filter(institution_id=require_institution_id(self.request))
