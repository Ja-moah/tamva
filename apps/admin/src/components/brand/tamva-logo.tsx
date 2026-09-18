import { BRAND_NAME, type BrandSurface } from "@tamva/brand";

import { cn } from "../../lib/utils/cn";
import { brandAssetUrl, preferredLogoUrl } from "./brand-assets";

/**
 * Compact TAMVA symbol. Renders the official `tamva-mark.svg` when it exists
 * in packages/brand; otherwise a neutral monogram tile that is explicitly
 * flagged as a placeholder. It is not a logo and must not be shipped as one.
 */
export function TamvaMark({ className }: { className?: string }) {
  const src = brandAssetUrl("mark");
  if (src) {
    return <img src={src} alt={BRAND_NAME} className={cn("size-10 shrink-0 select-none", className)} />;
  }
  return (
    <span
      role="img"
      aria-label={BRAND_NAME}
      data-brand-placeholder="true"
      className={cn(
        "inline-grid size-10 shrink-0 select-none place-items-center rounded-2xl border border-dashed",
        "border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-sm font-extrabold text-[var(--text-secondary)]",
        className,
      )}
    >
      T
    </span>
  );
}

/**
 * Full TAMVA lockup for a given surface. Falls back to the product name set
 * as plain text (not a drawn mark) until the official file is provided.
 */
export function TamvaLogo({ surface = "light", className }: { surface?: BrandSurface; className?: string }) {
  const src = preferredLogoUrl(surface);
  if (src) {
    return <img src={src} alt={BRAND_NAME} className={cn("h-8 w-auto select-none", className)} />;
  }
  return (
    <span
      data-brand-placeholder="true"
      className={cn("text-xl font-extrabold tracking-tight text-[var(--text-primary)] select-none", className)}
    >
      {BRAND_NAME}
    </span>
  );
}
