/**
 * The one place amounts, dates and numbers are formatted.
 *
 * Money is always shown in the currency it was recorded in and is never
 * converted: TAMVA has no approved exchange-rate source. The locale is the
 * device's, so nothing here assumes a country, currency symbol or time zone.
 */

export function deviceLocale(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || 'en';
  } catch {
    return 'en';
  }
}

export interface MoneyOptions {
  showSign?: boolean;
  hideDecimals?: boolean;
  compact?: boolean;
}

export interface Formatters {
  locale: string;
  money(amount: number, currency: string, options?: MoneyOptions): string;
  /** A same-width placeholder for privacy mode, keeping the currency visible. */
  maskedMoney(currency: string): string;
  number(value: number, maximumFractionDigits?: number): string;
  date(value: string | Date | null | undefined): string;
  dateTime(value: string | Date | null | undefined): string;
  /** "in 3 days", "2 hours ago" — falls back to the date if unsupported. */
  relative(value: string | Date, now?: Date): string;
}

const attempt = <T>(build: () => T, fallback: () => T): T => {
  try {
    return build();
  } catch {
    return fallback();
  }
};

export function makeFormatters(locale: string = deviceLocale(), timeZone?: string): Formatters {
  const dateFmt = attempt(
    () => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone }),
    () => new Intl.DateTimeFormat('en', { dateStyle: 'medium' })
  );
  const dateTimeFmt = attempt(
    () => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone }),
    () => new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' })
  );
  const asDate = (v: string | Date) => (v instanceof Date ? v : new Date(v));

  return {
    locale,
    money(amount, currency, options = {}) {
      const { showSign = false, hideDecimals = false, compact = false } = options;
      const code = currency.toUpperCase();
      const digits = hideDecimals ? 0 : 2;
      return attempt(
        () =>
          new Intl.NumberFormat(locale, {
            style: 'currency',
            currency: code,
            signDisplay: showSign ? 'exceptZero' : 'auto',
            ...(compact
              ? { notation: 'compact' as const, maximumFractionDigits: 1 }
              : { minimumFractionDigits: digits, maximumFractionDigits: digits }),
          }).format(amount),
        () => `${code} ${amount.toFixed(digits)}`
      );
    },
    maskedMoney(currency) {
      const code = currency.toUpperCase();
      const symbol = attempt(
        () =>
          new Intl.NumberFormat(locale, { style: 'currency', currency: code })
            .formatToParts(0)
            .find((part) => part.type === 'currency')?.value ?? code,
        () => code
      );
      return `${symbol} ••••••`;
    },
    number(value, maximumFractionDigits = 2) {
      return attempt(
        () => new Intl.NumberFormat(locale, { maximumFractionDigits }).format(value),
        () => String(value)
      );
    },
    date(value) {
      if (!value) return '—';
      const d = asDate(value);
      return Number.isNaN(d.getTime()) ? '—' : dateFmt.format(d);
    },
    dateTime(value) {
      if (!value) return '—';
      const d = asDate(value);
      return Number.isNaN(d.getTime()) ? '—' : dateTimeFmt.format(d);
    },
    relative(value, now = new Date()) {
      const d = asDate(value);
      if (Number.isNaN(d.getTime())) return '—';
      const seconds = Math.round((d.getTime() - now.getTime()) / 1000);
      const units: [Intl.RelativeTimeFormatUnit, number][] = [
        ['day', 86_400],
        ['hour', 3_600],
        ['minute', 60],
      ];
      for (const [unit, size] of units) {
        if (Math.abs(seconds) >= size) {
          return attempt(
            () => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(Math.round(seconds / size), unit),
            () => dateFmt.format(d)
          );
        }
      }
      return attempt(
        () => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(seconds, 'second'),
        () => dateFmt.format(d)
      );
    },
  };
}
