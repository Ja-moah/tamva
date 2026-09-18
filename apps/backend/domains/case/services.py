from __future__ import annotations

from typing import Any

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.utils import timezone

from domains.audit.models import AuditEvent
from domains.identity.models import User
from domains.partner.models import Institution, InstitutionMembership
from domains.risk.models import RiskEvent
from packages.events.models import OutboxEvent

from .models import (
    Case,
    CaseAction,
    CaseAssignment,
    CaseNote,
    CaseOpeningPolicy,
    CaseOpeningPolicyVersion,
    CaseResolution,
    CaseRiskEvent,
    CaseStatusEvent,
)
from .policy import DEFAULT_CONFIGURATION, CaseOpeningConfig

ALLOWED_TRANSITIONS: dict[str, set[str]] = {
    Case.Status.OPEN: {Case.Status.TRIAGED},
    Case.Status.TRIAGED: {Case.Status.INVESTIGATING},
    Case.Status.INVESTIGATING: {Case.Status.ACTIONED},
    Case.Status.ACTIONED: {Case.Status.RESOLVED},
    Case.Status.RESOLVED: set(),
}


def create_reference_case_opening_policy_version(*, version: str = "1") -> CaseOpeningPolicyVersion:
    policy, _ = CaseOpeningPolicy.objects.get_or_create(
        code="reference_case_policy",
        defaults={"name": "Reference case opening policy"},
    )
    policy_version, _ = CaseOpeningPolicyVersion.objects.get_or_create(
        policy=policy,
        version=version,
        defaults={
            "configuration": DEFAULT_CONFIGURATION,
            "status": CaseOpeningPolicyVersion.Status.ACTIVE,
        },
    )
    return policy_version


def _publish_event(*, event_type: str, institution: Institution, payload: dict[str, Any]) -> None:
    OutboxEvent.objects.create(
        event_type=event_type,
        occurred_at=timezone.now(),
        producer="domains.case",
        tenant_id=institution.id,
        payload=payload,
    )


@transaction.atomic
def open_case_from_risk_event(
    *,
    risk_event: RiskEvent,
    policy_version: CaseOpeningPolicyVersion,
    institution: Institution,
) -> Case | None:
    if risk_event.institution_id != institution.id:
        raise PermissionDenied("Risk event does not belong to the active institution.")
    if policy_version.status == CaseOpeningPolicyVersion.Status.RETIRED:
        raise ValidationError("Retired case opening policy versions cannot trigger new cases.")

    existing_link = CaseRiskEvent.objects.filter(
        risk_event=risk_event, case__opening_policy_version=policy_version
    ).first()
    if existing_link:
        return existing_link.case

    config = CaseOpeningConfig.from_dict(policy_version.configuration)
    reason_codes = list(risk_event.reasons.values_list("code", flat=True))
    if not config.should_open_case(decision=risk_event.decision, reason_codes=reason_codes):
        return None

    case = Case.objects.create(
        institution=institution,
        customer=risk_event.customer,
        case_type=config.default_type,
        priority=config.default_priority,
        status=Case.Status.OPEN,
        source=Case.Source.AUTOMATIC,
        opening_policy_version=policy_version,
        opened_at=timezone.now(),
    )
    CaseRiskEvent.objects.create(case=case, risk_event=risk_event)
    CaseStatusEvent.objects.create(case=case, previous_status="", new_status=Case.Status.OPEN)
    AuditEvent.objects.create(
        institution=institution,
        action="CASE_OPENED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={
            "case_id": str(case.id),
            "risk_event_id": str(risk_event.id),
            "source": "AUTOMATIC",
        },
    )
    _publish_event(
        event_type="case.created",
        institution=institution,
        payload={"case_id": str(case.id), "customer_id": str(case.customer_id)},
    )
    return case


@transaction.atomic
def open_case_manually(
    *,
    institution: Institution,
    customer: User,
    case_type: str,
    priority: str,
    created_by: User,
    risk_events: tuple[RiskEvent, ...] = (),
) -> Case:
    for risk_event in risk_events:
        if risk_event.institution_id != institution.id:
            raise PermissionDenied("Risk event does not belong to the active institution.")

    case = Case.objects.create(
        institution=institution,
        customer=customer,
        case_type=case_type,
        priority=priority,
        status=Case.Status.OPEN,
        source=Case.Source.MANUAL,
        created_by=created_by,
        opened_at=timezone.now(),
    )
    for risk_event in risk_events:
        CaseRiskEvent.objects.create(case=case, risk_event=risk_event)
    CaseStatusEvent.objects.create(
        case=case, previous_status="", new_status=Case.Status.OPEN, actor=created_by
    )
    AuditEvent.objects.create(
        institution=institution,
        action="CASE_OPENED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={"case_id": str(case.id), "source": "MANUAL"},
    )
    _publish_event(
        event_type="case.created",
        institution=institution,
        payload={"case_id": str(case.id), "customer_id": str(case.customer_id)},
    )
    return case


