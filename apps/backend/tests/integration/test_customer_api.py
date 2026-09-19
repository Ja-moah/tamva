import json
from datetime import timedelta

import pytest
from django.utils import timezone

from domains.confidence.services import (
    compute_financial_confidence,
    create_reference_confidence_policy_version,
)
from domains.identity.models import User
from domains.security.models import CustomerDevice, Device, SecurityEvent
from tests.integration.test_case import platform_user
from tests.integration.test_confidence import build_profile_and_features
from tests.integration.test_ledger import canonical_transaction
from tests.integration.test_notifications_api import make_notification
from tests.integration.test_passport import build_chain, grant_passport_consent

BASE = "/api/v1/customer"


def other_customer(name="second-customer"):
    return User.objects.create_user(
        username=name,
        email=f"{name}@example.test",
        password="correct horse battery staple",
        identity_type=User.IdentityType.CUSTOMER,
    )


def as_user(api_client, user):
    api_client.force_authenticate(user=user)
    return api_client


@pytest.fixture
def populated(normalisation_context):
    """A customer with ledger activity, a profile, a confidence score, a device
    event and one unread notification, all created through the domain services."""
    customer, institution, _other, _connection = normalisation_context
    build_profile_and_features(normalisation_context, source_event_id="c-credit", amount="200.00")
    canonical_transaction(
        normalisation_context,
        source_event_id="c-debit",
        direction="DEBIT",
        amount="35.00",
        counterparty_name="Corner Shop",
    )
    compute_financial_confidence(
        institution=institution,
        customer=customer,
        policy_version=create_reference_confidence_policy_version(),
    )
    device = Device.objects.create(
        institution=institution,
        device_key="opaque-device-key-123456",
        source="mobile",
        first_seen_at=timezone.now(),
        last_seen_at=timezone.now(),
    )
    CustomerDevice.objects.create(
        institution=institution,
        customer=customer,
        device=device,
        first_seen_at=timezone.now(),
        last_seen_at=timezone.now(),
        observation_count=1,
    )
    SecurityEvent.objects.create(
        institution=institution,
        customer=customer,
        category="NEW_DEVICE",
        severity="WARNING",
        source="mobile",
        occurred_at=timezone.now(),
        metadata={"internal": "producer detail"},
    )
    make_notification(normalisation_context)
    return normalisation_context


# ------------------------------------------------------------ who may call


ENDPOINTS = [
    "/home/",
    "/activity/",
    "/profile/current/",
    "/profile/history/",
    "/financial-confidence/current/",
    "/financial-confidence/history/",
    "/connections/",
    "/consent/catalogue/",
    "/consents/",
    "/passport/current/",
    "/passport/shares/",
    "/security/summary/",
    "/security/events/",
]


@pytest.mark.security
@pytest.mark.django_db
@pytest.mark.parametrize("path", ENDPOINTS)
def test_customer_endpoints_reject_anonymous_and_institutional_actors(
    api_client, normalisation_context, path
):
    assert api_client.get(BASE + path).status_code in {401, 403}
    staff = platform_user(normalisation_context, username="staff-actor")
    as_user(api_client, staff)
    assert api_client.get(BASE + path).status_code == 403


@pytest.mark.security
@pytest.mark.django_db
def test_a_customer_cannot_use_institutional_admin_apis(api_client, populated):
    as_user(api_client, populated[0])
    headers = {"HTTP_X_INSTITUTION_ID": str(populated[1].id)}
    for path in (
        "/api/v1/overview/",
        "/api/v1/customers/",
        "/api/v1/cases/",
        "/api/v1/team/members/",
    ):
        assert api_client.get(path, **headers).status_code == 403


@pytest.mark.security
@pytest.mark.django_db
def test_a_suspended_customer_is_refused(api_client, populated):
    User.objects.filter(pk=populated[0].pk).update(status="SUSPENDED")
    as_user(api_client, User.objects.get(pk=populated[0].pk))
    assert api_client.get(f"{BASE}/home/").status_code == 403


