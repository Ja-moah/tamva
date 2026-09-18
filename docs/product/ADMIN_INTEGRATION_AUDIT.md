# Admin integration audit

Audit of the institutional admin UI (`apps/admin`, integrated from `origin/sem`)
against the real TAMVA backend at `tamva` (`1a7a534`). The UI design is kept as
delivered; this document classifies what is real, what is sample, and what the
backend must add before a screen can go live. Nothing here was invented to
close a gap.

## Summary

- **11 routes**, all rendering static in-file sample data. **None reads the
  backend.** Before this integration the admin called three endpoints
  (`/health/`, and two currency endpoints that exist on no backend we ship).
- The backend serves: auth/session, capabilities, risk events (read), cases
  (read + workflow), notifications (+ preferences), consents, financial
  passport shares, and security observation intake.
- The backend does **not** serve: a customer directory, team/role management,
  partner/network status, analytics aggregates, API-credential or webhook
  management, or a security-events read API.
- Because of that, the shell now carries a persistent **sample-data notice**,
  and the currency converter (which shipped hard-coded exchange rates) is
  replaced by an explicit "not available" card.

### Gap classes

| Class | Meaning |
| --- | --- |
| **WIRE** | Backend endpoint exists; the screen can be wired now. |
| **RESHAPE** | Endpoint exists but its vocabulary/fields differ; UI or a mapping layer must change. |
| **BACKEND** | Data model exists in the backend but no API exposes it. Needs a backend addition first. |
| **EXTERNAL** | Needs a provider, data source or governance decision TAMVA does not have. |
| **REFRAME** | The screen makes a claim TAMVA cannot defensibly make; reword or remove. |

## Backend surface (from the regenerated OpenAPI)

| Area | Endpoints | Permission |
| --- | --- | --- |
| Auth | `POST /auth/login/`, `/auth/refresh/`, `/auth/logout/`, `GET /me/` | session |
| Capabilities | `GET /capabilities/` | authenticated |
| Risk | `GET /risk/events/`, `/risk/events/{id}/` | `risk:read` |
| Cases | `GET/POST /cases/`, `GET /cases/{id}/`, `POST …/assign/ transition/ notes/ actions/ resolve/` | `case:read` / `case:manage` |
| Notifications | `GET /notifications/`, `/{id}/`, `POST /{id}/read/`, `GET/POST /notification-preferences/` | own |
| Consents | `GET/POST /consents/`, `/{id}/`, `POST /{id}/revoke/` | — |
| Passport | `GET/POST /passport/customers/{id}/`, `/passport/shares/`, `…/revoke/`, `/passport/shares/access/` | `passport:read` / `passport:manage` |
| Security | `POST /security/observations/` (write only) | `security:observe` |

All under `/api/v1/`, tenant via `X-Institution-ID`, DRF page-number
pagination (`page`, `page_size` ≤ 100), errors as
`{error:{code,message,request_id,details}}`.

## Screen-by-screen

