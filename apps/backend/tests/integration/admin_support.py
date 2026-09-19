"""Shared helpers for the institutional Admin API tests."""

from __future__ import annotations

import itertools
from typing import Any

from domains.identity.catalog import sync_access_catalog
from domains.identity.models import Permission, Role
from domains.partner.models import InstitutionMembership
from tests.integration.test_case import platform_user

_counter = itertools.count(1)


def operator(context: tuple[Any, ...], *permissions: str, institution: Any = None) -> Any:
    """An institution member holding exactly `permissions` (via a throwaway role)."""
    institution = institution or context[1]
    sync_access_catalog()
    n = next(_counter)
    user = platform_user(context, username=f"operator-{n}", institution=institution)
    role = Role.objects.create(code=f"TEST_ROLE_{n}", name=f"Test role {n}")
    role.permissions.set(Permission.objects.filter(code__in=permissions))
    InstitutionMembership.objects.get(institution=institution, user=user).roles.add(role)
    return user


def headers(context: tuple[Any, ...], institution: Any = None) -> dict[str, str]:
    return {"HTTP_X_INSTITUTION_ID": str((institution or context[1]).id)}
