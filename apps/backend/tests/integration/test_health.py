import pytest
from django.urls import reverse


@pytest.mark.integration
@pytest.mark.django_db
def test_health_checks_database(api_client) -> None:
    response = api_client.get(reverse("health"))
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok"}


@pytest.mark.integration
def test_liveness_does_not_touch_dependencies(api_client) -> None:
    response = api_client.get(reverse("health-live"))
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


@pytest.mark.integration
@pytest.mark.django_db
def test_readiness_checks_database_and_cache(api_client) -> None:
    response = api_client.get(reverse("health-ready"))
    assert response.status_code == 200
    assert response.json() == {"status": "ok", "database": "ok", "cache": "ok"}
