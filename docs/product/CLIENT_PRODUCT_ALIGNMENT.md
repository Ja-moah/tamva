# Client product alignment (admin ↔ mobile ↔ backend)

The admin (`apps/admin`) serves institutions; the mobile app (`apps/mobile`)
serves the customer. Both sit on one backend and must describe the same
things in the same words. This compares them without changing mobile.

## Audiences

| | Admin | Mobile |
| --- | --- | --- |
| User | Institution analyst, investigator, administrator | Individual customer |
| Job | Review risk, work cases, manage access, see what a customer consented to | See own Financial Confidence, control consent, share a Passport |
| Data reach | One institution (`X-Institution-ID`) | The customer's own data |
| Backend status | **Wired** to the real API (see `ADMIN_INTEGRATION_AUDIT.md`) | **Wired** to the customer API: auth, registration, recovery, Home, Activity, Profile, Confidence, Passport, Consent (grant/revoke), Connections (list/disconnect), Protection, Notifications (see `MOBILE_INTEGRATION_AUDIT.md`) |

Both clients now use the shared API boundary. That does not imply feature parity: the Mobile audit records which customer capabilities have a real endpoint and which remain unavailable.

## Canonical vocabulary

The backend wins. These terms mean the same thing in both clients, the API and
the docs.

| Term | Meaning | Notes |
| --- | --- | --- |
| **Financial Profile** | A customer's computed picture of their finances from connected data | Per institution; never shown as raw transactions in Admin. |
| **Financial Confidence** | 0–100, higher = stronger *verified* financial confidence | Informational; not a credit decision, not a risk score. Admin no longer says "Trust Score". |
| **Risk Score** | 0–1000, higher = higher risk | Belongs to a risk *event*, never to a person. Never inverted or relabelled as confidence. |
| **Risk Decision** | `ALLOW`, `CHALLENGE`, `HOLD`, `BLOCK` | Same four in both clients. |
| **Case** | An investigation. `OPEN → TRIAGED → INVESTIGATING → ACTIONED → RESOLVED` | Admin uses these exact values; retired states (`NEW`, `UNDER_REVIEW`, `ESCALATED`) are guarded against by a test. "Escalate" is an action type, not a state. |
| **Consent** | A revocable, purpose-bound permission a customer grants an institution | Customer controls it; Admin can only observe. |
| **Connection** | A customer's data connection to an institution via a provider | Shown as health only; provider credentials are never exposed. |
| **Notification** | A message to a person (`channel, subject, body, status`, plus category) | Admin has no per-item severity because the backend has none. |
| **Security Event** | An observed device/location signal (`NEW_DEVICE`, `UNUSUAL_LOCATION`, …) | Dark-web, breach and account-takeover are not implemented and never appear as detections. |
| **Trust Network** | The institution-scoped graph of customers, accounts, counterparties, cases and events | Never cross-institution. |
| **Financial Passport** | A customer-controlled, revocable share of a profile snapshot | Admin sees share counts only with `passport:read`. |

## Where the clients still differ from each other

| Concept | Admin | Mobile | Action |
| --- | --- | --- | --- |
| Reason text for a decision | `lib/reason-codes.ts` (analyst tone, plus the raw code) | not built | One shared code → text source when mobile is wired; tone may differ, codes must not. |
| Currency | Per-record, institution locale, never converted | Shared formatter uses record currency and device locale; demo fixtures may contain GHS | Aligned for live data. |
| Contracts | `@tamva/client-contracts` | `@tamva/client-contracts` at the API boundary; local presentation types remain | Wire contracts aligned. |

## Shared contracts

- Both apps consume `@tamva/client-contracts` for wire validation. Mobile has a
  dedicated customer transport in `apps/mobile/src/api`; the obsolete local
  health-only transport was removed.
- Wire conventions — `X-Institution-ID`, `X-Request-ID`, `/api/v1`, error
  envelope, pagination — are defined once in the contracts package. Mobile is
  single-customer, so it will not send `X-Institution-ID`.

## What each side must not claim

- Neither client says TAMVA "prevented" a dollar/cedi amount of fraud, or that
  a customer is "verified"/"safe" beyond what a versioned decision states.
- Neither shows exchange rates or FX fees until a licensed provider exists.
- Neither shows third-party brand marks that are not official, licensed files.
  Mobile documents its official assets in `apps/mobile/assets/brands/ASSET_SOURCES.md`;
  admin's imitation SVGs were removed.

## Concept comparison (backend · Admin · Mobile)

| Concept | Backend term | Admin presentation | Mobile presentation | Status |
| --- | --- | --- | --- | --- |
| Financial Profile | `FinancialProfileSnapshot` | Counts and completeness, no raw data | Profile tab (design kept) | Mobile live |
| Financial Confidence | `FinancialConfidenceSnapshot` (0–100) | Per-customer value, bands | Confidence screen (design kept) | Mobile live |
| Risk | `RiskEvent` score 0–1000, decision | Risk events table and drawer | Not shown as a customer "score" | Intentional difference |
| Connections | `InstitutionConnection` | Health list, no credentials | Connected accounts | Mobile live |
| Consent | `Consent` | Read-only counts | Consent & data sharing: list + revoke | Live in both (customer grants and revokes) |
| Notifications | `Notification` | Own inbox + preferences | Notification centre + preferences | Live in both |
| Security | `SecurityEvent`, devices, locations | Security tab | Protection | Admin live; Mobile: no customer API |
| Trust Network | institution graph | Entities and relationships | Not customer-facing | Intentional difference |
| Financial Passport | `FinancialPassport`, shares | Share counts (`passport:read`) | Passport tab | Mobile live |

## Navigation

| Admin (sidebar) | Mobile (tabs) | Note |
| --- | --- | --- |
| Overview | Home | Different jobs; no shared nav needed. |
| Risk events, Cases, Analytics, Network | — | Institution-only. |
| Customers | Profile | Admin sees only consented data about a customer. |
| Security & governance | Protection (under More) | Customer sees own signals; institution sees events. |
| Notifications, Settings | Notifications, Settings (under More) | Same notification and preference contracts, scoped to the signed-in recipient. |
| Team, Integrations | — | Institution-only. |
| — | Activity, Passport | Customer-only. |

Mobile tabs are **Home · Activity · Profile · Passport · More**; More holds Connected accounts, Consent &
data sharing, Protection, Notifications, Settings and Help. Admin and Mobile deliberately do not share a
navigation model or information density.

## Open items

1. (Post-launch) Customer provider catalogue and provider-authorization completion (connections are created pending).
2. Publish reason-code text once and share it across clients.
3. Decide whether Admin's Customers screen should ever show Financial Confidence without an active consent granting it.
4. Mobile has no component-level UI tests, and the bespoke demo-mode layouts are not maintained against the live screens.
