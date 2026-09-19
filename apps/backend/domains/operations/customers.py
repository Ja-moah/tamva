"""Institution-scoped customer read model.

A customer is visible to an institution only through a relationship the
institution actually has with them: a connection, a consent, or a financial
profile. The read model is a summary — identifiers are masked and no raw
financial payloads (transactions, balances) are exposed.
"""

from __future__ import annotations

from typing import Any
from uuid import UUID

from django.db.models import Case as SqlCase
from django.db.models import (
    CharField,
    Count,
    DecimalField,
    Exists,
    IntegerField,
    OuterRef,
    Q,
    QuerySet,
    Subquery,
    Value,
    When,
)
from django.db.models.functions import Coalesce
from django.utils import timezone

from domains.case.models import Case
from domains.confidence.models import FinancialConfidenceSnapshot
from domains.connector.models import InstitutionConnection
from domains.consent.models import Consent
from domains.identity.models import User
from domains.passport.models import PassportShare
from domains.profile.models import FinancialProfile
from domains.risk.models import RiskEvent
from packages.common.filtering import FilterSpec, SearchSpec

FILTERS = (
    FilterSpec("financial_confidence_band", "fc_band", description="Policy-defined band name."),
    FilterSpec("profile_completeness_min", "fc_completeness", "decimal", "gte"),
    FilterSpec("profile_completeness_max", "fc_completeness", "decimal", "lte"),
    FilterSpec(
        "connection_state",
        "connection_state",
        "choice",
        choices=("CONNECTED", "NOT_CONNECTED"),
    ),
    FilterSpec(
        "consent_state",
        "consent_state",
        "choice",
        choices=("ACTIVE", "NONE"),
    ),
    FilterSpec(
        "latest_decision", "latest_decision", "choice", choices=tuple(RiskEvent.Decision.values)
    ),
)
SEARCH = SearchSpec(("email", "username", "first_name", "last_name"))
ORDERING = {
    "financial_confidence": "fc_score",
    "profile_completeness": "fc_completeness",
    "latest_risk_score": "latest_score",
    "open_cases": "open_case_count",
    "name": "username",
    "last_login": "last_login",
}


def _count(queryset: QuerySet[Any], group_field: str) -> Coalesce:
    subquery = (
        queryset.order_by().values(group_field).annotate(total=Count("pk")).values("total")[:1]
    )
    return Coalesce(Subquery(subquery, output_field=IntegerField()), Value(0))


def customer_queryset(institution_id: UUID, *, include_passport: bool = False) -> QuerySet[User]:
    now = timezone.now()
    connections = InstitutionConnection.objects.filter(
        institution_id=institution_id, customer_id=OuterRef("pk")
    )
    consents = Consent.objects.filter(institution_id=institution_id, customer_id=OuterRef("pk"))
    profiles = FinancialProfile.objects.filter(
        institution_id=institution_id, customer_id=OuterRef("pk")
    )
    current_confidence = FinancialConfidenceSnapshot.objects.filter(
        institution_id=institution_id, customer_id=OuterRef("pk"), is_current=True
    ).order_by("-evaluated_at")
    latest_risk = RiskEvent.objects.filter(
        institution_id=institution_id, customer_id=OuterRef("pk")
    ).order_by("-evaluated_at")
    cases = Case.objects.filter(institution_id=institution_id, customer_id=OuterRef("pk"))
    active_consents = consents.filter(
        status=Consent.Status.GRANTED, revoked_at__isnull=True, expires_at__gt=now
    )
    active_connections = connections.filter(status=InstitutionConnection.Status.ACTIVE)
    open_cases = cases.exclude(status=Case.Status.RESOLVED)

    queryset = (
        User.objects.filter(identity_type=User.IdentityType.CUSTOMER)
        .filter(Exists(connections) | Exists(consents) | Exists(profiles))
        .annotate(
            fc_score=Subquery(
                current_confidence.values("score")[:1],
                output_field=DecimalField(max_digits=6, decimal_places=2),
            ),
            fc_band=Subquery(current_confidence.values("band")[:1]),
            fc_completeness=Subquery(
                current_confidence.values("completeness")[:1],
                output_field=DecimalField(max_digits=5, decimal_places=4),
            ),
            fc_evaluated_at=Subquery(current_confidence.values("evaluated_at")[:1]),
            latest_decision=Subquery(latest_risk.values("decision")[:1]),
            latest_score=Subquery(
                latest_risk.values("score")[:1],
                output_field=DecimalField(max_digits=9, decimal_places=4),
            ),
            latest_risk_at=Subquery(latest_risk.values("evaluated_at")[:1]),
            active_connection_count=_count(active_connections, "customer_id"),
            case_count=_count(cases, "customer_id"),
            open_case_count=_count(open_cases, "customer_id"),
            active_consent_count=_count(active_consents, "customer_id"),
        )
        .annotate(
            connection_state=_case_state("active_connection_count", "CONNECTED", "NOT_CONNECTED"),
            consent_state=_case_state("active_consent_count", "ACTIVE", "NONE"),
        )
    )
    if include_passport:
        shares = PassportShare.objects.filter(
            snapshot__passport__institution_id=institution_id,
            snapshot__passport__customer_id=OuterRef("pk"),
            status=PassportShare.Status.ACTIVE,
            expires_at__gt=now,
        )
        queryset = queryset.annotate(
            active_passport_shares=_count(shares, "snapshot__passport__customer_id")
        )
    return queryset


def _case_state(count_field: str, positive: str, negative: str) -> SqlCase:
    return SqlCase(
        When(Q(**{f"{count_field}__gt": 0}), then=Value(positive)),
        default=Value(negative),
        output_field=CharField(),
    )


def mask_email(email: str) -> str:
    local, _, domain = email.partition("@")
    if not domain:
        return "***"
    return f"{local[:1]}***@{domain}"


def display_name(user: User) -> str:
    full = f"{user.first_name} {user.last_name}".strip()
    return full or user.username


def summarize(user: Any, *, include_passport: bool = False) -> dict[str, Any]:
    """Serialize an annotated customer row; never includes raw financial data."""
    return {
        "id": str(user.id),
        "display_name": display_name(user),
        "email_masked": mask_email(user.email),
        "status": user.status,
        "last_login": user.last_login,
        "financial_confidence": {
            "score": user.fc_score,
            "band": user.fc_band,
            "completeness": user.fc_completeness,
            "evaluated_at": user.fc_evaluated_at,
        },
        "latest_risk": {
            "decision": user.latest_decision,
            "score": user.latest_score,
            "evaluated_at": user.latest_risk_at,
        },
        "connection_state": user.connection_state,
        "active_connection_count": user.active_connection_count,
        "consent_state": user.consent_state,
        "active_consent_count": user.active_consent_count,
        "case_count": user.case_count,
        "open_case_count": user.open_case_count,
        "active_passport_shares": (
            getattr(user, "active_passport_shares", None) if include_passport else None
        ),
    }
