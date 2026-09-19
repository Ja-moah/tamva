# Mobile integration audit

Branch `integrate/mobile-platform`. Application: `apps/mobile` (one Expo app for Android, iOS and Web).
This is the record of what the customer app can truthfully do against the backend today, what it
cannot, and what the backend must add first. It follows the same rule as the Admin: **nothing is
shown as real that the backend cannot serve.**

## Headline

The backend was built institution-first. Only four customer-facing surfaces exist today:
**authentication, notifications (and preferences), consent (list + revoke) and the capability manifest.**
Everything else the Mobile design shows — Home dashboard, Activity, Financial Profile, Financial
Confidence, Passport, Protection, connections, and the Send/Receive/Save flows — was driven entirely by
bundled sample data. Those screens are now capability-gated: outside an explicit demo mode they show an
honest "Not available yet" state and no figures. The approved designs are preserved, not deleted.

## Product boundary

The app is a client of the Django API. The backend is authoritative for identity, consent,
notifications and every financial figure. The app formats and presents; it never computes a balance,
score, decision, consent, Passport or payment. TAMVA is **not a bank, wallet or lender**, which is why
Send / Receive / Save are classified V2/out-of-boundary rather than "to be wired".

## Demo mode

Sample fixtures live under `src/demo/data` and render only when `EXPO_PUBLIC_DEMO_MODE=true`. A
persistent banner ("DEMO DATA") is shown in that mode. It is off by default and must not be enabled in a
release build. The developer QA controls on the auth/onboarding screens (fill demo credentials, bypass,
reset onboarding) are also demo-mode only. Without demo mode there is no path around sign-in.

## Screen inventory

Classification: **READY** live and complete · **PARTIAL** live with named gaps · **BACKEND_GAP** needs an
API that does not exist · **UI_GAP** backend exists, client work remains · **V2** outside current scope.

| Route | Screen | Data source (normal mode) | Backend domain / endpoint | Capability | Class | Loading | Empty | Error | Offline |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Gatekeeper | onboarding flag + session | `GET /me/` | `customer_authentication` | READY | spinner | – | retry on startup failure | retry, never "signed out" |
| `/onboarding` | Onboarding | local; illustration labelled "Example financial view" | – | – | READY | – | – | – | works offline |
| `/(auth)`, `/(auth)/sign-in` | Sign in | `POST /auth/login/` → `/me/` → customer policy | identity | `customer_authentication` | READY | button loading | – | plain-language, no field leak | connectivity message |
| `/(auth)/sign-up` | Create account | **none** (was a fake success modal) | none | `customer_registration` NOT_AVAILABLE | BACKEND_GAP | – | – | – | – |
| `/(auth)/forgot-password` | Reset password | **none** (was a fake success) | none | `customer_account_recovery` NOT_AVAILABLE | BACKEND_GAP | – | – | – | – |
| `/(tabs)` | Home | real notifications + consent counts; "still to come" list | notifications, consent | `customer_home` NOT_AVAILABLE | PARTIAL | spinner | "all caught up" | retry text | pull-to-refresh |
| `/(tabs)/activity` | Activity | none | none (canonical transactions have no customer API) | `customer_activity` | BACKEND_GAP | gate | unavailable state | – | – |
| `/(tabs)/profile` | Financial Profile | none | profile snapshot has no customer API | `customer_financial_profile` | BACKEND_GAP | gate | unavailable state | – | – |
| `/(tabs)/passport` | Financial Passport | none | passport endpoints are institution-staff (`passport:read/manage`) | `customer_passport` | BACKEND_GAP | gate | unavailable state | – | – |
| `/(tabs)/more` | More hub | capability manifest | `GET /capabilities/` | – | READY | – | – | – | – |
| `/(tabs)/consent` | Consent & data sharing | `GET /consents/`, `POST /consents/{id}/revoke/` | consent | `customer_consent` PARTIAL | PARTIAL | spinner | empty state | retry | pull-to-refresh |
| `/(tabs)/protection` | Protection | none | security events/devices have no customer API | `customer_protection` | BACKEND_GAP | gate | unavailable state | – | – |
| `/(tabs)/risk`, `/confidence` | Financial Confidence | none | confidence exists in the backend, no customer API | `customer_financial_confidence` | BACKEND_GAP | gate | unavailable state | – | – |
| `/accounts` | Connected accounts | none | connections have no customer API | `customer_connections` | BACKEND_GAP | gate | unavailable state | – | – |
| `/notifications` | Notification centre | `GET /notifications/`, read, bulk-read | notifications | `customer_notifications` | READY | spinner | "all caught up" | retry | pull-to-refresh |
| `/settings` | Settings | preferences `GET/POST /notification-preferences/`, `/meta/version/`, sign out | notifications, meta | – | READY | inline | – | retry | – |
| `/help` | Help | static text (no support channel invented) | – | – | READY | – | – | – | works offline |
| `/send`, `/receive`, `/save` | Send / Receive / Save | none | no payments domain | `customer_payments` | V2 (out of boundary) | – | unavailable state | – | – |
| `/design-system` | Design reference | local | – | – | non-product | – | – | – | – |

