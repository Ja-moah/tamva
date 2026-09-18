from datetime import UTC, datetime
from decimal import Decimal

import pytest

from domains.audit.models import AuditEvent
from domains.feature.models import FeatureComputationRun
from domains.feature.services import compute_features, create_default_feature_set
from domains.ledger.services import post_transaction
from domains.profile.services import compute_profile
from tests.integration.test_ledger import canonical_transaction

PERIOD_START = datetime(2026, 9, 1, tzinfo=UTC)
PERIOD_END = datetime(2026, 10, 1, tzinfo=UTC)


def profile_snapshot(context, *, version="1"):
    return compute_profile(
        customer_id=context[0].id,
        institution=context[1],
        period_start=PERIOD_START,
        period_end=PERIOD_END,
        version=version,
    )


def post(context, *, source_event_id, direction="CREDIT", amount="125.50"):
    transaction = canonical_transaction(
        context,
        source_event_id=source_event_id,
        direction=direction,
        amount=amount,
    )
    return post_transaction(transaction_id=transaction.id, institution=context[1])


@pytest.mark.integration
@pytest.mark.django_db
def test_feature_computation_is_deterministic_and_idempotent(normalisation_context):
    post(normalisation_context, source_event_id="feature-credit")
    snapshot = profile_snapshot(normalisation_context)
    feature_set = create_default_feature_set()

    first = compute_features(snapshot=snapshot, feature_set=feature_set)
    second = compute_features(snapshot=snapshot, feature_set=feature_set)

    assert first.id == second.id
    assert second.status == FeatureComputationRun.Status.REUSED
    values = {value.definition.code: value for value in first.values.all()}
    assert values["account_coverage"].numeric_value == Decimal("1.0000")
    assert values["savings_rate"].numeric_value == Decimal("1.0000")
    assert values["cashflow_consistency"].available is False
    assert values["cashflow_consistency"].unavailable_reason == "unsupported_source_data"
    assert values["savings_rate"].provenance["profile_snapshot_id"] == str(snapshot.id)


@pytest.mark.integration
@pytest.mark.django_db
def test_new_profile_snapshot_creates_new_feature_run(normalisation_context):
    post(normalisation_context, source_event_id="feature-first")
    first_snapshot = profile_snapshot(normalisation_context)
    feature_set = create_default_feature_set()
    first_run = compute_features(snapshot=first_snapshot, feature_set=feature_set)

    post(normalisation_context, source_event_id="feature-second", amount="50.00")
    second_snapshot = profile_snapshot(normalisation_context)
    second_run = compute_features(snapshot=second_snapshot, feature_set=feature_set)

    assert second_snapshot.id != first_snapshot.id
    assert second_run.id != first_run.id
    assert first_run.values.get(definition__code="transaction_frequency").numeric_value == Decimal(
        "1.000000"
    )
    assert second_run.values.get(definition__code="transaction_frequency").numeric_value == Decimal(
        "2.000000"
    )
    assert (
        FeatureComputationRun.objects.filter(
            institution=normalisation_context[1], customer=normalisation_context[0]
        ).count()
        == 2
    )


@pytest.mark.integration
@pytest.mark.django_db
def test_empty_profile_history_is_explicitly_unavailable(normalisation_context):
    snapshot = profile_snapshot(normalisation_context)
    feature_set = create_default_feature_set()
    run = compute_features(snapshot=snapshot, feature_set=feature_set)

    values = {value.definition.code: value for value in run.values.all()}
    assert values["savings_rate"].available is False
    assert values["savings_rate"].unavailable_reason == "insufficient_history"
    assert values["transaction_frequency"].available is False
    assert values["transaction_frequency"].numeric_value is None


@pytest.mark.integration
@pytest.mark.django_db
def test_feature_set_version_preserves_historical_values(normalisation_context):
    post(normalisation_context, source_event_id="feature-versioned")
    snapshot = profile_snapshot(normalisation_context)
    first_set = create_default_feature_set(version="1")
    second_set = create_default_feature_set(version="2")

    first = compute_features(snapshot=snapshot, feature_set=first_set)
    second = compute_features(snapshot=snapshot, feature_set=second_set)

    assert first.id != second.id
    assert first.feature_set_version.version == "1"
    assert second.feature_set_version.version == "2"
    assert FeatureComputationRun.objects.filter(profile_snapshot=snapshot).count() == 2


@pytest.mark.integration
@pytest.mark.django_db
def test_feature_computation_is_audited(normalisation_context):
    snapshot = profile_snapshot(normalisation_context)
    feature_set = create_default_feature_set()

    run = compute_features(snapshot=snapshot, feature_set=feature_set)

    assert AuditEvent.objects.filter(
        institution=normalisation_context[1],
        action="FEATURES_COMPUTED",
        metadata__feature_run_id=str(run.id),
    ).exists()
