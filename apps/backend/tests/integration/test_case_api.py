import pytest

from domains.identity.models import Permission, Role
from domains.partner.models import InstitutionMembership
from tests.integration.test_case import block_risk_event, open_case_from_event_helper, platform_user


def grant_case_permissions(context, user):
    manage, _ = Permission.objects.get_or_create(
        code="case:manage", defaults={"name": "Manage cases"}
    )
    read, _ = Permission.objects.get_or_create(code="case:read", defaults={"name": "Read cases"})
    role, _ = Role.objects.get_or_create(code="CASE_HANDLER", defaults={"name": "Case handler"})
    role.permissions.add(manage, read)
    membership, _ = InstitutionMembership.objects.get_or_create(
        institution=context[1], user=user, defaults={"status": "ACTIVE"}
    )
    membership.roles.add(role)


@pytest.mark.integration
@pytest.mark.django_db
def test_unauthenticated_request_is_rejected(api_client) -> None:
    response = api_client.get("/api/v1/cases/")
    assert response.status_code in {401, 403}


@pytest.mark.integration
@pytest.mark.django_db
def test_staff_can_list_retrieve_and_transition_case(api_client, normalisation_context) -> None:
    risk_event = block_risk_event(normalisation_context)
    case = open_case_from_event_helper(risk_event, normalisation_context[1])
    staff = platform_user(normalisation_context, username="case-api-handler")
    grant_case_permissions(normalisation_context, staff)
    api_client.force_authenticate(user=staff)
    headers = {"HTTP_X_INSTITUTION_ID": str(normalisation_context[1].id)}

    list_response = api_client.get("/api/v1/cases/", **headers)
    assert list_response.status_code == 200
    assert list_response.data["results"][0]["id"] == str(case.id)

    transition_response = api_client.post(
        f"/api/v1/cases/{case.id}/transition/", {"new_status": "TRIAGED"}, format="json", **headers
    )
    assert transition_response.status_code == 200
    assert transition_response.data["data"]["status"] == "TRIAGED"

    invalid_transition = api_client.post(
        f"/api/v1/cases/{case.id}/transition/",
        {"new_status": "RESOLVED"},
        format="json",
        **headers,
    )
    assert invalid_transition.status_code == 400

    note_response = api_client.post(
        f"/api/v1/cases/{case.id}/notes/", {"body": "Reviewed."}, format="json", **headers
    )
    assert note_response.status_code == 201


@pytest.mark.integration
@pytest.mark.django_db
def test_case_cannot_be_read_via_wrong_institution_header(
    api_client, normalisation_context
) -> None:
    risk_event = block_risk_event(normalisation_context)
    case = open_case_from_event_helper(risk_event, normalisation_context[1])
    other_institution = normalisation_context[2]
    staff = platform_user(
        normalisation_context, username="case-cross-tenant", institution=other_institution
    )
    grant_case_permissions((None, other_institution), staff)
    api_client.force_authenticate(user=staff)

    response = api_client.get(
        f"/api/v1/cases/{case.id}/", HTTP_X_INSTITUTION_ID=str(other_institution.id)
    )
    assert response.status_code == 404
