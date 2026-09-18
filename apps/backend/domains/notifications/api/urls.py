from rest_framework.routers import DefaultRouter

from domains.notifications.api.views import NotificationPreferenceViewSet, NotificationViewSet

router = DefaultRouter()
router.register("notifications", NotificationViewSet, basename="notification")
router.register(
    "notification-preferences", NotificationPreferenceViewSet, basename="notification-preference"
)

urlpatterns = router.urls
