import type { LucideIcon } from "lucide-react";

import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/feedback/status-badge";

type DomainPageProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function DomainPage({ title, description, icon: Icon }: DomainPageProps) {
  return (
    <div className="space-y-6">
      <div className="border-b border-[var(--border-subtle)] pb-5">
        <StatusBadge tone="neutral" size="md">API Specification Pending</StatusBadge>
        <h1 className="mt-3 text-2xl font-bold tracking-tight text-[var(--text-primary)] sm:text-3xl">{title}</h1>
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">{description}</p>
      </div>
      <Card className="grid min-h-[340px] place-items-center p-8 text-center border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="max-w-md">
          <span className="mx-auto grid size-12 place-items-center rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--accent-gold)]">
            <Icon className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-lg font-semibold text-[var(--text-primary)]">Authoritative Schema Validation</h2>
          <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
            This module awaits the authoritative backend schema contract. The console automatically activates when Django exposes its reviewed <code className="font-mono text-[var(--accent-gold)] text-xs font-semibold px-1.5 py-0.5 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-default)]">/api/v1/</code> spec.
          </p>
        </div>
      </Card>
    </div>
  );
}

