import uuid
from datetime import timedelta

import pytest
from django.core.cache import cache
from django.utils import timezone
from rest_framework.throttling import ScopedRateThrottle

from domains.audit.models import AuditEvent
from domains.consent.models import Consent, ConsentPurpose, ConsentScope
from domains.consent.services import grant_consent, revoke_consent
from domains.identity.models import Permission, Role
from domains.partner.models import InstitutionMembership
from domains.security.models import DeviceObservation, LocationObservation, SecurityEvent
from tests.integration.test_case import platform_user

URL = "/api/v1/security/observations/"


def integration_user(context, *, username="integrator", institution=None, permitted=True):
    institution = institution or context[1]
    user = platform_user(context, username=username, institution=institution)
    if permitted:
        permission, _ = Permission.objects.get_or_create(
            code="security:observe", defaults={"name": "Submit security observations"}
        )
        role, _ = Role.objects.get_or_create(code="SECURITY_INTEGRATOR", defaults={"name": "x"})
        role.permissions.add(permission)
        InstitutionMembership.objects.get(institution=institution, user=user).roles.add(role)
    return user


def grant_security_consent(context, *, institution=None):
    institution = institution or context[1]
    purpose, _ = ConsentPurpose.objects.get_or_create(
        institution=institution, code="security_monitoring", defaults={"name": "Security"}
    )
    scope, _ = ConsentScope.objects.get_or_create(
        code="security:observe", defaults={"name": "Security observations"}
    )
    return grant_consent(
        customer=context[0],
        institution=institution,
        purpose=purpose,
        scopes=[scope],
        actor=context[0],
        expires_at=timezone.now() + timedelta(days=30),
    )


def device_body(context, *, event="evt-1", device_id="device-abcdef01", **overrides):
    body = {
        "type": "DEVICE",
        "customer_id": str(context[0].id),
        "source": "mobile_app",
        "source_event_id": event,
        "observed_at": (timezone.now() - timedelta(minutes=1)).isoformat(),
        "device": {"opaque_device_id": device_id},
    }
    body.update(overrides)
    return body


def location_body(context, *, event="loc-1", country="GH", **overrides):
    body = {
        "type": "LOCATION",
        "customer_id": str(context[0].id),
        "source": "partner_api",
        "source_event_id": event,
        "observed_at": (timezone.now() - timedelta(minutes=1)).isoformat(),
        "location": {"country_code": country, "region": "Greater Accra", "confidence": "0.9"},
    }
    body.update(overrides)
    return body


@pytest.fixture
def ready(api_client, normalisation_context):
    grant_security_consent(normalisation_context)
    user = integration_user(normalisation_context)
    api_client.force_authenticate(user=user)
    api_client.credentials(HTTP_X_INSTITUTION_ID=str(normalisation_context[1].id))
    cache.clear()
    return api_client


@pytest.mark.integration
@pytest.mark.django_db
def test_unauthenticated_request_is_rejected(api_client, normalisation_context):
    assert api_client.post(URL, device_body(normalisation_context), format="json").status_code in {
        401,
        403,
    }


@pytest.mark.security
@pytest.mark.django_db
def test_caller_without_permission_is_denied(api_client, normalisation_context):
    grant_security_consent(normalisation_context)
    user = integration_user(normalisation_context, username="no-perm", permitted=False)
    api_client.force_authenticate(user=user)

    response = api_client.post(
        URL,
        device_body(normalisation_context),
        format="json",
        HTTP_X_INSTITUTION_ID=str(normalisation_context[1].id),
    )

    assert response.status_code == 403


@pytest.mark.integration
@pytest.mark.django_db
def test_device_observation_is_created_and_triggers_new_device_signal(ready, normalisation_context):
    response = ready.post(URL, device_body(normalisation_context), format="json")

    assert response.status_code == 201
    assert response.data["data"]["created"] == "true"
    assert SecurityEvent.objects.filter(
        institution=normalisation_context[1], category=SecurityEvent.Category.NEW_DEVICE
    ).exists()
    observation = DeviceObservation.objects.get()
    assert observation.provenance_type == "security.observation_api"
    assert str(observation.id) == response.data["data"]["observation_id"]


