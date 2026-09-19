# Identity

Owns authentication identities, sessions, MFA metadata, and human/service identity foundations. It does not own financial transactions or risk scoring. The identity type classifies an account; authorization remains the responsibility of memberships, roles, permissions, scopes, tenant context, and consent.

The initial API foundation exposes session-backed login, refresh, logout, and
`/api/v1/me/` context endpoints for development and admin compatibility. Product
authentication is intended to move to short-lived OIDC/JWT-compatible access
tokens with refresh rotation; service accounts and partners will use scoped
client credentials. `CUSTOMER`, `PARTNER_USER`, and `PLATFORM_USER` are actor
classifications only; access is determined by active memberships, roles,
permissions, tenant context, and later valid consent.



Customer/native clients authenticate with short-lived bearer access tokens and
rotating refresh tokens (`tokens.py`, ADR 013); the Admin keeps cookie sessions.
Both resolve to the same `User`.