The capability manifest (`GET /api/v1/capabilities/`, authenticated) now reports the customer surface
explicitly (`customer_*`). A screen renders live data only when **both** the backend reports the capability
available **and** the app has wired it (`resolveAvailability`), so a future backend flip cannot light up
code that was never connected.

## Navigation

One canonical structure: **Home · Activity · Profile · Passport · More.** `More` holds Connected
accounts, Consent & data sharing, Protection, Notifications, Settings and Help, and each row shows
whether the backend can serve it today. `consent`, `protection` and `risk` remain routable (deep links
keep working) but are hidden from the tab bar. The previous state had five tabs including Consent, a
hidden auto-registered `more` and two hidden routes; those conflicting definitions are gone. Each tab
gates its own content (not the navigator), so an unavailable screen never removes the tab bar.

## API boundary

- `src/api/client.ts` is the only HTTP transport; it is unit-tested.
- Versioned calls use `/api/v1`, send `X-API-Version` and a fresh `X-Request-ID`, include cookies, and parse shared Zod contracts from `@tamva/client-contracts` (`customer.ts`, plus shared notification/capability/actor schemas).
- Unsafe calls need a CSRF token. Native code cannot read cookies, so the backend gained `GET /auth/csrf/`; the client fetches it, caches it, refreshes it after sign-in (it rotates) and retries once on a CSRF refusal.
- GET retries cover connectivity failures and 502/503/504 only, with backoff. Mutations are never retried automatically. Bulk mark-read is idempotent.
- Timeouts, offline failures and the backend error envelope become one `ApiError`; `describeError` produces customer-safe text and never repeats server detail. Request IDs are kept for diagnosis.
- No `X-Institution-ID`: customer resources are scoped to the signed-in customer by the backend.

## Authentication and storage

The backend's cookie session is authoritative and there is no token API. Startup calls `GET /me/`; only
an **active `CUSTOMER`** enters the customer routes. Institution staff are told to use the Admin console,
and a suspended/deactivated account is refused even if a session cookie exists. A 401 anywhere returns
the app to sign-in and clears cached data. An offline or failing start shows a retry screen; it does not
pretend the customer signed out (and no longer spins forever).

No password, token, consent or financial record is persisted by application code. On native, SecureStore
holds only a non-secret last-user hint (`userId`, email, time). On web nothing is persisted; the browser
cookie is the whole session. The session cookie itself lives in the platform's cookie store.

**Weakness recorded, not hidden:** cookie sessions plus CSRF work but are the least natural fit for native
apps (cookie-jar persistence differs by platform, and there is no refresh flow). A mobile-appropriate
session design is a V1 decision (see gaps).

## Vocabulary

| Term | Meaning in the app |
| --- | --- |
| Financial Confidence | 0–100, higher = stronger *verified* financial confidence. Informational; not a credit score or lending decision. |
| Risk Score | 0–1000, higher = higher risk. Institutional; never shown to the customer as their "score" and never inverted into Financial Confidence. |
| Consent / Connection / Notification / Security Event / Financial Passport / Trust Network | as defined in `CLIENT_PRODUCT_ALIGNMENT.md`. |

`Total Available Funds` and net-position figures exist only in demo fixtures. The backend has no
customer balance semantics, so the term is not used in normal mode; when a balance API exists the label
must reflect its real contract (e.g. "Known connected balance") and the app must not sum it locally.

## Hard-coded currency, country and locale

