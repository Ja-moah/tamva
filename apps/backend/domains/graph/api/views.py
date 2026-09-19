from __future__ import annotations

from typing import Any
from uuid import UUID

from django.db.models import Count
from drf_spectacular.utils import extend_schema, extend_schema_view
from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from domains.graph.api.serializers import (
    GraphEdgeSerializer,
    GraphMetricSerializer,
    GraphNodeSerializer,
)
from domains.graph.models import (
    GraphComputationRun,
    GraphEdge,
    GraphEdgeType,
    GraphNode,
    GraphNodeType,
)
from domains.identity.api.permissions import HasPermission
from packages.common.api import require_institution_id
from packages.common.capabilities import CAPABILITIES
from packages.common.filtering import (
    FilteredListMixin,
    FilterSpec,
    SearchSpec,
    filter_parameters,
)

# Institution-scoped only. Cross-institution intelligence, merchant consortiums,
# fraud rings and device-graph edges are not produced by the backend and are
# never inferred here (see `/capabilities/`).
UNSUPPORTED = (
    "cross_institution_graph",
    "merchant_intelligence",
)

NODE_FILTERS = (
    FilterSpec("node_type", "node_type", "choice", choices=tuple(GraphNodeType.values)),
    FilterSpec("reference", "reference_id", "uuid"),
)
NODE_SEARCH = SearchSpec(("label",))
NODE_ORDERING = {"label": "label", "node_type": "node_type", "created": "created_at"}


@extend_schema_view(
    list=extend_schema(
        parameters=filter_parameters(
            NODE_FILTERS, search=NODE_SEARCH, ordering_fields=NODE_ORDERING
        )
    )
)
class GraphNodeViewSet(
    FilteredListMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet
):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "network:read"
    serializer_class = GraphNodeSerializer
    queryset = GraphNode.objects.none()
    filter_specs = NODE_FILTERS
    search_spec = NODE_SEARCH
    ordering_fields = NODE_ORDERING
    default_ordering = ("node_type", "label", "id")

    def get_queryset(self) -> Any:
        return GraphNode.objects.filter(institution_id=require_institution_id(self.request))


EDGE_FILTERS = (
    FilterSpec("edge_type", "edge_type", "choice", choices=tuple(GraphEdgeType.values)),
    FilterSpec("source", "source_node_id", "uuid"),
    FilterSpec("target", "target_node_id", "uuid"),
    FilterSpec("last_from", "last_occurred_at", "datetime", "gte"),
    FilterSpec("last_to", "last_occurred_at", "datetime", "lte"),
)
EDGE_ORDERING = {
    "last_occurred_at": "last_occurred_at",
    "occurrence_count": "occurrence_count",
    "edge_type": "edge_type",
}


@extend_schema_view(
    list=extend_schema(parameters=filter_parameters(EDGE_FILTERS, ordering_fields=EDGE_ORDERING))
)
class GraphEdgeViewSet(FilteredListMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "network:read"
    serializer_class = GraphEdgeSerializer
    queryset = GraphEdge.objects.none()
    filter_specs = EDGE_FILTERS
    ordering_fields = EDGE_ORDERING
    default_ordering = ("-last_occurred_at", "id")

    def get_queryset(self) -> Any:
        return GraphEdge.objects.filter(institution_id=require_institution_id(self.request))


class NetworkSummaryView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "network:read"

    @extend_schema(responses=None)
    def get(self, request: Request) -> Response:
        institution_id = require_institution_id(request)
        nodes = dict(
            GraphNode.objects.filter(institution_id=institution_id)
            .order_by()
            .values_list("node_type")
            .annotate(n=Count("pk"))
        )
        edges = dict(
            GraphEdge.objects.filter(institution_id=institution_id)
            .order_by()
            .values_list("edge_type")
            .annotate(n=Count("pk"))
        )
        completed = GraphComputationRun.objects.filter(
            institution_id=institution_id, status=GraphComputationRun.Status.COMPLETED
        )
        return Response(
            {
                "data": {
                    "nodes_by_type": {t: nodes.get(t, 0) for t in GraphNodeType.values},
                    "edges_by_type": {t: edges.get(t, 0) for t in GraphEdgeType.values},
                    "customers_with_computed_graph": completed.values("customer_id")
                    .distinct()
                    .count(),
                    "unsupported": {code: CAPABILITIES[code].value for code in UNSUPPORTED},
                }
            }
        )


class CustomerGraphMetricsView(APIView):
    permission_classes = [IsAuthenticated, HasPermission]
    required_permission = "network:read"

    @extend_schema(responses=None)
    def get(self, request: Request, customer_id: UUID) -> Response:
        run = (
            GraphComputationRun.objects.filter(
                institution_id=require_institution_id(request),
                customer_id=customer_id,
                status__in=[
                    GraphComputationRun.Status.COMPLETED,
                    GraphComputationRun.Status.REUSED,
                ],
            )
            .order_by("-created_at")
            .prefetch_related("metrics")
            .first()
        )
        if run is None:
            return Response({"data": {"computed_at": None, "graph_version": None, "metrics": []}})
        return Response(
            {
                "data": {
                    "computed_at": run.created_at,
                    "graph_version": run.graph_version,
                    "metrics": GraphMetricSerializer(run.metrics.all(), many=True).data,
                }
            }
        )
