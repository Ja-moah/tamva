from datetime import timedelta

import pytest
from django.utils import timezone

from domains.consent.models import Consent, ConsentPurpose, ConsentScope


@pytest.mark.integration
@pytest.mark.django_db
def test_unauthenticated_request_is_rejected(api_client) -> None:
    response = api_client.get("/api/v1/consents/")
    assert response.status_code in {401, 403}


@pytest.mark.integration
@pytest.mark.django_db
def test_customer_can_grant_list_and_revoke_own_consent(api_client, normalisation_context) -> None:
    customer, institution, _, _ = normalisation_context
    purpose = ConsentPurpose.objects.create(
        institution=institution, code="api-test", name="API test"
    )
    scope = ConsentScope.objects.create(code="api:read", name="API read")
    api_client.force_authenticate(user=customer)

    create_response = api_client.post(
        "/api/v1/consents/",
        {
            "institution_id": str(institution.id),
            "purpose_code": purpose.code,
            "scope_codes": [scope.code],
            "expires_at": (timezone.now() + timedelta(days=30)).isoformat(),
        },
        format="json",
    )
    assert create_response.status_code == 201
    consent_id = create_response.data["data"]["id"]

    list_response = api_client.get("/api/v1/consents/")
    assert list_response.status_code == 200
    assert any(item["id"] == consent_id for item in list_response.data["results"])

    revoke_response = api_client.post(f"/api/v1/consents/{consent_id}/revoke/")
    assert revoke_response.status_code == 200
    assert revoke_response.data["data"]["status"] == Consent.Status.REVOKED


@pytest.mark.integration
@pytest.mark.django_db
def test_customer_cannot_read_another_customers_consent_by_id_guessing(
    api_client, normalisation_context
) -> None:
    customer, institution, _, _ = normalisation_context
    purpose = ConsentPurpose.objects.create(institution=institution, code="api-test-2", name="x")
    scope = ConsentScope.objects.create(code="api:read2", name="x")
    consent = Consent.objects.create(
        customer=customer,
        institution=institution,
        purpose=purpose,
        expires_at=timezone.now() + timedelta(days=30),
    )
    consent.scopes.set([scope])

    from domains.identity.models import User

    other_customer = User.objects.create_user(
        username="other-customer",
        email="other-customer@example.test",
        password="correct horse battery staple",
        identity_type=User.IdentityType.CUSTOMER,
    )
    api_client.force_authenticate(user=other_customer)

    response = api_client.get(f"/api/v1/consents/{consent.id}/")
    assert response.status_code == 404


@pytest.mark.integration
@pytest.mark.django_db
def test_consent_list_names_the_institution_and_purpose_for_display(
    api_client, normalisation_context
) -> None:
    api_client.force_authenticate(user=normalisation_context[0])

    response = api_client.get("/api/v1/consents/")

    row = response.data["results"][0]
    assert row["institution_name"] == "Normalisation Bank"
    assert row["purpose_name"] == "Canonical mapping"
    assert row["status"] == "GRANTED"
