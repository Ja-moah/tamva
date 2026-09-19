"""One serious customer journey through the real domain services.

Only the things that have no customer-facing surface are done by platform-side
code: publishing an institution/purpose/scope catalogue, provider authorization
completing (an institution-side integration), and the integration actor that
reports device observations. Everything the customer does goes through the API.
"""

from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from domains.confidence.services import (
    compute_financial_confidence,
    create_reference_confidence_policy_version,
)
from domains.connector.models import ConnectorDefinition, InstitutionConnection
from domains.consent.models import ConsentPurpose, ConsentScope
from domains.feature.services import compute_features, create_default_feature_set
from domains.identity.models import User
from domains.ledger.services import post_transaction
from domains.partner.models import Institution
from domains.profile.services import compute_profile
from tests.integration.test_customer_api import BASE
from tests.integration.test_ledger import canonical_transaction
from tests.integration.test_notifications_api import make_notification
from tests.integration.test_passport import build_chain
from tests.integration.test_security_ingestion_api import device_body, integration_user

PASSWORD = "an-e2e-passphrase-2026-xyz"


def days(n: int) -> str:
    return (timezone.now() + timedelta(days=n)).isoformat()


def as_bearer(tokens: dict) -> APIClient:
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access_token']}")
    return client


@pytest.mark.e2e
@pytest.mark.django_db
def test_customer_journey_from_registration_to_passport_share_and_logout():
    # ---- platform catalogue (published by institutions, not by the customer)
    bank = Institution.objects.create(name="E2E Bank", slug="e2e-bank")
    recipient = Institution.objects.create(name="E2E Lender", slug="e2e-lender")
    ConsentPurpose.objects.create(institution=bank, code="e2e-sync", name="Sync my accounts")
    ConsentPurpose.objects.create(
        institution=bank, code="security_monitoring", name="Security monitoring"
    )
    ConsentPurpose.objects.create(
        institution=recipient, code="passport_sharing", name="Share my passport"
    )
    for code in ("transactions:read", "security:observe", "passport:read"):
        ConsentScope.objects.create(code=code, name=code)
    ConnectorDefinition.objects.create(provider="e2e-provider", name="E2E Provider")

    # ---- 1. register and authenticate
    anon = APIClient()
    registered = anon.post(
        "/api/v1/customer/register/",
        {"email": "journey@example.test", "password": PASSWORD, "accepted_terms": True},
        format="json",
    )
    assert registered.status_code == 201
    signed_in = anon.post(
        "/api/v1/auth/token/",
        {"identifier": "journey@example.test", "password": PASSWORD, "device_label": "e2e"},
        format="json",
    )
    assert signed_in.status_code == 200
    tokens = signed_in.data["data"]
    customer = User.objects.get(email="journey@example.test")
    api = as_bearer(tokens)
    assert api.get("/api/v1/me/").data["data"]["user"]["actor_type"] == "CUSTOMER"

    # a brand-new customer's Home is empty, not fabricated
    assert api.get(f"{BASE}/home/").data["data"]["financial_confidence"] is None

    # ---- 2. discover the catalogue and grant consent (sync + security)
    catalogue = api.get(f"{BASE}/consent/catalogue/").data["data"]
    assert {i["name"] for i in catalogue["institutions"]} == {"E2E Bank", "E2E Lender"}
    for purpose, scope in (
        ("e2e-sync", "transactions:read"),
        ("security_monitoring", "security:observe"),
    ):
        granted = api.post(
            f"{BASE}/consents/",
            {
                "institution_id": str(bank.id),
                "purpose_code": purpose,
                "scope_codes": [scope],
                "expires_at": days(60),
            },
            format="json",
        )
        assert granted.status_code == 201, granted.data

    # ---- 3. connect a provider (created pending: authorization is the provider's step)
    started = api.post(
        f"{BASE}/connections/",
        {
            "institution_id": str(bank.id),
            "provider": "e2e-provider",
            "purpose_code": "e2e-sync",
            "scope_code": "transactions:read",
            "external_reference": "journey-account-1",
        },
        format="json",
    )
    assert started.status_code == 201
    assert started.data["data"]["state"] == "PENDING_AUTHORIZATION"
    connection = InstitutionConnection.objects.get(pk=started.data["data"]["id"])
    connection.status = InstitutionConnection.Status.ACTIVE  # provider authorization completed
    connection.save(update_fields=["status"])
    assert api.get(f"{BASE}/connections/").data["results"][0]["state"] == "ACTIVE"

    # ---- 4. ingest data through the domain pipeline (no shortcuts)
    other_institution = recipient
    context = (customer, bank, other_institution, connection)
    for source_id, direction, amount in (("j-1", "CREDIT", "900.00"), ("j-2", "DEBIT", "120.00")):
        txn = canonical_transaction(
            context, source_event_id=source_id, direction=direction, amount=amount
        )
        post_transaction(transaction_id=txn.id, institution=bank)
    snapshot = compute_profile(
        customer_id=customer.id,
        institution=bank,
        period_start=timezone.now() - timedelta(days=365),
        period_end=timezone.now() + timedelta(days=1),
    )
    compute_features(snapshot=snapshot, feature_set=create_default_feature_set())
    compute_financial_confidence(
        institution=bank,
        customer=customer,
        policy_version=create_reference_confidence_policy_version(),
    )

    activity = api.get(f"{BASE}/activity/")
    assert activity.data["count"] == 2
    assert api.get(f"{BASE}/activity/", {"direction": "DEBIT"}).data["count"] == 1
    profile = api.get(f"{BASE}/profile/current/").data["data"]["institutions"][0]
    assert str(profile["cash_flow"]["net_cash_flow"]) == "780.00"
    confidence = api.get(f"{BASE}/financial-confidence/current/").data["data"]
    assert 0 <= float(confidence["institutions"][0]["score"]) <= 100

    # ---- 5. a device observation from an institution integration becomes a security event
    integrator = APIClient()
    integrator.force_authenticate(user=integration_user(context, institution=bank))
    integrator.credentials(HTTP_X_INSTITUTION_ID=str(bank.id))
    observed = integrator.post(
        "/api/v1/security/observations/", device_body(context), format="json"
    )
    assert observed.status_code in {200, 201}
    summary = api.get(f"{BASE}/security/summary/").data["data"]
    assert summary["by_category_30d"].get("NEW_DEVICE") == 1
    assert api.get(f"{BASE}/security/events/").data["count"] == 1

    # ---- 6. a notification reaches the customer
    build_chain(context)  # risk + graph for the passport
    make_notification(context)
    assert api.get("/api/v1/notifications/").data["count"] >= 1
    home = api.get(f"{BASE}/home/").data["data"]
    assert home["notifications"]["unread"] >= 1
    assert home["financial_confidence"]["scale"]["max"] == 100
    assert home["connections"]["active"] == 1
    assert home["protection"]["events_30d"] == 1

    # ---- 7. generate a passport, consent to the recipient, share, revoke
    generated = api.post(
        f"{BASE}/passport/generate/", {"institution_id": str(bank.id)}, format="json"
    )
    assert generated.status_code == 201
    share_body = {
        "issuer_institution_id": str(bank.id),
        "recipient_institution_id": str(recipient.id),
        "purpose_code": "passport_sharing",
        "allowed_sections": ["FINANCIAL_SUMMARY", "PROFILE_COMPLETENESS"],
        "expires_at": days(14),
    }
    assert api.post(f"{BASE}/passport/shares/", share_body, format="json").status_code == 400
    assert (
        api.post(
            f"{BASE}/consents/",
            {
                "institution_id": str(recipient.id),
                "purpose_code": "passport_sharing",
                "scope_codes": ["passport:read"],
                "expires_at": days(30),
            },
            format="json",
        ).status_code
        == 201
    )
    share = api.post(f"{BASE}/passport/shares/", share_body, format="json")
    assert share.status_code == 201
    assert share.data["data"]["token"]
    assert api.get(f"{BASE}/home/").data["data"]["passport"]["active_shares"] == 1

    # ---- 8. isolation during the flow: a second customer sees none of it
    anon.post(
        "/api/v1/customer/register/",
        {"email": "bystander@example.test", "password": PASSWORD, "accepted_terms": True},
        format="json",
    )
    bystander = as_bearer(
        anon.post(
            "/api/v1/auth/token/",
            {"identifier": "bystander@example.test", "password": PASSWORD},
            format="json",
        ).data["data"]
    )
    for path in (
        "/activity/",
        "/connections/",
        "/consents/",
        "/passport/shares/",
        "/security/events/",
    ):
        assert bystander.get(BASE + path).data["count"] == 0
    assert bystander.get(f"{BASE}/home/").data["data"]["financial_confidence"] is None
    share_id = share.data["data"]["id"]
    assert bystander.post(f"{BASE}/passport/shares/{share_id}/revoke/").status_code == 404
    assert bystander.get("/api/v1/overview/").status_code == 403

    # ---- 9. revoke the share, then sign out
    revoked = api.post(f"{BASE}/passport/shares/{share_id}/revoke/")
    assert revoked.data["data"]["status"] == "REVOKED"
    assert api.get(f"{BASE}/home/").data["data"]["passport"]["active_shares"] == 0

    assert api.post("/api/v1/auth/token/revoke/", {}, format="json").status_code == 204
    assert api.get(f"{BASE}/home/").status_code == 401
    assert (
        anon.post(
            "/api/v1/auth/token/refresh/",
            {"refresh_token": tokens["refresh_token"]},
            format="json",
        ).status_code
        == 401
    )
