"""Registry of the list resources that support saved views and exports.

One declaration per resource drives four things so they cannot drift apart:
the permission required to read it, the filters and orderings a client may use,
the columns an export may contain, and the tenant-scoped base queryset.
"""

from __future__ import annotations

from collections.abc import Callable, Mapping, Sequence
from dataclasses import dataclass
from typing import Any
from uuid import UUID

from django.db.models import QuerySet

from domains.audit.api import views as audit_views
from domains.audit.models import AuditEvent
from domains.case.api import views as case_views
from domains.case.models import Case
from domains.identity.models import User
from domains.identity.services import resolve_membership, user_has_permission
from domains.notifications.api import views as notification_views
from domains.notifications.models import Notification
from domains.operations import customers
from domains.operations.models import ResourceType
from domains.risk.api import views as risk_views
from domains.risk.models import RiskEvent
from domains.security.api import views as security_views
from domains.security.models import SecurityEvent
from packages.common.filtering import FilterSpec, SearchSpec


@dataclass(frozen=True, slots=True)
class Column:
    key: str
    label: str
    getter: Callable[[Any], Any]
    # Extra permission required to include this column, beyond the resource's own.
    permission: str | None = None


@dataclass(frozen=True, slots=True)
class Resource:
    key: str
    permission: str
    filters: Sequence[FilterSpec]
    ordering: Mapping[str, str]
    default_ordering: Sequence[str]
    columns: Sequence[Column]
    queryset: Callable[[UUID, User], QuerySet[Any]]
    search: SearchSpec | None = None

    def allowed_columns(self, actor: User, institution_id: UUID) -> list[Column]:
        return [
            column
            for column in self.columns
            if column.permission is None
            or user_has_permission(actor, column.permission, institution_id)
        ]

    def filter_params(self) -> set[str]:
        params = {spec.param for spec in self.filters}
        if self.search:
            params.add(self.search.param)
        return params


def _attr(name: str) -> Callable[[Any], Any]:
    return lambda row: getattr(row, name)


def _risk_queryset(institution_id: UUID, actor: User) -> QuerySet[Any]:
    return RiskEvent.objects.filter(institution_id=institution_id).prefetch_related("reasons")


def _case_queryset(institution_id: UUID, actor: User) -> QuerySet[Any]:
    return Case.objects.filter(institution_id=institution_id).annotate(
        priority_rank=case_views.PRIORITY_RANK
    )


def _customer_queryset(institution_id: UUID, actor: User) -> QuerySet[Any]:
    return customers.customer_queryset(
        institution_id,
        include_passport=user_has_permission(actor, "passport:read", institution_id),
    )


def _notification_queryset(institution_id: UUID, actor: User) -> QuerySet[Any]:
    return Notification.objects.filter(recipient=actor).select_related("template")


def _security_queryset(institution_id: UUID, actor: User) -> QuerySet[Any]:
    return SecurityEvent.objects.filter(institution_id=institution_id).annotate(
        severity_rank=security_views.SEVERITY_RANK
    )


def _audit_queryset(institution_id: UUID, actor: User) -> QuerySet[Any]:
    return AuditEvent.objects.filter(institution_id=institution_id)


