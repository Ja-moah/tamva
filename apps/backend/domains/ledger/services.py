from __future__ import annotations

from datetime import timedelta
from decimal import Decimal
from typing import Any
from uuid import UUID

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from domains.audit.models import AuditEvent
from domains.normalisation.models import CanonicalTransaction
from domains.partner.models import Institution

from .models import (
    Account,
    ExchangeRateSnapshot,
    LedgerEntry,
    LedgerPosting,
    ReconciliationItem,
    ReconciliationRun,
)


def _transaction_for_tenant(
    *, transaction_id: UUID, institution: Institution
) -> CanonicalTransaction:
    canonical = (
        CanonicalTransaction.objects.select_related("connection", "customer")
        .filter(id=transaction_id, institution=institution)
        .first()
    )
    if canonical is None:
        raise PermissionDenied("Transaction does not belong to the active institution.")
    return canonical


@transaction.atomic
def post_transaction(*, transaction_id: UUID, institution: Institution) -> LedgerPosting:
    canonical = _transaction_for_tenant(transaction_id=transaction_id, institution=institution)
    existing = LedgerPosting.objects.filter(transaction=canonical).first()
    if existing is not None:
        return existing
    if canonical.status not in {
        CanonicalTransaction.Status.PENDING,
        CanonicalTransaction.Status.POSTED,
        CanonicalTransaction.Status.REVERSED,
    }:
        raise ValidationError("Failed canonical transactions cannot be posted.")

    account, _ = Account.objects.get_or_create(
        institution=institution,
        customer=canonical.customer,
        connection=canonical.connection,
        source_account_reference=canonical.source_account_reference,
        currency=canonical.currency,
    )
    posting = LedgerPosting.objects.create(
        transaction=canonical,
        institution=institution,
        status=LedgerPosting.Status.POSTED,
        posted_at=timezone.now(),
    )
    direction = canonical.direction
    entry_type = LedgerEntry.EntryType.POSTING
    reversal_of = None
    if canonical.status == CanonicalTransaction.Status.REVERSED:
        direction = (
            LedgerEntry.Direction.DEBIT
            if canonical.direction == LedgerEntry.Direction.CREDIT
            else LedgerEntry.Direction.CREDIT
        )
        entry_type = LedgerEntry.EntryType.REVERSAL
        original_source_id = canonical.metadata.get("reverses_source_event_id")
        if original_source_id:
            reversal_of = (
                LedgerPosting.objects.filter(
                    transaction__source_event_id=original_source_id,
                    institution=institution,
                )
                .order_by("created_at")
                .first()
            )
            posting.reversal_of = reversal_of
            posting.save(update_fields=["reversal_of", "updated_at"])
    LedgerEntry.objects.create(
        posting=posting,
        account=account,
        amount=canonical.amount,
        currency=canonical.currency,
        direction=direction,
        entry_type=entry_type,
        effective_at=canonical.posted_at or canonical.occurred_at,
        compensates=(reversal_of.entries.first() if reversal_of else None),
        metadata={"source_event_id": canonical.source_event_id},
    )
    AuditEvent.objects.create(
        institution=institution,
        action="LEDGER_TRANSACTION_POSTED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={
            "transaction_id": str(canonical.id),
            "posting_id": str(posting.id),
            "entry_type": entry_type,
        },
    )
    return posting


@transaction.atomic
def correct_posting(*, posting_id: UUID, institution: Institution) -> LedgerPosting:
    posting = (
        LedgerPosting.objects.select_for_update()
        .select_related("transaction")
        .filter(id=posting_id, institution=institution)
        .first()
    )
    if posting is None:
        raise PermissionDenied("Ledger posting does not belong to the active institution.")
    if posting.status == LedgerPosting.Status.REVERSED:
        return posting
    for entry in posting.entries.select_related("account"):
        LedgerEntry.objects.create(
            posting=posting,
            account=entry.account,
            amount=entry.amount,
            currency=entry.currency,
            direction=(
                LedgerEntry.Direction.DEBIT
                if entry.direction == LedgerEntry.Direction.CREDIT
                else LedgerEntry.Direction.CREDIT
            ),
            entry_type=LedgerEntry.EntryType.CORRECTION,
            effective_at=timezone.now(),
            compensates=entry,
            metadata={"corrects_entry_id": str(entry.id)},
        )
    posting.status = LedgerPosting.Status.REVERSED
    posting.save(update_fields=["status", "updated_at"])
    AuditEvent.objects.create(
        institution=institution,
        action="LEDGER_POSTING_CORRECTED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={"posting_id": str(posting.id)},
    )
    return posting


