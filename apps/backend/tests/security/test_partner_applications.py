import json
from datetime import timedelta

import pytest
from django.core.exceptions import PermissionDenied, ValidationError
from django.db import DatabaseError, connection, transaction
from django.utils import timezone

from domains.audit.models import AuditEvent
from domains.identity.models import Permission, Role, User
from domains.partner.models import (
    ApiCredential,
    CredentialScope,
    Institution,
    InstitutionMembership,
    PartnerEnvironment,
)
from domains.partner.services import (
    authenticate_api_credential,
    create_partner_application,
    create_partner_environment,
    create_webhook_endpoint,
    issue_api_credential,
    revoke_api_credential,
    rotate_api_credential,
)


@pytest.fixture
def partner_application_context():
    manager = User.objects.create_user(
        username="integration-manager",
        email="integration-manager@example.test",
        password="correct horse battery staple",
        identity_type=User.IdentityType.PARTNER_USER,
    )
    viewer = User.objects.create_user(
        username="integration-viewer",
        email="integration-viewer@example.test",
        password="correct horse battery staple",
        identity_type=User.IdentityType.PARTNER_USER,
    )
    institution = Institution.objects.create(name="Integration Bank", slug="integration-bank")
    other_institution = Institution.objects.create(name="Other Bank", slug="other-integration-bank")
    permission = Permission.objects.create(
        code="partner:manage", name="Manage partner applications"
    )
    role = Role.objects.create(code="INTEGRATION_MANAGER", name="Integration manager")
    role.permissions.add(permission)
    for tenant in (institution, other_institution):
        membership = InstitutionMembership.objects.create(
            institution=tenant, user=manager, status="ACTIVE"
        )
        membership.roles.add(role)
    InstitutionMembership.objects.create(institution=institution, user=viewer, status="ACTIVE")
    scope = CredentialScope.objects.create(code="transactions:read", name="Read transactions")
    other_scope = CredentialScope.objects.create(code="accounts:read", name="Read accounts")
    return manager, viewer, institution, other_institution, scope, other_scope


def build_application(context):
    manager, _, institution, _, _, _ = context
    application = create_partner_application(
        institution=institution,
        actor=manager,
        name="Core Banking Integration",
        slug="core-banking",
    )
    sandbox = create_partner_environment(
        application_id=application.id,
        institution=institution,
        actor=manager,
        kind=PartnerEnvironment.Kind.SANDBOX,
    )
    return application, sandbox


@pytest.mark.django_db
def test_application_owns_tenant_service_account_and_is_audited(partner_application_context):
    manager, _, institution, _, _, _ = partner_application_context

    application, _ = build_application(partner_application_context)

    assert application.institution == institution
    assert application.service_account.institution == institution
    assert application.service_account.credential_metadata == {"managed_by": "partner_application"}
    assert AuditEvent.objects.filter(
        actor=manager,
        institution=institution,
        action="PARTNER_APPLICATION_CREATED",
    ).exists()


@pytest.mark.django_db
def test_actor_without_permission_cannot_manage_applications(partner_application_context):
    _, viewer, institution, _, _, _ = partner_application_context

    with pytest.raises(PermissionDenied, match="not allowed"):
        create_partner_application(
            institution=institution,
            actor=viewer,
            name="Denied",
            slug="denied",
        )


@pytest.mark.django_db
def test_issued_secret_is_returned_once_and_never_stored_plaintext(
    partner_application_context,
):
    manager, _, institution, _, scope, _ = partner_application_context
    _, environment = build_application(partner_application_context)

    issued = issue_api_credential(
        environment_id=environment.id,
        institution=institution,
        actor=manager,
        name="Sandbox credential",
        scopes=[scope],
    )

    assert issued.secret.startswith("tamva_secret_")
    assert issued.credential.secret_digest != issued.secret
    assert len(issued.credential.secret_digest) == 64
    assert "secret" not in {field.name for field in ApiCredential._meta.fields}
    audit_payload = json.dumps(list(AuditEvent.objects.values_list("metadata", flat=True)))
    assert issued.secret not in audit_payload
    assert issued.credential.secret_digest not in audit_payload


@pytest.mark.django_db
def test_scope_and_environment_are_enforced(partner_application_context):
    manager, _, institution, _, scope, other_scope = partner_application_context
    application, sandbox = build_application(partner_application_context)
    staging = create_partner_environment(
        application_id=application.id,
        institution=institution,
        actor=manager,
        kind=PartnerEnvironment.Kind.STAGING,
    )
    issued = issue_api_credential(
        environment_id=sandbox.id,
        institution=institution,
        actor=manager,
        name="Scoped credential",
        scopes=[scope],
    )

    assert (
        authenticate_api_credential(
            client_id=issued.credential.client_id,
            secret=issued.secret,
            required_scope=scope.code,
            expected_environment_id=sandbox.id,
        )
        == issued.credential
    )
    assert (
        authenticate_api_credential(
            client_id=issued.credential.client_id,
            secret=issued.secret,
            required_scope=other_scope.code,
        )
        is None
    )
    assert (
        authenticate_api_credential(
            client_id=issued.credential.client_id,
            secret=issued.secret,
            expected_environment_id=staging.id,
        )
        is None
    )


