# Admin API integration

How the Admin talks to the backend, and the reference for the endpoints it uses.
The Django OpenAPI schema (`packages/contracts/openapi/schema.yml`, regenerate with
`make schema`; browse at `/api/docs/` and `/api/redoc/`) is authoritative. The
Admin's runtime validators live in `packages/contracts/client` and are shared, not
redefined per screen.

## Layers

```
OpenAPI schema ──► @tamva/client-contracts (zod)
                        └► lib/api/apiRequest  (auth, tenant, tracing, errors)
                             └► features/<area>/queries.ts  (TanStack Query hooks)
                                  └► routes/*  (presentation only)
```

Screens never call `fetch`, never filter or aggregate in React, and never derive
authorization from role names.

## Request conventions

| Concern | Rule |
| --- | --- |
| Auth | Cookie session; `POST /auth/login/ {identifier, password}`; unsafe methods echo `csrftoken` as `X-CSRFToken`. A 401 from any call returns the app to sign-in. |
| Tenant | `X-Institution-ID` is set once from the chosen membership. Switching institutions drops every cached tenant query. |
| Tracing | Fresh `X-Request-ID` per call; error UIs show the server's request id. |
| Versioning | `/api/v1`. |
| Pagination | `page`, `page_size` (≤ 100) → `{count, next, previous, results}`. |
| Filtering / sorting | Documented per endpoint. Unknown params are rejected (400). `ordering` is an allow-list; `-` reverses. |
| Idempotency | Bulk mutations accept `Idempotency-Key`; same key + body replays, different body → 409. |
| Errors | `{error: {code, message, request_id, details}}` → `ApiError`. |
| Decimals | Serialised as strings; converted once at the edge (`toNumber`). |
| Scores | Financial Confidence 0–100 (higher = stronger). Risk Score 0–1000 (higher = riskier). Never inverted or interchanged. |

## Endpoints added or extended

| Area | Endpoints | Permission |
| --- | --- | --- |
| Overview / analytics | `GET /overview/?days=`, `GET /analytics/summary/?days=` (1–366) | `overview:read`, `analytics:read` |
| Customers | `GET /customers/`, `/customers/{id}/` — filters `search`, `financial_confidence_band`, `profile_completeness_min/max`, `connection_state`, `consent_state`, `latest_decision`; sort `financial_confidence`, `profile_completeness`, `latest_risk_score`, `open_cases`, `name`, `last_login` | `customer:read` |
| Risk events | filters `decision`, `severity`, `reason_code`, `score_min/max`, `customer`, `date_from/to`; sort `evaluated_at`, `score`, `decision`, `confidence` | `risk:read` |
| Cases | filters `status`, `priority`, `assignee`, `unassigned`, `customer`, `case_type`, `source`, `opened_from/to`, `search`; sort `opened_at`, `closed_at`, `status`, `priority` (by severity), `reference`; `POST /cases/bulk-assign/`, `/bulk-triage/` (≤ 100) | `case:read` / `case:manage` |
| Notifications | filters `category`, `state`, `channel`, `unread`, `date_from/to`; `POST /notifications/bulk-read/` (≤ 200) | own |
| Security | `GET /security/events/`, `/devices/`, `/locations/` | `security:read` |
| Audit | `GET /audit/events/` | `audit:read` |
| Network | `GET /network/summary/`, `/nodes/`, `/edges/`, `/customers/{id}/metrics/` | `network:read` |
| Team | `GET /team/members/`, `/roles/`, `/permissions/`; `POST /team/members/{id}/roles/`, `/status/` | `team:read` / `team:manage` |
| Integrations | `GET/POST /integrations/applications/`; `POST …/{id}/environments/`; `POST /integrations/environments/{id}/credentials/`, `/webhooks/`; `POST /integrations/credentials/{id}/rotate/`, `/revoke/`; `GET /integrations/scopes/`, `/connections/` | `partner:read` / `partner:manage` |
| Saved views | `GET/POST /saved-views/`, `GET/PATCH/DELETE /saved-views/{id}/` | resource's read permission |
| Exports | `POST /exports/`, `GET /exports/`, `GET /exports/{id}/`, `POST /exports/{id}/download-link/`, `GET /exports/{id}/download/?token=` | `export:manage` + resource permission |
| Resource catalog | `GET /resources/` — filters, sort fields and export columns *for this actor* | authenticated |
| Locale / version | `GET/PATCH /institution/locale/`, `GET /meta/version/` (public) | `overview:read` / `institution:manage` |

## Permission catalog

Defined in `domains/identity/catalog.py`; `manage.py sync_access_catalog` makes
default roles match it exactly (`INSTITUTION_ADMIN`, `RISK_ANALYST`,
`INVESTIGATOR`, `INTEGRATION_MANAGER`, `VIEWER`). `security:observe` is a service
permission and is never granted to a human role.

## Saved views

Private to their owner within one institution. Filters are stored as plain
`{param: string}` pairs and validated against the resource's filter allow-list on
every write, so a stored view can never carry an executable or unknown expression.

## Bulk operations

Only workflow-safe actions are bulk: case assign, case triage (OPEN → TRIAGED
only) and notification mark-read. Each item is validated and applied
independently and reported (`SUCCESS` / `FAILED` / `NOT_FOUND`); the request is
audited; `Idempotency-Key` makes retries safe. Mass BLOCK/ALLOW, mass resolution
and mass consent revocation are intentionally not offered.

## Exports

Requesting an export returns a job, never data. A worker builds the file;
permissions are checked when requested **and again when the job runs**. Columns an
actor cannot view are refused. Files expire (default 24 h) and are purged hourly.
Downloads require the session, the requester's identity, and a 5-minute signed
token, and are audited. Cells are neutralised against spreadsheet formula
injection. Limits: 50 000 rows (larger jobs fail rather than truncate), 1 000
selected ids. Exportable: risk events, cases, customers (masked email only),
notifications (own), security events, audit events.

## Secrets

API secrets are returned once, by issue/rotate, with `Cache-Control: no-store`.
The Admin holds the value only in the dialog that displays it; it is not written
to the query cache. Only a hash is stored server-side.

## Errors and outages

`ErrorState` distinguishes 403 (unauthorized), 5xx (server problem) and network
failure, and always shows the request id when there is one.
