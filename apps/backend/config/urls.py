from django.conf import settings
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

from packages.common.views import (
    CapabilitiesView,
    HealthView,
    LivenessView,
    ReadinessView,
    VersionView,
)

urlpatterns = [
    path("health/", HealthView.as_view(), name="health"),
    path("health/live/", LivenessView.as_view(), name="health-live"),
    path("health/ready/", ReadinessView.as_view(), name="health-ready"),
    path("api/v1/capabilities/", CapabilitiesView.as_view(), name="capabilities"),
    path("api/v1/meta/version/", VersionView.as_view(), name="meta-version"),
    path("api/v1/", include("domains.identity.api.urls")),
    path("api/v1/", include("domains.consent.api.urls")),
    path("api/v1/", include("domains.risk.api.urls")),
    path("api/v1/", include("domains.case.api.urls")),
    path("api/v1/", include("domains.notifications.api.urls")),
    path("api/v1/", include("domains.passport.api.urls")),
    path("api/v1/", include("domains.security.api.urls")),
    path("api/v1/", include("domains.audit.api.urls")),
    path("api/v1/", include("domains.graph.api.urls")),
    path("api/v1/", include("domains.partner.api.urls")),
    path("api/v1/", include("domains.operations.api.urls")),
    path("api/v1/", include("domains.customer.api.urls")),
]

# Developer conveniences are opt-in in production (API_DOCS_ENABLED, DJANGO_ADMIN_ENABLED).
if settings.DJANGO_ADMIN_ENABLED:
    urlpatterns.append(path("admin/", admin.site.urls))
if settings.API_DOCS_ENABLED:
    urlpatterns += [
        path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
        path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
        path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
    ]

handler400 = "packages.common.error_pages.bad_request"
handler403 = "packages.common.error_pages.permission_denied"
handler404 = "packages.common.error_pages.not_found"
handler500 = "packages.common.error_pages.server_error"
