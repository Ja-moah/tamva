import type { StatusTone } from "../components/feedback/status-badge";

/** DRF sends decimals as strings; convert once, at the edge. */
export function toNumber(value: string | number | null | undefined): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function humanize(code: string): string {
  const words = code.replace(/[_:.-]+/g, " ").toLowerCase().trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export interface Formatters {
  dateTime: (iso: string | null | undefined) => string;
  date: (iso: string | null | undefined) => string;
  number: (value: number | string | null | undefined, maximumFractionDigits?: number) => string;
  /** Amounts are always shown in their own currency; TAMVA never converts. */
  money: (amount: number | string | null | undefined, currency: string) => string;
}

export function makeFormatters(locale: string, timeZone: string): Formatters {
  const safe = <T,>(build: () => T, fallback: () => T): T => {
    try {
      return build();
    } catch {
      return fallback();
    }
  };
  const dateTime = safe(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone }),
    () => new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }),
  );
  const date = safe(
    () => new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone }),
    () => new Intl.DateTimeFormat("en", { dateStyle: "medium" }),
  );
  return {
    dateTime: (iso) => (iso ? dateTime.format(new Date(iso)) : "—"),
    date: (iso) => (iso ? date.format(new Date(iso)) : "—"),
    number: (value, maximumFractionDigits = 2) => {
      const n = toNumber(value);
      return n === null
        ? "—"
        : safe(
            () => new Intl.NumberFormat(locale, { maximumFractionDigits }).format(n),
            () => String(n),
          );
    },
    money: (amount, currency) => {
      const n = toNumber(amount);
      if (n === null) return "—";
      return safe(
        () => new Intl.NumberFormat(locale, { style: "currency", currency }).format(n),
        () => `${n} ${currency}`,
      );
    },
  };
}

export const decisionTone = (decision: string | null | undefined): StatusTone =>
  decision === "BLOCK" ? "danger" : decision === "HOLD" || decision === "CHALLENGE" ? "warning" : decision === "ALLOW" ? "success" : "neutral";

export const priorityTone = (priority: string): StatusTone =>
  priority === "CRITICAL" ? "danger" : priority === "HIGH" ? "warning" : priority === "MEDIUM" ? "info" : "neutral";

export const caseStatusTone = (status: string): StatusTone =>
  status === "RESOLVED" ? "success" : status === "OPEN" ? "warning" : "info";

export const severityTone = (severity: string): StatusTone =>
  severity === "CRITICAL" || severity === "HIGH" ? "danger" : severity === "WARNING" ? "warning" : "neutral";

export const DECISION_COLORS: Record<string, string> = {
  ALLOW: "#10b981",
  CHALLENGE: "#f59e0b",
  HOLD: "#f97316",
  BLOCK: "#e11d48",
};
