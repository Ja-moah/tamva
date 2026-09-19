"""Canonical permission and default-role catalog.

The backend is the only authority on who may do what. Clients render navigation
from the permissions `/me/` returns, but every endpoint re-checks them. Roles
listed here are managed in code: `sync_access_catalog` makes their permission
sets match this file exactly, so a permission removed here is revoked on the
next sync.
"""

from __future__ import annotations

from dataclasses import dataclass

from django.db import transaction

from domains.identity.models import Permission, Role


@dataclass(frozen=True, slots=True)
class PermissionDef:
    code: str
    name: str
    description: str


PERMISSIONS: tuple[PermissionDef, ...] = (
    PermissionDef("overview:read", "View overview", "Institution summary metrics."),
    PermissionDef("analytics:read", "View analytics", "Aggregate risk and case analytics."),
    PermissionDef("risk:read", "View risk events", "Risk decisions and their reason codes."),
    PermissionDef("case:read", "View cases", "Cases, notes, actions and history."),
    PermissionDef("case:manage", "Manage cases", "Assign, triage, act on and resolve cases."),
    PermissionDef("customer:read", "View customers", "Consent-scoped customer summaries."),
    PermissionDef("passport:read", "View passports", "Financial Passport views and shares."),
    PermissionDef("passport:manage", "Manage passports", "Create and revoke passport shares."),
    PermissionDef("security:read", "View security events", "Security events and observations."),
    PermissionDef("security:observe", "Submit security observations", "Service-level intake."),
    PermissionDef("network:read", "View trust network", "Institution-scoped graph."),
    PermissionDef("audit:read", "View audit trail", "Institution audit events."),
    PermissionDef("team:read", "View team", "Members, roles and permissions."),
    PermissionDef("team:manage", "Manage team", "Change member roles and status."),
    PermissionDef("institution:manage", "Manage institution", "Locale and institution settings."),
    PermissionDef("partner:read", "View integrations", "Applications, credentials, webhooks."),
    PermissionDef("partner:manage", "Manage integrations", "Issue, rotate and revoke credentials."),
    PermissionDef("export:manage", "Create exports", "Request and download data exports."),
)

_ALL = tuple(p.code for p in PERMISSIONS)
# Service-level permissions are not granted to human roles.
_HUMAN = tuple(c for c in _ALL if c != "security:observe")

DEFAULT_ROLES: dict[str, tuple[str, tuple[str, ...]]] = {
    "INSTITUTION_ADMIN": ("Institution administrator", _HUMAN),
    "RISK_ANALYST": (
        "Risk analyst",
        (
            "overview:read",
            "analytics:read",
            "risk:read",
            "case:read",
            "customer:read",
            "network:read",
            "export:manage",
        ),
    ),
    "INVESTIGATOR": (
        "Investigator",
        (
            "overview:read",
            "risk:read",
            "case:read",
            "case:manage",
            "customer:read",
            "passport:read",
            "security:read",
            "network:read",
            "export:manage",
        ),
    ),
    "INTEGRATION_MANAGER": ("Integration manager", ("partner:read", "partner:manage")),
    "VIEWER": ("Viewer", ("overview:read", "risk:read", "case:read")),
}


@transaction.atomic
def sync_access_catalog() -> dict[str, int]:
    """Create/update catalog permissions and default roles. Idempotent."""
    by_code: dict[str, Permission] = {}
    for definition in PERMISSIONS:
        permission, _ = Permission.objects.update_or_create(
            code=definition.code,
            defaults={"name": definition.name, "description": definition.description},
        )
        by_code[definition.code] = permission
    for code, (name, permission_codes) in DEFAULT_ROLES.items():
        role, _ = Role.objects.update_or_create(
            code=code, defaults={"name": name, "scope_type": "INSTITUTION"}
        )
        role.permissions.set([by_code[c] for c in permission_codes])
    return {"permissions": len(PERMISSIONS), "roles": len(DEFAULT_ROLES)}