@pytest.mark.integration
@pytest.mark.django_db
def test_duplicate_device_observation_is_an_effective_reuse(ready, normalisation_context):
    first = ready.post(URL, device_body(normalisation_context), format="json")
    second = ready.post(URL, device_body(normalisation_context), format="json")

    assert first.status_code == 201
    assert second.status_code == 200
    assert second.data["data"]["created"] == "false"
    assert first.data["data"]["observation_id"] == second.data["data"]["observation_id"]
    assert DeviceObservation.objects.count() == 1
    assert SecurityEvent.objects.filter(category=SecurityEvent.Category.NEW_DEVICE).count() == 1
    assert AuditEvent.objects.filter(action="SECURITY_OBSERVATION_INGESTED").count() == 1


@pytest.mark.integration
@pytest.mark.django_db
def test_distinct_source_events_are_distinct_observations(ready, normalisation_context):
    ready.post(URL, device_body(normalisation_context, event="a"), format="json")
    ready.post(URL, device_body(normalisation_context, event="b"), format="json")

    assert DeviceObservation.objects.count() == 2


@pytest.mark.integration
@pytest.mark.django_db
def test_location_country_change_triggers_unusual_location_signal(ready, normalisation_context):
    first = location_body(
        normalisation_context,
        event="l1",
        observed_at=(timezone.now() - timedelta(hours=2)).isoformat(),
    )
    ready.post(URL, first, format="json")
    response = ready.post(
        URL, location_body(normalisation_context, event="l2", country="ng"), format="json"
    )

    assert response.status_code == 201
    event = SecurityEvent.objects.get(category=SecurityEvent.Category.UNUSUAL_LOCATION)
    assert event.metadata == {"previous_country": "GH", "new_country": "NG"}
    assert LocationObservation.objects.count() == 2


@pytest.mark.integration
@pytest.mark.django_db
def test_audit_records_request_id_without_payload_secrets(ready, normalisation_context):
    ready.post(URL, device_body(normalisation_context), format="json", HTTP_X_REQUEST_ID="trace-42")

    audit = AuditEvent.objects.get(action="SECURITY_OBSERVATION_INGESTED")
    assert audit.metadata["request_id"] == "trace-42"
    assert "device-abcdef01" not in str(audit.metadata)


@pytest.mark.integration
@pytest.mark.django_db
@pytest.mark.parametrize(
    "mutate",
    [
        lambda b: b.update(extra_field="x"),
        lambda b: b["device"].update(fingerprint="canvas-hash"),
        lambda b: b["device"].update(opaque_device_id="short"),
        lambda b: b["device"].update(opaque_device_id="has spaces in it!"),
        lambda b: b.update(location={"country_code": "GH", "confidence": "0.5"}),
        lambda b: b.pop("device"),
        lambda b: b.update(type="OTHER"),
        lambda b: b.update(source="Bad Source!"),
        lambda b: b.update(observed_at=(timezone.now() + timedelta(days=1)).isoformat()),
        lambda b: b.pop("source_event_id"),
    ],
)
def test_invalid_device_payloads_are_rejected(ready, normalisation_context, mutate):
    body = device_body(normalisation_context)
    mutate(body)

    response = ready.post(URL, body, format="json")

    assert response.status_code == 400
    assert response.data["error"]["request_id"] is not None
    assert not DeviceObservation.objects.exists()


@pytest.mark.integration
@pytest.mark.django_db
@pytest.mark.parametrize(
    "location",
    [
        {"country_code": "GHA", "confidence": "0.9"},
        {"country_code": "G1", "confidence": "0.9"},
        {"country_code": "GH", "confidence": "1.5"},
        {"country_code": "GH", "confidence": "0.9", "latitude": "5.6", "longitude": "-0.2"},
        {"country_code": "GH"},
    ],
)
def test_invalid_location_payloads_are_rejected(ready, normalisation_context, location):
    body = location_body(normalisation_context)
    body["location"] = location

    assert ready.post(URL, body, format="json").status_code == 400
    assert not LocationObservation.objects.exists()


