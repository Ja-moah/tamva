# Domain APIs

Only `domains.identity` had a REST surface before this pass. API exposure is
deliberate, not automatic: Consent, Risk, Case, Notifications, and Passport
were chosen as the most product-critical surfaces. Partner Applications,
Connectors, Profile, and the internal engine domains (Feature, Rules, Model)
remain service-layer-only, pending a future, equally deliberate exposure
decision. All routes are under `/api/v1/`; see
[error-contract.md](error-contract.md) for the response envelope and
[identity-access.md](identity-access.md) for authentication and the
`X-Institution-ID` tenant header.

## Consent — customer-facing

`GET/POST /consents/`, `GET /consents/{id}/`, `POST /consents/{id}/revoke/`.
A customer only ever sees, grants, or revokes their own consent; the
queryset is filtered to the requesting user, not gated by
`HasPermission`/`required_permission`.

## Risk — institution-facing, read-only

`GET /risk/events/`, `GET /risk/events/{id}/`, gated by `risk:read`.
Evaluation triggering is not exposed: it depends on selecting the "right"
upstream feature/rule/model run, which has no API-safe default yet and
stays pipeline-internal.

## Case — institution-facing

`GET /cases/`, `GET /cases/{id}/`, `POST /cases/`, and per-case
`assign/`, `transition/`, `notes/`, `actions/`, `resolve/` actions. Reads
are gated by `case:read`, mutations by `case:manage`.

## Notifications — customer-facing

`GET /notifications/`, `GET /notifications/{id}/`,
`POST /notifications/{id}/read/`, and `GET/POST /notification-preferences/`.
`Notification.read_at` was added for this (no read/acknowledge concept
existed before).

## Passport — institution-facing, plus a separate recipient endpoint

`GET/POST /passport/customers/{customer_id}/` (retrieve/generate, gated by
`passport:read`/`passport:manage`), `GET/POST /passport/shares/`, and
per-share `revoke/`. `POST /passport/shares/access/` is separate: the
accessing institution's staff redeem a share token, authorized by active
`InstitutionMembership` at the claimed institution rather than
`HasPermission`, since a recipient may hold no other TAMVA-internal
permission at all. Throttled under the `passport_share_access` scope.

## Security observations — trusted integrations

`POST /security/observations/` submits a typed `DEVICE` or `LOCATION`
observation (see the intake contract in
[INTELLIGENCE_CAPABILITIES.md](../product/INTELLIGENCE_CAPABILITIES.md)).
Gated by `security:observe`, customer consent, and the `security_observation`
throttle scope; `201` when new, `200` when the `source_event_id` was already
ingested.

## Capabilities — authenticated

`GET /capabilities/` returns `{code: AVAILABLE|PARTIAL|NOT_AVAILABLE|DISABLED}` so
clients render what exists. See
[INTELLIGENCE_CAPABILITIES.md](../product/INTELLIGENCE_CAPABILITIES.md).

## Shared infrastructure

`packages.common.api` resolves `X-Institution-ID`; every list endpoint uses
`packages.common.pagination.DefaultPagination` (25 per page, `page_size` up
to 100). Throttle scopes (`auth`, `credential_ops`, `connector_sync`,
`risk_evaluation`, `passport_share_access`) are DRF `ScopedRateThrottle`
rates configured via env vars in `config/settings/base.py`, not hardcoded.
