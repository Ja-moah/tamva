from __future__ import annotations

import hashlib
import json
from datetime import datetime
from decimal import Decimal
from uuid import UUID

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.db.models import QuerySet

from domains.audit.models import AuditEvent
from domains.connector.models import InstitutionConnection
from domains.ledger.models import Account, LedgerEntry
from domains.partner.models import Institution

from .models import (
    AccountSummary,
    CashFlowSummary,
    ExpenseSummary,
    FinancialProfile,
    FinancialProfileSnapshot,
    IncomeSummary,
    ProfileComputationRun,
    SavingsSummary,
)

PROFILE_COMPUTATION_VERSION = "1"


def _profile_for_tenant(*, customer_id: UUID, institution: Institution) -> FinancialProfile:
    if not institution.is_active:
        raise PermissionDenied("Institution is not active.")
    if not InstitutionConnection.objects.filter(
        institution=institution, customer_id=customer_id
    ).exists():
        raise PermissionDenied("Customer has no connection in the active institution.")
    return FinancialProfile.objects.get_or_create(institution=institution, customer_id=customer_id)[
        0
    ]


def _entries_for_window(
    *, customer_id: UUID, institution: Institution, start: datetime, end: datetime
) -> QuerySet[LedgerEntry]:
    return (
        LedgerEntry.objects.select_related("account", "posting")
        .filter(
            account__institution=institution,
            account__customer_id=customer_id,
            effective_at__gte=start,
            effective_at__lt=end,
        )
        .order_by("effective_at", "id")
    )


def _fingerprint(
    entries: list[LedgerEntry], *, start: datetime, end: datetime, version: str
) -> str:
    values = [
        {
            "id": str(entry.id),
            "account_id": str(entry.account_id),
            "amount": str(entry.amount),
            "currency": entry.currency,
            "direction": entry.direction,
            "entry_type": entry.entry_type,
            "effective_at": entry.effective_at.isoformat(),
        }
        for entry in entries
    ]
    payload = {
        "start": start.isoformat(),
        "end": end.isoformat(),
        "version": version,
        "entries": values,
    }
    encoded = json.dumps(payload, sort_keys=True, separators=(",", ":")).encode()
    return hashlib.sha256(encoded).hexdigest()


def _confidence(coverage_ratio: Decimal, entry_count: int) -> str:
    if entry_count == 0:
        return "LOW"
    if coverage_ratio >= Decimal("0.99"):
        return "HIGH"
    if coverage_ratio >= Decimal("0.5"):
        return "MEDIUM"
    return "LOW"


