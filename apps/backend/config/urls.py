from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from packages.common.views import (
    CapabilitiesView,
    CurrencyConvertView,
    CurrencyRatesView,
    HealthView,
    LivenessView,
    ReadinessView,
)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", HealthView.as_view(), name="health"),
    path("health/live/", LivenessView.as_view(), name="health-live"),
    path("health/ready/", ReadinessView.as_view(), name="health-ready"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/v1/capabilities/", CapabilitiesView.as_view(), name="capabilities"),
    path("api/v1/currency/rates/", CurrencyRatesView.as_view(), name="currency-rates"),
    path("api/v1/currency/convert/", CurrencyConvertView.as_view(), name="currency-convert"),
    path("api/v1/", include("domains.identity.api.urls")),
    path("api/v1/", include("domains.consent.api.urls")),
    path("api/v1/", include("domains.risk.api.urls")),
    path("api/v1/", include("domains.case.api.urls")),
    path("api/v1/", include("domains.notifications.api.urls")),
    path("api/v1/", include("domains.passport.api.urls")),
    path("api/v1/", include("domains.security.api.urls")),
]
