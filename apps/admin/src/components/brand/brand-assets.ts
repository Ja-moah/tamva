import { BRAND_ASSET_FILES, preferredLogoKeys, type BrandAssetKey, type BrandSurface } from "@tamva/brand";

// Every SVG dropped into packages/brand/assets is picked up here with no code
// change. With no files present this is an empty map and components fall
// back to the neutral placeholder.
const discovered = import.meta.glob("../../../../../packages/brand/assets/*.svg", {
  eager: true,
  query: "?url",
  import: "default",
}) as Record<string, string>;

export function brandAssetUrl(key: BrandAssetKey): string | undefined {
  const file = BRAND_ASSET_FILES[key];
  const match = Object.entries(discovered).find(([path]) => path.endsWith(`/${file}`));
  return match?.[1];
}

export function preferredLogoUrl(surface: BrandSurface): string | undefined {
  for (const key of preferredLogoKeys(surface)) {
    const url = brandAssetUrl(key);
    if (url) return url;
  }
  return undefined;
}
