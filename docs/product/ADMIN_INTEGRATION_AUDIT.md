# Admin integration status

The institutional Admin (`apps/admin`) is now a real application over the TAMVA
backend. This document records what is wired, what is partial, what is
deliberately unavailable, and what still needs a backend or product decision. It
replaces the earlier audit, which described a sample-data prototype.

Status legend:

| Status | Meaning |
| --- | --- |
| **WIRED** | Reads (and where stated, writes) real backend data; permission-gated. |
| **PARTIAL** | Wired, with named gaps. |
| **V2** | Not built. Rendered as a professional "not available yet" state, driven by `GET /api/v1/capabilities/`, never mocked. |

## Route status

| Route | Status | Backed by | Gaps / notes |
| --- | --- | --- | --- |
| Sign-in, session, institution picker | WIRED | `/auth/*`, `/me/`, `/meta/version/` | Membership-based picker; expired sessions return to sign-in; CSRF echoed. |
| Overview | WIRED | `/overview/` | Counts and averages only. Ledger volume per original currency, never converted. FX tile is V2. |
| Risk events | PARTIAL | `/risk/events/`, `/{id}/` | Filters, sorting, pagination, saved views, export, reasons drawer. **Amount, beneficiary, channel, device, IP and location are not on the risk event**; they need a transaction join in the backend serializer before the drawer can show them. |
| Cases | WIRED | `/cases/*`, bulk actions | Backend workflow only (OPEN → TRIAGED → INVESTIGATING → ACTIONED → RESOLVED). Assign-to-me, notes, resolve-with-reason, bulk triage/assign. Actors appear as short IDs (see below). No SLA clock or evidence count exists in the backend. |
| Customers | PARTIAL | `/customers/` | Consent-scoped summary: masked email, Financial Confidence, latest risk, connections, consent, cases, passport count (with `passport:read`). Not modelled in the backend, so not shown: KYC tier, national ID, linked institutions. |
| Notifications | WIRED | `/notifications/` + bulk read | Category, state, channel, unread filters. No per-item severity in the backend; "clear all" is not offered. |
| Team & access | PARTIAL | `/team/*` | Members, roles, permission matrix, role/status changes with self-change and last-administrator guards. **Invitations are V2.** |
| Security & governance | PARTIAL | `/security/*`, `/audit/events/` | Events, devices, locations, audit trail. Only `NEW_DEVICE` and `UNUSUAL_LOCATION` are produced (capability `security_events` is PARTIAL). Dark-web, breach and account-takeover are V2. |
| Trust network | PARTIAL | `/network/*` | Institution-scoped entities and relationships as lists with counts. No topology visualisation; the per-customer graph-metrics endpoint exists but has no UI yet. Cross-institution and merchant/rail intelligence are V2. |
| Analytics | PARTIAL | `/analytics/summary/` | Daily risk trend, score and decision distributions, reason codes, case flow, confidence bands, connection/consent/passport counts. Fraud-prevented value, peer comparison and geographic risk are V2 by design. Analytics summaries are not exportable (see below). |
| API & integrations | PARTIAL | `/integrations/*` | Applications, environments, credential issue/rotate/revoke (secret shown once), webhook create, connection health. Webhook disable/delete/update, request logs and usage metrics are V2. |
| Settings | PARTIAL | `/notification-preferences/`, `/institution/locale/` | Preferences and regional settings. Quiet hours is V2. |

## What was removed

Every static dataset, `Math.random` generator, simulated event, invented API path,
fabricated report, fake partner/rail telemetry and local "Production/Sandbox"
toggle. The fake tenant list (including a cross-tenant "Global Platform Scope"),
the hard-coded operator identity, nav counts and "18 ms" latency are gone.
`src/app/vocabulary.test.ts` fails the build if retired case states, "Trust
Score", `Math.random`, `GH₵`/exchange-rate literals, third-party brand names or an
environment toggle reappear in application source.

## Backend surface added in this phase

See `ADMIN_API_INTEGRATION.md` for the reference. In short: overview and
analytics aggregates; customer directory; security events/devices/locations;
audit read; institution-scoped graph; team and integrations management;
`SavedView`; `ExportJob` (CSV/XLSX); idempotent bulk operations; institution
locale settings and a rate-snapshot foundation; the permission/role catalog;
`/meta/version/`; ReDoc; fixed enum naming in the OpenAPI schema.

## Still needs a decision or backend work

1. **Risk event transaction context** (amount, currency, counterparty, channel, device/location reference) via a ledger/transaction join.
2. **Actor display names.** Cases, notes, history and the audit trail expose `user_id`s only. A member-directory read (id → display name within the institution) is needed to show people instead of short IDs.
3. **Case SLA, evidence count, assignee name.** Not modelled.
4. **Team invitations**, webhook lifecycle (disable/delete/update, delivery log), API usage metering.
5. **Customer KYC tier / national ID**, if those become TAMVA concepts.
6. **Exports of analytics summaries** and scheduled reports.
7. **FX conversion.** `ExchangeRateSnapshot` and `latest_exchange_rate` exist; no approved rate provider does. Conversion stays disabled.
8. **Currency support** is a fixed set in normalisation (`GHS, USD, EUR, GBP, NGN, KES, ZAR`), not per-institution configuration.
9. **Shared saved views** (only private views exist).
10. **Contract generation.** The Admin's zod contracts are hand-written from the OpenAPI schema. A contract test or generator that fails on drift is still to be added.
11. **Export storage.** Resolved in hardening: production requires a private S3-compatible bucket (`EXPORT_STORAGE_BACKEND=s3`); the worker and exactly one Celery beat run in the deployment compose file.
12. **Mobile** is now wired to the customer platform APIs (see `MOBILE_INTEGRATION_AUDIT.md`).

## Repository hygiene (resolved in hardening)

- `apps/admin/dist` is no longer tracked; images build the SPA in a builder stage.
- Plus Jakarta Sans and JetBrains Mono are self-hosted (`@fontsource-variable/*`); the Google Fonts CDN
  is gone and `pnpm --filter @tamva/admin verify:build` fails the build if it or a localhost URL returns.
- Unreferenced demo imagery (`public/assets/*.jpg`) was removed.
- Still open: the Admin bundle's main chunk is ~500 kB; code-split the shell if it grows.
