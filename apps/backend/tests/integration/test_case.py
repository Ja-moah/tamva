from decimal import Decimal

import pytest
from django.core.exceptions import PermissionDenied, ValidationError

from domains.audit.models import AuditEvent
from domains.case.models import (
    Case,
    CaseAssignment,
    CaseResolution,
    CaseRiskEvent,
)
from domains.case.services import (
    add_case_note,
    assign_case,
    create_reference_case_opening_policy_version,
    open_case_manually,
    record_case_action,
    resolve_case,
    transition_case_status,
)
from domains.identity.models import User
from domains.partner.models import InstitutionMembership
from domains.risk.services import create_reference_policy_version, evaluate_risk
from tests.integration.test_risk import feature_run, model_run_with_fixed_score, rule_run_for


def block_risk_event(context, *, suffix="block"):
    run = feature_run(context, source_event_id=f"case-{suffix}")
    rules = rule_run_for(run, severity="CRITICAL", reason_code="CRITICAL_SIGNAL", version=suffix)
    policy = create_reference_policy_version()
    result_run = evaluate_risk(
        feature_run=run, policy_version=policy, institution=context[1], rule_run=rules
    )
    return result_run.event


def hold_risk_event(context, *, suffix="hold"):
    run = feature_run(context, source_event_id=f"case-{suffix}")
    rules = rule_run_for(run, severity="HIGH", reason_code="HIGH_SIGNAL", version=suffix)
    policy = create_reference_policy_version()
    result_run = evaluate_risk(
        feature_run=run, policy_version=policy, institution=context[1], rule_run=rules
    )
    return result_run.event


def allow_risk_event(context, *, suffix="allow"):
    run = feature_run(context, source_event_id=f"case-{suffix}")
    rules = rule_run_for(
        run, severity="INFO", reason_code="INFO_ONLY", matches=False, version=suffix
    )
    model_run = model_run_with_fixed_score(
        context, run, score=Decimal("100"), code=f"case_allow_{suffix}"
    )
    policy = create_reference_policy_version()
    result_run = evaluate_risk(
        feature_run=run,
        policy_version=policy,
        institution=context[1],
        rule_run=rules,
        model_run=model_run,
    )
    return result_run.event


def platform_user(context, *, username, institution=None):
    user = User.objects.create_user(
        username=username,
        email=f"{username}@example.test",
        password="correct horse battery staple",
        identity_type=User.IdentityType.PLATFORM_USER,
    )
    InstitutionMembership.objects.create(
        institution=institution or context[1], user=user, status="ACTIVE"
    )
    return user


def open_case_from_event_helper(event, institution):
    from domains.case.services import open_case_from_risk_event

    policy = create_reference_case_opening_policy_version()
    return open_case_from_risk_event(
        risk_event=event, policy_version=policy, institution=institution
    )


@pytest.mark.integration
@pytest.mark.django_db
def test_block_decision_opens_case(normalisation_context):
    event = block_risk_event(normalisation_context)

    case = open_case_from_event_helper(event, normalisation_context[1])

    assert case is not None
    assert case.status == Case.Status.OPEN
    assert case.priority == "HIGH"
    assert CaseRiskEvent.objects.filter(case=case, risk_event=event).exists()


@pytest.mark.integration
@pytest.mark.django_db
def test_hold_decision_opens_case(normalisation_context):
    event = hold_risk_event(normalisation_context)

    case = open_case_from_event_helper(event, normalisation_context[1])

    assert case is not None
    assert case.status == Case.Status.OPEN


@pytest.mark.integration
@pytest.mark.django_db
def test_allow_decision_does_not_open_case(normalisation_context):
    event = allow_risk_event(normalisation_context)

    case = open_case_from_event_helper(event, normalisation_context[1])

    assert case is None
    assert not CaseRiskEvent.objects.filter(risk_event=event).exists()


@pytest.mark.integration
@pytest.mark.django_db
def test_same_risk_event_processed_twice_does_not_duplicate_case(normalisation_context):
    event = block_risk_event(normalisation_context)
    policy = create_reference_case_opening_policy_version()

    from domains.case.services import open_case_from_risk_event

    first = open_case_from_risk_event(
        risk_event=event, policy_version=policy, institution=normalisation_context[1]
    )
    second = open_case_from_risk_event(
        risk_event=event, policy_version=policy, institution=normalisation_context[1]
    )

    assert first.id == second.id
    assert Case.objects.filter(customer=normalisation_context[0]).count() == 1


