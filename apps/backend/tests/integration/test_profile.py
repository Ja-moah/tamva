from datetime import UTC, datetime
from decimal import Decimal

import pytest
from django.core.exceptions import PermissionDenied

from domains.audit.models import AuditEvent
from domains.ledger.models import LedgerEntry
from domains.ledger.services import correct_posting, post_transaction
from domains.profile.services import compute_profile
from tests.integration.test_ledger import canonical_transaction

PERIOD_START = datetime(2026, 9, 1, tzinfo=UTC)
PERIOD_END = datetime(2026, 10, 1, tzinfo=UTC)


def compute(context, *, start=PERIOD_START, end=PERIOD_END, version="1"):
    return compute_profile(
        customer_id=context[0].id,
        institution=context[1],
        period_start=start,
        period_end=end,
        version=version,
    )


def post(context, *, source_event_id, direction="CREDIT", amount="125.50"):
    canonical = canonical_transaction(
        context,
        source_event_id=source_event_id,
        direction=direction,
        amount=amount,
    )
    return post_transaction(transaction_id=canonical.id, institution=context[1])


@pytest.mark.integration
@pytest.mark.django_db
def test_same_ledger_history_produces_deterministic_profile(normalisation_context):
    post(normalisation_context, source_event_id="profile-credit")
    post(
        normalisation_context,
        source_event_id="profile-debit",
        direction="DEBIT",
        amount="25.50",
    )

    first = compute(normalisation_context)
    second = compute(normalisation_context)

    assert first.id == second.id
    assert first.cash_flow.total_inflows == Decimal("125.50")
    assert first.cash_flow.total_outflows == Decimal("25.50")
    assert first.cash_flow.net_cash_flow == Decimal("100.00")
    assert first.savings.net_savings == Decimal("100.00")
    assert first.income.estimated_total == Decimal("125.50")
    assert first.expenses.total == Decimal("25.50")
    assert first.provenance["ledger_entry_ids"]
    assert first.provenance["account_ids"]


@pytest.mark.integration
@pytest.mark.django_db
def test_new_ledger_entry_creates_new_snapshot_and_preserves_history(normalisation_context):
    post(normalisation_context, source_event_id="profile-first")
    first = compute(normalisation_context)
    post(normalisation_context, source_event_id="profile-second", amount="50.00")

    second = compute(normalisation_context)

    assert second.id != first.id
    first.refresh_from_db()
    assert first.is_current is False
    assert second.is_current is True
    assert second.cash_flow.total_inflows == Decimal("175.50")


@pytest.mark.security
@pytest.mark.django_db
def test_different_tenant_is_denied(normalisation_context):
    with pytest.raises(PermissionDenied, match="active institution"):
        compute_profile(
            customer_id=normalisation_context[0].id,
            institution=normalisation_context[2],
            period_start=PERIOD_START,
            period_end=PERIOD_END,
        )


@pytest.mark.integration
@pytest.mark.django_db
def test_empty_history_is_valid_low_confidence_profile(normalisation_context):
    snapshot = compute(normalisation_context)

    assert snapshot.confidence == "LOW"
    assert snapshot.coverage_ratio == Decimal("0")
    assert snapshot.cash_flow.transaction_count == 0
    assert snapshot.cash_flow.net_cash_flow == Decimal("0")
    assert snapshot.completeness["has_ledger_entries"] is False


@pytest.mark.integration
@pytest.mark.django_db
def test_reversal_and_correction_are_reflected_in_recomputed_profile(normalisation_context):
    posting = post(normalisation_context, source_event_id="profile-reversal")
    first = compute(normalisation_context)
    correct_posting(posting_id=posting.id, institution=normalisation_context[1])

    second = compute(normalisation_context)

    assert first.cash_flow.net_cash_flow == Decimal("125.50")
    assert second.cash_flow.net_cash_flow == Decimal("0.00")
    assert second.provenance["ledger_entry_ids"]
    assert LedgerEntry.objects.filter(posting=posting).count() == 2


@pytest.mark.integration
@pytest.mark.django_db
def test_profile_has_account_coverage_and_audit_event(normalisation_context):
    post(normalisation_context, source_event_id="profile-coverage")

    snapshot = compute(normalisation_context)

    assert snapshot.account_count == 1
    assert snapshot.covered_account_count == 1
    assert snapshot.coverage_ratio == Decimal("1.0000")
    assert snapshot.account_summaries.get().entry_count == 1
    assert AuditEvent.objects.filter(
        institution=normalisation_context[1], action="FINANCIAL_PROFILE_COMPUTED"
    ).exists()
