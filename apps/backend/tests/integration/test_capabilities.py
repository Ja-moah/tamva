import json

import pytest


@pytest.mark.integration
@pytest.mark.django_db
def test_capabilities_require_authentication(api_client):
    response = api_client.get("/api/v1/capabilities/")
    assert response.status_code in {401, 403}


@pytest.mark.integration
@pytest.mark.django_db
def test_implemented_capability_is_available_and_v2_is_not(api_client, normalisation_context):
    api_client.force_authenticate(user=normalisation_context[0])

    response = api_client.get("/api/v1/capabilities/")

    assert response.status_code == 200
    data = response.data["data"]
    assert data["financial_confidence"] == "AVAILABLE"
    assert data["counterparty_intelligence"] == "AVAILABLE"
    assert data["device_signals"] == "AVAILABLE"
    assert data["location_signals"] == "AVAILABLE"
    assert data["security_events"] == "PARTIAL"
    assert data["dark_web_monitoring"] == "NOT_AVAILABLE"
    assert data["external_breach_monitoring"] == "NOT_AVAILABLE"
    assert data["cross_institution_graph"] == "NOT_AVAILABLE"
    assert set(data.values()) <= {"AVAILABLE", "PARTIAL", "NOT_AVAILABLE", "DISABLED"}


@pytest.mark.integration
@pytest.mark.django_db
def test_capabilities_expose_no_internal_detail(api_client, normalisation_context):
    api_client.force_authenticate(user=normalisation_context[0])

    body = json.dumps(api_client.get("/api/v1/capabilities/").data).lower()

    for forbidden in ("secret", "token", "password", "domains.", "provider"):
        assert forbidden not in body