@pytest.mark.integration
@pytest.mark.django_db
def test_open_to_triaged_succeeds(normalisation_context):
    event = block_risk_event(normalisation_context)
    case = open_case_from_event_helper(event, normalisation_context[1])

    updated = transition_case_status(
        case=case, new_status=Case.Status.TRIAGED, institution=normalisation_context[1]
    )

    assert updated.status == Case.Status.TRIAGED


@pytest.mark.integration
@pytest.mark.django_db
def test_open_to_investigating_is_rejected(normalisation_context):
    event = block_risk_event(normalisation_context)
    case = open_case_from_event_helper(event, normalisation_context[1])

    with pytest.raises(ValidationError):
        transition_case_status(
            case=case, new_status=Case.Status.INVESTIGATING, institution=normalisation_context[1]
        )


@pytest.mark.integration
@pytest.mark.django_db
def test_full_lifecycle(normalisation_context):
    event = block_risk_event(normalisation_context)
    case = open_case_from_event_helper(event, normalisation_context[1])
    handler = platform_user(normalisation_context, username="case-handler")

    case = transition_case_status(
        case=case,
        new_status=Case.Status.TRIAGED,
        institution=normalisation_context[1],
        actor=handler,
    )
    case = transition_case_status(
        case=case,
        new_status=Case.Status.INVESTIGATING,
        institution=normalisation_context[1],
        actor=handler,
    )
    case = transition_case_status(
        case=case,
        new_status=Case.Status.ACTIONED,
        institution=normalisation_context[1],
        actor=handler,
    )
    resolution = resolve_case(
        case=case,
        outcome=CaseResolution.Outcome.CONFIRMED_RISK,
        reason="Confirmed via manual review.",
        resolved_by=handler,
        institution=normalisation_context[1],
    )

    case.refresh_from_db()
    assert case.status == Case.Status.RESOLVED
    assert case.closed_at is not None
    assert resolution.outcome == CaseResolution.Outcome.CONFIRMED_RISK
    assert list(case.status_events.values_list("new_status", flat=True)) == [
        "OPEN",
        "TRIAGED",
        "INVESTIGATING",
        "ACTIONED",
        "RESOLVED",
    ]


@pytest.mark.security
@pytest.mark.django_db
def test_wrong_tenant_cannot_touch_case(normalisation_context):
    event = block_risk_event(normalisation_context)
    case = open_case_from_event_helper(event, normalisation_context[1])
    other_institution = normalisation_context[2]

    with pytest.raises(PermissionDenied):
        transition_case_status(
            case=case, new_status=Case.Status.TRIAGED, institution=other_institution
        )
    with pytest.raises(PermissionDenied):
        assign_case(
            case=case,
            assignee=None,
            assigned_by=normalisation_context[0],
            institution=other_institution,
        )
    with pytest.raises(PermissionDenied):
        add_case_note(
            case=case, author=normalisation_context[0], body="x", institution=other_institution
        )


@pytest.mark.integration
@pytest.mark.django_db
def test_assignment_is_tenant_safe(normalisation_context):
    event = block_risk_event(normalisation_context)
    case = open_case_from_event_helper(event, normalisation_context[1])
    handler = platform_user(normalisation_context, username="member-1")
    outsider = platform_user(
        normalisation_context, username="outsider-1", institution=normalisation_context[2]
    )

    updated = assign_case(
        case=case, assignee=handler, assigned_by=handler, institution=normalisation_context[1]
    )
    assert updated.current_assignee_id == handler.id

    with pytest.raises(PermissionDenied):
        assign_case(
            case=case, assignee=outsider, assigned_by=handler, institution=normalisation_context[1]
        )


@pytest.mark.integration
@pytest.mark.django_db
def test_reassignment_preserves_history(normalisation_context):
    event = block_risk_event(normalisation_context)
    case = open_case_from_event_helper(event, normalisation_context[1])
    first_handler = platform_user(normalisation_context, username="member-a")
    second_handler = platform_user(normalisation_context, username="member-b")

    assign_case(
        case=case,
        assignee=first_handler,
        assigned_by=first_handler,
        institution=normalisation_context[1],
    )
    assign_case(
        case=case,
        assignee=second_handler,
        assigned_by=first_handler,
        institution=normalisation_context[1],
    )

    assert CaseAssignment.objects.filter(case=case).count() == 2
    case.refresh_from_db()
    assert case.current_assignee_id == second_handler.id