@transaction.atomic
def transition_case_status(
    *,
    case: Case,
    new_status: str,
    institution: Institution,
    actor: User | None = None,
    note: str = "",
) -> Case:
    if case.institution_id != institution.id:
        raise PermissionDenied("Case does not belong to the active institution.")
    if new_status not in ALLOWED_TRANSITIONS.get(case.status, set()):
        raise ValidationError(f"Cannot transition case from {case.status} to {new_status}.")

    previous_status = case.status
    case.status = new_status
    update_fields = ["status", "updated_at"]
    if new_status == Case.Status.RESOLVED:
        case.closed_at = timezone.now()
        update_fields.append("closed_at")
    case.full_clean()
    case.save(update_fields=update_fields)
    CaseStatusEvent.objects.create(
        case=case,
        previous_status=previous_status,
        new_status=new_status,
        actor=actor,
        note=note,
    )
    AuditEvent.objects.create(
        institution=institution,
        action="CASE_STATUS_CHANGED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={
            "case_id": str(case.id),
            "previous_status": previous_status,
            "new_status": new_status,
        },
    )
    _publish_event(
        event_type="case.status_changed",
        institution=institution,
        payload={"case_id": str(case.id), "new_status": new_status},
    )
    return case


@transaction.atomic
def assign_case(
    *,
    case: Case,
    assignee: User | None,
    assigned_by: User,
    institution: Institution,
    note: str = "",
) -> Case:
    if case.institution_id != institution.id:
        raise PermissionDenied("Case does not belong to the active institution.")
    if (
        assignee is not None
        and not InstitutionMembership.objects.filter(
            institution=institution, user=assignee, status="ACTIVE"
        ).exists()
    ):
        raise PermissionDenied("Assignee is not an active member of the active institution.")

    case.current_assignee = assignee
    case.save(update_fields=["current_assignee", "updated_at"])
    CaseAssignment.objects.create(case=case, assignee=assignee, assigned_by=assigned_by, note=note)
    AuditEvent.objects.create(
        institution=institution,
        action="CASE_ASSIGNED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={
            "case_id": str(case.id),
            "assignee_id": str(assignee.id) if assignee else None,
        },
    )
    _publish_event(
        event_type="case.assigned",
        institution=institution,
        payload={
            "case_id": str(case.id),
            "assignee_id": str(assignee.id) if assignee else None,
        },
    )
    return case


def add_case_note(*, case: Case, author: User, body: str, institution: Institution) -> CaseNote:
    if case.institution_id != institution.id:
        raise PermissionDenied("Case does not belong to the active institution.")
    note = CaseNote.objects.create(case=case, author=author, body=body)
    AuditEvent.objects.create(
        institution=institution,
        action="CASE_NOTE_ADDED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={"case_id": str(case.id), "note_id": str(note.id)},
    )
    return note


def record_case_action(
    *,
    case: Case,
    actor: User,
    action_type: str,
    institution: Institution,
    detail: dict[str, Any] | None = None,
) -> CaseAction:
    if case.institution_id != institution.id:
        raise PermissionDenied("Case does not belong to the active institution.")
    action = CaseAction.objects.create(
        case=case, actor=actor, action_type=action_type, detail=detail or {}
    )
    AuditEvent.objects.create(
        institution=institution,
        action="CASE_ACTION_RECORDED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={"case_id": str(case.id), "action_type": action_type},
    )
    return action


@transaction.atomic
def resolve_case(
    *,
    case: Case,
    outcome: str,
    reason: str,
    resolved_by: User,
    institution: Institution,
) -> CaseResolution:
    if case.institution_id != institution.id:
        raise PermissionDenied("Case does not belong to the active institution.")
    if case.status != Case.Status.ACTIONED:
        raise ValidationError("A case must be ACTIONED before it can be resolved.")
    if CaseResolution.objects.filter(case=case).exists():
        raise ValidationError("Case has already been resolved.")

    resolution = CaseResolution.objects.create(
        case=case, outcome=outcome, reason=reason, resolved_by=resolved_by
    )
    transition_case_status(
        case=case,
        new_status=Case.Status.RESOLVED,
        institution=institution,
        actor=resolved_by,
        note="Resolved.",
    )
    AuditEvent.objects.create(
        institution=institution,
        action="CASE_RESOLVED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={"case_id": str(case.id), "outcome": outcome},
    )
    _publish_event(
        event_type="case.resolved",
        institution=institution,
        payload={"case_id": str(case.id), "outcome": outcome},
    )
    return resolution
