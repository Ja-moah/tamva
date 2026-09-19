from __future__ import annotations

import hashlib
import json
import secrets
from collections.abc import Iterable
from datetime import datetime
from typing import Any

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.utils import timezone

from domains.audit.models import AuditEvent
from domains.consent.services import require_consent_access
from domains.feature.models import FeatureComputationRun
from domains.graph.models import GraphComputationRun
from domains.identity.models import User
from domains.partner.models import Institution
from domains.profile.models import FinancialProfile, FinancialProfileSnapshot
from domains.risk.models import RiskEvent
from packages.events.models import OutboxEvent

from .models import (
    FinancialPassport,
    PassportSection,
    PassportSectionCode,
    PassportShare,
    PassportShareAccess,
    PassportSnapshot,
)

SCHEMA_VERSION = "1"
CONSENT_SCOPE_CODE = "passport:read"

_TRUST_SIGNAL_FEATURE_CODES = ("savings_rate", "transaction_frequency", "cashflow_consistency")
_NETWORK_METRIC_CODES = (
    "account_count",
    "unique_counterparty_count",
    "transaction_partner_concentration",
    "repeat_counterparty_ratio",
    "network_activity_count",
)


def _publish_event(*, event_type: str, institution: Institution, payload: dict[str, Any]) -> None:
    OutboxEvent.objects.create(
        event_type=event_type,
        occurred_at=timezone.now(),
        producer="domains.passport",
        tenant_id=institution.id,
        payload=payload,
    )


def _fingerprint(
    *,
    profile_snapshot: FinancialProfileSnapshot,
    feature_run: FeatureComputationRun | None,
    risk_event: RiskEvent | None,
    graph_run: GraphComputationRun | None,
    schema_version: str,
) -> str:
    payload = {
        "schema_version": schema_version,
        "profile_snapshot_id": str(profile_snapshot.id),
        "profile_source_fingerprint": profile_snapshot.source_fingerprint,
        "feature_run_id": str(feature_run.id) if feature_run else None,
        "risk_event_id": str(risk_event.id) if risk_event else None,
        "graph_run_id": str(graph_run.id) if graph_run else None,
    }
    return hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()


def _build_sections(
    *,
    customer: User,
    profile_snapshot: FinancialProfileSnapshot,
    feature_run: FeatureComputationRun | None,
    risk_event: RiskEvent | None,
    graph_run: GraphComputationRun | None,
) -> list[tuple[str, dict[str, Any]]]:
    sections: list[tuple[str, dict[str, Any]]] = [
        (
            PassportSectionCode.IDENTITY,
            {"customer_reference": str(customer.id), "identity_type": customer.identity_type},
        ),
        (
            PassportSectionCode.FINANCIAL_SUMMARY,
            {
                "account_count": profile_snapshot.account_count,
                "covered_account_count": profile_snapshot.covered_account_count,
                "coverage_ratio": str(profile_snapshot.coverage_ratio),
                "confidence": profile_snapshot.confidence,
            },
        ),
        (
            PassportSectionCode.ACCOUNT_COVERAGE,
            {
                "account_count": profile_snapshot.account_count,
                "covered_account_count": profile_snapshot.covered_account_count,
                "coverage_ratio": str(profile_snapshot.coverage_ratio),
            },
        ),
        (
            PassportSectionCode.PROFILE_COMPLETENESS,
            {
                "completeness": profile_snapshot.completeness,
                "confidence": profile_snapshot.confidence,
            },
        ),
    ]

    income = getattr(profile_snapshot, "income", None)
    if income is not None:
        sections.append(
            (
                PassportSectionCode.INCOME_SUMMARY,
                {
                    "estimated_total": str(income.estimated_total),
                    "observation_count": income.observation_count,
                    "methodology": income.methodology,
                },
            )
        )

    cash_flow = getattr(profile_snapshot, "cash_flow", None)
    if cash_flow is not None:
        sections.append(
            (
                PassportSectionCode.CASHFLOW_SUMMARY,
                {
                    "total_inflows": str(cash_flow.total_inflows),
                    "total_outflows": str(cash_flow.total_outflows),
                    "net_cash_flow": str(cash_flow.net_cash_flow),
                    "transaction_count": cash_flow.transaction_count,
                },
            )
        )

    savings = getattr(profile_snapshot, "savings", None)
    if savings is not None:
        sections.append(
            (
                PassportSectionCode.SAVINGS_SUMMARY,
                {
                    "net_savings": str(savings.net_savings),
                    "savings_rate": str(savings.savings_rate),
                    "methodology": savings.methodology,
                },
            )
        )

    if feature_run is not None:
        values = {
            value.definition.code: value
            for value in feature_run.values.select_related("definition")
        }
        signals = {
            code: {"available": value.available, "confidence": str(value.confidence)}
            for code in _TRUST_SIGNAL_FEATURE_CODES
            if (value := values.get(code)) is not None
        }
        if signals:
            sections.append((PassportSectionCode.SELECTED_TRUST_SIGNALS, {"signals": signals}))

    if risk_event is not None:
        sections.append(
            (
                PassportSectionCode.SELECTED_RISK_SUMMARY,
                {
                    "risk_band": risk_event.decision,
                    "confidence": str(risk_event.confidence),
                    "evaluated_at": risk_event.evaluated_at.isoformat(),
                    "reason_count": risk_event.reasons.count(),
                },
            )
        )

    if graph_run is not None:
        metrics = {}
        for code in _NETWORK_METRIC_CODES:
            metric = graph_run.metrics.filter(code=code).first()
            if metric is None:
                continue
            metrics[code] = {
                "available": metric.available,
                "value": str(metric.numeric_value) if metric.available else None,
            }
        if metrics:
            sections.append((PassportSectionCode.NETWORK_SUMMARY, {"metrics": metrics}))

    return sections


