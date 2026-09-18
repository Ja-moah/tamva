from dataclasses import dataclass
from uuid import UUID


@dataclass(frozen=True, slots=True)
class TenantContext:
    institution_id: UUID | None = None
    actor_id: UUID | None = None
