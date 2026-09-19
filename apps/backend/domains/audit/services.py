from __future__ import annotations

from typing import Any

from domains.audit.models import AuditEvent


def record_audit(
    *,
    action: str,
    outcome: str = AuditEvent.Outcome.SUCCESS,
    actor: Any = None,
    institution: Any = None,
    metadata: dict[str, Any] | None = None,
) -> AuditEvent:
    """Append an audit event. Never put secrets or raw PII in `metadata`."""
    return AuditEvent.objects.create(
        actor=actor if getattr(actor, "is_authenticated", False) else None,
        institution=institution,
        action=action,
        outcome=outcome,
        metadata=metadata or {},
    )
