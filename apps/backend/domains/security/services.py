from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Any
from uuid import UUID, uuid5

from django.core.exceptions import PermissionDenied
from django.db import transaction
from django.utils import timezone

from domains.audit.models import AuditEvent
from domains.connector.models import InstitutionConnection
from domains.consent.services import check_consent_access
from domains.identity.models import User
from domains.ledger.models import Account
from domains.partner.models import Institution

from .models import CustomerDevice, Device, DeviceObservation, LocationObservation, SecurityEvent


def record_security_event(
    *,
    institution: Institution,
    category: str,
    severity: str,
    source: str,
    customer: User | None = None,
    occurred_at: datetime | None = None,
    provenance_type: str = "",
    provenance_id: UUID | None = None,
    metadata: dict[str, Any] | None = None,
) -> SecurityEvent:
    event = SecurityEvent.objects.create(
        institution=institution,
        customer=customer,
        category=category,
        severity=severity,
        source=source,
        occurred_at=occurred_at or timezone.now(),
        provenance_type=provenance_type,
        provenance_id=provenance_id,
        metadata=metadata or {},
    )
    AuditEvent.objects.create(
        institution=institution,
        action="SECURITY_EVENT_RECORDED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={
            "security_event_id": str(event.id),
            "category": category,
            "severity": severity,
        },
    )
    return event


@transaction.atomic
def observe_device(
    *,
    institution: Institution,
    customer: User,
    device_key: str,
    source: str,
    provenance_type: str,
    provenance_id: UUID,
    observed_at: datetime | None = None,
    metadata: dict[str, Any] | None = None,
) -> CustomerDevice:
    observed_at = observed_at or timezone.now()

    device, device_created = Device.objects.get_or_create(
        institution=institution,
        device_key=device_key,
        defaults={"source": source, "first_seen_at": observed_at, "last_seen_at": observed_at},
    )
    if not device_created and observed_at > device.last_seen_at:
        device.last_seen_at = observed_at
        device.save(update_fields=["last_seen_at", "updated_at"])

    customer_device, link_created = CustomerDevice.objects.get_or_create(
        institution=institution,
        customer=customer,
        device=device,
        defaults={"first_seen_at": observed_at, "last_seen_at": observed_at},
    )
    if not link_created and observed_at > customer_device.last_seen_at:
        customer_device.last_seen_at = observed_at
        customer_device.save(update_fields=["last_seen_at", "updated_at"])

    _, observation_created = DeviceObservation.objects.get_or_create(
        customer_device=customer_device,
        provenance_type=provenance_type,
        provenance_id=provenance_id,
        defaults={"source": source, "observed_at": observed_at, "metadata": metadata or {}},
    )
    if observation_created:
        customer_device.observation_count += 1
        customer_device.save(update_fields=["observation_count", "updated_at"])
        if link_created:
            record_security_event(
                institution=institution,
                customer=customer,
                category=SecurityEvent.Category.NEW_DEVICE,
                severity=SecurityEvent.Severity.INFO,
                source=source,
                occurred_at=observed_at,
                provenance_type=provenance_type,
                provenance_id=provenance_id,
                metadata={"device_id": str(device.id)},
            )
    return customer_device


@transaction.atomic
def observe_location(
    *,
    institution: Institution,
    customer: User,
    source: str,
    country_code: str,
    confidence: Any,
    provenance_type: str,
    provenance_id: UUID,
    region: str = "",
    city: str = "",
    observed_at: datetime | None = None,
    metadata: dict[str, Any] | None = None,
) -> LocationObservation:
    observed_at = observed_at or timezone.now()

    existing = LocationObservation.objects.filter(
        customer=customer, provenance_type=provenance_type, provenance_id=provenance_id
    ).first()
    if existing:
        return existing

    previous = (
        LocationObservation.objects.filter(institution=institution, customer=customer)
        .order_by("-observed_at")
        .first()
    )
    observation = LocationObservation.objects.create(
        institution=institution,
        customer=customer,
        source=source,
        country_code=country_code,
        region=region,
        city=city,
        confidence=confidence,
        observed_at=observed_at,
        provenance_type=provenance_type,
        provenance_id=provenance_id,
        metadata=metadata or {},
    )
    if previous is not None and previous.country_code != observation.country_code:
        record_security_event(
            institution=institution,
            customer=customer,
            category=SecurityEvent.Category.UNUSUAL_LOCATION,
            severity=SecurityEvent.Severity.WARNING,
            source=source,
            occurred_at=observed_at,
            provenance_type=provenance_type,
            provenance_id=provenance_id,
            metadata={
                "previous_country": previous.country_code,
                "new_country": observation.country_code,
            },
        )
    return observation


# ---------------------------------------------------------------------------
# Trusted observation intake
# ---------------------------------------------------------------------------

