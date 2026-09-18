import pytest

from domains.identity.models import Permission, Role
from domains.partner.models import InstitutionMembership
from domains.risk.services import create_reference_policy_version, evaluate_risk
from tests.integration.test_case import platform_user
from tests.integration.test_risk import feature_run, rule_run_for


def grant_risk_read(context, user):
    permission, _ = Permission.objects.get_or_create(
        code="risk:read", defaults={"name": "Read risk"}
    )
    role, _ = Role.objects.get_or_create(code="RISK_READER", defaults={"name": "Risk reader"})
    role.permissions.add(permission)
    membership, _ = InstitutionMembership.objects.get_or_create(
        institution=context[1], user=user, defaults={"status": "ACTIVE"}
    )
    membership.roles.add(role)


@pytest.mark.integration
@pytest.mark.django_db
def test_unauthenticated_request_is_rejected(api_client) -> None:
    response = api_client.get("/api/v1/risk/events/")
    assert response.status_code in {401, 403}


@pytest.mark.integration
@pytest.mark.django_db
def test_staff_without_permission_is_denied(api_client, normalisation_context) -> None:
    staff = platform_user(normalisation_context, username="no-perm-staff")
    api_client.force_authenticate(user=staff)

    response = api_client.get(
        "/api/v1/risk/events/", HTTP_X_INSTITUTION_ID=str(normalisation_context[1].id)
    )
    assert response.status_code == 403


@pytest.mark.integration
@pytest.mark.django_db
def test_staff_with_permission_can_list_and_retrieve_risk_events(
    api_client, normalisation_context
) -> None:
    run = feature_run(normalisation_context)
    rules = rule_run_for(run, severity="CRITICAL", reason_code="CRITICAL_SIGNAL")
    policy = create_reference_policy_version()
    risk_run = evaluate_risk(
        feature_run=run, policy_version=policy, institution=normalisation_context[1], rule_run=rules
    )
    staff = platform_user(normalisation_context, username="risk-analyst")
    grant_risk_read(normalisation_context, staff)
    api_client.force_authenticate(user=staff)

    list_response = api_client.get(
        "/api/v1/risk/events/", HTTP_X_INSTITUTION_ID=str(normalisation_context[1].id)
    )
    assert list_response.status_code == 200
    assert list_response.data["results"][0]["id"] == str(risk_run.event.id)

    detail_response = api_client.get(
        f"/api/v1/risk/events/{risk_run.event.id}/",
        HTTP_X_INSTITUTION_ID=str(normalisation_context[1].id),
    )
    assert detail_response.status_code == 200
    assert detail_response.data["reasons"][0]["code"] == "CRITICAL_SIGNAL"


@pytest.mark.integration
@pytest.mark.django_db
def test_cannot_read_risk_event_via_wrong_institution_header(
    api_client, normalisation_context
) -> None:
    run = feature_run(normalisation_context)
    rules = rule_run_for(run, severity="CRITICAL", reason_code="CRITICAL_SIGNAL")
    policy = create_reference_policy_version()
    risk_run = evaluate_risk(
        feature_run=run, policy_version=policy, institution=normalisation_context[1], rule_run=rules
    )
    other_institution = normalisation_context[2]
    staff = platform_user(
        normalisation_context, username="cross-tenant-analyst", institution=other_institution
    )
    grant_risk_read((None, other_institution), staff)
    api_client.force_authenticate(user=staff)

    response = api_client.get(
        f"/api/v1/risk/events/{risk_run.event.id}/",
        HTTP_X_INSTITUTION_ID=str(other_institution.id),
    )
    assert response.status_code == 404