| Route | What it shows (sample) | Real backend today | Class | Needed before going live |
| --- | --- | --- | --- | --- |
| Overview | KPI tiles, "domain modules" with endpoints/events, mobile-money mesh, live audit ticker | Risk events, cases (counts derivable client-side only for one page) | WIRE (KPIs), BACKEND (aggregates), **REFRAME** (domain modules) | The domain-module card lists endpoints that do not exist (e.g. `POST /api/v1/identity/verify`). Remove or generate from the OpenAPI. A summary endpoint (`/risk/summary/`, `/cases/summary/`) is needed for real KPIs. |
| Risk events | Table + drawer: score, decision, institution action, device, IP, reasons | `GET /risk/events/` returns `id, customer_id, score, decision, confidence, reason_codes, ruleset/model/policy_version, evaluated_at`; detail adds `reasons[{code,source,severity}]` | WIRE + RESHAPE | Decisions match (ALLOW/CHALLENGE/HOLD/BLOCK). Amount, beneficiary, channel, device, IP, location, and "institution action" are **not** on the event; they need a transaction/ledger join in the serializer. Reason titles/descriptions must come from a client-side code→text dictionary (backend sends codes only, by design). Filtering/sorting has no server support yet. |
| Cases | Kanban/table, priority, SLA hours, assignee, evidence count, audit log | Full workflow endpoints | WIRE + RESHAPE | Status vocabulary differs: UI `NEW / UNDER_REVIEW / ESCALATED / RESOLVED`; backend `OPEN / TRIAGED / INVESTIGATING / ACTIONED / RESOLVED`. Backend has no SLA clock, no evidence count, and no assignee display name (only `assignee_id`); "escalate" is an action type, not a status. "SAR/FIC dossier" text has no backend basis (**REFRAME**). |
| Customers | Directory with KYC tier, trust score, consents, linked institutions | Consents and passport per customer; no list endpoint | BACKEND / RESHAPE / **REFRAME** | Needs a customer-directory endpoint scoped by consent. "Trust score" conflicts with backend/mobile **Financial Confidence** (0–100, informational, not a credit or risk score). KYC tiers and `nationalId` are not backend concepts today. |
| Network | Partner rails (MTN, Telecel, banks, GhIPSS), latency, TPS, float, SIM-swap signal, cert fingerprints | `Institution`/`PartnerApplication`/`PartnerEnvironment` models only; no API | BACKEND / EXTERNAL / **REFRAME** | Latency/TPS/float/volume are not measured anywhere. `Math.random` jitter simulates telemetry and must go. SIM-swap signal is EXTERNAL (capability `account_takeover_detection` is `NOT_AVAILABLE`). |
| Analytics | Volume trend, risk distribution, top categories, region risk, institution comparison, reports | None | BACKEND / EXTERNAL | Needs aggregate endpoints over risk events. **Institution comparison implies cross-institution data**, which the backend deliberately does not expose (`cross_institution_graph` is `NOT_AVAILABLE`). Reports/PDF export do not exist. |
| Team | Members, roles, MFA, permission matrix, invite | `InstitutionMembership`, `Role`, `Permission` models; only `/me/` exposes roles/permissions | BACKEND | Needs member list, invite and role-assignment endpoints. MFA status is not modelled. The matrix must be generated from the real permission catalog (`risk:read`, `case:read`, `case:manage`, `passport:read`, `passport:manage`, `security:observe`), not typed by hand. |
| Security | Consent distribution, alerts, audit trail, incidents | `AuditEvent` model (write-only), consent list; `security_events` capability is `PARTIAL` with no read API | BACKEND | Needs an audit-event read endpoint (institution-scoped) and a security-events read API. "Incidents" and mTLS/API-key-rotation alerts have no backend. |
| Notifications | Inbox with categories, severities, metadata | `GET /notifications/` (`channel, subject, body, status, read_at, created_at`), mark-read | WIRE + RESHAPE | UI categories `security/transactions/passport/insights` and per-item severity/metadata are not fields. Either the backend adds `category`/`severity` or the UI drops them. "Clear all" has no endpoint. |
| Settings | Notification preferences, channels, quiet hours | `GET/POST /notification-preferences/` (`category, channel, enabled`) | WIRE + RESHAPE | Preferences map cleanly to category×channel. **Quiet hours has no backend.** |
| Integrations | API products, keys, webhooks, request log | `ApiCredential`, `WebhookEndpoint`, `CredentialScope` models; no API | BACKEND / **REFRAME** | Products list advertises endpoints that do not exist (`/api/v1/risk/evaluate`). Keys are generated with `Math.random`; a real key must be created server-side and shown once. Request log has no backend. |

## What was changed in this integration

- **Excluded** Sem's backend edits (a `CurrencyRatesView`/`CurrencyConvertView`
  that returned fabricated rates, and unrelated docstring deletions);
  `apps/backend` is byte-identical to `tamva`.
- **Kept** a configurable Postgres host port in `docker-compose.yml`
  (`POSTGRES_HOST_PORT`, default unchanged).
- **Dropped** `apps/admin/package-lock.json`, the per-app `.nvmrc`, Sem's
  `dist/` output, and a native-binding pin; the pnpm workspace remains the only
  dependency source.
- **Removed** the invented crest, the invented favicon and seven imitation
  third-party logos (see `DESIGN_SYSTEM_ALIGNMENT.md`).
- **Added** the API client, shared contracts, capability hook, sample-data
  notice and the "not available" converter card.

## API client architecture

```
Django OpenAPI (packages/contracts/openapi/schema.yml, `make schema`)
  → @tamva/client-contracts (zod schemas + wire constants)
    → apps/admin/src/lib/api  (apiRequest, endpoint functions)
      → TanStack Query hooks (apps/admin/src/features/*)
        → screens
```

`apiRequest` (`lib/api/client.ts`) owns every cross-cutting rule so screens
never call `fetch` directly:

| Concern | Behaviour |
| --- | --- |
| Auth | Cookie session (`credentials: "include"`); Vite proxies `/api` and `/health` so dev is same-origin. |
| CSRF | `csrftoken` cookie echoed as `X-CSRFToken` on unsafe methods. Django sets it on login; there is no bootstrap endpoint, and none is needed for the login call itself. |
| Tenant | Ambient `X-Institution-ID` set once via `setActiveInstitution`, overridable per call. |
| Tracing | Fresh `X-Request-ID` per call; the server echoes it and puts it in error envelopes. |
| Versioning | `/api/v1` prefix from the shared constant; `/health/` is unversioned. |
| Errors | Standard envelope → `ApiError{status, code, requestId, details}`; non-JSON failures (proxy 502) become `http_error`. |
| Pagination | `paginatedSchema(item)` for the DRF page-number envelope. |
| Capabilities | `useCapability(code)` treats unknown/unloaded as `NOT_AVAILABLE`. |

Still to build (deliberately not started): login screen and session guard,
institution picker driven by `/me/` memberships, permission-gated routes, and
the per-screen query hooks. Login posts `{identifier, password}`.

