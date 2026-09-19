"""Institution-scoped aggregates for Overview and Analytics.

Every figure is a count or average over the institution's own records. There is
deliberately no "fraud prevented" amount (the backend records decisions, not
verified prevented loss), no cross-institution comparison, and no currency
conversion: monetary totals stay in their original currency.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from typing import Any
from uuid import UUID

from django.db.models import Avg, Count, F, Q, Sum, Value
from django.db.models.functions import Floor, TruncDay
from django.utils import timezone

from domains.case.models import Case
from domains.confidence.models import FinancialConfidenceSnapshot
from domains.connector.models import ConnectorSyncRun, InstitutionConnection
from domains.consent.models import Consent
from domains.ledger.models import LedgerEntry, LedgerPosting
from domains.notifications.models import Notification
from domains.partner.models import ApiCredential
from domains.passport.models import PassportShare, PassportShareAccess
from domains.profile.models import FinancialProfileSnapshot
from domains.risk.models import RiskEvent, RiskReason

MAX_WINDOW_DAYS = 366
SCORE_BUCKET_WIDTH = 100  # risk score is 0-1000


def resolve_window(days: int, now: datetime | None = None) -> tuple[datetime, datetime]:
    end = now or timezone.now()
    return end - timedelta(days=days), end


def _zero_filled(choices: Any, counts: dict[str, int]) -> dict[str, int]:
    return {value: counts.get(value, 0) for value in choices.values} | {
        key: n for key, n in counts.items() if key not in choices.values
    }


def _group(queryset: Any, field: str) -> dict[str, int]:
    return {
        row[field]: row["n"] for row in queryset.order_by().values(field).annotate(n=Count("pk"))
    }


def risk_summary(institution_id: UUID, start: datetime, end: datetime) -> dict[str, Any]:
    events = RiskEvent.objects.filter(
        institution_id=institution_id, evaluated_at__gte=start, evaluated_at__lte=end
    )
    average = events.aggregate(avg=Avg("score"))["avg"]
    return {
        "evaluations": events.count(),
        "decisions": _zero_filled(RiskEvent.Decision, _group(events, "decision")),
        "average_score": average,
        "score_scale": "0-1000, higher = higher risk",
    }


def case_summary(institution_id: UUID) -> dict[str, Any]:
    cases = Case.objects.filter(institution_id=institution_id)
    unresolved = cases.exclude(status=Case.Status.RESOLVED)
    return {
        "open": unresolved.count(),
        "by_status": _zero_filled(Case.Status, _group(cases, "status")),
        "by_priority_open": _zero_filled(Case.Priority, _group(unresolved, "priority")),
        "unresolved_high_severity": unresolved.filter(
            priority__in=[Case.Priority.HIGH, Case.Priority.CRITICAL]
        ).count(),
        "unassigned_open": unresolved.filter(current_assignee__isnull=True).count(),
    }


def confidence_summary(institution_id: UUID) -> dict[str, Any]:
    current = FinancialConfidenceSnapshot.objects.filter(
        institution_id=institution_id, is_current=True
    )
    return {
        "customers_scored": current.count(),
        "average_score": current.aggregate(avg=Avg("score"))["avg"],
        "bands": _group(current, "band"),
        "score_scale": "0-100, higher = stronger verified financial confidence",
    }


def connector_summary(institution_id: UUID, start: datetime, end: datetime) -> dict[str, Any]:
    connections = InstitutionConnection.objects.filter(institution_id=institution_id)
    runs = ConnectorSyncRun.objects.filter(
        connection__institution_id=institution_id, started_at__gte=start, started_at__lte=end
    )
    return {
        "connections_by_status": _zero_filled(
            InstitutionConnection.Status, _group(connections, "status")
        ),
        "sync_runs_by_status": _zero_filled(ConnectorSyncRun.Status, _group(runs, "status")),
    }


def consent_summary(institution_id: UUID) -> dict[str, Any]:
    now = timezone.now()
    consents = Consent.objects.filter(institution_id=institution_id)
    return {
        "by_status": _zero_filled(Consent.Status, _group(consents, "status")),
        "active": consents.filter(
            status=Consent.Status.GRANTED, revoked_at__isnull=True, expires_at__gt=now
        ).count(),
        "expiring_within_30_days": consents.filter(
            status=Consent.Status.GRANTED,
            revoked_at__isnull=True,
            expires_at__gt=now,
            expires_at__lte=now + timedelta(days=30),
        ).count(),
    }


def notification_summary(institution_id: UUID) -> dict[str, Any]:
    notifications = Notification.objects.filter(institution_id=institution_id)
    return {
        "total": notifications.count(),
        "unread": notifications.filter(read_at__isnull=True).count(),
        "by_status": _zero_filled(Notification.Status, _group(notifications, "status")),
    }


def passport_summary(institution_id: UUID, start: datetime, end: datetime) -> dict[str, Any]:
    now = timezone.now()
    shares = PassportShare.objects.filter(snapshot__passport__institution_id=institution_id)
    accesses = PassportShareAccess.objects.filter(
        share__snapshot__passport__institution_id=institution_id,
        accessed_at__gte=start,
        accessed_at__lte=end,
    )
    return {
        "active_shares": shares.filter(
            status=PassportShare.Status.ACTIVE, expires_at__gt=now
        ).count(),
        "shares_created": shares.filter(created_at__gte=start, created_at__lte=end).count(),
        "accesses_by_outcome": _zero_filled(
            PassportShareAccess.Outcome, _group(accesses, "outcome")
        ),
    }


def ledger_summary(institution_id: UUID, start: datetime, end: datetime) -> dict[str, Any]:
    postings = LedgerPosting.objects.filter(
        institution_id=institution_id, posted_at__gte=start, posted_at__lte=end
    )
    debit_totals = (
        LedgerEntry.objects.filter(
            posting__in=postings,
            direction=LedgerEntry.Direction.DEBIT,
            entry_type=LedgerEntry.EntryType.POSTING,
        )
        .order_by()
        .values("currency")
        .annotate(total=Sum("amount"))
    )
    return {
        "postings": postings.count(),
        # Original currency only; never converted or summed across currencies.
        "debit_volume_by_currency": {row["currency"]: row["total"] for row in debit_totals},
    }


def credential_summary(institution_id: UUID, start: datetime, end: datetime) -> dict[str, Any]:
    credentials = ApiCredential.objects.filter(
        environment__application__institution_id=institution_id
    )
    return {
        "active": credentials.filter(status=ApiCredential.Status.ACTIVE).count(),
        "used_in_window": credentials.filter(
            last_used_at__gte=start, last_used_at__lte=end
        ).count(),
    }


def overview(institution_id: UUID, days: int) -> dict[str, Any]:
    start, end = resolve_window(days)
    return {
        "generated_at": end,
        "window": {"from": start, "to": end, "days": days},
        "risk": risk_summary(institution_id, start, end),
        "cases": case_summary(institution_id),
        "financial_confidence": confidence_summary(institution_id),
        "connectors": connector_summary(institution_id, start, end),
        "consents": consent_summary(institution_id),
        "notifications": notification_summary(institution_id),
        "passport": passport_summary(institution_id, start, end),
        "ledger": ledger_summary(institution_id, start, end),
        "credentials": credential_summary(institution_id, start, end),
    }


def analytics(institution_id: UUID, days: int) -> dict[str, Any]:
    start, end = resolve_window(days)
    events = RiskEvent.objects.filter(
        institution_id=institution_id, evaluated_at__gte=start, evaluated_at__lte=end
    )
    daily = (
        events.annotate(day=TruncDay("evaluated_at"))
        .order_by("day")
        .values("day")
        .annotate(
            evaluations=Count("pk"),
            blocked=Count("pk", filter=Q(decision=RiskEvent.Decision.BLOCK)),
            held=Count("pk", filter=Q(decision=RiskEvent.Decision.HOLD)),
            challenged=Count("pk", filter=Q(decision=RiskEvent.Decision.CHALLENGE)),
        )
    )
    last_bucket = 1000 // SCORE_BUCKET_WIDTH - 1
    buckets: dict[int, int] = {}
    for row in (
        events.annotate(bucket=Floor(F("score") / Value(SCORE_BUCKET_WIDTH)))
        .order_by()
        .values("bucket")
        .annotate(n=Count("pk"))
    ):
        index = min(int(row["bucket"]), last_bucket)
        buckets[index] = buckets.get(index, 0) + row["n"]
    reason_codes = (
        RiskReason.objects.filter(event__in=events)
        .order_by()
        .values("code")
        .annotate(n=Count("pk"))
        .order_by("-n", "code")[:20]
    )
    cases = Case.objects.filter(institution_id=institution_id)
    opened = (
        cases.filter(opened_at__gte=start, opened_at__lte=end)
        .annotate(day=TruncDay("opened_at"))
        .order_by("day")
        .values("day")
        .annotate(n=Count("pk"))
    )
    resolved = (
        cases.filter(closed_at__gte=start, closed_at__lte=end)
        .annotate(day=TruncDay("closed_at"))
        .order_by("day")
        .values("day")
        .annotate(n=Count("pk"))
    )
    latest_snapshots = FinancialProfileSnapshot.objects.filter(
        profile__institution_id=institution_id, is_current=True
    )
    return {
        "generated_at": end,
        "window": {"from": start, "to": end, "days": days},
        "risk": {
            **risk_summary(institution_id, start, end),
            "daily": list(daily),
            "score_distribution": [
                {
                    "min": b * SCORE_BUCKET_WIDTH,
                    "max": (b + 1) * SCORE_BUCKET_WIDTH,
                    "count": buckets.get(b, 0),
                }
                for b in range(1000 // SCORE_BUCKET_WIDTH)
            ],
            "top_reason_codes": [{"code": r["code"], "count": r["n"]} for r in reason_codes],
        },
        "cases": {
            **case_summary(institution_id),
            "opened_daily": [{"day": r["day"], "count": r["n"]} for r in opened],
            "resolved_daily": [{"day": r["day"], "count": r["n"]} for r in resolved],
        },
        "profiles": {
            "current_snapshots": latest_snapshots.count(),
            "by_confidence_level": _group(latest_snapshots, "confidence"),
            "average_coverage_ratio": latest_snapshots.aggregate(avg=Avg("coverage_ratio"))["avg"],
        },
        "financial_confidence": confidence_summary(institution_id),
        "connectors": connector_summary(institution_id, start, end),
        "consents": consent_summary(institution_id),
        "passport": passport_summary(institution_id, start, end),
        "credentials": credential_summary(institution_id, start, end),
        # Not derivable from what TAMVA records; kept explicit so clients gate them.
        "unavailable": {
            "fraud_prevented_value": "NOT_AVAILABLE",
            "institution_comparison": "NOT_AVAILABLE",
            "geographic_risk": "NOT_AVAILABLE",
        },
    }
