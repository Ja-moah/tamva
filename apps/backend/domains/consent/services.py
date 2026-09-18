from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.utils import timezone

from domains.audit.models import AuditEvent
from domains.consent.models import Consent, ConsentEvent, ConsentPurpose, ConsentScope
from domains.identity.models import User
from domains.partner.models import Institution


@dataclass(frozen=True, slots=True)
class ConsentAccessDecision:
    allowed: bool
    reason: str
    consent: Consent | None = None


def _snapshot(consent: Consent, scope_codes: Iterable[str]) -> dict[str, object]:
    return {
        "consent_id": str(consent.id),
        "customer_id": str(consent.customer_id),
        "institution_id": str(consent.institution_id),
        "purpose": consent.purpose.code,
        "scopes": sorted(scope_codes),
        "status": consent.status,
        "granted_at": consent.granted_at.isoformat(),
        "expires_at": consent.expires_at.isoformat(),
        "revoked_at": consent.revoked_at.isoformat() if consent.revoked_at else None,
    }


def _record_event(
    consent: Consent,
    event_type: ConsentEvent.EventType,
    *,
    actor: User | None,
    scope_codes: Iterable[str],
    occurred_at: datetime,
) -> ConsentEvent:
    return ConsentEvent.objects.create(
        consent=consent,
        institution=consent.institution,
        actor=actor,
        event_type=event_type,
        snapshot=_snapshot(consent, scope_codes),
        occurred_at=occurred_at,
    )


@transaction.atomic
def grant_consent(
    *,
    customer: User,
    institution: Institution,
    purpose: ConsentPurpose,
    scopes: Iterable[ConsentScope],
    expires_at: datetime,
    actor: User | None = None,
    granted_at: datetime | None = None,
) -> Consent:
    effective_granted_at = granted_at or timezone.now()
    effective_actor = actor or customer
    selected_scopes = tuple({scope.id: scope for scope in scopes}.values())
    if (
        customer.identity_type != User.IdentityType.CUSTOMER
        or not customer.is_active
        or customer.status != "ACTIVE"
    ):
        raise ValidationError("Consent can only be granted by a customer identity.")
    if effective_actor.id != customer.id:
        raise PermissionDenied("Only the customer can grant this consent.")
    if not institution.is_active:
        raise ValidationError("Consent recipient institution must be active.")
    if purpose.institution_id != institution.id or not purpose.is_active:
        raise ValidationError("Consent purpose is not active for the recipient institution.")
    if not selected_scopes or any(not scope.is_active for scope in selected_scopes):
        raise ValidationError("Consent requires at least one active scope.")
    if expires_at <= effective_granted_at:
        raise ValidationError("Consent expiry must be later than its grant time.")

    consent = Consent.objects.create(
        customer=customer,
        institution=institution,
        purpose=purpose,
        status=Consent.Status.GRANTED,
        granted_at=effective_granted_at,
        expires_at=expires_at,
    )
    consent.scopes.set(selected_scopes)
    scope_codes = tuple(scope.code for scope in selected_scopes)
    _record_event(
        consent,
        ConsentEvent.EventType.GRANTED,
        actor=effective_actor,
        scope_codes=scope_codes,
        occurred_at=effective_granted_at,
    )
    AuditEvent.objects.create(
        actor=effective_actor,
        institution=institution,
        action="CONSENT_GRANTED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={
            "consent_id": str(consent.id),
            "customer_id": str(customer.id),
            "purpose": purpose.code,
            "scopes": sorted(scope_codes),
        },
    )
    return consent


@transaction.atomic
def revoke_consent(
    *, consent_id: UUID, institution: Institution, actor: User, revoked_at: datetime | None = None
) -> Consent:
    consent = (
        Consent.objects.select_for_update()
        .select_related("purpose", "institution")
        .prefetch_related("scopes")
        .filter(id=consent_id, institution=institution)
        .first()
    )
    if consent is None:
        raise PermissionDenied("Consent does not belong to the active institution.")
    if actor.id != consent.customer_id:
        raise PermissionDenied("Only the customer can revoke this consent.")
    if consent.status == Consent.Status.REVOKED:
        return consent
    if consent.status != Consent.Status.GRANTED:
        raise ValidationError("Only granted consent can be revoked.")

    effective_revoked_at = revoked_at or timezone.now()
    scope_codes = tuple(consent.scopes.values_list("code", flat=True))
    consent.status = Consent.Status.REVOKED
    consent.revoked_at = effective_revoked_at
    consent.save(update_fields=["status", "revoked_at", "updated_at"])
    _record_event(
        consent,
        ConsentEvent.EventType.REVOKED,
        actor=actor,
        scope_codes=scope_codes,
        occurred_at=effective_revoked_at,
    )
    AuditEvent.objects.create(
        actor=actor,
        institution=institution,
        action="CONSENT_REVOKED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={"consent_id": str(consent.id), "customer_id": str(consent.customer_id)},
    )
    return consent


@transaction.atomic
def expire_consent(*, consent_id: UUID, checked_at: datetime | None = None) -> Consent:
    effective_at = checked_at or timezone.now()
    consent = (
        Consent.objects.select_for_update()
        .select_related("purpose", "institution")
        .prefetch_related("scopes")
        .get(id=consent_id)
    )
    if consent.status != Consent.Status.GRANTED:
        return consent
    if consent.expires_at > effective_at:
        raise ValidationError("Consent has not expired.")

    scope_codes = tuple(consent.scopes.values_list("code", flat=True))
    consent.status = Consent.Status.EXPIRED
    consent.save(update_fields=["status", "updated_at"])
    _record_event(
        consent,
        ConsentEvent.EventType.EXPIRED,
        actor=None,
        scope_codes=scope_codes,
        occurred_at=effective_at,
    )
    AuditEvent.objects.create(
        institution=consent.institution,
        action="CONSENT_EXPIRED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={"consent_id": str(consent.id), "customer_id": str(consent.customer_id)},
    )
    return consent


def check_consent_access(
    *,
    customer_id: UUID,
    institution_id: UUID,
    purpose_code: str,
    scope_code: str,
    checked_at: datetime | None = None,
) -> ConsentAccessDecision:
    effective_at = checked_at or timezone.now()
    base = Consent.objects.filter(
        customer_id=customer_id,
        customer__is_active=True,
        customer__status="ACTIVE",
        institution_id=institution_id,
        institution__is_active=True,
        status=Consent.Status.GRANTED,
        revoked_at__isnull=True,
        granted_at__lte=effective_at,
        expires_at__gt=effective_at,
    )
    purpose_match = base.filter(
        purpose__code=purpose_code,
        purpose__institution_id=institution_id,
        purpose__is_active=True,
    )
    consent = purpose_match.filter(scopes__code=scope_code, scopes__is_active=True).first()
    if consent is not None:
        return ConsentAccessDecision(True, "active_consent", consent)
    if not base.exists():
        return ConsentAccessDecision(False, "missing_inactive_or_expired_consent")
    if not purpose_match.exists():
        return ConsentAccessDecision(False, "wrong_purpose")
    return ConsentAccessDecision(False, "wrong_scope")


def require_consent_access(
    *,
    customer_id: UUID,
    institution_id: UUID,
    purpose_code: str,
    scope_code: str,
    checked_at: datetime | None = None,
) -> Consent:
    decision = check_consent_access(
        customer_id=customer_id,
        institution_id=institution_id,
        purpose_code=purpose_code,
        scope_code=scope_code,
        checked_at=checked_at,
    )
    if not decision.allowed or decision.consent is None:
        raise PermissionDenied(f"Consent access denied: {decision.reason}.")
    return decision.consent
