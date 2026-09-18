from django.urls import path

from domains.security.api.views import ObservationView

urlpatterns = [
    path("security/observations/", ObservationView.as_view(), name="security-observation"),
]