# --------------------------------------------------------------------- home


@pytest.mark.integration
@pytest.mark.django_db
def test_home_aggregates_trusted_summaries_without_inventing_a_balance(api_client, populated):
    customer, institution = populated[0], populated[1]

    data = as_user(api_client, customer).get(f"{BASE}/home/").data["data"]

    assert data["financial_confidence"]["scale"]["max"] == 100
    assert data["financial_confidence"]["institution_name"] == institution.name
    assert data["profile"]["account_count"] >= 1
    assert data["connections"] == {"total": 1, "active": 1, "needs_attention": 0}
    assert data["consents"]["active"] == 1
    assert data["notifications"]["unread"] == 1
    assert data["protection"]["events_30d"] == 1
    # the risk pipeline behind the notification fixture adds one 125.50 credit
    assert data["activity_30d"]["transaction_count"] == 3
    assert data["activity_30d"]["inflow_by_currency"]  # per original currency
    body = json.dumps(data, default=str).lower()
    for forbidden in ("balance", "available", "risk_score", "raw", "provenance"):
        assert forbidden not in body


@pytest.mark.integration
@pytest.mark.django_db
def test_home_for_a_brand_new_customer_is_explicitly_empty(api_client):
    fresh = other_customer("fresh")
    data = as_user(api_client, fresh).get(f"{BASE}/home/").data["data"]

    assert data["financial_confidence"] is None
    assert data["profile"] is None
    assert data["connections"] == {"total": 0, "active": 0, "needs_attention": 0}
    assert data["activity_30d"]["transaction_count"] == 0
    assert data["activity_30d"]["latest"] == []
    assert data["consents"]["active"] == 0


# ----------------------------------------------------------------- activity


@pytest.mark.integration
@pytest.mark.django_db
def test_activity_lists_canonical_transactions_with_filters_and_no_provider_data(
    api_client, populated
):
    as_user(api_client, populated[0])

    everything = api_client.get(f"{BASE}/activity/")
    debits = api_client.get(f"{BASE}/activity/", {"direction": "DEBIT"})
    searched = api_client.get(f"{BASE}/activity/", {"search": "corner"})
    ordered = api_client.get(f"{BASE}/activity/", {"ordering": "amount"})
    paged = api_client.get(f"{BASE}/activity/", {"page_size": 1})
    future = api_client.get(f"{BASE}/activity/", {"date_from": "2100-01-01"})

    assert everything.data["count"] == 3
    assert debits.data["count"] == 1
    assert debits.data["results"][0]["counterparty"] == "Corner Shop"
    assert searched.data["count"] == 1
    assert [float(r["amount"]) for r in ordered.data["results"]] == [35.0, 125.5, 200.0]
    assert len(paged.data["results"]) == 1 and paged.data["next"] is not None
    assert future.data["count"] == 0
    body = json.dumps(everything.data, default=str)
    for leaked in (
        "account-456",
        "source_provenance",
        "raw_event",
        "counterparty_reference",
        "metadata",
    ):
        assert leaked not in body
    assert everything.data["results"][0]["account"].startswith("••")
    assert api_client.get(f"{BASE}/activity/", {"nope": "1"}).status_code == 400


@pytest.mark.security
@pytest.mark.django_db
def test_customers_never_see_each_others_data(api_client, populated):
    stranger = other_customer()
    as_user(api_client, stranger)
    for path in (
        "/activity/",
        "/connections/",
        "/consents/",
        "/passport/shares/",
        "/security/events/",
    ):
        assert api_client.get(BASE + path).data["count"] == 0
    assert api_client.get(f"{BASE}/profile/current/").data["data"]["institutions"] == []
    assert (
        api_client.get(f"{BASE}/financial-confidence/current/").data["data"]["institutions"] == []
    )
    assert api_client.get(f"{BASE}/profile/history/").data["count"] == 0
    assert api_client.get(f"{BASE}/financial-confidence/history/").data["count"] == 0


