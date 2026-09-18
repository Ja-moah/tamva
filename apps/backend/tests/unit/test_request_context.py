import pytest
from django.urls import reverse


@pytest.mark.unit
@pytest.mark.django_db
def test_request_id_is_generated(api_client) -> None:
    response = api_client.get(reverse("health"))
    assert response["X-Request-ID"]


@pytest.mark.unit
@pytest.mark.django_db
def test_supplied_request_id_is_returned(api_client) -> None:
    response = api_client.get(reverse("health"), HTTP_X_REQUEST_ID="trace-123")
    assert response["X-Request-ID"] == "trace-123"
