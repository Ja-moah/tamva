# Known limitations and decisions

## Customer web session

The customer web app (Expo web export) keeps the access token in memory and **persists nothing**: a page
reload signs the customer out. This is deliberate: a refresh token in `localStorage` is readable by any
script on the page. Native builds keep the refresh token only in the OS keychain (SecureStore). If a
persistent web session becomes a product requirement, the safe design is an `HttpOnly` `SameSite`
refresh cookie on `api.<domain>` with CSRF protection, which needs a small backend addition; it is not
built.

## API documentation exposure

Decision: the interactive docs (`/api/docs/`, `/api/redoc/`) and the schema endpoint are **off in
production** (`API_DOCS_ENABLED=false`) because they enumerate every route and field for anonymous
visitors. They are on in development. The Caddy `docs.<domain>` host is wired but returns 404 until the
flag is enabled; if it is enabled, restrict it (IP allow-list or basic auth) at the edge. The schema
itself remains a checked artifact (`packages/contracts/openapi/schema.yml`) and must generate with zero
warnings (`spectacular --validate --fail-on-warn`); it does not depend on the URLs being exposed.

## Provider catalogue (post-launch)

A customer can list and disconnect connections, and a connection they start is created
`PENDING_AUTHORIZATION`. There is no customer-facing catalogue of providers and no provider
authorization completion step, so Mobile does not offer "add account". This is documented as
**post-launch work**: it needs a provider/institution catalogue API and an OAuth-style completion flow
with each provider.

## Brand assets

No official TAMVA logo files exist in the repository. Admin renders a plainly labelled placeholder
(`data-brand-placeholder="true"`) and no favicon; Mobile still uses Expo's stock icon and splash. The
concept renders under `packages/brand/assets/*.png` are reference only and are neither committed nor
wired. Supplying the official SVGs (`tamva-logo*.svg`, `tamva-mark.svg`, `tamva-icon.svg`) needs no code
change; the Mobile app icon and splash must be replaced before a store submission.

## Other deferred items

Email verification, push notifications, MFA, advanced fraud/security analytics, dark-web/breach/
account-takeover detection, balances, Send/Receive/Save (out of the product boundary), team
invitations, webhook delivery, and scheduled/analytics exports. See the product audits in
`docs/product/`.

## Operational notes

* Single host: one failure domain. No high availability.
* Redis is not durable storage; queued exports are recovered by `fail_stale_exports`, not replayed.
* Mobile builds bake in their API URL; changing the domain means a new build (web included).
