/**
 * TAMVA Currency & Financial Number Utilities
 *
 * Provides locale-aware, privacy-compatible formatting for financial values.
 */

import { CurrencyCode, TransactionFlow } from '../types/financial';

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  GHS: 'GH₵',
  USD: '$',
  EUR: '€',
  GBP: '£',
  NGN: '₦',
  KES: 'KSh',
};

export interface FormatCurrencyOptions {
  currency?: CurrencyCode;
  showSign?: boolean;
  flow?: TransactionFlow;
  hideDecimals?: boolean;
  compact?: boolean;
}

/**
 * Formats a numeric value into a standard currency string.
 * Example: 12450.5 -> "GH₵ 12,450.50"
 */
export function formatCurrency(
  amount: number,
  options: FormatCurrencyOptions = {}
): string {
  const {
    currency = 'GHS',
    showSign = false,
    flow,
    hideDecimals = false,
    compact = false,
  } = options;

  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  const absAmount = Math.abs(amount);

  let formattedNumber: string;

  if (compact && absAmount >= 1000) {
    if (absAmount >= 1_000_000) {
      formattedNumber = `${(absAmount / 1_000_000).toFixed(1)}M`;
    } else {
      formattedNumber = `${(absAmount / 1_000).toFixed(1)}k`;
    }
  } else {
    formattedNumber = absAmount.toLocaleString('en-US', {
      minimumFractionDigits: hideDecimals ? 0 : 2,
      maximumFractionDigits: hideDecimals ? 0 : 2,
    });
  }

  let signPrefix = '';
  if (showSign) {
    if (flow === 'income' || amount > 0) {
      signPrefix = '+';
    } else if (flow === 'outflow' || amount < 0) {
      signPrefix = '-';
    }
  } else if (amount < 0) {
    signPrefix = '-';
  }

  return `${signPrefix}${symbol} ${formattedNumber}`;
}

/**
 * Masks a currency value for privacy mode.
 * Example: 12450 -> "GH₵ ••••••"
 */
export function maskCurrency(
  currency: CurrencyCode = 'GHS',
  maskCharacter = '••••••'
): string {
  const symbol = CURRENCY_SYMBOLS[currency] || currency;
  return `${symbol} ${maskCharacter}`;
}

/**
 * Masks any embedded currency figures inside descriptive text when privacy mode is active.
 * Example: "GH₵7,200/mo avg" -> "GH₵ ••••••/mo avg"
 */
export function maskEmbeddedCurrency(
  text?: string,
  isPrivate = false
): string {
  if (!text) return '';
  if (!isPrivate) return text;
  return text.replace(/(GH₵|\$|€|£|₦|KSh)\s*[\d,]+(\.\d+)?/g, '$1 ••••••');
}

