from datetime import UTC, datetime
from decimal import Decimal

import pytest

from domains.feature.models import FeatureComputationRun
from domains.feature.services import compute_intelligence_features, create_intelligence_feature_set
from domains.ledger.services import post_transaction
from domains.profile.services import compute_profile
from domains.security.services import observe_device, observe_location
from tests.integration.test_ledger import canonical_transaction

PERIOD_START = datetime(2026, 9, 1, tzinfo=UTC)
PERIOD_END = datetime(2026, 10, 1, tzinfo=UTC)


def post(context, *, source_event_id, **overrides):
    txn = canonical_transaction(context, source_event_id=source_event_id, **overrides)
    post_transaction(transaction_id=txn.id, institution=context[1])
    return txn


def profile_snapshot(context):
    return compute_profile(
        customer_id=context[0].id,
        institution=context[1],
        period_start=PERIOD_START,
        period_end=PERIOD_END,
    )


@pytest.mark.integration
@pytest.mark.django_db
def test_transaction_window_counts_are_computed(normalisation_context):
    post(
        normalisation_context,
        source_event_id="iv-1h",
        occurred_at="2026-09-30T23:30:00Z",
        amount="40.00",
    )
    post(
        normalisation_context,
        source_event_id="iv-old",
        occurred_at="2026-09-05T10:00:00Z",
        amount="10.00",
    )
    snapshot = profile_snapshot(normalisation_context)
    feature_set = create_intelligence_feature_set()

    run = compute_intelligence_features(snapshot=snapshot, feature_set=feature_set)

    values = {v.definition.code: v for v in run.values.all()}
    assert values["transactions_last_1h"].numeric_value == Decimal("1")
    assert values["transaction_value_last_1h"].numeric_value == Decimal("40.00")
    assert values["transactions_last_24h"].numeric_value == Decimal("1")


@pytest.mark.integration
@pytest.mark.django_db
def test_baseline_deviation_is_computed(normalisation_context):
    post(
        normalisation_context,
        source_event_id="iv-b1",
        occurred_at="2026-09-10T10:00:00Z",
        amount="100.00",
    )
    post(
        normalisation_context,
        source_event_id="iv-b2",
        occurred_at="2026-09-15T10:00:00Z",
        amount="100.00",
    )
    post(
        normalisation_context,
        source_event_id="iv-b3",
        occurred_at="2026-09-30T23:00:00Z",
        amount="420.00",
    )
    snapshot = profile_snapshot(normalisation_context)
    feature_set = create_intelligence_feature_set()

    run = compute_intelligence_features(snapshot=snapshot, feature_set=feature_set)

    values = {v.definition.code: v for v in run.values.all()}
    assert values["typical_transaction_amount"].numeric_value == Decimal("100.000000")
    assert values["transaction_amount_deviation"].numeric_value == Decimal("4.200000")


@pytest.mark.integration
@pytest.mark.django_db
def test_insufficient_history_is_explicit(normalisation_context):
    snapshot = profile_snapshot(normalisation_context)
    feature_set = create_intelligence_feature_set()

    run = compute_intelligence_features(snapshot=snapshot, feature_set=feature_set)

    values = {v.definition.code: v for v in run.values.all()}
    assert values["typical_transaction_amount"].available is False
    assert values["typical_transaction_amount"].unavailable_reason == "insufficient_history"
    assert values["new_counterparty_flag"].available is False
    assert values["new_device_flag"].available is False
    assert values["new_device_flag"].unavailable_reason == "no_device_observations"
    assert values["new_location_flag"].available is False


@pytest.mark.integration
@pytest.mark.django_db
def test_recomputation_is_deterministic_and_reused(normalisation_context):
    post(normalisation_context, source_event_id="iv-det", occurred_at="2026-09-20T10:00:00Z")
    snapshot = profile_snapshot(normalisation_context)
    feature_set = create_intelligence_feature_set()

    first = compute_intelligence_features(snapshot=snapshot, feature_set=feature_set)
    second = compute_intelligence_features(snapshot=snapshot, feature_set=feature_set)

    assert first.id == second.id
    assert second.status == FeatureComputationRun.Status.REUSED


@pytest.mark.integration
@pytest.mark.django_db
def test_new_counterparty_flag_reflects_first_seen_transaction(normalisation_context):
    post(
        normalisation_context,
        source_event_id="iv-cp",
        occurred_at="2026-09-30T12:00:00Z",
        counterparty_reference="brand-new-cp",
    )
    snapshot = profile_snapshot(normalisation_context)
    feature_set = create_intelligence_feature_set()

    run = compute_intelligence_features(snapshot=snapshot, feature_set=feature_set)

    values = {v.definition.code: v for v in run.values.all()}
    assert values["new_counterparty_flag"].boolean_value is True


@pytest.mark.integration
@pytest.mark.django_db
def test_new_device_flag_reflects_recent_link(normalisation_context):
    import uuid

    observe_device(
        institution=normalisation_context[1],
        customer=normalisation_context[0],
        device_key="fresh-device",
        source="mobile_app",
        provenance_type="a",
        provenance_id=uuid.uuid4(),
        observed_at=datetime(2026, 9, 30, 12, 0, tzinfo=UTC),
    )
    snapshot = profile_snapshot(normalisation_context)
    feature_set = create_intelligence_feature_set()

    run = compute_intelligence_features(snapshot=snapshot, feature_set=feature_set)

    values = {v.definition.code: v for v in run.values.all()}
    assert values["new_device_flag"].boolean_value is True


@pytest.mark.integration
@pytest.mark.django_db
def test_new_location_flag_reflects_recent_country_change(normalisation_context):
    import uuid

    observe_location(
        institution=normalisation_context[1],
        customer=normalisation_context[0],
        source="s",
        country_code="GH",
        confidence=Decimal("0.9"),
        provenance_type="a",
        provenance_id=uuid.uuid4(),
        observed_at=datetime(2026, 9, 1, tzinfo=UTC),
    )
    observe_location(
        institution=normalisation_context[1],
        customer=normalisation_context[0],
        source="s",
        country_code="NG",
        confidence=Decimal("0.9"),
        provenance_type="b",
        provenance_id=uuid.uuid4(),
        observed_at=datetime(2026, 9, 30, 12, 0, tzinfo=UTC),
    )
    snapshot = profile_snapshot(normalisation_context)
    feature_set = create_intelligence_feature_set()

    run = compute_intelligence_features(snapshot=snapshot, feature_set=feature_set)

    values = {v.definition.code: v for v in run.values.all()}
    assert values["new_location_flag"].boolean_value is True
