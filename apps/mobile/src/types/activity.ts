/**
 * TAMVA Financial Activity UI Types
 *
 * Types and contracts for the Financial Activity screen:
 * Transactions, Cashflow Summary, Grouping, and Filtering.
 */

import { CurrencyCode, TransactionFlow, TransactionStatus } from './financial';
import { FeatherIconName } from '../constants/icons';

export type ActivityFilterId = 'all' | 'income' | 'outflow' | 'transfers' | 'savings';

export interface ActivityFilterOption {
  id: ActivityFilterId;
  label: string;
  icon?: FeatherIconName;
  count?: number;
}

export interface ActivityTransaction {
  id: string;
  title: string;
  category: string;
  date: string; // ISO date string or human date
  rawDate: string; // YYYY-MM-DD for grouping/sorting
  amount: number;
  currency: CurrencyCode;
  flow: TransactionFlow;
  status: TransactionStatus;
  accountLabel: string; // e.g. "GCB •• 4021", "CalBank Vault"
  icon: FeatherIconName;
  categoryTag?: 'income' | 'outflow' | 'transfers' | 'savings';
  merchantLogo?: string;
  note?: string;
}

export interface ActivitySummary {
  periodLabel: string; // e.g., "September 2026"
  totalInflow: number;
  totalOutflow: number;
  netCashflow: number;
  currency: CurrencyCode;
}

export interface ActivityDateGroup {
  title: string; // e.g., "TODAY", "YESTERDAY", "EARLIER THIS MONTH"
  dateKey: string; // sort key
  data: ActivityTransaction[];
}

export interface ActivityScreenData {
  summary: ActivitySummary;
  groups: ActivityDateGroup[];
  totalTransactionCount: number;
}

export type ActivityStateMode = 'loaded' | 'loading' | 'empty' | 'error';

export interface ActivitySecondaryFilters {
  status: TransactionStatus | 'all';
  account: string | 'all';
}