def account_balance(*, account_id: UUID, institution: Institution) -> Decimal:
    account = Account.objects.filter(id=account_id, institution=institution).first()
    if account is None:
        raise PermissionDenied("Account does not belong to the active institution.")
    credit = account.entries.filter(direction=LedgerEntry.Direction.CREDIT).aggregate(
        total=Sum("amount")
    )["total"] or Decimal("0")
    debit = account.entries.filter(direction=LedgerEntry.Direction.DEBIT).aggregate(
        total=Sum("amount")
    )["total"] or Decimal("0")
    return credit - debit


@transaction.atomic
def reconcile_transactions(
    *, institution: Institution, connection_id: UUID, expected: list[dict[str, Any]]
) -> ReconciliationRun:
    connection = institution.connector_connections.filter(id=connection_id).first()
    if connection is None:
        raise PermissionDenied("Connection does not belong to the active institution.")
    run = ReconciliationRun.objects.create(
        institution=institution, connection=connection, started_at=timezone.now()
    )
    for item in expected:
        source_event_id = str(item["source_event_id"])
        transaction_record = CanonicalTransaction.objects.filter(
            institution=institution, connection=connection, source_event_id=source_event_id
        ).first()
        ledger_amount = None
        status = ReconciliationItem.Status.MISMATCH
        details: dict[str, Any] = {}
        if transaction_record is not None:
            posting = LedgerPosting.objects.filter(transaction=transaction_record).first()
            if posting is not None:
                ledger_amount = posting.transaction.amount
                if (
                    ledger_amount == Decimal(str(item["amount"]))
                    and posting.status == LedgerPosting.Status.POSTED
                ):
                    status = ReconciliationItem.Status.MATCHED
                else:
                    details["reason"] = "ledger amount or posting status differs"
            else:
                details["reason"] = "transaction has no ledger posting"
        else:
            details["reason"] = "canonical transaction not found"
        ReconciliationItem.objects.create(
            run=run,
            transaction=transaction_record,
            source_event_id=source_event_id,
            expected_amount=Decimal(str(item["amount"])),
            ledger_amount=ledger_amount,
            currency=str(item["currency"]).upper(),
            status=status,
            details=details,
        )
    run.matched_count = run.items.filter(status=ReconciliationItem.Status.MATCHED).count()
    run.mismatch_count = run.items.exclude(status=ReconciliationItem.Status.MATCHED).count()
    run.status = (
        ReconciliationRun.Status.COMPLETED
        if run.mismatch_count == 0
        else ReconciliationRun.Status.MISMATCHED
    )
    run.completed_at = timezone.now()
    run.save(
        update_fields=[
            "matched_count",
            "mismatch_count",
            "status",
            "completed_at",
            "updated_at",
        ]
    )
    AuditEvent.objects.create(
        institution=institution,
        action="LEDGER_RECONCILIATION_COMPLETED",
        outcome=(
            AuditEvent.Outcome.SUCCESS
            if run.status == ReconciliationRun.Status.COMPLETED
            else AuditEvent.Outcome.FAILURE
        ),
        metadata={"run_id": str(run.id), "mismatch_count": run.mismatch_count},
    )
    return run


def latest_exchange_rate(
    base_currency: str, quote_currency: str, *, max_age: timedelta
) -> ExchangeRateSnapshot | None:
    """The most recent observed rate no older than `max_age`, or None.

    Callers must treat None as "conversion unavailable" and show the original
    amount and currency; they must never fall back to an assumed rate.
    """
    cutoff = timezone.now() - max_age
    return (
        ExchangeRateSnapshot.objects.filter(
            base_currency=base_currency.upper(),
            quote_currency=quote_currency.upper(),
            observed_at__gte=cutoff,
        )
        .order_by("-observed_at")
        .first()
    )
