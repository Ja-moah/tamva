import { ArrowRightLeft } from "lucide-react";

import { cn } from "../../lib/utils/cn";
import { Card } from "../ui/card";

// The backend has no exchange-rate source, and TAMVA does not ship invented
// rates. This keeps the converter's place in the layout until a licensed,
// attributed rate provider exists (see docs/product/ADMIN_INTEGRATION_AUDIT.md).
export function CurrencyConverterUnavailable({ className }: { className?: string }) {
  return (
    <Card className={cn("p-5", className)} data-capability="currency_conversion" data-state="not-available">
      <div className="flex items-center gap-3">
        <span className="flex size-9 items-center justify-center rounded-lg bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)]">
          <ArrowRightLeft className="size-4" aria-hidden />
        </span>
        <div>
          <h3 className="text-sm font-semibold">Currency converter</h3>
          <p className="text-xs text-[var(--text-secondary)]">Not available</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        No exchange-rate provider is configured, so conversions and cross-border fee estimates are not shown.
      </p>
    </Card>
  );
}
