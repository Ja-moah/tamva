from django.urls import path
from rest_framework.routers import DefaultRouter

from domains.operations.api.views import (
    AnalyticsSummaryView,
    CustomerViewSet,
    ExportViewSet,
    OverviewView,
    ResourceCatalogView,
    SavedViewViewSet,
)

router = DefaultRouter()
router.register("customers", CustomerViewSet, basename="customer")
router.register("saved-views", SavedViewViewSet, basename="saved-view")
router.register("exports", ExportViewSet, basename="export")

urlpatterns = [
    path("overview/", OverviewView.as_view(), name="overview"),
    path("analytics/summary/", AnalyticsSummaryView.as_view(), name="analytics-summary"),
    path("resources/", ResourceCatalogView.as_view(), name="resource-catalog"),
    *router.urls,
]