**Deployment note:** with the API and admin on different subdomains, session
cookies need a shared parent domain (SameSite=Lax is same-site) or CORS with
credentials plus `CSRF_TRUSTED_ORIGINS`. `.env.*.example` already lists both
origins; this has not been exercised end to end.

## Route and permission review

Every route is currently reachable without authentication. Required guards
once login exists: unauthenticated → `/login`; per-route permission from
`/me/` (`risk:read` for Risk, `case:read` for Cases, `passport:read` for
Customers passport views, `security:observe` is a service permission and is not
a screen permission). Routes with no backend permission (Team, Network,
Analytics, Integrations, Security) need permissions defined first.

## HCI review

| Finding | Evidence | Action |
| --- | --- | --- |
| Sample data is indistinguishable from live data | no marker on any screen | Done: shell-level notice. Per-screen "sample" badges when screens go live one at a time. |
| Fake randomness | `Math.random` in 12 places (cases, customers, integrations, network, overview, team) | Remove as each screen is wired; API-key prefixes must never be client-generated. |
| No pagination or sorting anywhere | 0 occurrences across all 11 screens | Adopt `page`/`page_size` and a server sort param when endpoints are wired. |
| Search only on 4 of 11 screens; client-side only | cases, customers, team, notifications | Move to server filters. |
| Accessibility largely absent | 0 `aria-` on 8 of 12 route files; icon-only buttons unlabelled | Label controls, add `role`/`aria-live` for toasts, focus management for the drawer and modal. Not a redesign. |
| Google Fonts loaded from a CDN | `index.html` | Self-host (privacy, offline, CSP) during hardening. |
| Fake "Production/Sandbox" switch | Shell environment toggle is local state | Reflect the real deployment environment, or remove. It currently says "Production" over sample data. |
| Bulk actions with no backend | risk, team, notifications, integrations | Hide until an endpoint exists. |
| Unverified tagline | "People • Data • Trust • Opportunity" | Confirm with the brand owner before shipping. |

## Exports

Three screens generate real files in the browser, from **sample data**:
Cases ("Export Dossiers", per-case "Export JSON", described as "ISO 20022 JSON"),
Customers ("Passport Registry" `.csv`, "KYC Dossier") and Network
("Export Topology" `.json`). Risk has an "Export JSON Payload" button; Analytics'
"Recent Reports" list (PDF names, sizes, dates) is a static list of fabricated
entries with nothing behind it.

Consequences: a downloaded file looks like an institutional record but contains
invented rows, and the "ISO 20022" label claims a message standard no code
implements. Until the underlying screen is wired, these should be disabled or
watermarked as sample. Live exports need a server-side, permission-checked,
audited export (async job for large sets) with a defined column contract;
client-side CSV of one page must not be presented as a full export.

## Filter and sort contract (proposed)

For list endpoints: `?page=&page_size=` (existing), `?ordering=field|-field`
against a documented allow-list, exact-match filters named after fields
(`decision`, `status`, `priority`, `assignee_id`), and range filters
`evaluated_at_after`/`_before`. Unknown params should be rejected, not
ignored. The client schema will expose these as typed query objects.

## International UX

Currency is hard-coded `GH₵`, dates are preformatted strings, and regions are
Ghana-only. The backend stores ISO timestamps and (per ledger) currency codes;
the UI must format from those with `Intl` and the institution's locale. No
exchange rates are shown anywhere until a licensed, attributed provider exists.

## Specific reviews

- **Security Center:** every item is sample. The only real security data is the
  audit table and the `NEW_DEVICE`/`UNUSUAL_LOCATION` events (capability
  `PARTIAL`). Breach/dark-web monitoring are `NOT_AVAILABLE` and must not
  appear as detections.
- **Network:** no partner telemetry exists. Show institution/partner records
  from the backend when an API exists; drop latency, TPS, float and simulated
  jitter until a monitored source exists.
- **Analytics:** derive only from the institution's own risk events. Remove
  cross-institution comparison. Do not claim "fraud prevented GH¢X"; the
  backend records decisions, not verified prevented loss.

## Backend additions needed first (ordered)

1. Risk/case **summary** aggregates; server sort/filter on lists.
2. Institution **audit-event read** API.
3. **Team**: members, invites, role assignment; a permission catalog endpoint.
4. **Customer directory** (consent-scoped) and Financial Confidence read.
5. **Credentials/webhooks** management (server-generated, show-once secrets).
6. Notification `category`/`severity` (or drop from UI); case SLA and
   assignee display fields; transaction context on risk events.
7. Export jobs.
8. Two `drf-spectacular` enum-name collisions (`status`, `source`) — add
   `ENUM_NAME_OVERRIDES` so generated client types are stable.

Items 1–3 unblock Overview, Risk, Cases, Security and Team; Network, Analytics
comparison and any FX feature stay blocked on external decisions.

## Repository hygiene found

- `apps/admin/dist` is tracked and rewritten by every build; it should be
  untracked (`.gitignore`) during hardening. This branch does not commit it.
- Root `make check` builds the frontend and dirties `dist`.
- Currency-converter and brand-logo code assumed remote/imitation assets and
  is removed.
