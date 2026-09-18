from __future__ import annotations

import hashlib
import json
from decimal import Decimal
from typing import Any

from django.core.exceptions import ValidationError
from django.db import transaction

from domains.audit.models import AuditEvent
from domains.feature.models import FeatureComputationRun

from .models import (
    RuleDefinition,
    RuleEvaluationResult,
    RuleEvaluationRun,
    RuleSetVersion,
)


def _fingerprint(feature_run: FeatureComputationRun, rule_set: RuleSetVersion) -> str:
    payload = {
        "feature_run_id": str(feature_run.id),
        "feature_source": feature_run.source_fingerprint,
        "rule_set": f"{rule_set.code}:{rule_set.version}",
        "rules": list(rule_set.rules.order_by("code").values_list("code", "version")),
    }
    return hashlib.sha256(json.dumps(payload, sort_keys=True, default=str).encode()).hexdigest()


def _comparable(value: Any) -> Any:
    if isinstance(value, bool):
        # bool is an int subclass; Decimal("True") would raise.
        return value
    if isinstance(value, (int, float, Decimal)):
        return Decimal(str(value))
    if isinstance(value, str):
        try:
            return Decimal(value)
        except ArithmeticError:
            return value
    return value


def _matches(operator: str, observed: Any, threshold: Any) -> bool:
    observed_value = _comparable(observed)
    if operator == RuleDefinition.Operator.EXISTS:
        return True
    if operator == RuleDefinition.Operator.NOT_EXISTS:
        return False
    if operator == RuleDefinition.Operator.BETWEEN:
        lower, upper = threshold
        return _comparable(lower) <= observed_value <= _comparable(upper)
    if operator == RuleDefinition.Operator.IN:
        return observed_value in [_comparable(value) for value in threshold]
    if operator == RuleDefinition.Operator.NOT_IN:
        return observed_value not in [_comparable(value) for value in threshold]
    expected = _comparable(threshold)
    if operator == RuleDefinition.Operator.EQ:
        return observed_value == expected
    if operator == RuleDefinition.Operator.NE:
        return observed_value != expected
    if operator == RuleDefinition.Operator.GT:
        return observed_value > expected
    if operator == RuleDefinition.Operator.GTE:
        return observed_value >= expected
    if operator == RuleDefinition.Operator.LT:
        return observed_value < expected
    if operator == RuleDefinition.Operator.LTE:
        return observed_value <= expected
    raise ValidationError(f"Unsupported rule operator: {operator}")


def _observed_value(feature_value: Any) -> Any:
    if feature_value.numeric_value is not None:
        return str(feature_value.numeric_value)
    if feature_value.boolean_value is not None:
        return feature_value.boolean_value
    if feature_value.categorical_value:
        return feature_value.categorical_value
    return None


@transaction.atomic
def evaluate_rules(
    *, feature_run: FeatureComputationRun, rule_set: RuleSetVersion
) -> RuleEvaluationRun:
    if feature_run.status not in (
        FeatureComputationRun.Status.COMPLETED,
        FeatureComputationRun.Status.REUSED,
    ):
        raise ValidationError("Rules require a completed feature computation.")
    fingerprint = _fingerprint(feature_run, rule_set)
    existing = RuleEvaluationRun.objects.filter(
        feature_run=feature_run, rule_set_version=rule_set, source_fingerprint=fingerprint
    ).first()
    if existing:
        existing.status = RuleEvaluationRun.Status.REUSED
        existing.save(update_fields=["status", "updated_at"])
        return existing

    run = RuleEvaluationRun.objects.create(
        institution=feature_run.institution,
        customer=feature_run.customer,
        feature_run=feature_run,
        rule_set_version=rule_set,
        source_fingerprint=fingerprint,
    )
    feature_values = {
        value.definition.code: value for value in feature_run.values.select_related("definition")
    }
    results: list[RuleEvaluationResult] = []
    for rule in rule_set.rules.select_related("feature").all():
        feature_value = feature_values.get(rule.feature.code)
        observed = _observed_value(feature_value) if feature_value else None
        expected = rule.threshold
        if feature_value is None or not feature_value.available:
            if rule.missing_policy == RuleDefinition.MissingPolicy.SKIP:
                results.append(
                    RuleEvaluationResult(
                        run=run,
                        rule=rule,
                        skipped=True,
                        reason_code=rule.reason_code,
                        severity=rule.severity,
                        observed_value=observed,
                        expected_value=expected,
                        metadata={"missing_policy": rule.missing_policy},
                    )
                )
                continue
            matched = rule.missing_policy == RuleDefinition.MissingPolicy.FAIL_CLOSED
            results.append(
                RuleEvaluationResult(
                    run=run,
                    rule=rule,
                    matched=matched,
                    reason_code=rule.reason_code,
                    severity=rule.severity,
                    observed_value=observed,
                    expected_value=expected,
                    metadata={"missing_policy": rule.missing_policy},
                )
            )
            continue
        matched = _matches(rule.operator, observed, expected)
        results.append(
            RuleEvaluationResult(
                run=run,
                rule=rule,
                matched=matched,
                reason_code=rule.reason_code,
                severity=rule.severity,
                observed_value=observed,
                expected_value=expected,
            )
        )
    RuleEvaluationResult.objects.bulk_create(results)
    run.status = RuleEvaluationRun.Status.COMPLETED
    run.metadata = {"rule_count": len(results), "feature_run_id": str(feature_run.id)}
    run.save(update_fields=["status", "metadata", "updated_at"])
    AuditEvent.objects.create(
        institution=feature_run.institution,
        action="RULES_EVALUATED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={
            "rule_run_id": str(run.id),
            "rule_set": f"{rule_set.code}:{rule_set.version}",
            "feature_run_id": str(feature_run.id),
        },
    )
    return run
