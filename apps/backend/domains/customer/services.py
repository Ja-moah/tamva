"""Read models over the authoritative domains, scoped to one customer.

Nothing here computes a financial fact: it selects, aggregates counts/sums the
domains already recorded, and labels them honestly.
"""

from __future__ import annotations

from datetime import timedelta
from typing import Any
from uuid import UUID

from django.db.models import Count, QuerySet, Sum
from django.utils import timezone

from domains.confidence.models import FinancialConfidenceSnapshot
from domains.connector.models import InstitutionConnection
from domains.consent.models import Consent
from domains.identity.models import User
from domains.normalisation.models import CanonicalTransaction
from domains.notifications.models import Notification
from domains.partner.models import Institution
from domains.passport.models import FinancialPassport, PassportShare
from domains.profile.models import FinancialProfile
from domains.security.models import CustomerDevice, LocationObservation, SecurityEvent

# Consent and share durations customers may choose.
MIN_DAYS, DEFAULT_DAYS, MAX_DAYS = 1, 90, 365

CONFIDENCE_SCALE = {
    "min": 0,
    "max": 100,
    "higher_is": "stronger verified financial confidence",
    "informational": True,
    "note": "Not a credit score and not a lending decision.",
}
# Profile dimensions TAMVA has no verified source for; stated, never estimated.
UNSUPPORTED_PROFILE_DIMENSIONS = ["debt_management", "repayment_behaviour", "resilience"]


def mask_reference(reference: str) -> str:
    return f"•• {reference[-4:]}" if len(reference) > 4 else "••"


def active_consents(customer: User) -> QuerySet[Consent]:
    now = timezone.now()
    return Consent.objects.filter(
        customer=customer,
        status=Consent.Status.GRANTED,
        revoked_at__isnull=True,
        expires_at__gt=now,
    )


def _confidence_item(snapshot: FinancialConfidenceSnapshot, *, components: bool) -> dict[str, Any]:
    item: dict[str, Any] = {
        "id": str(snapshot.id),
        "institution_id": str(snapshot.institution_id),
        "institution_name": snapshot.institution.name,
        "score": snapshot.score,
        "band": snapshot.band,
        "completeness": snapshot.completeness,
        "as_of": snapshot.evaluated_at,
        "version": f"{snapshot.policy_version.policy.code}:{snapshot.policy_version.version}",
        "is_current": snapshot.is_current,
    }
    if components:
        item["components"] = [
            {
                "code": c.code,
                "weight": c.weight,
                "value": c.value,
                "available": c.available,
                "unavailable_reason": c.unavailable_reason,
            }
            for c in snapshot.components.all()
        ]
    return item


def confidence_queryset(customer: User) -> QuerySet[FinancialConfidenceSnapshot]:
    return FinancialConfidenceSnapshot.objects.filter(customer=customer).select_related(
        "institution", "policy_version__policy"
    )


def current_confidence(customer: User) -> list[dict[str, Any]]:
    snapshots = (
        confidence_queryset(customer)
        .filter(is_current=True)
        .prefetch_related("components")
        .order_by("-evaluated_at")
    )
    return [_confidence_item(s, components=True) for s in snapshots]


def confidence_history_item(snapshot: FinancialConfidenceSnapshot) -> dict[str, Any]:
    return _confidence_item(snapshot, components=False)


def profile_item(profile: FinancialProfile) -> dict[str, Any] | None:
    snap = profile.current_snapshot
    if snap is None:
        return None
    cash = getattr(snap, "cash_flow", None)
    income = getattr(snap, "income", None)
    expenses = getattr(snap, "expenses", None)
    savings = getattr(snap, "savings", None)
    return {
        "id": str(snap.id),
        "institution_id": str(profile.institution_id),
        "institution_name": profile.institution.name,
        "as_of": snap.period_end,
        "period_start": snap.period_start,
        "computed_at": snap.created_at,
        "data_confidence": snap.confidence,
        "account_count": snap.account_count,
        "covered_account_count": snap.covered_account_count,
        "coverage_ratio": snap.coverage_ratio,
        "cash_flow": None
        if cash is None
        else {
            "total_inflows": cash.total_inflows,
            "total_outflows": cash.total_outflows,
            "net_cash_flow": cash.net_cash_flow,
            "transaction_count": cash.transaction_count,
        },
        "income": None
        if income is None
        else {"estimated_total": income.estimated_total, "methodology": income.methodology},
        "expenses": None
        if expenses is None
        else {"total": expenses.total, "by_category": expenses.by_category},
        "savings": None
        if savings is None
        else {"net_savings": savings.net_savings, "savings_rate": savings.savings_rate},
        "not_available": UNSUPPORTED_PROFILE_DIMENSIONS,
    }