@transaction.atomic
def compute_profile(
    *,
    customer_id: UUID,
    institution: Institution,
    period_start: datetime,
    period_end: datetime,
    version: str = PROFILE_COMPUTATION_VERSION,
) -> FinancialProfileSnapshot:
    if period_end <= period_start:
        raise ValidationError("Profile period end must be after period start.")
    profile = _profile_for_tenant(customer_id=customer_id, institution=institution)
    entries = list(
        _entries_for_window(
            customer_id=customer_id,
            institution=institution,
            start=period_start,
            end=period_end,
        )
    )
    fingerprint = _fingerprint(entries, start=period_start, end=period_end, version=version)
    existing = FinancialProfileSnapshot.objects.filter(
        profile=profile,
        period_start=period_start,
        period_end=period_end,
        computation_version=version,
        source_fingerprint=fingerprint,
    ).first()
    run = ProfileComputationRun.objects.create(
        profile=profile,
        period_start=period_start,
        period_end=period_end,
        computation_version=version,
        source_fingerprint=fingerprint,
        status=ProfileComputationRun.Status.RUNNING,
    )
    if existing is not None:
        run.status = ProfileComputationRun.Status.REUSED
        run.snapshot = existing
        run.save(update_fields=["status", "snapshot", "updated_at"])
        return existing

    accounts = list(
        Account.objects.filter(institution=institution, customer_id=customer_id).order_by("id")
    )
    covered_ids = {entry.account_id for entry in entries}
    account_count = len(accounts)
    covered_count = len(covered_ids)
    coverage_ratio = (
        (Decimal(covered_count) / Decimal(account_count)).quantize(Decimal("0.0001"))
        if account_count
        else Decimal("0")
    )
    credits = [entry for entry in entries if entry.direction == LedgerEntry.Direction.CREDIT]
    debits = [entry for entry in entries if entry.direction == LedgerEntry.Direction.DEBIT]
    total_inflows = sum((entry.amount for entry in credits), Decimal("0"))
    total_outflows = sum((entry.amount for entry in debits), Decimal("0"))
    net = total_inflows - total_outflows
    provenance = {
        "ledger_entry_ids": [str(entry.id) for entry in entries],
        "account_ids": [str(account.id) for account in accounts],
        "institution_id": str(institution.id),
        "period_start": period_start.isoformat(),
        "period_end": period_end.isoformat(),
    }
    snapshot = FinancialProfileSnapshot.objects.create(
        profile=profile,
        period_start=period_start,
        period_end=period_end,
        computation_version=version,
        source_fingerprint=fingerprint,
        account_count=account_count,
        covered_account_count=covered_count,
        coverage_ratio=coverage_ratio,
        confidence=_confidence(coverage_ratio, len(entries)),
        completeness={
            "has_ledger_entries": bool(entries),
            "accounts_with_activity": covered_count,
            "accounts_total": account_count,
        },
        provenance=provenance,
        is_current=True,
    )
    FinancialProfileSnapshot.objects.filter(profile=profile).exclude(id=snapshot.id).update(
        is_current=False
    )
    profile.current_snapshot = snapshot
    profile.save(update_fields=["current_snapshot", "updated_at"])
    for account in accounts:
        account_entries = [entry for entry in entries if entry.account_id == account.id]
        inflows = sum(
            (
                entry.amount
                for entry in account_entries
                if entry.direction == LedgerEntry.Direction.CREDIT
            ),
            Decimal("0"),
        )
        outflows = sum(
            (
                entry.amount
                for entry in account_entries
                if entry.direction == LedgerEntry.Direction.DEBIT
            ),
            Decimal("0"),
        )
        all_entries = list(account.entries.all())
        balance = sum((entry.signed_amount for entry in all_entries), Decimal("0"))
        AccountSummary.objects.create(
            snapshot=snapshot,
            account=account,
            currency=account.currency,
            current_balance=balance,
            period_inflows=inflows,
            period_outflows=outflows,
            entry_count=len(account_entries),
            covered=bool(account_entries),
        )
    CashFlowSummary.objects.create(
        snapshot=snapshot,
        total_inflows=total_inflows,
        total_outflows=total_outflows,
        net_cash_flow=net,
        transaction_count=len(entries),
    )
    ExpenseSummary.objects.create(
        snapshot=snapshot,
        total=total_outflows,
        observation_count=len(debits),
        by_category={},
    )
    IncomeSummary.objects.create(
        snapshot=snapshot,
        estimated_total=total_inflows,
        observation_count=len(credits),
    )
    savings_rate = (
        (net / total_inflows).quantize(Decimal("0.0001")) if total_inflows else Decimal("0")
    )
    SavingsSummary.objects.create(
        snapshot=snapshot,
        net_savings=net,
        savings_rate=savings_rate,
    )
    run.status = ProfileComputationRun.Status.COMPLETED
    run.snapshot = snapshot
    run.save(update_fields=["status", "snapshot", "updated_at"])
    AuditEvent.objects.create(
        institution=institution,
        action="FINANCIAL_PROFILE_COMPUTED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={
            "profile_id": str(profile.id),
            "snapshot_id": str(snapshot.id),
            "customer_id": str(customer_id),
            "computation_version": version,
            "entry_count": len(entries),
        },
    )
    return snapshot
