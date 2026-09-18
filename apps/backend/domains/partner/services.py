from __future__ import annotations

import hashlib
import hmac
import secrets
from collections.abc import Iterable
from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from django.core.exceptions import PermissionDenied, ValidationError
from django.db import transaction
from django.utils import timezone

from domains.audit.models import AuditEvent
from domains.identity.models import ServiceAccount, User
from domains.identity.services import user_has_permission
from domains.partner.models import (
    ApiCredential,
    CredentialScope,
    Institution,
    PartnerApplication,
    PartnerEnvironment,
    WebhookEndpoint,
)


@dataclass(frozen=True, slots=True)
class IssuedApiCredential:
    credential: ApiCredential
    secret: str


def _require_partner_manager(actor: User, institution: Institution) -> None:
    if not institution.is_active or not user_has_permission(
        actor, "partner:manage", institution.id
    ):
        raise PermissionDenied(
            "Partner application management is not allowed for this institution."
        )


def _secret_digest(secret: str) -> str:
    return hashlib.sha256(secret.encode("utf-8")).hexdigest()


def _new_client_id(environment: PartnerEnvironment) -> str:
    return f"tamva_{environment.kind.lower()}_{secrets.token_urlsafe(18)}"


def _new_secret() -> str:
    return f"tamva_secret_{secrets.token_urlsafe(32)}"


@transaction.atomic
def create_partner_application(
    *, institution: Institution, actor: User, name: str, slug: str, description: str = ""
) -> PartnerApplication:
    _require_partner_manager(actor, institution)
    service_account = ServiceAccount.objects.create(
        name=f"{name.strip()} integration",
        institution=institution,
        status="ACTIVE",
        scopes=[],
        credential_metadata={"managed_by": "partner_application"},
    )
    application = PartnerApplication.objects.create(
        institution=institution,
        service_account=service_account,
        name=name.strip(),
        slug=slug,
        description=description.strip(),
    )
    AuditEvent.objects.create(
        actor=actor,
        institution=institution,
        action="PARTNER_APPLICATION_CREATED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={
            "application_id": str(application.id),
            "service_account_id": str(service_account.id),
        },
    )
    return application


@transaction.atomic
def create_partner_environment(
    *,
    application_id: UUID,
    institution: Institution,
    actor: User,
    kind: PartnerEnvironment.Kind,
) -> PartnerEnvironment:
    _require_partner_manager(actor, institution)
    application = PartnerApplication.objects.filter(
        id=application_id, institution=institution, status=PartnerApplication.Status.ACTIVE
    ).first()
    if application is None:
        raise PermissionDenied("Partner application does not belong to the active institution.")
    environment = PartnerEnvironment.objects.create(application=application, kind=kind)
    AuditEvent.objects.create(
        actor=actor,
        institution=institution,
        action="PARTNER_ENVIRONMENT_CREATED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={
            "application_id": str(application.id),
            "environment_id": str(environment.id),
            "kind": environment.kind,
        },
    )
    return environment


def _validate_credential_request(
    *,
    environment: PartnerEnvironment,
    scopes: Iterable[CredentialScope],
    expires_at: datetime | None,
) -> tuple[CredentialScope, ...]:
    selected_scopes = tuple({scope.id: scope for scope in scopes}.values())
    if (
        environment.status != PartnerEnvironment.Status.ACTIVE
        or environment.application.status != PartnerApplication.Status.ACTIVE
        or not environment.application.institution.is_active
    ):
        raise ValidationError("API credentials require an active application environment.")
    if not selected_scopes or any(not scope.is_active for scope in selected_scopes):
        raise ValidationError("API credentials require at least one active scope.")
    if expires_at is not None and expires_at <= timezone.now():
        raise ValidationError("Credential expiry must be in the future.")
    return selected_scopes


def _issue_credential(
    *,
    environment: PartnerEnvironment,
    actor: User,
    name: str,
    scopes: Iterable[CredentialScope],
    expires_at: datetime | None,
    rotated_from: ApiCredential | None = None,
) -> IssuedApiCredential:
    selected_scopes = _validate_credential_request(
        environment=environment, scopes=scopes, expires_at=expires_at
    )
    secret = _new_secret()
    credential = ApiCredential.objects.create(
        environment=environment,
        name=name.strip(),
        client_id=_new_client_id(environment),
        secret_digest=_secret_digest(secret),
        expires_at=expires_at,
        rotated_from=rotated_from,
        created_by=actor,
    )
    credential.scopes.set(selected_scopes)
    return IssuedApiCredential(credential=credential, secret=secret)


@transaction.atomic
def issue_api_credential(
    *,
    environment_id: UUID,
    institution: Institution,
    actor: User,
    name: str,
    scopes: Iterable[CredentialScope],
    expires_at: datetime | None = None,
) -> IssuedApiCredential:
    _require_partner_manager(actor, institution)
    environment = (
        PartnerEnvironment.objects.select_related("application__institution")
        .filter(id=environment_id, application__institution=institution)
        .first()
    )
    if environment is None:
        raise PermissionDenied("Partner environment does not belong to the active institution.")
    issued = _issue_credential(
        environment=environment,
        actor=actor,
        name=name,
        scopes=scopes,
        expires_at=expires_at,
    )
    AuditEvent.objects.create(
        actor=actor,
        institution=institution,
        action="API_CREDENTIAL_ISSUED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={
            "application_id": str(environment.application_id),
            "environment_id": str(environment.id),
            "credential_id": str(issued.credential.id),
            "client_id": issued.credential.client_id,
            "scopes": sorted(scope.code for scope in issued.credential.scopes.all()),
        },
    )
    return issued


