from typing import Protocol
from uuid import UUID

from packages.contracts.tenancy import TenantContext


class ResourceAuthorizer(Protocol):
    def may_access(self, *, actor_id: UUID, resource_id: UUID, tenant: TenantContext) -> bool: ...
