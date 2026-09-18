/**
 * TAMVA Financial UI Types
 *
 * Domain types for financial presentation components.
 * Note: These are presentation contracts, not backend data models.
 */

export type CurrencyCode = 'GHS' | 'USD' | 'EUR' | 'GBP' | 'NGN' | 'KES';

export type TransactionFlow = 'income' | 'outflow' | 'neutral';

export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'scheduled';

export type FinancialConfidenceRating =
  | 'exceptional' // 800+
  | 'very_good'   // 740 - 799
  | 'good'        // 670 - 739
  | 'fair'        // 580 - 669
  | 'developing'; // < 580

export type ConnectionStatus =
  | 'connected'
  | 'syncing'
  | 'attention_required'
  | 'disconnected'
  | 'revoked';

export interface FinancialMetric {
  id: string;
  title: string;
  value: number | string;
  formattedValue?: string;
  supportingText?: string;
  trend?: {
    value: number; // e.g. 8.4
    direction: 'up' | 'down' | 'neutral';
    periodLabel?: string; // e.g. "vs last month"
    isPositiveIndicator?: boolean; // e.g. lower outflow is good
  };
}

export interface FinancialScore {
  score: number;
  maxScore: number;
  label: string;
  rating: FinancialConfidenceRating;
  ratingLabel: string;
  summaryText?: string;
}

export interface TransactionSummary {
  id: string;
  title: string;
  category: string;
  date: string | Date;
  amount: number;
  currency?: CurrencyCode;
  flow: TransactionFlow;
  status?: TransactionStatus;
  iconName?: string;
  accountLabel?: string;
}