def authenticate_api_credential(
    *,
    client_id: str,
    secret: str,
    required_scope: str | None = None,
    expected_environment_id: UUID | None = None,
    checked_at: datetime | None = None,
) -> ApiCredential | None:
    effective_at = checked_at or timezone.now()
    credential = (
        ApiCredential.objects.select_related("environment__application__institution")
        .prefetch_related("scopes")
        .filter(client_id=client_id)
        .first()
    )
    if credential is None or not hmac.compare_digest(
        credential.secret_digest, _secret_digest(secret)
    ):
        return None
    environment = credential.environment
    application = environment.application
    if (
        credential.status != ApiCredential.Status.ACTIVE
        or credential.revoked_at is not None
        or (credential.expires_at is not None and credential.expires_at <= effective_at)
        or environment.status != PartnerEnvironment.Status.ACTIVE
        or application.status != PartnerApplication.Status.ACTIVE
        or not application.institution.is_active
        or (expected_environment_id is not None and environment.id != expected_environment_id)
    ):
        return None
    active_scopes = {scope.code for scope in credential.scopes.all() if scope.is_active}
    if required_scope is not None and required_scope not in active_scopes:
        return None
    ApiCredential.objects.filter(id=credential.id).update(last_used_at=effective_at)
    credential.last_used_at = effective_at
    return credential


@transaction.atomic
def rotate_api_credential(
    *, credential_id: UUID, institution: Institution, actor: User
) -> IssuedApiCredential:
    _require_partner_manager(actor, institution)
    credential = (
        ApiCredential.objects.select_for_update()
        .select_related("environment__application__institution")
        .prefetch_related("scopes")
        .filter(id=credential_id, environment__application__institution=institution)
        .first()
    )
    if credential is None:
        raise PermissionDenied("API credential does not belong to the active institution.")
    if credential.status != ApiCredential.Status.ACTIVE:
        raise ValidationError("Only active credentials can be rotated.")

    issued = _issue_credential(
        environment=credential.environment,
        actor=actor,
        name=credential.name,
        scopes=credential.scopes.all(),
        expires_at=credential.expires_at,
        rotated_from=credential,
    )
    revoked_at = timezone.now()
    credential.status = ApiCredential.Status.REVOKED
    credential.revoked_at = revoked_at
    credential.save(update_fields=["status", "revoked_at", "updated_at"])
    AuditEvent.objects.create(
        actor=actor,
        institution=institution,
        action="API_CREDENTIAL_ROTATED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={
            "previous_credential_id": str(credential.id),
            "credential_id": str(issued.credential.id),
            "environment_id": str(credential.environment_id),
        },
    )
    return issued


@transaction.atomic
def revoke_api_credential(
    *, credential_id: UUID, institution: Institution, actor: User
) -> ApiCredential:
    _require_partner_manager(actor, institution)
    credential = (
        ApiCredential.objects.select_for_update()
        .filter(id=credential_id, environment__application__institution=institution)
        .first()
    )
    if credential is None:
        raise PermissionDenied("API credential does not belong to the active institution.")
    if credential.status == ApiCredential.Status.REVOKED:
        return credential
    credential.status = ApiCredential.Status.REVOKED
    credential.revoked_at = timezone.now()
    credential.save(update_fields=["status", "revoked_at", "updated_at"])
    AuditEvent.objects.create(
        actor=actor,
        institution=institution,
        action="API_CREDENTIAL_REVOKED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={"credential_id": str(credential.id)},
    )
    return credential


@transaction.atomic
def create_webhook_endpoint(
    *,
    environment_id: UUID,
    institution: Institution,
    actor: User,
    url: str,
    event_types: Iterable[str],
) -> WebhookEndpoint:
    _require_partner_manager(actor, institution)
    environment = (
        PartnerEnvironment.objects.select_related("application__institution")
        .filter(id=environment_id, application__institution=institution)
        .first()
    )
    if environment is None:
        raise PermissionDenied("Partner environment does not belong to the active institution.")
    selected_events = sorted({event.strip() for event in event_types if event.strip()})
    endpoint = WebhookEndpoint.objects.create(
        environment=environment,
        url=url,
        event_types=selected_events,
    )
    AuditEvent.objects.create(
        actor=actor,
        institution=institution,
        action="WEBHOOK_ENDPOINT_CREATED",
        outcome=AuditEvent.Outcome.SUCCESS,
        metadata={
            "application_id": str(environment.application_id),
            "environment_id": str(environment.id),
            "webhook_endpoint_id": str(endpoint.id),
            "event_types": selected_events,
        },
    )
    return endpoint