@pytest.mark.django_db
def test_wrong_tenant_cannot_issue_or_revoke_credentials(partner_application_context):
    manager, _, institution, other_institution, scope, _ = partner_application_context
    _, environment = build_application(partner_application_context)
    issued = issue_api_credential(
        environment_id=environment.id,
        institution=institution,
        actor=manager,
        name="Tenant credential",
        scopes=[scope],
    )

    with pytest.raises(PermissionDenied, match="active institution"):
        issue_api_credential(
            environment_id=environment.id,
            institution=other_institution,
            actor=manager,
            name="Cross-tenant credential",
            scopes=[scope],
        )
    with pytest.raises(PermissionDenied, match="active institution"):
        revoke_api_credential(
            credential_id=issued.credential.id,
            institution=other_institution,
            actor=manager,
        )


@pytest.mark.django_db
def test_rotation_revokes_old_secret_and_returns_new_secret(partner_application_context):
    manager, _, institution, _, scope, _ = partner_application_context
    _, environment = build_application(partner_application_context)
    issued = issue_api_credential(
        environment_id=environment.id,
        institution=institution,
        actor=manager,
        name="Rotating credential",
        scopes=[scope],
    )

    rotated = rotate_api_credential(
        credential_id=issued.credential.id,
        institution=institution,
        actor=manager,
    )

    assert rotated.secret != issued.secret
    assert rotated.credential.rotated_from == issued.credential
    assert (
        authenticate_api_credential(client_id=issued.credential.client_id, secret=issued.secret)
        is None
    )
    assert (
        authenticate_api_credential(
            client_id=rotated.credential.client_id,
            secret=rotated.secret,
            required_scope=scope.code,
        )
        == rotated.credential
    )
    assert AuditEvent.objects.filter(
        institution=institution, action="API_CREDENTIAL_ROTATED"
    ).exists()


@pytest.mark.django_db
def test_revoked_and_expired_credentials_are_denied(partner_application_context):
    manager, _, institution, _, scope, _ = partner_application_context
    _, environment = build_application(partner_application_context)
    expires_at = timezone.now() + timedelta(hours=1)
    issued = issue_api_credential(
        environment_id=environment.id,
        institution=institution,
        actor=manager,
        name="Lifecycle credential",
        scopes=[scope],
        expires_at=expires_at,
    )

    assert (
        authenticate_api_credential(
            client_id=issued.credential.client_id,
            secret=issued.secret,
            checked_at=expires_at + timedelta(seconds=1),
        )
        is None
    )
    revoke_api_credential(
        credential_id=issued.credential.id,
        institution=institution,
        actor=manager,
    )
    assert (
        authenticate_api_credential(client_id=issued.credential.client_id, secret=issued.secret)
        is None
    )


@pytest.mark.django_db
def test_credential_secret_and_client_id_cannot_change_in_place(partner_application_context):
    manager, _, institution, _, scope, _ = partner_application_context
    _, environment = build_application(partner_application_context)
    issued = issue_api_credential(
        environment_id=environment.id,
        institution=institution,
        actor=manager,
        name="Immutable credential",
        scopes=[scope],
    )

    issued.credential.secret_digest = "0" * 64
    with pytest.raises(ValidationError, match="cannot be replaced"):
        issued.credential.save()
    with pytest.raises(DatabaseError, match="credential identity is immutable"):
        with transaction.atomic():
            with connection.cursor() as cursor:
                cursor.execute(
                    "UPDATE partner_apicredential SET secret_digest = %s WHERE id = %s",
                    ["0" * 64, issued.credential.id],
                )


@pytest.mark.django_db
def test_production_webhooks_require_https_and_are_tenant_scoped(
    partner_application_context,
):
    manager, _, institution, other_institution, _, _ = partner_application_context
    application, _ = build_application(partner_application_context)
    production = create_partner_environment(
        application_id=application.id,
        institution=institution,
        actor=manager,
        kind=PartnerEnvironment.Kind.PRODUCTION,
    )

    with pytest.raises(ValidationError, match="HTTPS"):
        create_webhook_endpoint(
            environment_id=production.id,
            institution=institution,
            actor=manager,
            url="http://partner.example.test/events",
            event_types=["consent.revoked"],
        )
    with pytest.raises(PermissionDenied, match="active institution"):
        create_webhook_endpoint(
            environment_id=production.id,
            institution=other_institution,
            actor=manager,
            url="https://partner.example.test/events",
            event_types=["consent.revoked"],
        )
    endpoint = create_webhook_endpoint(
        environment_id=production.id,
        institution=institution,
        actor=manager,
        url="https://partner.example.test/events",
        event_types=["consent.revoked", "consent.revoked"],
    )
    assert endpoint.event_types == ["consent.revoked"]
    assert AuditEvent.objects.filter(
        institution=institution, action="WEBHOOK_ENDPOINT_CREATED"
    ).exists()


@pytest.mark.security
@pytest.mark.django_db
def test_sandbox_webhooks_may_not_target_internal_hosts(partner_application_context):
    manager, _, institution, _, _, _ = partner_application_context
    _, sandbox = build_application(partner_application_context)

    with pytest.raises(ValidationError, match="publicly reachable"):
        create_webhook_endpoint(
            environment_id=sandbox.id,
            institution=institution,
            actor=manager,
            url="http://169.254.169.254/latest/meta-data/",
            event_types=["consent.revoked"],
        )
