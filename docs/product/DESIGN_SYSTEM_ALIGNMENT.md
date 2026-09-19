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

**No production logo asset exists in the repository.** The mobile app's icon files are
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

A dark, glowing concept render was placed at `packages/brand/assets/tamva.png`
(1536×1024 PNG, near-invisible wordmark). It is **not committed and not wired**:
the manifest expects clean SVG lockups (`tamva-logo*.svg`, `tamva-mark.svg`,
`tamva-icon.svg`) and a raster splash image is not one. It does show the mark's
palette (mint/emerald on near-black, consistent with the teal decision below) and
the tagline written as "People. Data. Trust. Opportunity." — the sidebar still
uses bullets; align it once the brand owner confirms the punctuation.

## Canonical palette (applied)

Source of truth: `packages/brand/tokens/colors.ts`. **Deep teal / dark green is the TAMVA identity in
every client**; gold is an institutional accent only.

| Role | Light | Dark | Use |
| --- | --- | --- | --- |
| Primary | `#1A7F64` (teal 600) | `#20A880` | Primary actions, active navigation, focus, brand surfaces |
| Primary hover | `#146350` | `#2DC298` | |
| Secondary | `#059669` (emerald 600); mint `#6EE7B7` for highlights | `#10B981` | Trust and positive emphasis |
| Accent | `#C68A00` (gold) | `#C68A00` | Eyebrow labels, small tags, institutional highlights. Never a primary. |
| Info | `#1570EF` | `#2E90FA` | Informational |
| Warning | `#DC6803` | `#F79009` | |
| Danger / risk | `#D92D20` | `#F04438` | |
| Success | `#059652` | `#12B76A` | |
| Neutral | white, `#F7F8FA` … `#111827` | dark surfaces | Surfaces and text |

Admin maps the roles to CSS variables (`--brand-primary*`, `--accent-gold*`, `--accent-emerald*`); Mobile
takes its primitives and dark primary from the same file. A drift test in each app fails if its values
diverge from the tokens. Layouts, glass surfaces and typography are unchanged.

## Comparison

| Aspect | Mobile | Admin | Alignment |
| --- | --- | --- | --- |
| Typeface | Plus Jakarta Sans (5 weights) | Plus Jakarta Sans + JetBrains Mono, self-hosted (`@fontsource-variable`) | Same family; no third-party font CDN. |
| Primary | Teal (`#1A7F64` / dark `#20A880`) | Same teal via `--brand-primary` | **Aligned.** |
| Accent | — | Restrained gold | Admin-only institutional accent. |
| Surfaces | Solid `background/surface/surfaceElevated` | Translucent glass with backdrop blur | Different on purpose: dense operations console vs. personal app. |
| Semantics | success/warning/danger/info with Light/Medium/Dark/Text | `--risk-*` and `--accent-*` CSS variables; chart colours via `DECISION_COLORS` | Equivalent roles; some chart hex literals remain in `lib/format.ts`. |
| Tokens location | `apps/mobile/src/constants/tokens.ts` | CSS variables in `apps/admin/src/styles/global.css` | Still two sources. |
| Theme | light/dark via `ThemeContext` | light/dark via `ThemeProvider` | Equivalent. |

## Mobile integration

The existing customer visual system remains intact. Integration added only shared
runtime states: demo disclosure, offline recovery, capability-unavailable
messaging, and a live consent list. Backend capability state—not placeholder
content—now decides what normal builds render. Demo fixtures live under
`apps/mobile/src/demo` and are available only through explicitly labelled demo
mode.

Money and dates now pass through the locale-aware Mobile formatter. It preserves
the record's ISO currency and never performs an unlicensed conversion.

## Recommendation (not implemented)

Extract colour, type and radius tokens to one platform-neutral source (in
`packages/brand`) that generates both the CSS variables and the React Native
constants. Do this as a separate design-system change; Mobile API integration
does not justify a wholesale visual refactor.

## Out of bounds

- Drawing, redrawing or "approximating" the TAMVA logo or any partner mark.
- Third-party marks without a documented licence/source.
- Wholesale client refactors as part of API integration.
