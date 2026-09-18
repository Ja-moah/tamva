# Identity and access API

The identity foundation currently uses Django session authentication for the
initial implementation and admin compatibility. Product APIs are designed to
move to short-lived OIDC/JWT-compatible access tokens with refresh/token
rotation. Service accounts and partners will use scoped client credentials.
The same backend identity foundation serves customers, institutional users, and
platform users.

## Actor types

- `CUSTOMER` identifies a customer actor.
- `PARTNER_USER` identifies an institutional actor.
- `PLATFORM_USER` identifies a TAMVA platform actor.

Actor type is classification, not authorization. Access is resolved from the
active user, institution membership, assigned roles, role permissions, and the
selected tenant context. Customer data access additionally requires valid
consent where a domain API depends on it (Passport sharing calls
`domains.consent.require_consent_access` directly; see
[domain-apis.md](domain-apis.md)).

## Endpoints

All routes are under `/api/v1/`:

- `POST /auth/login/` accepts `identifier` (username or email) and `password`,
  establishes a Django session, and returns the actor context.
- `POST /auth/refresh/` rotates the authenticated session key and returns the
  current actor context.
- `POST /auth/logout/` terminates the current session and records an audit event.
- `GET /me/` returns the authenticated user, selected tenant, memberships, roles,
  and permission codes.

Set `X-Institution-ID` when a user belongs to more than one active institution or
when a request must explicitly select its tenant. The backend rejects an
institution that is not an active membership for the authenticated user.

## Authorization rules

Permission checks are default-deny. Partner access requires an active membership
and a role granting the required permission. `CUSTOMER` actors do not inherit
partner permissions. Platform bypass is limited to Django superusers and must be
used only where the endpoint explicitly permits it.

Login success and failure, logout, and future privileged access actions are
recorded as append-only `AuditEvent` records without storing credentials or raw
tokens.
