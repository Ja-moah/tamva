# ADR-005: Custom identity foundation

**Status:** Accepted

## Context
Replacing Django's user model after migrations is costly, and TAMVA needs customer, partner, platform, and service identities.

## Decision
Start with a UUID-based custom user and a separate service-account model. Identity type is classification only; authorization comes from membership, roles, permissions, scopes, tenant context, and consent.

## Consequences
Identity can evolve without a disruptive user-table swap. Django sessions remain
available for the admin and initial development API, but product clients must
move toward short-lived OIDC/JWT-compatible access tokens with refresh rotation.
Service accounts and partners use scoped client credentials. MFA remains a future
extension of the same identity foundation.

## Alternatives considered
Django's default user and using a user-type enum as authorization were rejected.