# ------------------------------------------- profile and financial confidence


@pytest.mark.integration
@pytest.mark.django_db
def test_profile_current_and_history_expose_supported_metrics_and_state_the_gaps(
    api_client, populated
):
    as_user(api_client, populated[0])

    current = api_client.get(f"{BASE}/profile/current/").data["data"]["institutions"][0]
    history = api_client.get(f"{BASE}/profile/history/")

    assert str(current["cash_flow"]["total_inflows"]) == "325.50"
    assert current["institution_name"] == populated[1].name
    assert current["not_available"] == ["debt_management", "repayment_behaviour", "resilience"]
    assert "provenance" not in current
    assert history.data["count"] == 2  # snapshots are immutable; newest first
    assert history.data["results"][0]["is_current"] is True
    assert history.data["results"][1]["is_current"] is False


@pytest.mark.integration
@pytest.mark.django_db
def test_financial_confidence_is_zero_to_hundred_informational_and_not_a_risk_score(
    api_client, populated
):
    as_user(api_client, populated[0])

    current = api_client.get(f"{BASE}/financial-confidence/current/").data["data"]
    history = api_client.get(f"{BASE}/financial-confidence/history/")

    item = current["institutions"][0]
    assert current["scale"] == {
        "min": 0,
        "max": 100,
        "higher_is": "stronger verified financial confidence",
        "informational": True,
        "note": "Not a credit score and not a lending decision.",
    }
    assert 0 <= float(item["score"]) <= 100
    assert item["components"] and {"code", "weight", "available"} <= set(item["components"][0])
    assert item["version"] and item["as_of"]
    assert history.data["results"][0]["score"] == item["score"]
    assert "risk" not in json.dumps(current, default=str).lower().replace("risk_", "x")


# -------------------------------------------------------------- connections


@pytest.mark.integration
@pytest.mark.django_db
def test_connections_list_health_but_never_credentials_or_provider_references(
    api_client, populated
):
    response = as_user(api_client, populated[0]).get(f"{BASE}/connections/")

    row = response.data["results"][0]
    assert row["provider"] == "normalisation-provider"
    assert row["state"] == "ACTIVE"
    body = json.dumps(response.data, default=str)
    for leaked in ("vault://", "account-456", "credential", "external_reference"):
        assert leaked not in body


@pytest.mark.integration
@pytest.mark.django_db
def test_starting_a_connection_needs_consent_and_is_created_pending_authorization(
    api_client, populated
):
    customer, institution = populated[0], populated[1]
    as_user(api_client, customer)
    body = {
        "institution_id": str(institution.id),
        "provider": "normalisation-provider",
        "purpose_code": "canonical-mapping",
        "scope_code": "transactions:read",
        "external_reference": "new-account-789",
    }

    no_consent = api_client.post(
        f"{BASE}/connections/", {**body, "scope_code": "not-consented"}, format="json"
    )
    created = api_client.post(f"{BASE}/connections/", body, format="json")
    duplicate = api_client.post(f"{BASE}/connections/", body, format="json")

    assert no_consent.status_code == 403
    assert created.status_code == 201
    assert created.data["data"]["state"] == "PENDING_AUTHORIZATION"
    assert created.data["data"]["status"] == "PAUSED"  # not ACTIVE: nothing is fetched yet
    assert duplicate.status_code == 400
    assert "pending-provider-authorization" not in json.dumps(created.data, default=str)
    assert (
        api_client.post(
            f"{BASE}/connections/", {**body, "provider": "nope"}, format="json"
        ).status_code
        == 400
    )


@pytest.mark.security
@pytest.mark.django_db
def test_disconnect_is_owner_only_and_idempotent(api_client, populated):
    connection = populated[3]
    stranger = other_customer()
    url = f"{BASE}/connections/{connection.id}/disconnect/"

    as_user(api_client, stranger)
    assert api_client.post(url).status_code == 404
    assert api_client.get(f"{BASE}/connections/{connection.id}/").status_code == 404

    as_user(api_client, populated[0])
    first = api_client.post(url)
    second = api_client.post(url)
    assert first.data["data"]["status"] == second.data["data"]["status"] == "REVOKED"


