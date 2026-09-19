import { cn } from "../../lib/utils/cn";
import { BrandCrest } from "../ui/brand-crest";

export function TamvaMark({ className }: { className?: string }) {
  return (
    <span role="img" aria-label="TAMVA" className="inline-flex shrink-0">
      <BrandCrest className={cn("size-10", className)} />
    </span>
  );
}

export function TamvaLogo({ className }: { surface?: "light" | "dark"; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      <TamvaMark className="size-8" />
      <span className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">TAMVA</span>
    </span>
  );
}
