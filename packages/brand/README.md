# @tamva/brand

One canonical source for TAMVA brand assets. Applications own *placement*;
this package owns *the files and their names*.

## Status: official assets are not in the repository yet

No official TAMVA logo file exists in this repo. (The mobile app's
`icon.png` / `splash-icon.png` are Expo's stock template placeholders, not
TAMVA artwork.) This package therefore contains **no drawn substitutes** —
inventing a logo here would quietly become the brand. Until the real files
arrive, applications render a neutral placeholder and flag it
(`data-brand-placeholder="true"`).

## Colour tokens

`tokens/colors.ts` is the canonical TAMVA palette and role map: **primary = deep teal /
dark green**, secondary = emerald/mint, accent = restrained gold, plus blue (info),
amber (warning), red (danger), green (success) and neutral surfaces. Admin maps it to
CSS variables and Mobile to its React Native theme; a test in each app fails if its
values drift from this file. Gold is an institutional accent, never a second primary.

## Reference renders (not assets)

Raster concept renders (`tamva*.png`) may be present locally. They are **references only**:
noisy raster lockups, not the source SVGs, and are neither committed nor wired. Do not
trace or redraw them into SVGs here; the brand owner supplies the official files.

## Add the official files

Drop them into `assets/` with exactly these names; nothing else needs to
change, the applications pick them up automatically:

| File | Use |
| --- | --- |
| `tamva-logo.svg` | Full lockup, neutral surfaces |
| `tamva-logo-light.svg` | Full lockup for light surfaces |
| `tamva-logo-dark.svg` | Full lockup for dark surfaces |
| `tamva-mark.svg` | Compact symbol (sidebar, headers) |
| `tamva-icon.svg` | Square app icon / favicon source |

Mobile additionally needs raster exports (app icon, adaptive icon,
splash) generated from these; that is a mobile build step, not a fork of the
artwork.

## Placement rules

- **Admin:** sidebar/top brand area, sign-in, favicon, loading state.
  Never repeated on every card or page.
- **Mobile:** app icon, splash, sign-in/onboarding, and a compact mark in the
  Home header only.
- **Third-party brands** (banks, mobile-money providers) are *not* TAMVA
  brand assets and do not belong here. Use official assets with documented
  sources (see `apps/mobile/assets/brands/ASSET_SOURCES.md`), never
  hand-drawn imitations.
