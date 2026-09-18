# Design system alignment

The admin design is retained as delivered; this records what is shared with
mobile, what differs on purpose, and what is out of bounds.

## Brand assets

`packages/brand` is the single home for official TAMVA assets. It ships a
manifest of expected filenames and **no artwork**:

| Key | File in `packages/brand/assets/` |
| --- | --- |
| logo / logoLight / logoDark | `tamva-logo.svg`, `tamva-logo-light.svg`, `tamva-logo-dark.svg` |
| mark | `tamva-mark.svg` |
| icon (favicon) | `tamva-icon.svg` |

**No official logo exists in the repository.** The mobile app's icon files are
Expo defaults. Rather than draw one, the admin discovers assets with
`import.meta.glob` and renders a plainly labelled placeholder
(`data-brand-placeholder="true"`: a dashed "T" tile, or the word "TAMVA") until
the files are added. Favicon is emitted only if `tamva-icon.svg` exists. **Action
for the brand owner: drop the official SVGs into `packages/brand/assets/`.** No
code change is needed.

Removed as fabricated or unlicensed: the invented `BrandCrest`, an invented
favicon, and seven SVGs imitating MTN MoMo, Telecel Cash, AirtelTigo, GhIPSS,
Ecobank, Apex Bank and Zenith Bank. Partner tiles now fall back to a neutral
initials tile; official partner marks may be added only with the same
provenance record mobile keeps in `ASSET_SOURCES.md`.

The tagline "People • Data • Trust • Opportunity" is unverified and should be
confirmed before use.

## Comparison

| Aspect | Mobile | Admin | Alignment |
| --- | --- | --- | --- |
| Typeface | Plus Jakarta Sans (5 weights) | Plus Jakarta Sans + JetBrains Mono, from Google Fonts CDN | Same family. Admin should self-host. |
| Primary | Teal (`#20A880` dark / teal-600 light) | Gold (`--accent-gold #c68a00`) + emerald (`--accent-emerald #059669`) | **Differs.** Sem's admin palette is gold/emerald with a glass/ios-glass surface; mobile is calm teal. Decision needed on whether the admin adopts mobile's teal as primary or the product keeps a distinct institutional accent. Not changed here. |
| Surfaces | Solid `background/surface/surfaceElevated` | Translucent `--bg-surface` with backdrop blur | Different treatment; both light/dark. |
| Semantics | success/warning/danger/info with Light/Medium/Dark/Text | emerald/amber/rose used ad hoc via Tailwind classes and hex in charts | Admin should route chart/status colours through tokens. Several hex literals are inline in the analytics and security data. |
| Tokens location | `apps/mobile/src/constants/tokens.ts` | CSS variables in `apps/admin/src/styles/global.css` | Two sources. |
| Theme | light/dark via `ThemeContext` | light/dark via `ThemeProvider` + `data-theme` | Equivalent behaviour. |
| Radius / spacing | scale in tokens | Tailwind defaults | Not unified. |

## Recommendation (not implemented)

1. Keep the admin visual language; the user has approved it.
2. Extract colour, type and radius tokens to a platform-neutral
   `packages/brand` (or `packages/tokens`) JSON once the accent decision is
   made, generating both the CSS variables and the React Native constants.
3. Do this after the admin is wired; a token refactor now would touch every
   screen and every mobile component for no functional gain.

## Out of bounds

- Drawing, redrawing or "approximating" the TAMVA logo or any partner mark.
- Third-party marks without a documented licence/source.
- Wholesale mobile refactor as part of admin integration.
