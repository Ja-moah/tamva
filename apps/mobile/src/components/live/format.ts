import { makeFormatters } from '../../i18n/format';

export const fmt = makeFormatters();

export const toNumber = (value: string | number | null | undefined): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
};

export const humanize = (code: string): string => {
  const words = code.replace(/[_:.-]+/g, ' ').toLowerCase().trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** Original currency only; the app never converts. */
export const money = (amount: string | number | null | undefined, currency: string) => {
  const n = toNumber(amount);
  return n === null ? '—' : fmt.money(n, currency);
};

/** A plain number in the device locale, or an em dash when the backend sent none. */
export const numText = (value: string | number | null | undefined, digits = 2) => {
  const n = toNumber(value);
  return n === null ? '—' : fmt.number(n, digits);
};
