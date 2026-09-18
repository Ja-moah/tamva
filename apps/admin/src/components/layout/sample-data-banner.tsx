import { Info } from "lucide-react";

// Every institutional screen currently renders static sample data; none is
// wired to the backend yet. Remove a screen from this notice only when it reads
// from the API (tracked in docs/product/ADMIN_INTEGRATION_AUDIT.md).
export function SampleDataBanner() {
  return (
    <div
      role="status"
      data-testid="sample-data-banner"
      className="flex items-start gap-2 border-b border-[var(--border-default)] bg-[var(--bg-surface-elevated)] px-5 py-2 text-xs text-[var(--text-secondary)]"
    >
      <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
      <span>
        Preview: figures, customers, cases and partners on these screens are sample data, not live TAMVA records.
      </span>
    </div>
  );
}
