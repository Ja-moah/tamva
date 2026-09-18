# Domain inventory

What each `apps/backend/domains/*` module currently exposes, as of the
backend-hardening pass. See [ADR-012](../adr/ADR-012-deliberate-api-exposure.md)
for why "has a service layer" does not imply "has a public API."

| Domain | Models | Services | Public API | Django admin |
| --- | --- | --- | --- | --- |
| identity | yes | yes | yes (auth, me) | yes |
| partner | yes | yes | no | yes |
| consent | yes | yes | yes | yes |
| connector | yes | yes | no | no |
| normalisation | yes | yes | no | yes |
| ledger | yes | yes | no | yes |
| profile | yes | yes | no | yes |
| feature | yes | yes | no | no |
| rules | yes | yes | no | no |
| modeling | yes | yes | no | no |
| risk | yes | yes | yes (read-only) | no |
| case | yes | yes | yes | no |
| notifications | yes | yes | yes | no |
| graph | yes | yes | no | no |
| passport | yes | yes | yes | no |
| security | yes | yes | no | no |
| counterparty | yes | yes | no | no |
| confidence | yes | yes | no | no |
| audit | yes (append-only) | n/a — write path is `AuditEvent.objects.create()` from other domains | no | no |

No domain uses Celery tasks for its own domain logic; the only task is the
cross-domain `packages.events.tasks.dispatch_pending_outbox_events` outbox
dispatcher (see [outbox.md](../events/outbox.md)).

## Gaps deliberately left open by this pass

- **Django admin**: Feature, Rules, Modeling, Risk, Case, Notifications,
  Graph, and Passport have no admin registration. Case and Notifications in
  particular are operator-facing domains where an admin view would likely
  earn its place; not added here to avoid guessing at the operator
  workflow without product input.
- **APIs**: Partner Applications, Connectors, and Profile are complete,
  tested service layers with no REST surface. Feature/Rules/Model are
  intentionally kept internal (see ADR-012).
- **Risk evaluation triggering**: not exposed via API; it is pipeline-
  triggered today.
