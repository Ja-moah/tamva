import { useState } from "react";
import { cn } from "../../lib/utils/cn";

export type BrandType =
  | "mtn"
  | "telecel"
  | "airteltigo"
  | "apex"
  | "ecobank"
  | "zenith"
  | "ghipss"
  | "bank_generic"
  | "momo_generic";

interface BrandLogoProps {
  brand: BrandType | string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
}

const brandConfig: Record<
  string,
  { name: string; tag: string; src: string; fallbackBg: string; fallbackText: string }
> = {
  mtn: {
    name: "MTN Mobile Money",
    tag: "MoMo Rail",
    src: "",
    fallbackBg: "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]",
    fallbackText: "MTN",
  },
  telecel: {
    name: "Telecel Cash",
    tag: "Cash Rail",
    src: "",
    fallbackBg: "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]",
    fallbackText: "TC",
  },
  airteltigo: {
    name: "AirtelTigo Money",
    tag: "AT Money Rail",
    src: "",
    fallbackBg: "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]",
    fallbackText: "AT",
  },
  apex: {
    name: "Apex Bank PLC",
    tag: "Commercial Core",
    src: "",
    fallbackBg: "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]",
    fallbackText: "APEX",
  },
  ecobank: {
    name: "Ecobank Regional Hub",
    tag: "PAPSS Regional",
    src: "",
    fallbackBg: "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]",
    fallbackText: "ECO",
  },
  zenith: {
    name: "Zenith Digital Trust",
    tag: "FinTech Rail",
    src: "",
    fallbackBg: "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]",
    fallbackText: "ZTH",
  },
  ghipss: {
    name: "GhIPSS National Switch",
    tag: "GIP Core Switch",
    src: "",
    fallbackBg: "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]",
    fallbackText: "GIP",
  },
};

const sizeClasses = {
  sm: "size-7 rounded-lg text-[10px]",
  md: "size-10 rounded-xl text-xs",
  lg: "size-13 rounded-2xl text-sm",
  xl: "size-16 rounded-2xl text-base",
};

export function BrandLogo({
  brand,
  className,
  size = "md",
  showLabel = false,
}: BrandLogoProps) {
  const [hasError, setHasError] = useState(false);
  const normalizedKey = brand.toLowerCase().replace(/[^a-z]/g, "");

  let matchedKey = "bank_generic";
  if (normalizedKey.includes("mtn") || normalizedKey.includes("momo")) matchedKey = "mtn";
  else if (normalizedKey.includes("telecel") || normalizedKey.includes("vodafone")) matchedKey = "telecel";
  else if (normalizedKey.includes("airtel") || normalizedKey.includes("tigo") || normalizedKey.includes("atmoney")) matchedKey = "airteltigo";
  else if (normalizedKey.includes("apex")) matchedKey = "apex";
  else if (normalizedKey.includes("eco")) matchedKey = "ecobank";
  else if (normalizedKey.includes("zenith")) matchedKey = "zenith";
  else if (normalizedKey.includes("ghipss") || normalizedKey.includes("switch")) matchedKey = "ghipss";

  const config = brandConfig[matchedKey] || {
    name: brand,
    tag: "Institutional",
    src: "",
    fallbackBg: "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]",
    fallbackText: brand.slice(0, 3).toUpperCase(),
  };

  return (
    <div className={cn("inline-flex items-center gap-3 select-none", className)}>
      <div
        className={cn(
          "relative shrink-0 flex items-center justify-center overflow-hidden border border-white/10 shadow-sm transition-transform duration-200 hover:scale-105",
          sizeClasses[size],
        )}
      >
        {!hasError && config.src ? (
          <img
            src={config.src}
            alt={config.name}
            className="w-full h-full object-cover"
            onError={() => setHasError(true)}
            loading="lazy"
          />
        ) : (
          <div
            className={cn(
              "w-full h-full flex items-center justify-center font-bold tracking-tight",
              config.fallbackBg,
            )}
          >
            {config.fallbackText}
          </div>
        )}
      </div>

      {showLabel && (
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-[var(--text-primary)] truncate">
            {config.name}
          </span>
          <span className="text-xs text-[var(--text-muted)] font-mono">
            {config.tag}
          </span>
        </div>
      )}
    </div>
  );
}