@transaction.atomic
def generate_passport_snapshot(
    *, institution: Institution, customer: User, schema_version: str = SCHEMA_VERSION
) -> PassportSnapshot:
    try:
        profile = FinancialProfile.objects.get(institution=institution, customer=customer)
    except FinancialProfile.DoesNotExist as exc:
        raise ValidationError(
            "Customer has no financial profile at the active institution."
        ) from exc
    profile_snapshot = profile.current_snapshot
    if profile_snapshot is None:
        raise ValidationError("Financial profile has no current snapshot yet.")

    feature_run = (
        FeatureComputationRun.objects.filter(
            profile_snapshot=profile_snapshot,
            status__in=[
                FeatureComputationRun.Status.COMPLETED,
                FeatureComputationRun.Status.REUSED,
            ],
        )
        .order_by("-created_at")
        .first()
    )
    risk_event = (
        RiskEvent.objects.filter(institution=institution, customer=customer)
        .order_by("-evaluated_at")
        .first()
    )
    graph_run = (
        GraphComputationRun.objects.filter(
            institution=institution,
            customer=customer,
            status__in=[GraphComputationRun.Status.COMPLETED, GraphComputationRun.Status.REUSED],
        )
        .order_by("-created_at")
        .first()
    )

    fingerprint = _fingerprint(
        profile_snapshot=profile_snapshot,
        feature_run=feature_run,
        risk_event=risk_event,
        graph_run=graph_run,
        schema_version=schema_version,
    )

    passport, _ = FinancialPassport.objects.get_or_create(
        institution=institution, customer=customer
    )

    existing = PassportSnapshot.objects.filter(
        passport=passport, schema_version=schema_version, source_fingerprint=fingerprint
    ).first()
    if existing:
        return existing

    snapshot = PassportSnapshot.objects.create(
        passport=passport,
        schema_version=schema_version,
        source_fingerprint=fingerprint,
        provenance={
            "profile_snapshot_id": str(profile_snapshot.id),
            "feature_run_id": str(feature_run.id) if feature_run else None,
            "risk_event_id": str(risk_event.id) if risk_event else None,
            "graph_run_id": str(graph_run.id) if graph_run else None,
        },
    )
    for code, payload in _build_sections(
        customer=customer,
        profile_snapshot=profile_snapshot,
        feature_run=feature_run,
        risk_event=risk_event,
        graph_run=graph_run,
    ):
        PassportSection.objects.create(
            snapshot=snapshot, code=code, schema_version=schema_version, payload=payload
        )

    passport.current_snapshot = snapshot
    passport.save(update_fields=["current_snapshot", "updated_at"])

    AuditEvent.objects.create(
        institution=institution,
        action="PASSPORT_GENERATED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={"passport_id": str(passport.id), "snapshot_id": str(snapshot.id)},
    )
    _publish_event(
        event_type="passport.generated",
        institution=institution,
        payload={"passport_id": str(passport.id), "snapshot_id": str(snapshot.id)},
    )
    return snapshot


def _hash_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


