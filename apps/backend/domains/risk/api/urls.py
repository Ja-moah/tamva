from rest_framework.routers import DefaultRouter

from domains.risk.api.views import RiskEventViewSet

router = DefaultRouter()
router.register("risk/events", RiskEventViewSet, basename="risk-event")

urlpatterns = router.urls
