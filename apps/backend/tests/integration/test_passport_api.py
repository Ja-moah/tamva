from datetime import timedelta

import pytest
from django.utils import timezone

from domains.identity.models import Permission, Role
from domains.partner.models import InstitutionMembership
from tests.integration.test_case import platform_user
from tests.integration.test_passport import build_chain, grant_passport_consent


def grant_passport_permissions(context, user, *, institution=None):
    manage, _ = Permission.objects.get_or_create(
        code="passport:manage", defaults={"name": "Manage passports"}
    )
    read, _ = Permission.objects.get_or_create(
        code="passport:read", defaults={"name": "Read passports"}
    )
    role, _ = Role.objects.get_or_create(
        code="PASSPORT_OPERATOR", defaults={"name": "Passport operator"}
    )
    role.permissions.add(manage, read)
    membership, _ = InstitutionMembership.objects.get_or_create(
        institution=institution or context[1], user=user, defaults={"status": "ACTIVE"}
    )
    membership.roles.add(role)


@pytest.mark.integration
@pytest.mark.django_db
def test_unauthenticated_request_is_rejected(api_client, normalisation_context) -> None:
    response = api_client.get(
        f"/api/v1/passport/customers/{normalisation_context[0].id}/",
        HTTP_X_INSTITUTION_ID=str(normalisation_context[1].id),
    )
    assert response.status_code in {401, 403}


@pytest.mark.integration
@pytest.mark.django_db
def test_staff_can_generate_retrieve_share_and_recipient_can_access(
    api_client, normalisation_context
) -> None:
    build_chain(normalisation_context)
    staff = platform_user(normalisation_context, username="passport-operator")
    grant_passport_permissions(normalisation_context, staff)
    api_client.force_authenticate(user=staff)
    headers = {"HTTP_X_INSTITUTION_ID": str(normalisation_context[1].id)}

    generate_response = api_client.post(
        f"/api/v1/passport/customers/{normalisation_context[0].id}/", **headers
    )
    assert generate_response.status_code == 201
    assert "FINANCIAL_SUMMARY" in generate_response.data["data"]["sections"]

    retrieve_response = api_client.get(
        f"/api/v1/passport/customers/{normalisation_context[0].id}/", **headers
    )
    assert retrieve_response.status_code == 200

    recipient_institution = normalisation_context[2]
    grant_passport_consent(normalisation_context, recipient_institution=recipient_institution)

    share_response = api_client.post(
        "/api/v1/passport/shares/",
        {
            "customer_id": str(normalisation_context[0].id),
            "recipient_institution_id": str(recipient_institution.id),
            "purpose_code": "passport_sharing",
            "allowed_sections": ["FINANCIAL_SUMMARY"],
            "expires_at": (timezone.now() + timedelta(days=7)).isoformat(),
        },
        format="json",
        **headers,
    )
    assert share_response.status_code == 201
    token = share_response.data["data"]["token"]

    recipient_staff = platform_user(
        normalisation_context, username="recipient-staff", institution=recipient_institution
    )
    api_client.force_authenticate(user=recipient_staff)
    access_response = api_client.post(
        "/api/v1/passport/shares/access/",
        {"token": token},
        format="json",
        HTTP_X_INSTITUTION_ID=str(recipient_institution.id),
    )
    assert access_response.status_code == 200
    assert "FINANCIAL_SUMMARY" in access_response.data["data"]


@pytest.mark.integration
@pytest.mark.django_db
def test_non_member_cannot_access_share_even_with_valid_token(
    api_client, normalisation_context
) -> None:
    build_chain(normalisation_context)
    staff = platform_user(normalisation_context, username="passport-operator-2")
    grant_passport_permissions(normalisation_context, staff)
    api_client.force_authenticate(user=staff)
    headers = {"HTTP_X_INSTITUTION_ID": str(normalisation_context[1].id)}
    api_client.post(f"/api/v1/passport/customers/{normalisation_context[0].id}/", **headers)

    recipient_institution = normalisation_context[2]
    grant_passport_consent(normalisation_context, recipient_institution=recipient_institution)
    share_response = api_client.post(
        "/api/v1/passport/shares/",
        {
            "customer_id": str(normalisation_context[0].id),
            "recipient_institution_id": str(recipient_institution.id),
            "purpose_code": "passport_sharing",
            "allowed_sections": ["FINANCIAL_SUMMARY"],
            "expires_at": (timezone.now() + timedelta(days=7)).isoformat(),
        },
        format="json",
        **headers,
    )
    token = share_response.data["data"]["token"]

    from domains.identity.models import User

    non_member = User.objects.create_user(
        username="not-a-member",
        email="not-a-member@example.test",
        password="correct horse battery staple",
        identity_type=User.IdentityType.PLATFORM_USER,
    )
    api_client.force_authenticate(user=non_member)

    response = api_client.post(
        "/api/v1/passport/shares/access/",
        {"token": token},
        format="json",
        HTTP_X_INSTITUTION_ID=str(recipient_institution.id),
    )
    assert response.status_code == 403