def current_profiles(customer: User) -> list[dict[str, Any]]:
    profiles = (
        FinancialProfile.objects.filter(customer=customer, current_snapshot__isnull=False)
        .select_related(
            "institution",
            "current_snapshot__cash_flow",
            "current_snapshot__income",
            "current_snapshot__expenses",
            "current_snapshot__savings",
        )
        .order_by("-current_snapshot__period_end")
    )
    return [item for p in profiles if (item := profile_item(p)) is not None]


def transactions(customer: User) -> QuerySet[CanonicalTransaction]:
    return CanonicalTransaction.objects.filter(customer=customer).select_related("institution")


def money_by_currency(queryset: QuerySet[CanonicalTransaction]) -> dict[str, Any]:
    """Sums per original currency. Never converted, never combined across currencies."""
    return {
        row["currency"]: row["total"]
        for row in queryset.order_by().values("currency").annotate(total=Sum("amount"))
    }


def home(customer: User) -> dict[str, Any]:
    now = timezone.now()
    window_start = now - timedelta(days=30)
    confidence = current_confidence(customer)
    profiles = current_profiles(customer)
    connections = InstitutionConnection.objects.filter(customer=customer)
    recent = transactions(customer).filter(occurred_at__gte=window_start)
    posted = recent.exclude(status=CanonicalTransaction.Status.FAILED)
    inflow = posted.filter(direction=CanonicalTransaction.Direction.CREDIT)
    outflow = posted.filter(direction=CanonicalTransaction.Direction.DEBIT)
    events = SecurityEvent.objects.filter(customer=customer, occurred_at__gte=window_start)
    consents = active_consents(customer)
    latest = transactions(customer).order_by("-occurred_at", "id")[:5]
    return {
        "generated_at": now,
        "financial_confidence": (
            {k: confidence[0][k] for k in ("score", "band", "completeness", "as_of", "version")}
            | {"institution_name": confidence[0]["institution_name"], "scale": CONFIDENCE_SCALE}
            if confidence
            else None
        ),
        "profile": (
            {
                "as_of": profiles[0]["as_of"],
                "coverage_ratio": profiles[0]["coverage_ratio"],
                "data_confidence": profiles[0]["data_confidence"],
                "account_count": profiles[0]["account_count"],
            }
            if profiles
            else None
        ),
        "connections": {
            "total": connections.count(),
            "active": connections.filter(status=InstitutionConnection.Status.ACTIVE).count(),
            "needs_attention": connections.filter(
                status__in=[
                    InstitutionConnection.Status.FAILED,
                    InstitutionConnection.Status.PAUSED,
                ]
            ).count(),
        },
        # Observed movement only. TAMVA does not hold provider-authoritative
        # balances, so there is deliberately no "balance" or "available funds" here.
        "activity_30d": {
            "transaction_count": recent.count(),
            "inflow_by_currency": money_by_currency(inflow),
            "outflow_by_currency": money_by_currency(outflow),
            "latest": [activity_item(t) for t in latest],
        },
        "notifications": {
            "unread": Notification.objects.filter(recipient=customer, read_at__isnull=True).count()
        },
        "consents": {
            "active": consents.count(),
            "expiring_within_30_days": consents.filter(
                expires_at__lte=now + timedelta(days=30)
            ).count(),
        },
        "passport": {"active_shares": active_shares(customer).count()},
        "protection": {
            "events_30d": events.count(),
            "high_or_critical_30d": events.filter(severity__in=["HIGH", "CRITICAL"]).count(),
        },
    }


