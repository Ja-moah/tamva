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

## Palette decision (applied)

Deep teal is the TAMVA primary in both clients; gold is a restrained
institutional accent in Admin, not a second primary.

| Token (Admin, `styles/global.css`) | Light | Dark | Mirrors |
| --- | --- | --- | --- |
| `--brand-primary` | `#1a7f64` | `#20a880` | mobile `teal600` / dark `primary` |
| `--brand-primary-hover` | `#146350` | `#2dc298` | mobile `teal700` / dark link |
| `--brand-primary-subtle`, `--brand-primary-border` | teal at 12% / 40% | teal at 16% / 50% | |
| `--brand-on-primary` | `#ffffff` | `#072b23` | |

Used for primary buttons, the active navigation item, focus rings and the time-window control.
Gold (`--accent-gold*`) is kept only for eyebrow labels, small tags and highlights.
Emerald (`--accent-emerald*`) remains trust/success; amber = warning; red = risk; the
existing decision colours are unchanged. The rest of the approved design (glass
surfaces, layout, typography) is untouched.

## Comparison

| Aspect | Mobile | Admin | Alignment |
| --- | --- | --- | --- |
| Typeface | Plus Jakarta Sans (5 weights) | Plus Jakarta Sans + JetBrains Mono, from Google Fonts CDN | Same family. Admin should self-host (hardening). |
| Primary | Teal (`#1A7F64` / dark `#20A880`) | Same teal via `--brand-primary` | **Aligned.** |
| Accent | — | Restrained gold | Admin-only institutional accent. |
| Surfaces | Solid `background/surface/surfaceElevated` | Translucent glass with backdrop blur | Different on purpose: dense operations console vs. personal app. |
| Semantics | success/warning/danger/info with Light/Medium/Dark/Text | `--risk-*` and `--accent-*` CSS variables; chart colours via `DECISION_COLORS` | Equivalent roles; some chart hex literals remain in `lib/format.ts`. |
| Tokens location | `apps/mobile/src/constants/tokens.ts` | CSS variables in `apps/admin/src/styles/global.css` | Still two sources. |
| Theme | light/dark via `ThemeContext` | light/dark via `ThemeProvider` | Equivalent. |

## Recommendation (not implemented)

Extract colour, type and radius tokens to one platform-neutral source (in
`packages/brand`) that generates both the CSS variables and the React Native
constants. Do this when mobile is wired, so the change lands with real screens.

## Out of bounds

- Drawing, redrawing or "approximating" the TAMVA logo or any partner mark.
- Third-party marks without a documented licence/source.
- Wholesale mobile refactor as part of admin integration.
