import type { ReactNode } from "react";

import { cn } from "../../lib/utils/cn";
import { Card } from "../ui/card";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? (
          <p className="mb-1 font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--accent-gold)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-3xl">{title}</h1>
        {description ? (
          <p className="mt-1.5 max-w-3xl text-sm font-medium leading-relaxed text-[var(--text-secondary)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function StatCard({
  label,
  value,
  hint,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: "neutral" | "danger" | "warning" | "success";
}) {
  return (
    <Card className="ios-glass-card p-5">
      <p className="font-mono text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">{label}</p>
      <p
        className={cn(
          "font-tabular mt-2 text-3xl font-extrabold text-[var(--text-primary)]",
          tone === "danger" && "text-[var(--risk-high-text)]",
          tone === "warning" && "text-[var(--risk-med-text)]",
          tone === "success" && "text-[var(--risk-low-text)]",
        )}
      >
        {value}
      </p>
      {hint ? <p className="mt-1.5 text-xs font-medium text-[var(--text-secondary)]">{hint}</p> : null}
    </Card>
  );
}

export function Section({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("ios-glass-card p-5", className)}>
      <h2 className="text-base font-extrabold text-[var(--text-primary)]">{title}</h2>
      {description ? <p className="mb-3 mt-0.5 text-xs text-[var(--text-secondary)]">{description}</p> : <div className="mb-3" />}
      {children}
    </Card>
  );
}

/** Key/value counts as a compact definition list. */
export function CountList({ counts, format }: { counts: Record<string, number>; format?: (key: string) => string }) {
  const entries = Object.entries(counts);
  if (entries.length === 0) return <p className="text-xs text-[var(--text-muted)]">No data yet.</p>;
  return (
    <dl className="space-y-1.5 text-xs">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-center justify-between gap-3">
          <dt className="text-[var(--text-secondary)]">{format ? format(key) : key}</dt>
          <dd className="font-tabular font-bold text-[var(--text-primary)]">{value.toLocaleString()}</dd>
        </div>
      ))}
    </dl>
  );
}

const windowOptions = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
] as const;

export function WindowPicker({ days, onChange }: { days: number; onChange: (days: number) => void }) {
  return (
    <div role="group" aria-label="Time window" className="inline-flex overflow-hidden rounded-lg border border-[var(--border-default)]">
      {windowOptions.map((option) => (
        <button
          key={option.days}
          type="button"
          aria-pressed={days === option.days}
          onClick={() => onChange(option.days)}
          className={cn(
            "cursor-pointer px-3 py-1.5 text-xs font-bold",
            days === option.days
              ? "bg-[var(--brand-primary)] text-[var(--brand-on-primary)]"
              : "bg-[var(--bg-surface)] text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)]",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