@transaction.atomic
def create_passport_share(
    *,
    snapshot: PassportSnapshot,
    institution: Institution,
    recipient_institution: Institution,
    purpose_code: str,
    allowed_sections: Iterable[str],
    created_by: User,
    expires_at: datetime,
) -> tuple[PassportShare, str]:
    if snapshot.passport.institution_id != institution.id:
        raise PermissionDenied("Snapshot does not belong to the active institution.")

    sections = list(allowed_sections)
    available_codes = set(snapshot.sections.values_list("code", flat=True))
    invalid = set(sections) - available_codes
    if invalid:
        raise ValidationError(
            f"Requested sections are not present on this snapshot: {sorted(invalid)}"
        )

    require_consent_access(
        customer_id=snapshot.passport.customer_id,
        institution_id=recipient_institution.id,
        purpose_code=purpose_code,
        scope_code=CONSENT_SCOPE_CODE,
    )

    token = secrets.token_urlsafe(32)
    share = PassportShare.objects.create(
        snapshot=snapshot,
        recipient_institution=recipient_institution,
        purpose_code=purpose_code,
        allowed_sections=sections,
        token_hash=_hash_token(token),
        created_by=created_by,
        expires_at=expires_at,
    )
    AuditEvent.objects.create(
        institution=institution,
        action="PASSPORT_SHARED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={
            "share_id": str(share.id),
            "recipient_institution_id": str(recipient_institution.id),
        },
    )
    _publish_event(
        event_type="passport.shared",
        institution=institution,
        payload={
            "share_id": str(share.id),
            "recipient_institution_id": str(recipient_institution.id),
        },
    )
    return share, token


def access_passport_share(
    *,
    token: str,
    accessor_institution: Institution,
    requested_sections: Iterable[str] | None = None,
) -> dict[str, dict[str, Any]]:
    share = (
        PassportShare.objects.filter(token_hash=_hash_token(token))
        .select_related("snapshot__passport")
        .first()
    )
    if share is None:
        raise PermissionDenied("Invalid share token.")

    home_institution = share.snapshot.passport.institution
    requested = list(requested_sections) if requested_sections is not None else None

    def _deny(reason: str) -> None:
        PassportShareAccess.objects.create(
            share=share,
            accessor_institution=accessor_institution,
            outcome=PassportShareAccess.Outcome.DENIED,
            reason=reason,
            requested_sections=requested or [],
        )
        AuditEvent.objects.create(
            institution=home_institution,
            action="PASSPORT_ACCESS_DENIED",
            outcome=AuditEvent.Outcome.FAILURE,
            metadata={"share_id": str(share.id), "reason": reason},
        )

    if share.status == PassportShare.Status.REVOKED:
        _deny("revoked")
        raise PermissionDenied("Share has been revoked.")
    if timezone.now() >= share.expires_at:
        if share.status != PassportShare.Status.EXPIRED:
            share.status = PassportShare.Status.EXPIRED
            share.save(update_fields=["status", "updated_at"])
        _deny("expired")
        raise PermissionDenied("Share has expired.")
    if accessor_institution.id != share.recipient_institution_id:
        _deny("wrong_recipient")
        raise PermissionDenied("Share does not belong to the requesting institution.")

    # Consent is re-checked on every read, not just when the share was created: revoking
    # or letting the underlying consent lapse must end access immediately.
    try:
        require_consent_access(
            customer_id=share.snapshot.passport.customer_id,
            institution_id=share.recipient_institution_id,
            purpose_code=share.purpose_code,
            scope_code=CONSENT_SCOPE_CODE,
        )
    except PermissionDenied:
        _deny("consent_not_active")
        raise PermissionDenied(
            "The customer's consent for this share is no longer active."
        ) from None

    sections_to_return = requested if requested is not None else list(share.allowed_sections)
    if not set(sections_to_return) <= set(share.allowed_sections):
        _deny("scope_not_granted")
        raise PermissionDenied("Requested sections exceed the granted scope.")

    PassportShareAccess.objects.create(
        share=share,
        accessor_institution=accessor_institution,
        outcome=PassportShareAccess.Outcome.SUCCESS,
        requested_sections=sections_to_return,
    )
    AuditEvent.objects.create(
        institution=home_institution,
        action="PASSPORT_ACCESSED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={"share_id": str(share.id), "sections": sections_to_return},
    )
    _publish_event(
        event_type="passport.accessed",
        institution=home_institution,
        payload={"share_id": str(share.id)},
    )

    return {
        section.code: section.payload
        for section in share.snapshot.sections.filter(code__in=sections_to_return)
    }


@transaction.atomic
def revoke_passport_share(
    *, share: PassportShare, institution: Institution, revoked_by: User
) -> PassportShare:
    if share.snapshot.passport.institution_id != institution.id:
        raise PermissionDenied("Share does not belong to the active institution.")
    if share.status == PassportShare.Status.REVOKED:
        raise ValidationError("Share has already been revoked.")

    share.status = PassportShare.Status.REVOKED
    share.revoked_at = timezone.now()
    share.save(update_fields=["status", "revoked_at", "updated_at"])
    AuditEvent.objects.create(
        institution=institution,
        action="PASSPORT_REVOKED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={"share_id": str(share.id), "revoked_by": str(revoked_by.id)},
    )
    _publish_event(
        event_type="passport.revoked", institution=institution, payload={"share_id": str(share.id)}
    )
    return share
