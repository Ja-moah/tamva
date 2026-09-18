import { cn } from "../../lib/utils/cn";

type StatusBadgeProps = {
  children: string;
  tone?: "neutral" | "success" | "warning";
};

export function StatusBadge({ children, tone = "neutral" }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold",
        tone === "success" && "border-emerald-400/20 bg-emerald-400/10 text-emerald-200",
        tone === "warning" && "border-amber-400/20 bg-amber-400/10 text-amber-200",
        tone === "neutral" && "border-white/10 bg-white/5 text-slate-300",
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {children}
    </span>
  );
}