# ------------------------------------------------------------------ consent


@pytest.mark.integration
@pytest.mark.django_db
def test_consent_catalogue_lists_only_valid_recipients_purposes_and_scopes(api_client, populated):
    catalogue = as_user(api_client, populated[0]).get(f"{BASE}/consent/catalogue/").data["data"]

    names = {i["name"]: [p["code"] for p in i["purposes"]] for i in catalogue["institutions"]}
    assert names == {"Normalisation Bank": ["canonical-mapping"]}  # other bank has no purposes
    assert "transactions:read" in [s["code"] for s in catalogue["scopes"]]
    assert catalogue["duration_days"] == {"min": 1, "default": 90, "max": 365}
    assert "slug" not in json.dumps(catalogue)


@pytest.mark.integration
@pytest.mark.django_db
def test_customer_grants_and_revokes_consent_within_the_duration_rules(api_client, populated):
    customer, institution = populated[0], populated[1]
    as_user(api_client, customer)
    body = {
        "institution_id": str(institution.id),
        "purpose_code": "canonical-mapping",
        "scope_codes": ["transactions:read"],
        "expires_at": (timezone.now() + timedelta(days=30)).isoformat(),
    }

    too_long = api_client.post(
        f"{BASE}/consents/",
        {**body, "expires_at": (timezone.now() + timedelta(days=400)).isoformat()},
        format="json",
    )
    past = api_client.post(
        f"{BASE}/consents/",
        {**body, "expires_at": (timezone.now() - timedelta(days=1)).isoformat()},
        format="json",
    )
    unknown_purpose = api_client.post(
        f"{BASE}/consents/", {**body, "purpose_code": "nope"}, format="json"
    )
    granted = api_client.post(f"{BASE}/consents/", body, format="json")

    assert too_long.status_code == past.status_code == unknown_purpose.status_code == 400
    assert granted.status_code == 201
    assert granted.data["data"]["institution_name"] == institution.name
    consent_id = granted.data["data"]["id"]
    revoked = api_client.post(f"{BASE}/consents/{consent_id}/revoke/")
    assert revoked.data["data"]["status"] == "REVOKED"
    assert api_client.get(f"{BASE}/consents/", {"status": "REVOKED"}).data["count"] == 1


@pytest.mark.security
@pytest.mark.django_db
def test_consent_can_only_be_revoked_by_its_owner(api_client, populated):
    consent = populated[0].consents.first()
    as_user(api_client, other_customer())
    assert api_client.post(f"{BASE}/consents/{consent.id}/revoke/").status_code == 404


# ----------------------------------------------------------------- passport


@pytest.mark.integration
@pytest.mark.django_db
def test_passport_generation_needs_a_profile_and_never_exposes_raw_history(api_client, populated):
    build_chain(populated)
    customer, institution = populated[0], populated[1]
    as_user(api_client, customer)

    unknown = api_client.post(
        f"{BASE}/passport/generate/", {"institution_id": str(populated[2].id)}, format="json"
    )
    generated = api_client.post(
        f"{BASE}/passport/generate/", {"institution_id": str(institution.id)}, format="json"
    )
    current = api_client.get(f"{BASE}/passport/current/").data["data"]["institutions"][0]

    assert unknown.status_code == 404  # no profile with that institution
    assert generated.status_code == 201
    assert current["snapshot"]["id"] == generated.data["data"]["id"]
    body = json.dumps(current, default=str).lower()
    for raw in ("corner shop", "source_account", "vault://", "account-456", "token"):
        assert raw not in body


