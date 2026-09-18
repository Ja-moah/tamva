from django.contrib import admin
from django.urls import path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from packages.common.views import CurrencyConvertView, CurrencyRatesView, HealthView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health/", HealthView.as_view(), name="health"),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    # Backend Currency Conversion & Multi-Rail Exchange Rates API
    path("api/v1/currency/rates/", CurrencyRatesView.as_view(), name="currency-rates"),
    path("api/v1/currency/convert/", CurrencyConvertView.as_view(), name="currency-convert"),
]