@pytest.mark.security
@pytest.mark.django_db
def test_customer_without_relationship_at_institution_is_denied(api_client, normalisation_context):
    other = normalisation_context[2]
    grant_security_consent(normalisation_context, institution=other)
    user = integration_user(normalisation_context, username="other-int", institution=other)
    api_client.force_authenticate(user=user)

    response = api_client.post(
        URL,
        device_body(normalisation_context),
        format="json",
        HTTP_X_INSTITUTION_ID=str(other.id),
    )

    assert response.status_code == 403
    assert not DeviceObservation.objects.exists()
    assert AuditEvent.objects.filter(
        action="SECURITY_OBSERVATION_DENIED", institution=other
    ).exists()


@pytest.mark.security
@pytest.mark.django_db
def test_unknown_customer_is_indistinguishable_from_no_relationship(ready, normalisation_context):
    unknown = ready.post(
        URL, device_body(normalisation_context, customer_id=str(uuid.uuid4())), format="json"
    )

    assert unknown.status_code == 403
    assert unknown.data["error"]["details"]["detail"] == (
        "Observation cannot be accepted for this customer."
    )


@pytest.mark.security
@pytest.mark.django_db
def test_caller_cannot_act_for_an_institution_they_do_not_belong_to(
    api_client, normalisation_context
):
    user = integration_user(normalisation_context, username="outsider-int")
    api_client.force_authenticate(user=user)

    response = api_client.post(
        URL,
        device_body(normalisation_context),
        format="json",
        HTTP_X_INSTITUTION_ID=str(normalisation_context[2].id),
    )

    assert response.status_code == 403


@pytest.mark.security
@pytest.mark.django_db
def test_missing_consent_is_denied(api_client, normalisation_context):
    user = integration_user(normalisation_context)
    api_client.force_authenticate(user=user)

    response = api_client.post(
        URL,
        device_body(normalisation_context),
        format="json",
        HTTP_X_INSTITUTION_ID=str(normalisation_context[1].id),
    )

    assert response.status_code == 403
    denial = AuditEvent.objects.get(action="SECURITY_OBSERVATION_DENIED")
    assert denial.metadata["reason"].startswith("consent:")


@pytest.mark.security
@pytest.mark.django_db
def test_revoked_consent_blocks_further_observations(ready, normalisation_context):
    assert ready.post(URL, device_body(normalisation_context), format="json").status_code == 201

    for consent in Consent.objects.filter(purpose__code="security_monitoring"):
        revoke_consent(
            consent_id=consent.id,
            institution=normalisation_context[1],
            actor=normalisation_context[0],
        )
    response = ready.post(URL, device_body(normalisation_context, event="after"), format="json")

    assert response.status_code == 403
    assert DeviceObservation.objects.count() == 1


@pytest.mark.security
@pytest.mark.django_db
def test_endpoint_is_rate_limited(ready, normalisation_context, monkeypatch):
    monkeypatch.setitem(ScopedRateThrottle.THROTTLE_RATES, "security_observation", "2/min")
    cache.clear()

    statuses = [
        ready.post(
            URL, device_body(normalisation_context, event=f"t{i}"), format="json"
        ).status_code
        for i in range(3)
    ]

    assert statuses == [201, 201, 429]
    cache.clear()


@pytest.mark.integration
@pytest.mark.django_db
def test_observations_feed_the_feature_engine_end_to_end(ready, normalisation_context):
    from domains.feature.services import (
        compute_intelligence_features,
        create_intelligence_feature_set,
    )
    from domains.profile.services import compute_profile

    now = timezone.now()
    ready.post(
        URL,
        device_body(normalisation_context, observed_at=(now - timedelta(minutes=30)).isoformat()),
        format="json",
    )
    snapshot = compute_profile(
        customer_id=normalisation_context[0].id,
        institution=normalisation_context[1],
        period_start=now - timedelta(days=30),
        period_end=now,
    )

    run = compute_intelligence_features(
        snapshot=snapshot, feature_set=create_intelligence_feature_set()
    )

    assert run.values.get(definition__code="new_device_flag").boolean_value is True
