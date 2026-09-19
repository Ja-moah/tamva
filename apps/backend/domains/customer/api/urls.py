from django.urls import path
from rest_framework.routers import DefaultRouter

from domains.customer.api.views import (
    ActivityViewSet,
    ConfidenceCurrentView,
    ConfidenceHistoryViewSet,
    ConnectionViewSet,
    ConsentCatalogueView,
    ConsentViewSet,
    HomeView,
    PassportCurrentView,
    PassportGenerateView,
    PassportShareViewSet,
    ProfileCurrentView,
    ProfileHistoryViewSet,
    SecurityEventViewSet,
    SecuritySummaryView,
)

router = DefaultRouter()
router.register("customer/activity", ActivityViewSet, basename="customer-activity")
router.register(
    "customer/profile/history", ProfileHistoryViewSet, basename="customer-profile-history"
)
router.register(
    "customer/financial-confidence/history",
    ConfidenceHistoryViewSet,
    basename="customer-confidence-history",
)
router.register("customer/connections", ConnectionViewSet, basename="customer-connection")
router.register("customer/consents", ConsentViewSet, basename="customer-consent")
router.register(
    "customer/passport/shares", PassportShareViewSet, basename="customer-passport-share"
)
router.register(
    "customer/security/events", SecurityEventViewSet, basename="customer-security-event"
)

urlpatterns = [
    path("customer/home/", HomeView.as_view(), name="customer-home"),
    path(
        "customer/profile/current/", ProfileCurrentView.as_view(), name="customer-profile-current"
    ),
    path(
        "customer/financial-confidence/current/",
        ConfidenceCurrentView.as_view(),
        name="customer-confidence-current",
    ),
    path(
        "customer/consent/catalogue/",
        ConsentCatalogueView.as_view(),
        name="customer-consent-catalogue",
    ),
    path(
        "customer/passport/current/",
        PassportCurrentView.as_view(),
        name="customer-passport-current",
    ),
    path(
        "customer/passport/generate/",
        PassportGenerateView.as_view(),
        name="customer-passport-generate",
    ),
    path(
        "customer/security/summary/",
        SecuritySummaryView.as_view(),
        name="customer-security-summary",
    ),
    *router.urls,
]