# Namespace for deriving a stable provenance_id from the caller's
# (institution, customer, type, source, source_event_id) tuple. Replaying the
# same source event therefore always resolves to the same observation.
_OBSERVATION_NAMESPACE = UUID("6f0b1d4e-3c8a-4b57-9d0e-5a1c7e2f9b34")
OBSERVATION_PROVENANCE_TYPE = "security.observation_api"
OBSERVATION_CONSENT_PURPOSE = "security_monitoring"
OBSERVATION_CONSENT_SCOPE = "security:observe"


@dataclass(frozen=True)
class IngestResult:
    observation_type: str
    observation_id: UUID
    created: bool


def _provenance_id(
    *, institution: Institution, customer: User, observation_type: str, source: str, event: str
) -> UUID:
    return uuid5(
        _OBSERVATION_NAMESPACE,
        f"{institution.id}|{customer.id}|{observation_type}|{source}|{event}",
    )


def _deny(
    *, institution: Institution, actor: User, customer_id: UUID, reason: str, request_id: str
) -> None:
    AuditEvent.objects.create(
        actor=actor,
        institution=institution,
        action="SECURITY_OBSERVATION_DENIED",
        outcome=AuditEvent.Outcome.FAILURE,
        metadata={"customer_id": str(customer_id), "reason": reason, "request_id": request_id},
    )
    raise PermissionDenied("Observation cannot be accepted for this customer.")


def ingest_observation(
    *,
    institution: Institution,
    actor: User,
    observation_type: str,
    customer_id: UUID,
    source: str,
    source_event_id: str,
    observed_at: datetime,
    payload: dict[str, Any],
    request_id: str = "",
) -> IngestResult:
    """Accept one trusted device/location observation.

    The caller only reports what was observed; whether that becomes a signal
    (NEW_DEVICE, UNUSUAL_LOCATION, feature flags) is decided by the existing
    observe_* services, never asserted by the client.
    """
    customer = User.objects.filter(
        id=customer_id,
        identity_type=User.IdentityType.CUSTOMER,
        is_active=True,
        status="ACTIVE",
    ).first()
    has_relationship = customer is not None and (
        InstitutionConnection.objects.filter(
            institution=institution,
            customer=customer,
            status=InstitutionConnection.Status.ACTIVE,
        ).exists()
        or Account.objects.filter(institution=institution, customer=customer).exists()
    )
    # One message for both cases so the response cannot confirm whether a
    # customer exists at some other institution.
    if customer is None or not has_relationship:
        _deny(
            institution=institution,
            actor=actor,
            customer_id=customer_id,
            reason="no_customer_relationship",
            request_id=request_id,
        )
    assert customer is not None

    decision = check_consent_access(
        customer_id=customer.id,
        institution_id=institution.id,
        purpose_code=OBSERVATION_CONSENT_PURPOSE,
        scope_code=OBSERVATION_CONSENT_SCOPE,
    )
    if not decision.allowed:
        _deny(
            institution=institution,
            actor=actor,
            customer_id=customer.id,
            reason=f"consent:{decision.reason}",
            request_id=request_id,
        )

    provenance_id = _provenance_id(
        institution=institution,
        customer=customer,
        observation_type=observation_type,
        source=source,
        event=source_event_id,
    )

    if observation_type == "DEVICE":
        created = not DeviceObservation.objects.filter(
            customer_device__institution=institution,
            customer_device__customer=customer,
            provenance_type=OBSERVATION_PROVENANCE_TYPE,
            provenance_id=provenance_id,
        ).exists()
        link = observe_device(
            institution=institution,
            customer=customer,
            device_key=payload["opaque_device_id"],
            source=source,
            provenance_type=OBSERVATION_PROVENANCE_TYPE,
            provenance_id=provenance_id,
            observed_at=observed_at,
        )
        observation_id = link.observations.get(
            provenance_type=OBSERVATION_PROVENANCE_TYPE, provenance_id=provenance_id
        ).id
    else:
        created = not LocationObservation.objects.filter(
            customer=customer,
            provenance_type=OBSERVATION_PROVENANCE_TYPE,
            provenance_id=provenance_id,
        ).exists()
        observation_id = observe_location(
            institution=institution,
            customer=customer,
            source=source,
            country_code=payload["country_code"],
            region=payload.get("region", ""),
            city=payload.get("city", ""),
            confidence=payload["confidence"],
            provenance_type=OBSERVATION_PROVENANCE_TYPE,
            provenance_id=provenance_id,
            observed_at=observed_at,
        ).id

    if created:
        AuditEvent.objects.create(
            actor=actor,
            institution=institution,
            action="SECURITY_OBSERVATION_INGESTED",
            outcome=AuditEvent.Outcome.SUCCESS,
            metadata={
                "observation_type": observation_type,
                "customer_id": str(customer.id),
                "source": source,
                "request_id": request_id,
            },
        )
    return IngestResult(
        observation_type=observation_type, observation_id=observation_id, created=created
    )
