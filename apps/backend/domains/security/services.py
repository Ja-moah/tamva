from __future__ import annotations

from datetime import datetime
from typing import Any
from uuid import UUID

from django.db import transaction
from django.utils import timezone

from domains.audit.models import AuditEvent
from domains.identity.models import User
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
