from django.urls import path
from rest_framework.routers import DefaultRouter

from domains.security.api.views import (
    CustomerDeviceViewSet,
    LocationObservationViewSet,
    ObservationView,
    SecurityEventViewSet,
)

router = DefaultRouter()
router.register("security/events", SecurityEventViewSet, basename="security-event")
router.register("security/devices", CustomerDeviceViewSet, basename="security-device")
router.register("security/locations", LocationObservationViewSet, basename="security-location")

urlpatterns = [
    path("security/observations/", ObservationView.as_view(), name="security-observation"),
    *router.urls,
]
