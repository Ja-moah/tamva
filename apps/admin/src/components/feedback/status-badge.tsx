import { cn } from "../../lib/utils/cn";

export type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

type StatusBadgeProps = {
  children: React.ReactNode;
  tone?: StatusTone;
  pulse?: boolean;
  className?: string;
  size?: "sm" | "md";
};

export function StatusBadge({
  children,
  tone = "neutral",
  pulse = false,
  className,
  size = "md",
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border font-semibold whitespace-nowrap select-none",
        size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
        tone === "success" &&
          "border-[var(--risk-low-border)] bg-[var(--risk-low-bg)] text-[var(--risk-low-text)]",
        tone === "warning" &&
          "border-[var(--risk-med-border)] bg-[var(--risk-med-bg)] text-[var(--risk-med-text)]",
        tone === "danger" &&
          "border-[var(--risk-high-border)] bg-[var(--risk-high-bg)] text-[var(--risk-high-text)]",
        tone === "info" &&
          "border-[var(--border-default)] bg-[var(--bg-surface-hover)] text-[var(--text-primary)]",
        tone === "neutral" &&
          "border-[var(--border-default)] bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)]",
        className,
      )}
    >
      <span
        className={cn(
          "inline-block size-2 rounded-full shrink-0",
          tone === "success" && "bg-[var(--risk-low-text)]",
          tone === "warning" && "bg-[var(--risk-med-text)]",
          tone === "danger" && "bg-[var(--risk-high-text)]",
          tone === "info" && "bg-[var(--accent-gold)]",
          tone === "neutral" && "bg-[var(--text-muted)]",
          pulse && "animate-pulse",
        )}
        aria-hidden="true"
      />
      {children}
    </span>
  );
}