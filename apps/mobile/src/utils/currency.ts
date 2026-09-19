/**
 * TAMVA Currency & Financial Number Utilities
 *
 * Provides locale-aware, privacy-compatible formatting for financial values.
 */

import { CurrencyCode, TransactionFlow } from '../types/financial';
import { makeFormatters } from '../i18n/format';

export interface FormatCurrencyOptions {
  /** The currency the amount was recorded in. There is deliberately no default. */
  currency: CurrencyCode;
  showSign?: boolean;
  flow?: TransactionFlow;
  hideDecimals?: boolean;
  compact?: boolean;
}

/**
 * Formats an amount in the currency it was recorded in, in the device locale.
 * It never converts between currencies.
 */
export function formatCurrency(amount: number, options: FormatCurrencyOptions): string {
  const { currency, showSign = false, flow, hideDecimals = false, compact = false } = options;
  const signed = flow === 'outflow' && amount > 0 ? -amount : flow === 'income' && amount < 0 ? -amount : amount;
  return makeFormatters().money(signed, currency, { showSign, hideDecimals, compact });
}

/** Masks a currency value for privacy mode, e.g. "GH₵ ••••••" in an en-GH locale. */
export function maskCurrency(currency: CurrencyCode): string {
  return makeFormatters().maskedMoney(currency);
}

/**
 * Masks any currency figures embedded in descriptive text when privacy mode is
 * active. Matches an ISO code or currency symbol followed by digits.
 */
export function maskEmbeddedCurrency(text?: string, isPrivate = false): string {
  if (!text) return '';
  if (!isPrivate) return text;
  return text.replace(/([A-Z]{3}|\p{Sc}[A-Za-z]*)\s*[\d,]+(\.\d+)?/gu, '$1 ••••••');
}
