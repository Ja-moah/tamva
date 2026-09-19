"""End-to-end refusals through the public API: the customer shares a Passport, the
recipient institution reads it, and then every way access should stop actually stops."""

from datetime import timedelta

import pytest
from django.utils import timezone
from rest_framework.test import APIClient

from domains.consent.models import Consent
from domains.identity.models import User
from domains.passport.models import PassportShare
from tests.integration.admin_support import operator
from tests.integration.test_case import platform_user
from tests.integration.test_customer_api import BASE, other_customer
from tests.integration.test_passport import build_chain, grant_passport_consent

ACCESS = "/api/v1/passport/shares/access/"


def client_for(user: User) -> APIClient:
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def shared(normalisation_context):
    """A customer with a generated Passport shared with the recipient institution."""
    build_chain(normalisation_context)
    customer, issuer, recipient = normalisation_context[:3]
    grant_passport_consent(normalisation_context, recipient_institution=recipient)
    api = client_for(customer)
    generated = api.post(
        f"{BASE}/passport/generate/", {"institution_id": str(issuer.id)}, format="json"
    )
    assert generated.status_code in {200, 201}, generated.data
    created = api.post(
        f"{BASE}/passport/shares/",
        {
            "issuer_institution_id": str(issuer.id),
            "recipient_institution_id": str(recipient.id),
            "purpose_code": "passport_sharing",
            "allowed_sections": ["FINANCIAL_SUMMARY"],
            "expires_at": (timezone.now() + timedelta(days=7)).isoformat(),
        },
        format="json",
    )
    assert created.status_code == 201, created.data
    recipient_staff = platform_user(
        normalisation_context, username="e2e-recipient-staff", institution=recipient
    )
    return {
        "context": normalisation_context,
        "api": api,
        "share_id": created.data["data"]["id"],
        "token": created.data["data"]["token"],
        "recipient": recipient,
        "recipient_client": client_for(recipient_staff),
    }


def read_passport(shared, token=None):
    return shared["recipient_client"].post(
        ACCESS,
        {"token": token or shared["token"]},
        format="json",
        HTTP_X_INSTITUTION_ID=str(shared["recipient"].id),
    )


@pytest.mark.e2e
@pytest.mark.django_db
def test_baseline_recipient_can_read_the_shared_passport(shared):
    assert read_passport(shared).status_code == 200


@pytest.mark.e2e
@pytest.mark.django_db
def test_a_guessed_or_altered_token_is_refused(shared):
    assert read_passport(shared, token=shared["token"][:-2] + "xx").status_code in {400, 403, 404}
    assert read_passport(shared, token="not-a-real-token").status_code in {400, 403, 404}


@pytest.mark.e2e
@pytest.mark.django_db
def test_revoking_the_share_stops_access(shared):
    revoked = shared["api"].post(f"{BASE}/passport/shares/{shared['share_id']}/revoke/")
    assert revoked.status_code == 200

    assert read_passport(shared).status_code in {400, 403, 404}


@pytest.mark.e2e
@pytest.mark.django_db
def test_an_expired_share_stops_access(shared):
    PassportShare.objects.filter(pk=shared["share_id"]).update(
        expires_at=timezone.now() - timedelta(seconds=1)
    )

    assert read_passport(shared).status_code in {400, 403, 404}


@pytest.mark.e2e
@pytest.mark.django_db
def test_revoking_the_underlying_consent_stops_access(shared):
    consent = Consent.objects.get(purpose__code="passport_sharing", customer=shared["context"][0])

    revoked = shared["api"].post(f"{BASE}/consents/{consent.id}/revoke/")
    assert revoked.status_code == 200

    assert read_passport(shared).status_code in {400, 403, 404}


@pytest.mark.e2e
@pytest.mark.django_db
def test_another_customer_can_neither_see_nor_revoke_the_share_or_consent(shared):
    consent = Consent.objects.get(purpose__code="passport_sharing", customer=shared["context"][0])
    intruder = client_for(other_customer("intruder"))

    assert intruder.get(f"{BASE}/passport/shares/").data["count"] == 0
    assert intruder.post(f"{BASE}/passport/shares/{shared['share_id']}/revoke/").status_code == 404
    assert intruder.post(f"{BASE}/consents/{consent.id}/revoke/").status_code == 404
    assert intruder.get(f"{BASE}/consents/{consent.id}/").status_code == 404
    assert read_passport(shared).status_code == 200  # untouched


@pytest.mark.e2e
@pytest.mark.django_db
def test_staff_of_the_wrong_institution_cannot_use_the_token(shared):
    context = shared["context"]
    issuer_staff = platform_user(context, username="e2e-issuer-staff", institution=context[1])

    response = client_for(issuer_staff).post(
        ACCESS,
        {"token": shared["token"]},
        format="json",
        HTTP_X_INSTITUTION_ID=str(context[1].id),
    )

    assert response.status_code in {400, 403, 404}


@pytest.mark.e2e
@pytest.mark.django_db
def test_an_operator_cannot_act_in_an_institution_they_do_not_belong_to(normalisation_context):
    member = operator(normalisation_context, "case:read")
    foreign = normalisation_context[2]

    response = client_for(member).get("/api/v1/cases/", HTTP_X_INSTITUTION_ID=str(foreign.id))

    assert response.status_code == 403


@pytest.mark.e2e
@pytest.mark.django_db
def test_unavailable_capabilities_are_reported_and_have_no_route(shared):
    api = shared["api"]
    capabilities = api.get("/api/v1/capabilities/").data["data"]

    assert capabilities["customer_payments"] == "NOT_AVAILABLE"
    assert capabilities["dark_web_monitoring"] == "NOT_AVAILABLE"
    assert api.post(f"{BASE}/payments/", {}, format="json").status_code == 404
    assert api.get(f"{BASE}/send/").status_code == 404
