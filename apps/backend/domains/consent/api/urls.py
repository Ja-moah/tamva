from rest_framework.routers import DefaultRouter

from domains.consent.api.views import ConsentViewSet

router = DefaultRouter()
router.register("consents", ConsentViewSet, basename="consent")

urlpatterns = router.urls
