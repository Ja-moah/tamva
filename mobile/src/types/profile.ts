/**
 * TAMVA Financial Profile Types
 *
 * Domain types for TAMVA's deep financial intelligence profile.
 * Represents customer financial behaviour, stability, cashflow dynamics,
 * analytical dimensions, insights, and data source contributions
 * strictly derived from consented financial accounts.
 */

import { CurrencyCode, FinancialConfidenceRating, ConnectionStatus } from './financial';
import { BadgeTone } from '../components/ui/Badge';
import { FeatherIconName } from '../constants/icons';

export type ProfileStateMode = 'loaded' | 'loading' | 'empty' | 'error';

export type ProfileDimensionId =
  | 'income_consistency'
  | 'financial_stability'
  | 'savings_discipline'
  | 'repayment_behaviour'
  | 'financial_resilience';

export interface ProfileScore {
  score: number;
  maxScore: number;
  rating: FinancialConfidenceRating;
  ratingLabel: string;
  summaryText: string;
  trendLabel?: string; // e.g. "Improving"
  isBureauScore: false;
}

export interface ProfileDimension {
  id: ProfileDimensionId;
  title: string;
  score?: number; // 0 - 100 (optional if building)
  statusLabel: string; // e.g. "Excellent", "Strong"
  description: string;
  trendLabel?: string; // e.g. "Consistent", "Improving"
  icon: FeatherIconName;
  badgeTone: BadgeTone;
}

export interface ProfileCashflow {
  monthlyIncome?: number;
  monthlyOutflow?: number;
  netCashflow?: number;
  savingsRatePercent?: number;
  currency: CurrencyCode;
  supportingNote?: string;
}

export type ProfileInsightType = 'positive' | 'neutral' | 'attention' | 'info';

export interface ProfileInsight {
  id: string;
  type: ProfileInsightType;
  title: string;
  explanation: string;
  badgeLabel: string;
  badgeTone: BadgeTone;
  icon: FeatherIconName;
  supportingMetric?: string;
}

export interface ProfileSource {
  id: string;
  institutionName: string;
  accountType: string;
  status: ConnectionStatus;
  icon: FeatherIconName;
  contribution?: string;
  lastUpdated?: string;
}

export interface ProfileFreshness {
  lastUpdated: string;
  dataWindow: string;
  disclosure: string;
}

export interface FinancialProfileData {
  customer: {
    name: string;
    initials: string;
    memberSince: string;
  };
  score: ProfileScore;
  dimensions: ProfileDimension[];
  cashflow?: ProfileCashflow | null;
  insights: ProfileInsight[];
  sources: ProfileSource[];
  freshness: ProfileFreshness;
}
