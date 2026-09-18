import inspect
from datetime import UTC, datetime
from decimal import Decimal

import pytest
from django.core.exceptions import ValidationError

from domains.confidence import services as confidence_services
from domains.confidence.models import FinancialConfidenceSnapshot
from domains.confidence.services import (
    compute_financial_confidence,
    create_reference_confidence_policy_version,
)
from domains.feature.services import compute_features, create_default_feature_set
from domains.ledger.services import post_transaction
from domains.profile.services import compute_profile
from tests.integration.test_ledger import canonical_transaction

PERIOD_START = datetime(2026, 9, 1, tzinfo=UTC)
PERIOD_END = datetime(2026, 10, 1, tzinfo=UTC)


def build_profile_and_features(context, *, source_event_id="confidence-credit", amount="200.00"):
    txn = canonical_transaction(
        context, source_event_id=source_event_id, direction="CREDIT", amount=amount
    )
    post_transaction(transaction_id=txn.id, institution=context[1])
    snapshot = compute_profile(
        customer_id=context[0].id,
        institution=context[1],
        period_start=PERIOD_START,
        period_end=PERIOD_END,
    )
    compute_features(snapshot=snapshot, feature_set=create_default_feature_set())
    return snapshot


def empty_profile(context):
    return compute_profile(
        customer_id=context[0].id,
        institution=context[1],
        period_start=PERIOD_START,
        period_end=PERIOD_END,
    )


@pytest.mark.integration
@pytest.mark.django_db
def test_confidence_score_is_deterministic_and_idempotent(normalisation_context):
    build_profile_and_features(normalisation_context)
    policy = create_reference_confidence_policy_version()

    first = compute_financial_confidence(
        institution=normalisation_context[1],
        customer=normalisation_context[0],
        policy_version=policy,
    )
    second = compute_financial_confidence(
        institution=normalisation_context[1],
        customer=normalisation_context[0],
        policy_version=policy,
    )

    assert first.id == second.id
    assert first.score == second.score


@pytest.mark.integration
@pytest.mark.django_db
def test_new_profile_data_creates_new_snapshot(normalisation_context):
    build_profile_and_features(normalisation_context, source_event_id="confidence-first")
    policy = create_reference_confidence_policy_version()
    first = compute_financial_confidence(
        institution=normalisation_context[1],
        customer=normalisation_context[0],
        policy_version=policy,
    )

    build_profile_and_features(
        normalisation_context, source_event_id="confidence-second", amount="75.00"
    )
    second = compute_financial_confidence(
        institution=normalisation_context[1],
        customer=normalisation_context[0],
        policy_version=policy,
    )

    assert first.id != second.id
    assert (
        FinancialConfidenceSnapshot.objects.filter(customer=normalisation_context[0]).count() == 2
    )


@pytest.mark.integration
@pytest.mark.django_db
def test_unavailable_components_are_explicit_and_reduce_completeness(normalisation_context):
    empty_profile(normalisation_context)
    policy = create_reference_confidence_policy_version()

    snapshot = compute_financial_confidence(
        institution=normalisation_context[1],
        customer=normalisation_context[0],
        policy_version=policy,
    )

    components = {component.code: component for component in snapshot.components.all()}
    assert components["cashflow_consistency"].available is False
    assert components["cashflow_consistency"].unavailable_reason == "no_feature_run"
    assert snapshot.completeness < Decimal("1")


@pytest.mark.integration
@pytest.mark.django_db
def test_historical_snapshot_is_immutable(normalisation_context):
    build_profile_and_features(normalisation_context, source_event_id="confidence-hist-1")
    policy = create_reference_confidence_policy_version()
    first = compute_financial_confidence(
        institution=normalisation_context[1],
        customer=normalisation_context[0],
        policy_version=policy,
    )
    original_score = first.score

    build_profile_and_features(
        normalisation_context, source_event_id="confidence-hist-2", amount="900.00"
    )
    compute_financial_confidence(
        institution=normalisation_context[1],
        customer=normalisation_context[0],
        policy_version=policy,
    )

    first.refresh_from_db()
    assert first.score == original_score
    assert first.is_current is False


@pytest.mark.integration
@pytest.mark.django_db
def test_confidence_service_does_not_reference_risk_domain():
    source = inspect.getsource(confidence_services)
    assert "domains.risk" not in source
    assert "RiskEvent" not in source


@pytest.mark.integration
@pytest.mark.django_db
def test_confidence_requires_a_profile_at_the_active_institution(normalisation_context):
    policy = create_reference_confidence_policy_version()

    with pytest.raises(ValidationError):
        compute_financial_confidence(
            institution=normalisation_context[2],
            customer=normalisation_context[0],
            policy_version=policy,
        )


@pytest.mark.integration
@pytest.mark.django_db
def test_confidence_snapshot_has_provenance(normalisation_context):
    build_profile_and_features(normalisation_context, source_event_id="confidence-provenance")
    policy = create_reference_confidence_policy_version()

    snapshot = compute_financial_confidence(
        institution=normalisation_context[1],
        customer=normalisation_context[0],
        policy_version=policy,
    )

    assert snapshot.provenance["profile_snapshot_id"]
    assert snapshot.provenance["feature_run_id"]
