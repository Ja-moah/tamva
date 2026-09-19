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
| Backend status | **Wired** to the real API (see `ADMIN_INTEGRATION_AUDIT.md`) | Sample data (`constants/mock-data.ts`); only `/health/` is called |

The Admin now reads real data; the customer app does not yet. Integrating mobile is a separate task and was deliberately not done here.

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
| Currency | Per-record, institution locale, never converted | Hard-coded `GH₵` in several screens | Mobile to adopt the same rule. |
| Contracts | `@tamva/client-contracts` | Local types and mock data | Migrate mobile to the shared package when it is wired. |

## Shared contracts

- Both apps should consume `@tamva/client-contracts`. Admin does now. Mobile
  still has its own health call in `apps/mobile/lib/api/index.ts` and local
  types in `src/types`; migrating it is a separate, deliberate task (not done
  here).
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

## Navigation

| Admin (sidebar, 11) | Mobile (tabs, 8) | Note |
| --- | --- | --- |
| Overview | Home | Different jobs; no shared nav needed. |
| Risk events | Risk / Protection | Same backend resource, opposite viewpoint. |
| Cases | — | Institution-only. |
| Customers | Profile | Admin sees only consented data about a customer. |
| Security | Protection | Customer sees own devices/locations; institution sees events. |
| Notifications, Settings | Activity, More | Same notification and preference endpoints. |
| Team, Network, Analytics, Integrations | — | Institution-only; backend mostly missing. |
| — | Passport, Consent | Customer-only controls the admin can only observe. |

## Open items

1. Wire mobile to the API and to `@tamva/client-contracts`; remove hard-coded `GH₵`.
2. Decide whether Admin's Customers screen should ever show Financial Confidence without an active consent granting it (today it is shown to holders of `customer:read` for customers the institution already has a relationship with).
3. Publish reason-code text once and share it across clients.
