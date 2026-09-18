from decimal import Decimal

import pytest
from django.core.exceptions import PermissionDenied, ValidationError

from domains.audit.models import AuditEvent
from domains.ledger.models import (
    Account,
    LedgerEntry,
    LedgerPosting,
    ReconciliationItem,
    ReconciliationRun,
)
from domains.ledger.services import (
    account_balance,
    correct_posting,
    post_transaction,
    reconcile_transactions,
)
from domains.normalisation.models import CanonicalTransaction
from domains.normalisation.services import normalise_raw_event
from tests.integration.test_normalisation import create_raw_event, valid_payload


def canonical_transaction(context, *, source_event_id="ledger-1", **overrides):
    raw_event = create_raw_event(
        context,
        valid_payload(**overrides),
        source_event_id=source_event_id,
    )
    return normalise_raw_event(raw_event_id=raw_event.id, institution=context[1]).transaction


@pytest.mark.integration
@pytest.mark.django_db
def test_posted_transaction_creates_one_ledger_effect(normalisation_context):
    canonical = canonical_transaction(normalisation_context)
    institution = normalisation_context[1]

    posting = post_transaction(transaction_id=canonical.id, institution=institution)

    entry = posting.entries.get()
    assert posting.status == LedgerPosting.Status.POSTED
    assert entry.direction == LedgerEntry.Direction.CREDIT
    assert entry.amount == Decimal("125.50")
    assert account_balance(account_id=entry.account_id, institution=institution) == Decimal(
        "125.50"
    )
    assert AuditEvent.objects.filter(
        institution=institution, action="LEDGER_TRANSACTION_POSTED"
    ).exists()


@pytest.mark.integration
@pytest.mark.django_db
def test_duplicate_posting_is_idempotent(normalisation_context):
    canonical = canonical_transaction(normalisation_context)
    institution = normalisation_context[1]

    first = post_transaction(transaction_id=canonical.id, institution=institution)
    second = post_transaction(transaction_id=canonical.id, institution=institution)

    assert first.id == second.id
    assert LedgerPosting.objects.filter(transaction=canonical).count() == 1
    assert LedgerEntry.objects.filter(posting=first).count() == 1


@pytest.mark.integration
@pytest.mark.django_db
def test_reversal_creates_compensating_entry(normalisation_context):
    institution = normalisation_context[1]
    original = canonical_transaction(normalisation_context, source_event_id="original-1")
    original_posting = post_transaction(transaction_id=original.id, institution=institution)
    reversal = canonical_transaction(
        normalisation_context,
        source_event_id="reversal-1",
        event_type="reversal",
        metadata={"reverses_source_event_id": "original-1"},
    )

    reversal_posting = post_transaction(transaction_id=reversal.id, institution=institution)

    assert reversal_posting.reversal_of_id == original_posting.id
    assert reversal_posting.entries.get().entry_type == LedgerEntry.EntryType.REVERSAL
    assert reversal_posting.entries.get().direction == LedgerEntry.Direction.DEBIT
    account = reversal_posting.entries.get().account
    assert account_balance(account_id=account.id, institution=institution) == Decimal("0.00")


@pytest.mark.integration
@pytest.mark.django_db
def test_correction_preserves_original_history(normalisation_context):
    institution = normalisation_context[1]
    canonical = canonical_transaction(normalisation_context)
    posting = post_transaction(transaction_id=canonical.id, institution=institution)

    corrected = correct_posting(posting_id=posting.id, institution=institution)

    assert corrected.status == LedgerPosting.Status.REVERSED
    assert posting.entries.count() == 2
    assert posting.entries.filter(entry_type=LedgerEntry.EntryType.POSTING).exists()
    assert posting.entries.filter(entry_type=LedgerEntry.EntryType.CORRECTION).exists()
    entry = posting.entries.first()
    assert account_balance(account_id=entry.account_id, institution=institution) == Decimal("0.00")


@pytest.mark.security
@pytest.mark.django_db
def test_wrong_tenant_is_denied(normalisation_context):
    canonical = canonical_transaction(normalisation_context)

    with pytest.raises(PermissionDenied, match="active institution"):
        post_transaction(transaction_id=canonical.id, institution=normalisation_context[2])


@pytest.mark.integration
@pytest.mark.django_db
def test_failed_canonical_transaction_is_not_posted(normalisation_context):
    canonical = canonical_transaction(normalisation_context)
    canonical.status = CanonicalTransaction.Status.FAILED
    canonical.save(update_fields=["status", "updated_at"])

    with pytest.raises(ValidationError, match="Failed canonical"):
        post_transaction(transaction_id=canonical.id, institution=normalisation_context[1])
    assert not LedgerPosting.objects.filter(transaction=canonical).exists()
    assert not Account.objects.filter(customer=canonical.customer).exists()


@pytest.mark.integration
@pytest.mark.django_db
def test_reconciliation_match_and_mismatch_are_explicit(normalisation_context):
    institution = normalisation_context[1]
    connection = normalisation_context[3]
    canonical = canonical_transaction(normalisation_context)
    post_transaction(transaction_id=canonical.id, institution=institution)

    matched = reconcile_transactions(
        institution=institution,
        connection_id=connection.id,
        expected=[
            {"source_event_id": canonical.source_event_id, "amount": "125.50", "currency": "GHS"}
        ],
    )
    mismatch = reconcile_transactions(
        institution=institution,
        connection_id=connection.id,
        expected=[
            {"source_event_id": canonical.source_event_id, "amount": "99.00", "currency": "GHS"}
        ],
    )

    assert matched.status == ReconciliationRun.Status.COMPLETED
    assert matched.items.get().status == ReconciliationItem.Status.MATCHED
    assert mismatch.status == ReconciliationRun.Status.MISMATCHED
    assert mismatch.items.get().status == ReconciliationItem.Status.MISMATCH
    assert mismatch.items.get().details["reason"]
