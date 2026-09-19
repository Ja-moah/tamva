# ADR 013: Customer token authentication alongside session auth

Status: accepted

## Context

The Admin console uses Django's cookie session with CSRF, which suits a browser.
A native customer app cannot read cookies, has no reliable cookie persistence, and
had no refresh story (the `/auth/refresh/` endpoint only cycles a session key). The
first mobile integration worked around this with `GET /auth/csrf/`, which the audit
recorded as the weakest point of the customer surface.

## Decision

Keep one identity system and add a second *transport* for it.

- **Browser / Admin:** unchanged (cookie session + CSRF).
- **Native and mobile web:** `POST /auth/token/` (same credentials, same `LoginSerializer`,
  same audit trail) returns a short-lived **access token** (15 minutes) and a **rotating
  refresh token** (30 days). Requests send `Authorization: Bearer <access>`.
- `BearerTokenAuthentication` resolves the token to the same `User`, so RBAC,
  customer-ownership checks and audit are identical for every client.

Tokens are opaque random strings (no JWT, no signing key to manage or leak), stored
only as SHA-256 hashes, and never logged. Each sign-in creates an `AuthSession`
(a token family). Refresh exchanges the pair and marks the spent refresh token used;
**presenting a spent refresh token again revokes the whole session** (reuse means it
leaked). Logout, `revoke-all`, password reset and user suspension all end sessions;
a suspended or deactivated user is refused at every step, including with a still-valid
access token. Sign-in, refresh, registration and recovery are throttled by scope.
Refusals are generic and never say why a token failed.

Native clients keep the refresh token in SecureStore and the access token in memory.

## Consequences

- Bearer requests carry no ambient credential, so they need no CSRF token; session
  requests still do. `DEFAULT_AUTHENTICATION_CLASSES` is now Bearer then Session (HTTP
  Basic was removed).
- A database lookup per authenticated bearer request (indexed by hash). Acceptable at
  current scale; a signed JWT with a revocation list is the alternative if that changes.
- Access tokens can be revoked instantly (unlike stateless JWTs).
- `GET /auth/csrf/` remains for browser clients that cannot read the cookie.
- Housekeeping: `purge_expired_tokens()` removes tokens a week past expiry; scheduling it
  belongs to deployment hardening.
- Not built: MFA, device management UI, OIDC federation. The identity README's stated
  direction (OIDC-compatible access tokens) is still open; this is compatible with it.
