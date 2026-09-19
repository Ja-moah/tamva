from django.urls import path
from rest_framework.routers import DefaultRouter

from domains.graph.api.views import (
    CustomerGraphMetricsView,
    GraphEdgeViewSet,
    GraphNodeViewSet,
    NetworkSummaryView,
)

router = DefaultRouter()
router.register("network/nodes", GraphNodeViewSet, basename="network-node")
router.register("network/edges", GraphEdgeViewSet, basename="network-edge")

urlpatterns = [
    path("network/summary/", NetworkSummaryView.as_view(), name="network-summary"),
    path(
        "network/customers/<uuid:customer_id>/metrics/",
        CustomerGraphMetricsView.as_view(),
        name="network-customer-metrics",
    ),
    *router.urls,
]
