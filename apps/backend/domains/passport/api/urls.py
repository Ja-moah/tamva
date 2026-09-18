from django.urls import path
from rest_framework.routers import DefaultRouter

from domains.passport.api.views import PassportShareAccessView, PassportShareViewSet, PassportView

router = DefaultRouter()
router.register("passport/shares", PassportShareViewSet, basename="passport-share")

urlpatterns = [
    path("passport/customers/<uuid:customer_id>/", PassportView.as_view(), name="passport-detail"),
    path(
        "passport/shares/access/",
        PassportShareAccessView.as_view(),
        name="passport-share-access",
    ),
    *router.urls,
]
