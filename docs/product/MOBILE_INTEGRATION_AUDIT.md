# Mobile integration audit

Branch `integrate/mobile-platform`. Application: `apps/mobile` (one Expo app for Android, iOS and Web).
This is the record of what the customer app can truthfully do against the backend today, what it
cannot, and what the backend must add first. It follows the same rule as the Admin: **nothing is
shown as real that the backend cannot serve.**

## Headline

The customer platform APIs now exist (`/api/v1/customer/*`, bearer-token auth, registration and
recovery), and Mobile is wired to them. Every primary screen reads real backend data. Two areas remain
partial by design: **connections** (a customer can list and disconnect, and a connection is *created
pending provider authorization*, but there is no customer-facing provider catalogue, so Mobile does not
offer "add account" yet) and **protection** (only new-device and unusual-location signals exist). Send /
Receive / Save stay unavailable: TAMVA is not a bank or wallet.

The live screens are built from the app's design-system components and tokens; the earlier bespoke
sample-data layouts (cards, sheets, flows) are preserved and shown only in explicit demo mode.

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
API that does not exist · **V2** outside current scope.

| Route | Screen | Backend | Capability | Class |
| --- | --- | --- | --- | --- |
| `/`, `/onboarding`, `/(auth)` | Gatekeeper, onboarding | session restore + `GET /me/` | `customer_authentication` | READY |
| `/(auth)/sign-in` | Sign in | `POST /auth/token/` (bearer pair) | `customer_authentication` | READY |
| `/(auth)/sign-up` | Create account | `POST /customer/register/` | `customer_registration` | READY |
| `/(auth)/forgot-password`, `/reset-password` | Recovery | `POST /auth/recovery/request/`, `/confirm/` | `customer_account_recovery` | READY |
| `/(tabs)` | Home | `GET /customer/home/` | `customer_home` | READY |
| `/(tabs)/activity` | Activity (search, direction filter, paging) | `GET /customer/activity/` | `customer_activity` | READY |
| `/(tabs)/profile` | Financial Profile | `GET /customer/profile/current/` | `customer_financial_profile` | READY |
| `/(tabs)/risk`, `/confidence` | Financial Confidence (+ history) | `GET /customer/financial-confidence/*` | `customer_financial_confidence` | READY |
| `/(tabs)/passport`, `/passport-share` | Passport: view, generate, share, revoke | `/customer/passport/*` | `customer_passport` | READY |
| `/(tabs)/consent`, `/consent-grant` | Consent & data sharing: list, grant (catalogue), revoke | `/customer/consent/catalogue/`, `/consents` | `customer_consent` | READY |
| `/accounts` | Connected accounts: list, disconnect | `/customer/connections/` | `customer_connections` PARTIAL | PARTIAL |
| `/(tabs)/protection` | Protection summary | `GET /customer/security/summary/` | `customer_protection` PARTIAL | PARTIAL |
| `/notifications` | Notification centre | `/notifications/` | `customer_notifications` | READY |
| `/settings`, `/help`, `/(tabs)/more` | Settings, Help, More hub | preferences, `/meta/version/`, capabilities | – | READY |
| `/send`, `/receive`, `/save` | Send / Receive / Save | none | `customer_payments` NOT_AVAILABLE | V2 (out of boundary) |

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

- `src/api/client.ts` is the only HTTP transport; it is unit-tested (bearer header, single-flight refresh, retry rules, session end vs. connectivity loss).
- Versioned calls use `/api/v1`, send `X-API-Version` and a fresh `X-Request-ID`, use `Authorization: Bearer`, send no cookies, and parse shared Zod contracts from `@tamva/client-contracts` (`customer.ts`, plus shared notification/capability/actor schemas).
- Bearer requests need no CSRF token. (`GET /auth/csrf/` still exists for browser clients.)
- GET retries cover connectivity failures and 502/503/504 only, with backoff. Mutations are never retried automatically.
- Timeouts, offline failures and the backend error envelope become one `ApiError`; `describeError` produces customer-safe text and never repeats server detail. Request IDs are kept for diagnosis.
- No `X-Institution-ID`: customer resources are scoped to the signed-in customer by the backend.

## Authentication and storage (ADR-013)

One identity system, two transports. Admin keeps cookie sessions; Mobile uses a **15-minute bearer access
token and a rotating 30-day refresh token** (`POST /auth/token/`, `/refresh/`, `/revoke/`). Refresh
rotates the pair; presenting a spent refresh token revokes the whole session (reuse detection); logout,
password reset and suspension end sessions. Both resolve to the same `User` and the same ownership/RBAC
checks. Only an **active `CUSTOMER`** enters the customer routes.

Client behaviour: the access token lives in memory only; on any 401 the client performs one
single-flight refresh and one retry, and a refused refresh ends the session and clears storage, while a
connectivity failure keeps the tokens. On native the refresh token is stored **only in SecureStore**
(Keychain/Keystore) with a non-secret last-user hint; nothing is in AsyncStorage. On the web nothing is
persisted, so a reload signs out (deliberate: no refresh token in web storage). Registration collects
email, password, optional name and terms acceptance only.

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

## What remains (deliberately deferred)

- **Provider catalogue and authorization completion (post-launch).** A customer-started connection is created
  `PENDING_AUTHORIZATION`; nothing completes it yet, and customers cannot discover provider codes, so Mobile
  does not offer "add account". Needs a provider/institution catalogue and an OAuth-style completion step.
- **Protection breadth:** only new-device and unusual-location signals exist. Dark-web, breach and
  account-takeover detection are not built and are stated as such in the UI.
- **Balances:** TAMVA holds no provider-authoritative balance, so Home shows observed 30-day money in/out per
  currency and no balance or "available funds".
- **Financial Confidence / Profile per institution:** shown per institution; a single blended number is not invented.
- **Push notifications, MFA, email verification, device management** are not built.
- **Send / Receive / Save:** out of product boundary; routes remain and say so.
- **Web sessions** do not survive a reload by design.
- **Not verified on devices:** screen-reader, dynamic-type and contrast passes; no component-level UI tests
  (only pure-logic tests run in Mobile).

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
