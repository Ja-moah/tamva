import pytest
from django.urls import reverse


@pytest.mark.contract
@pytest.mark.django_db
def test_openapi_schema_is_available(api_client) -> None:
    response = api_client.get(reverse("schema"))
    assert response.status_code == 200
    assert "openapi" in response.content.decode()