@pytest.mark.integration
@pytest.mark.django_db
def test_passport_share_is_consented_scoped_time_limited_and_revocable(api_client, populated):
    build_chain(populated)
    customer, institution, recipient = populated[0], populated[1], populated[2]
    as_user(api_client, customer)
    api_client.post(
        f"{BASE}/passport/generate/", {"institution_id": str(institution.id)}, format="json"
    )
    share_body = {
        "issuer_institution_id": str(institution.id),
        "recipient_institution_id": str(recipient.id),
        "purpose_code": "passport_sharing",
        "allowed_sections": ["FINANCIAL_SUMMARY", "PROFILE_COMPLETENESS"],
        "expires_at": (timezone.now() + timedelta(days=7)).isoformat(),
    }

    without_consent = api_client.post(f"{BASE}/passport/shares/", share_body, format="json")
    grant_passport_consent(populated, recipient_institution=recipient)
    too_long = api_client.post(
        f"{BASE}/passport/shares/",
        {**share_body, "expires_at": (timezone.now() + timedelta(days=500)).isoformat()},
        format="json",
    )
    bad_section = api_client.post(
        f"{BASE}/passport/shares/",
        {**share_body, "allowed_sections": ["RAW_TRANSACTIONS"]},
        format="json",
    )
    created = api_client.post(f"{BASE}/passport/shares/", share_body, format="json")

    assert without_consent.status_code == 400
    assert too_long.status_code == bad_section.status_code == 400
    assert created.status_code == 201
    assert created["Cache-Control"] == "no-store"
    assert created.data["data"]["token"]  # shown once
    assert created.data["data"]["allowed_sections"] == ["FINANCIAL_SUMMARY", "PROFILE_COMPLETENESS"]

    listed = api_client.get(f"{BASE}/passport/shares/")
    assert listed.data["count"] == 1
    assert "token" not in json.dumps(listed.data, default=str)
    assert listed.data["results"][0]["recipient_institution_name"] == recipient.name

    share_id = created.data["data"]["id"]
    as_user(api_client, other_customer())
    assert api_client.post(f"{BASE}/passport/shares/{share_id}/revoke/").status_code == 404
    as_user(api_client, customer)
    revoked = api_client.post(f"{BASE}/passport/shares/{share_id}/revoke/")
    assert revoked.data["data"]["status"] == "REVOKED"
    assert api_client.post(f"{BASE}/passport/shares/{share_id}/revoke/").status_code == 400


# ----------------------------------------------------------------- security


@pytest.mark.integration
@pytest.mark.django_db
def test_security_summary_and_events_are_customer_safe_and_flag_unsupported_detection(
    api_client, populated
):
    as_user(api_client, populated[0])

    summary = api_client.get(f"{BASE}/security/summary/").data["data"]
    events = api_client.get(f"{BASE}/security/events/")

    assert summary["events_30d"] == 1
    assert summary["by_category_30d"] == {"NEW_DEVICE": 1}
    assert summary["devices"]["known"] == 1
    assert summary["unsupported"] == {
        "dark_web_monitoring": "NOT_AVAILABLE",
        "external_breach_monitoring": "NOT_AVAILABLE",
        "account_takeover_detection": "NOT_AVAILABLE",
    }
    assert events.data["count"] == 1
    assert "producer detail" not in json.dumps(events.data, default=str)
    assert "metadata" not in events.data["results"][0]
    assert api_client.get(f"{BASE}/security/events/", {"category": "NOPE"}).status_code == 400


@pytest.mark.integration
@pytest.mark.django_db
def test_customer_capabilities_are_honest_once_the_apis_exist(api_client, populated):
    data = as_user(api_client, populated[0]).get("/api/v1/capabilities/").data["data"]

    for available in (
        "customer_home",
        "customer_activity",
        "customer_financial_profile",
        "customer_financial_confidence",
        "customer_consent",
        "customer_passport",
        "customer_registration",
        "customer_account_recovery",
    ):
        assert data[available] == "AVAILABLE"
    assert data["customer_connections"] == "PARTIAL"
    assert data["customer_protection"] == "PARTIAL"
    assert data["customer_payments"] == "NOT_AVAILABLE"
