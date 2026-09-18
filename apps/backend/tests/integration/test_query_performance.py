"""Query-count guards for list endpoints that join across several related
tables. These assert the property that actually matters against N+1 bugs:
listing 5 records takes the same number of queries as listing 1, rather than
pinning an exact magic number that would need retuning on every unrelated
auth/permission-check change.
"""

import pytest
from django.db import connection
from django.test.utils import CaptureQueriesContext

from domains.identity.models import Permission, Role
from domains.partner.models import InstitutionMembership
from tests.integration.test_case import block_risk_event, open_case_from_event_helper, platform_user
from tests.integration.test_risk_api import grant_risk_read


def grant_case_permissions(context, user):
    manage, _ = Permission.objects.get_or_create(
        code="case:manage", defaults={"name": "Manage cases"}
    )
    read, _ = Permission.objects.get_or_create(code="case:read", defaults={"name": "Read cases"})
    role, _ = Role.objects.get_or_create(
        code="CASE_HANDLER_PERF", defaults={"name": "Case handler"}
    )
    role.permissions.add(manage, read)
    membership, _ = InstitutionMembership.objects.get_or_create(
        institution=context[1], user=user, defaults={"status": "ACTIVE"}
    )
    membership.roles.add(role)


@pytest.mark.integration
@pytest.mark.django_db
def test_case_list_query_count_does_not_grow_with_case_count(
    api_client, normalisation_context
) -> None:
    staff = platform_user(normalisation_context, username="case-perf-staff")
    grant_case_permissions(normalisation_context, staff)
    api_client.force_authenticate(user=staff)
    headers = {"HTTP_X_INSTITUTION_ID": str(normalisation_context[1].id)}

    open_case_from_event_helper(
        block_risk_event(normalisation_context, suffix="perf-1"), normalisation_context[1]
    )
    with CaptureQueriesContext(connection) as one_case:
        response = api_client.get("/api/v1/cases/", **headers)
    assert response.status_code == 200

    for i in range(2, 6):
        open_case_from_event_helper(
            block_risk_event(normalisation_context, suffix=f"perf-{i}"), normalisation_context[1]
        )
    with CaptureQueriesContext(connection) as five_cases:
        response = api_client.get("/api/v1/cases/", **headers)
    assert response.status_code == 200
    assert len(response.data["results"]) == 5

    assert len(five_cases) == len(one_case)


@pytest.mark.integration
@pytest.mark.django_db
def test_risk_event_list_query_count_does_not_grow_with_event_count(
    api_client, normalisation_context
) -> None:
    from domains.risk.services import create_reference_policy_version, evaluate_risk
    from tests.integration.test_risk import feature_run, rule_run_for

    staff = platform_user(normalisation_context, username="risk-perf-staff")
    grant_risk_read(normalisation_context, staff)
    api_client.force_authenticate(user=staff)
    headers = {"HTTP_X_INSTITUTION_ID": str(normalisation_context[1].id)}

    def make_event(suffix: str) -> None:
        run = feature_run(normalisation_context, source_event_id=f"perf-risk-{suffix}")
        rules = rule_run_for(
            run, severity="INFO", reason_code="INFO_ONLY", matches=False, version=suffix
        )
        policy = create_reference_policy_version()
        evaluate_risk(
            feature_run=run,
            policy_version=policy,
            institution=normalisation_context[1],
            rule_run=rules,
        )

    make_event("1")
    with CaptureQueriesContext(connection) as one_event:
        response = api_client.get("/api/v1/risk/events/", **headers)
    assert response.status_code == 200

    for i in range(2, 6):
        make_event(str(i))
    with CaptureQueriesContext(connection) as five_events:
        response = api_client.get("/api/v1/risk/events/", **headers)
    assert response.status_code == 200
    assert len(response.data["results"]) == 5

    assert len(five_events) == len(one_event)
