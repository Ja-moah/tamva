from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from packages.common.views import HealthView, LivenessView, ReadinessView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", HealthView.as_view(), name="health"),
    path("health/live/", LivenessView.as_view(), name="health-live"),
    path("health/ready/", ReadinessView.as_view(), name="health-ready"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/v1/", include("domains.identity.api.urls")),
    path("api/v1/", include("domains.consent.api.urls")),
    path("api/v1/", include("domains.risk.api.urls")),
    path("api/v1/", include("domains.case.api.urls")),
    path("api/v1/", include("domains.notifications.api.urls")),
    path("api/v1/", include("domains.passport.api.urls")),
]