Normal-mode code paths contain none. `formatCurrency` (Intl-based, no default currency) and
`src/i18n/format.ts` show money in the currency it was recorded in, in the device locale, and never
convert. Dates use the device locale and time zone. What remains, by design:
- demo fixtures (`src/demo/data`) use GHS, "GMT" strings and Ghanaian institution names;
- the Send/Receive/Save components (unavailable in normal mode) carry GHS defaults;
- the onboarding illustration is visibly labelled "Example financial view" and uses fixed figures;
- `constants/brands.ts` lists Ghanaian institutions for the (demo-only) connected-accounts design.
No exchange-rate capability exists, so no converted amount is ever shown.

## HCI review

Implemented and tested where the screen is live (consent, notifications, settings, sign-in):
distinct loading, empty, error and offline states; pull-to-refresh; a global offline banner with retry
driven by real request outcomes; destructive confirmation for consent revocation and sign-out; the
existing skeleton/empty/error components reused, not replaced. Unavailable screens use one
`UnavailableState` with an accessibility summary and a way home. Existing touch targets, screen-reader
labels, privacy masking and light/dark themes are unchanged.

Not done (needs devices/tooling): screen-reader pass on real devices, dynamic-type audit, contrast
audit of the unavailable state in dark mode, Android back-button audit beyond the notification detail
view, focus rings on web, and an automated component-test setup (only pure-logic tests run today).

## Backend gap register

**CRITICAL FOR V1** (the app cannot be a real product without these)
1. Customer registration / onboarding, and account recovery.
2. A native-appropriate session design (token or hardened cookie + refresh) — decision, then implementation.
3. Customer read model for **Financial Confidence** (score, band, components, completeness, as-of, policy version).
4. Customer read model for **Financial Profile** (snapshot, cash-flow, completeness).
5. **Connections**: list/status and a provider/institution catalogue to connect.
6. **Consent grant catalogue**: institutions, purposes and scopes a customer may grant (list/revoke exists).
7. **Customer-facing Passport**: read own snapshot, create / list / revoke shares. Existing endpoints are institution-permissioned and a customer has no membership.
8. **Customer Home** read model composing the above.

**USEFUL V1**
9. Activity: canonical transactions and ledger-backed summaries with search, date/type/account filters and pagination.
10. Customer Protection read model (own device/location security events, passport-share and consent activity).
11. Notification target/deep-link, category catalogue and an unread-count endpoint.
12. Financial Confidence history.

**V1.x**
13. Balance summary semantics (what "available" means, per currency).
14. Push-token registration for the `PUSH` channel; quiet hours.
15. A support/contact channel to show in Help.

**V2 / out of boundary**
16. Payments: Send, Receive, Save. TAMVA is not a bank or wallet; decide whether these designs are retired.
17. FX conversion (needs an approved rate provider), dark-web/breach monitoring, production account-takeover detection.

## Small backend changes made for truthful wiring

- `GET /api/v1/auth/csrf/` and `X-API-Version` on every response.
- Customer capability entries in `/capabilities/`.
- `institution_name` and `purpose_name` on consent rows (a consent screen cannot show a bare UUID).

## Security and privacy

UI gates are product communication, not authorization: the backend re-checks ownership on every call.
Customer routes require a verified customer session; query data is cleared on sign-out and expiry;
shared schemas reject malformed payloads; `EXPO_PUBLIC_*` values are public and hold no secrets; no
credentials appear in source or logs. The unapproved `packages/brand/assets/tamva.png` concept is neither
referenced nor committed. The mobile app is ready for `tamva-mark.svg`, an app icon, splash and auth
lockup from `packages/brand`, but uses the existing placeholders until official assets are approved.

## Configuration and platforms

`EXPO_PUBLIC_API_BASE_URL` selects the API (documented in `apps/mobile/.env.example`): iOS simulator and
web can use `localhost`, Android emulators need `10.0.2.2`, physical devices need a LAN address. Expo
config declares Android, iOS/tablet and statically exported Web. Logic is shared across platforms;
no platform-specific files exist because no behaviour requires them.

## Verification

```bash
pnpm install --frozen-lockfile
pnpm --filter @tamva/mobile typecheck
pnpm --filter @tamva/mobile lint
pnpm --filter @tamva/mobile test
pnpm --filter @tamva/mobile export:web
pnpm --filter @tamva/mobile export:android
pnpm --filter @tamva/mobile export:ios
pnpm --filter @tamva/admin typecheck && pnpm --filter @tamva/admin test
```

ESLint reports pre-existing design-fixture warnings (0 errors). Generated `dist/` and `.expo/` stay untracked.