RESOURCES: dict[str, Resource] = {
    ResourceType.RISK_EVENTS: Resource(
        key=ResourceType.RISK_EVENTS,
        permission="risk:read",
        filters=risk_views.FILTERS,
        ordering=risk_views.ORDERING,
        default_ordering=("-evaluated_at", "id"),
        queryset=_risk_queryset,
        columns=(
            Column("id", "Event ID", lambda r: str(r.id)),
            Column("customer_id", "Customer ID", lambda r: str(r.customer_id)),
            Column("evaluated_at", "Evaluated at", _attr("evaluated_at")),
            Column("risk_score", "Risk score (0-1000, higher = riskier)", _attr("score")),
            Column("decision", "Decision", _attr("decision")),
            Column("confidence", "Confidence", _attr("confidence")),
            Column(
                "reason_codes",
                "Reason codes",
                lambda r: "; ".join(sorted(reason.code for reason in r.reasons.all())),
            ),
        ),
    ),
    ResourceType.CASES: Resource(
        key=ResourceType.CASES,
        permission="case:read",
        filters=case_views.FILTERS,
        search=case_views.SEARCH,
        ordering=case_views.ORDERING,
        default_ordering=("-opened_at", "id"),
        queryset=_case_queryset,
        columns=(
            Column("reference", "Reference", _attr("reference")),
            Column("customer_id", "Customer ID", lambda r: str(r.customer_id)),
            Column("case_type", "Type", _attr("case_type")),
            Column("priority", "Priority", _attr("priority")),
            Column("status", "Status", _attr("status")),
            Column("source", "Source", _attr("source")),
            Column(
                "assignee_id",
                "Assignee ID",
                lambda r: str(r.current_assignee_id) if r.current_assignee_id else "",
            ),
            Column("opened_at", "Opened at", _attr("opened_at")),
            Column("closed_at", "Closed at", _attr("closed_at")),
        ),
    ),
    ResourceType.CUSTOMERS: Resource(
        key=ResourceType.CUSTOMERS,
        permission="customer:read",
        filters=customers.FILTERS,
        search=customers.SEARCH,
        ordering=customers.ORDERING,
        default_ordering=("username", "id"),
        queryset=_customer_queryset,
        columns=(
            Column("id", "Customer ID", lambda r: str(r.id)),
            Column("display_name", "Name", customers.display_name),
            Column("email_masked", "Email (masked)", lambda r: customers.mask_email(r.email)),
            Column("financial_confidence", "Financial Confidence (0-100)", _attr("fc_score")),
            Column("financial_confidence_band", "Confidence band", _attr("fc_band")),
            Column("profile_completeness", "Profile completeness", _attr("fc_completeness")),
            Column("latest_risk_decision", "Latest risk decision", _attr("latest_decision")),
            Column("latest_risk_score", "Latest risk score (0-1000)", _attr("latest_score")),
            Column("connection_state", "Connection state", _attr("connection_state")),
            Column("consent_state", "Consent state", _attr("consent_state")),
            Column("open_cases", "Open cases", _attr("open_case_count")),
            Column(
                "active_passport_shares",
                "Active passport shares",
                lambda r: getattr(r, "active_passport_shares", ""),
                permission="passport:read",
            ),
        ),
    ),
    ResourceType.NOTIFICATIONS: Resource(
        key=ResourceType.NOTIFICATIONS,
        # Own notifications only; no permission beyond authentication is needed,
        # so an empty string means "any authenticated institution member".
        permission="",
        filters=notification_views.FILTERS,
        ordering=notification_views.ORDERING,
        default_ordering=("-created_at", "id"),
        queryset=_notification_queryset,
        columns=(
            Column("id", "Notification ID", lambda r: str(r.id)),
            Column("category", "Category", lambda r: r.template.category),
            Column("channel", "Channel", _attr("channel")),
            Column("subject", "Subject", _attr("subject")),
            Column("status", "State", _attr("status")),
            Column("read_at", "Read at", _attr("read_at")),
            Column("created_at", "Created at", _attr("created_at")),
        ),
    ),
    ResourceType.SECURITY_EVENTS: Resource(
        key=ResourceType.SECURITY_EVENTS,
        permission="security:read",
        filters=security_views.EVENT_FILTERS,
        ordering=security_views.EVENT_ORDERING,
        default_ordering=("-occurred_at", "id"),
        queryset=_security_queryset,
        columns=(
            Column("id", "Event ID", lambda r: str(r.id)),
            Column(
                "customer_id",
                "Customer ID",
                lambda r: str(r.customer_id) if r.customer_id else "",
            ),
            Column("category", "Category", _attr("category")),
            Column("severity", "Severity", _attr("severity")),
            Column("source", "Source", _attr("source")),
            Column("occurred_at", "Occurred at", _attr("occurred_at")),
        ),
    ),
    ResourceType.AUDIT_EVENTS: Resource(
        key=ResourceType.AUDIT_EVENTS,
        permission="audit:read",
        filters=audit_views.FILTERS,
        ordering=audit_views.ORDERING,
        default_ordering=("-created_at", "id"),
        queryset=_audit_queryset,
        columns=(
            Column("id", "Event ID", lambda r: str(r.id)),
            Column("actor_id", "Actor ID", lambda r: str(r.actor_id) if r.actor_id else ""),
            Column("action", "Action", _attr("action")),
            Column("outcome", "Outcome", _attr("outcome")),
            Column("created_at", "Created at", _attr("created_at")),
        ),
    ),
}


def can_read(resource: Resource, actor: User, institution_id: UUID) -> bool:
    if not resource.permission:
        # Own-data resources still require active membership of the institution.
        return resolve_membership(actor, institution_id) is not None
    return user_has_permission(actor, resource.permission, institution_id)
