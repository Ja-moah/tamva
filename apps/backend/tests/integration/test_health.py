import pytest
from django.urls import reverse


@pytest.mark.integration
@pytest.mark.django_db
def test_health_checks_database(api_client) -> None:
    response = api_client.get(reverse("health"))
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}
