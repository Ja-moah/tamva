from dataclasses import dataclass
from uuid import UUID

from django.core.exceptions import PermissionDenied

from domains.identity.models import User
from domains.partner.models import Institution, InstitutionMembership


@dataclass(frozen=True, slots=True)
class ActorContext:
    user: User
    institution: Institution | None
    memberships: tuple[InstitutionMembership, ...]
    roles: tuple[str, ...]
    permissions: tuple[str, ...]


def resolve_membership(
    user: User, institution_id: UUID | None = None
) -> InstitutionMembership | None:
    memberships = InstitutionMembership.objects.filter(
        user=user, status="ACTIVE", institution__is_active=True
    ).select_related("institution")
    if institution_id is not None:
        return memberships.filter(institution_id=institution_id).first()
    if memberships.count() == 1:
        return memberships.first()
    return None


def build_actor_context(user: User, institution_id: UUID | None = None) -> ActorContext:
    memberships = tuple(
        InstitutionMembership.objects.filter(
            user=user, status="ACTIVE", institution__is_active=True
        )
        .select_related("institution")
        .prefetch_related("roles__permissions")
    )
    selected = resolve_membership(user, institution_id)
    if institution_id is not None and selected is None:
        raise PermissionDenied("The user is not an active member of this institution.")

    selected_memberships = (selected,) if selected else memberships
    roles = {role.code for membership in selected_memberships for role in membership.roles.all()}
    permissions = {
        permission.code
        for membership in selected_memberships
        for role in membership.roles.all()
        for permission in role.permissions.all()
    }
    institution = selected.institution if selected else None
    return ActorContext(
        user=user,
        institution=institution,
        memberships=memberships,
        roles=tuple(sorted(roles)),
        permissions=tuple(sorted(permissions)),
    )


def user_has_permission(
    user: User, permission_code: str, institution_id: UUID | None = None
) -> bool:
    if not user.is_authenticated or not user.is_active or user.status != "ACTIVE":
        return False
    if user.is_superuser:
        return True
    context = build_actor_context(user, institution_id)
    return permission_code in context.permissions