def activity_item(t: CanonicalTransaction) -> dict[str, Any]:
    return {
        "id": str(t.id),
        "occurred_at": t.occurred_at,
        "posted_at": t.posted_at,
        "amount": t.amount,
        "currency": t.currency,
        "direction": t.direction,
        "status": t.status,
        "type": t.transaction_type,
        "category": t.merchant_category,
        "channel": t.channel,
        "counterparty": t.counterparty_name,
        "account": mask_reference(t.source_account_reference),
        "institution_id": str(t.institution_id),
        "institution_name": t.institution.name,
        "connection_id": str(t.connection_id) if t.connection_id else None,
    }


def connections(customer: User) -> QuerySet[InstitutionConnection]:
    return InstitutionConnection.objects.filter(customer=customer).select_related(
        "institution", "connector"
    )


def active_shares(customer: User) -> QuerySet[PassportShare]:
    return PassportShare.objects.filter(
        snapshot__passport__customer=customer,
        status=PassportShare.Status.ACTIVE,
        expires_at__gt=timezone.now(),
    )


def shares(customer: User) -> QuerySet[PassportShare]:
    return PassportShare.objects.filter(snapshot__passport__customer=customer).select_related(
        "snapshot__passport__institution", "recipient_institution"
    )


def current_passports(customer: User) -> QuerySet[FinancialPassport]:
    return (
        FinancialPassport.objects.filter(customer=customer, current_snapshot__isnull=False)
        .select_related("institution", "current_snapshot")
        .order_by("-current_snapshot__created_at")
    )


def consent_catalogue() -> dict[str, Any]:
    from domains.consent.models import ConsentPurpose, ConsentScope

    institutions = Institution.objects.filter(is_active=True).order_by("name")
    purposes = ConsentPurpose.objects.filter(is_active=True, institution__is_active=True)
    by_institution: dict[UUID, list[ConsentPurpose]] = {}
    for purpose in purposes.order_by("code"):
        by_institution.setdefault(purpose.institution_id, []).append(purpose)
    return {
        "institutions": [
            {
                "id": str(i.id),
                "name": i.name,
                "purposes": [
                    {"code": p.code, "name": p.name, "description": p.description}
                    for p in by_institution.get(i.id, [])
                ],
            }
            for i in institutions
            if i.id in by_institution
        ],
        "scopes": [
            {"code": s.code, "name": s.name, "description": s.description}
            for s in ConsentScope.objects.filter(is_active=True).order_by("code")
        ],
        "duration_days": {"min": MIN_DAYS, "default": DEFAULT_DAYS, "max": MAX_DAYS},
    }


def security_summary(customer: User) -> dict[str, Any]:
    window = timezone.now() - timedelta(days=30)
    events = SecurityEvent.objects.filter(customer=customer)
    recent = events.filter(occurred_at__gte=window)
    devices = CustomerDevice.objects.filter(customer=customer)
    by_category = dict(recent.order_by().values_list("category").annotate(n=Count("pk")))
    latest = events.order_by("-occurred_at").first()
    return {
        "events_30d": recent.count(),
        "by_category_30d": by_category,
        "latest_event": None
        if latest is None
        else {
            "category": latest.category,
            "severity": latest.severity,
            "occurred_at": latest.occurred_at,
        },
        "devices": {
            "known": devices.count(),
            "trusted": devices.filter(status="TRUSTED").count(),
            "flagged": devices.filter(status__in=["SUSPICIOUS", "BLOCKED"]).count(),
        },
        "locations": {
            "countries_seen": LocationObservation.objects.filter(customer=customer)
            .values("country_code")
            .distinct()
            .count()
        },
        "active_consents": active_consents(customer).count(),
        "active_passport_shares": active_shares(customer).count(),
        "unread_notifications": Notification.objects.filter(
            recipient=customer, read_at__isnull=True
        ).count(),
    }