@pytest.mark.integration
@pytest.mark.django_db
def test_case_note_is_recorded_and_audited(normalisation_context):
    event = block_risk_event(normalisation_context)
    case = open_case_from_event_helper(event, normalisation_context[1])
    handler = platform_user(normalisation_context, username="note-author")

    note = add_case_note(
        case=case,
        author=handler,
        body="Reviewed transaction history.",
        institution=normalisation_context[1],
    )

    assert note.body == "Reviewed transaction history."
    assert AuditEvent.objects.filter(
        action="CASE_NOTE_ADDED", metadata__note_id=str(note.id)
    ).exists()


@pytest.mark.integration
@pytest.mark.django_db
def test_case_action_is_persisted(normalisation_context):
    event = block_risk_event(normalisation_context)
    case = open_case_from_event_helper(event, normalisation_context[1])
    handler = platform_user(normalisation_context, username="actioner")

    action = record_case_action(
        case=case,
        actor=handler,
        action_type="ESCALATE",
        institution=normalisation_context[1],
        detail={"escalated_to": "compliance"},
    )

    assert action.action_type == "ESCALATE"
    assert action.detail["escalated_to"] == "compliance"


@pytest.mark.integration
@pytest.mark.django_db
def test_resolution_does_not_mutate_original_risk_event(normalisation_context):
    event = block_risk_event(normalisation_context)
    original_score = event.score
    original_decision = event.decision
    case = open_case_from_event_helper(event, normalisation_context[1])
    handler = platform_user(normalisation_context, username="resolver")

    transition_case_status(
        case=case,
        new_status=Case.Status.TRIAGED,
        institution=normalisation_context[1],
        actor=handler,
    )
    transition_case_status(
        case=case,
        new_status=Case.Status.INVESTIGATING,
        institution=normalisation_context[1],
        actor=handler,
    )
    transition_case_status(
        case=case,
        new_status=Case.Status.ACTIONED,
        institution=normalisation_context[1],
        actor=handler,
    )
    resolve_case(
        case=case,
        outcome=CaseResolution.Outcome.CONFIRMED_RISK,
        reason="Confirmed.",
        resolved_by=handler,
        institution=normalisation_context[1],
    )

    event.refresh_from_db()
    assert event.score == original_score
    assert event.decision == original_decision


@pytest.mark.integration
@pytest.mark.django_db
def test_manual_case_creation(normalisation_context):
    handler = platform_user(normalisation_context, username="manual-creator")

    case = open_case_manually(
        institution=normalisation_context[1],
        customer=normalisation_context[0],
        case_type="MANUAL_REVIEW",
        priority=Case.Priority.MEDIUM,
        created_by=handler,
    )

    assert case.source == Case.Source.MANUAL
    assert case.created_by_id == handler.id
    assert AuditEvent.objects.filter(action="CASE_OPENED", metadata__case_id=str(case.id)).exists()


@pytest.mark.integration
@pytest.mark.django_db
def test_audit_trail_is_complete_across_lifecycle(normalisation_context):
    event = block_risk_event(normalisation_context)
    case = open_case_from_event_helper(event, normalisation_context[1])
    handler = platform_user(normalisation_context, username="audit-handler")

    assign_case(
        case=case, assignee=handler, assigned_by=handler, institution=normalisation_context[1]
    )
    transition_case_status(
        case=case,
        new_status=Case.Status.TRIAGED,
        institution=normalisation_context[1],
        actor=handler,
    )

    actions = set(
        AuditEvent.objects.filter(metadata__case_id=str(case.id)).values_list("action", flat=True)
    )
    assert {"CASE_OPENED", "CASE_ASSIGNED", "CASE_STATUS_CHANGED"} <= actions


@pytest.mark.integration
@pytest.mark.django_db
def test_historical_case_status_events_are_immutable(normalisation_context):
    event = block_risk_event(normalisation_context)
    case = open_case_from_event_helper(event, normalisation_context[1])
    handler = platform_user(normalisation_context, username="immutable-handler")

    transition_case_status(
        case=case,
        new_status=Case.Status.TRIAGED,
        institution=normalisation_context[1],
        actor=handler,
    )
    first_event = case.status_events.get(new_status=Case.Status.OPEN)
    original_occurred_at = first_event.occurred_at

    transition_case_status(
        case=case,
        new_status=Case.Status.INVESTIGATING,
        institution=normalisation_context[1],
        actor=handler,
    )

    first_event.refresh_from_db()
    assert first_event.occurred_at == original_occurred_at
    assert case.status_events.count() == 3
