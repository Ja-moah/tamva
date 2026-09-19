/**
 * TAMVA brand manifest.
 *
 * The files listed here are the ONLY logo assets applications may use, and
 * they live in `packages/brand/assets/`. This package deliberately ships no
 * drawn stand-ins: until the official files are added, applications render a
 * neutral, clearly-marked placeholder (see `apps/admin/src/components/brand`).
 */
export const BRAND_NAME = "TAMVA";

export const BRAND_ASSET_FILES = {
  /** Full lockup, for neutral surfaces. */
  logo: "tamva-logo.svg",
  /** Full lockup for light surfaces. */
  logoLight: "tamva-logo-light.svg",
  /** Full lockup for dark surfaces. */
  logoDark: "tamva-logo-dark.svg",
  /** Compact symbol without the wordmark. */
  mark: "tamva-mark.svg",
  /** Square app/favicon icon. */
  icon: "tamva-icon.svg",
} as const;

export type BrandAssetKey = keyof typeof BRAND_ASSET_FILES;
export type BrandSurface = "light" | "dark";

/** Which asset to prefer for the full logo on a given surface. */
export function preferredLogoKeys(surface: BrandSurface): BrandAssetKey[] {
  return surface === "dark" ? ["logoDark", "logo"] : ["logoLight", "logo"];
}

export * from "../tokens/colors";
