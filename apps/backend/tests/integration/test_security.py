import uuid
from datetime import UTC, datetime
from decimal import Decimal

import pytest

from domains.security.models import (
    Device,
    DeviceObservation,
    LocationObservation,
    SecurityEvent,
    TrustState,
)
from domains.security.services import observe_device, observe_location


@pytest.mark.integration
@pytest.mark.django_db
def test_first_device_observation_creates_device_and_link(normalisation_context):
    customer, institution, _, _ = normalisation_context

    link = observe_device(
        institution=institution,
        customer=customer,
        device_key="device-abc",
        source="mobile_app",
        provenance_type="identity.LoginSession",
        provenance_id=uuid.uuid4(),
    )

    assert Device.objects.filter(institution=institution, device_key="device-abc").exists()
    assert link.observation_count == 1
    assert link.status == TrustState.UNKNOWN
    assert SecurityEvent.objects.filter(
        institution=institution, customer=customer, category=SecurityEvent.Category.NEW_DEVICE
    ).exists()


@pytest.mark.integration
@pytest.mark.django_db
def test_repeat_device_observation_does_not_duplicate(normalisation_context):
    customer, institution, _, _ = normalisation_context
    provenance_id = uuid.uuid4()
    observe_device(
        institution=institution,
        customer=customer,
        device_key="device-xyz",
        source="mobile_app",
        provenance_type="x",
        provenance_id=provenance_id,
    )

    link = observe_device(
        institution=institution,
        customer=customer,
        device_key="device-xyz",
        source="mobile_app",
        provenance_type="x",
        provenance_id=provenance_id,
    )

    assert link.observation_count == 1
    assert DeviceObservation.objects.filter(customer_device=link).count() == 1
    assert SecurityEvent.objects.filter(category=SecurityEvent.Category.NEW_DEVICE).count() == 1


@pytest.mark.integration
@pytest.mark.django_db
def test_second_distinct_observation_does_not_refire_new_device_signal(normalisation_context):
    customer, institution, _, _ = normalisation_context
    observe_device(
        institution=institution,
        customer=customer,
        device_key="device-1",
        source="mobile_app",
        provenance_type="a",
        provenance_id=uuid.uuid4(),
    )

    link = observe_device(
        institution=institution,
        customer=customer,
        device_key="device-1",
        source="mobile_app",
        provenance_type="b",
        provenance_id=uuid.uuid4(),
    )

    assert link.observation_count == 2
    assert SecurityEvent.objects.filter(category=SecurityEvent.Category.NEW_DEVICE).count() == 1


@pytest.mark.integration
@pytest.mark.django_db
def test_device_observation_has_provenance(normalisation_context):
    customer, institution, _, _ = normalisation_context
    provenance_id = uuid.uuid4()

    link = observe_device(
        institution=institution,
        customer=customer,
        device_key="device-p",
        source="mobile_app",
        provenance_type="identity.LoginSession",
        provenance_id=provenance_id,
    )

    observation = link.observations.get()
    assert observation.provenance_type == "identity.LoginSession"
    assert observation.provenance_id == provenance_id


@pytest.mark.security
@pytest.mark.django_db
def test_device_is_tenant_isolated(normalisation_context):
    customer, institution, other_institution, _ = normalisation_context
    observe_device(
        institution=institution,
        customer=customer,
        device_key="shared-key",
        source="mobile_app",
        provenance_type="a",
        provenance_id=uuid.uuid4(),
    )

    assert not Device.objects.filter(
        institution=other_institution, device_key="shared-key"
    ).exists()

    observe_device(
        institution=other_institution,
        customer=customer,
        device_key="shared-key",
        source="mobile_app",
        provenance_type="a",
        provenance_id=uuid.uuid4(),
    )
    assert Device.objects.filter(device_key="shared-key").count() == 2


@pytest.mark.integration
@pytest.mark.django_db
def test_first_location_observation_has_no_unusual_signal(normalisation_context):
    customer, institution, _, _ = normalisation_context

    observation = observe_location(
        institution=institution,
        customer=customer,
        source="provider_metadata",
        country_code="gh",
        confidence=Decimal("0.9"),
        provenance_type="normalisation.CanonicalTransaction",
        provenance_id=uuid.uuid4(),
    )

    assert observation.country_code == "GH"
    assert not SecurityEvent.objects.filter(
        category=SecurityEvent.Category.UNUSUAL_LOCATION
    ).exists()


@pytest.mark.integration
@pytest.mark.django_db
def test_location_change_to_new_country_creates_signal(normalisation_context):
    customer, institution, _, _ = normalisation_context
    observe_location(
        institution=institution,
        customer=customer,
        source="provider_metadata",
        country_code="GH",
        confidence=Decimal("0.9"),
        provenance_type="a",
        provenance_id=uuid.uuid4(),
        observed_at=datetime(2026, 1, 1, tzinfo=UTC),
    )

    observe_location(
        institution=institution,
        customer=customer,
        source="provider_metadata",
        country_code="NG",
        confidence=Decimal("0.9"),
        provenance_type="b",
        provenance_id=uuid.uuid4(),
        observed_at=datetime(2026, 1, 2, tzinfo=UTC),
    )

    event = SecurityEvent.objects.get(category=SecurityEvent.Category.UNUSUAL_LOCATION)
    assert event.metadata["previous_country"] == "GH"
    assert event.metadata["new_country"] == "NG"


@pytest.mark.integration
@pytest.mark.django_db
def test_repeat_location_observation_is_idempotent(normalisation_context):
    customer, institution, _, _ = normalisation_context
    provenance_id = uuid.uuid4()

    first = observe_location(
        institution=institution,
        customer=customer,
        source="s",
        country_code="GH",
        confidence=Decimal("0.9"),
        provenance_type="a",
        provenance_id=provenance_id,
    )
    second = observe_location(
        institution=institution,
        customer=customer,
        source="s",
        country_code="GH",
        confidence=Decimal("0.9"),
        provenance_type="a",
        provenance_id=provenance_id,
    )

    assert first.id == second.id
    assert LocationObservation.objects.count() == 1


@pytest.mark.integration
@pytest.mark.django_db
def test_location_observation_preserves_confidence_and_source(normalisation_context):
    customer, institution, _, _ = normalisation_context

    observation = observe_location(
        institution=institution,
        customer=customer,
        source="partner_api",
        country_code="GH",
        confidence=Decimal("0.75"),
        provenance_type="a",
        provenance_id=uuid.uuid4(),
    )

    assert observation.confidence == Decimal("0.7500")
    assert observation.source == "partner_api"


@pytest.mark.security
@pytest.mark.django_db
def test_location_observations_are_tenant_isolated(normalisation_context):
    customer, institution, other_institution, _ = normalisation_context
    observe_location(
        institution=institution,
        customer=customer,
        source="s",
        country_code="GH",
        confidence=Decimal("0.9"),
        provenance_type="a",
        provenance_id=uuid.uuid4(),
    )

    assert not LocationObservation.objects.filter(institution=other_institution).exists()
