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
| Backend status | Sample data only; API client and contracts now in place | Sample data (`constants/mock-data.ts`); only `/health/` is called |

Neither client is wired to real data yet, so neither can be called "ahead".

## Terminology

| Concept | Backend / docs | Mobile | Admin | Decision |
| --- | --- | --- | --- | --- |
| 0–100 confidence in a person's verified finances | Financial Confidence (informational; not a credit or risk score) | Financial Confidence (`isBureauScore: false`) | "Trust Score" | Admin should say **Financial Confidence**. "Trust score" reads as a credit score, which TAMVA explicitly is not. |
| Per-transaction assessment | Risk event: `score`, `decision`, `confidence`, reason codes | Risk tab (customer view) | Risk events | Keep "risk score" for events only; never reuse it for a person. |
| Decision | ALLOW / CHALLENGE / HOLD / BLOCK | not shown | same four | Aligned. |
| Case states | OPEN / TRIAGED / INVESTIGATING / ACTIONED / RESOLVED | — | NEW / UNDER_REVIEW / ESCALATED / RESOLVED | Admin adopts backend vocabulary (labels may be friendlier, values must match). |
| Sharing a profile | Financial Passport (+ shares, revocable) | Financial Passport / Share flow | "Passport" tier names | Aligned in name; admin KYC tiers are not a backend concept. |
| Permission the customer grants | Consent (revocable) | Consent tab | Consents list | Aligned. |
| Alerts to a person | Notification (`channel, subject, body, status`) | Notifications screen | Notifications inbox | Shape aligned; admin's category/severity is extra (see audit). |

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

## Gaps to resolve before wiring both

1. Rename "Trust Score" → "Financial Confidence" in admin copy.
2. Settle the case-status vocabulary and publish it in OpenAPI enums.
3. Decide whether the admin's Customers screen shows Financial Confidence at
   all (it should only with an active consent granting it).
4. One place for reason-code → human text, shared by both clients (mobile
   explains a decision to the customer; admin to the analyst, with different
   tone but the same code).
