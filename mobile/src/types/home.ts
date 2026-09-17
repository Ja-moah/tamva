/**
 * TAMVA Home Screen Data Models
 *
 * Defines domain data structures for the customer Home screen.
 * Designed to seamlessly bind to future backend REST/GraphQL endpoints.
 */

import { CurrencyCode, FinancialConfidenceRating, TransactionSummary } from './financial';
import { FeatherIconName } from '../constants/icons';

export interface UserGreeting {
  greeting: string;
  userName: string;
  avatarUrl?: string;
  initials: string;
  unreadNotificationsCount: number;
}

export interface FinancialConfidenceData {
  score: number;
  maxScore: number;
  rating: FinancialConfidenceRating;
  ratingLabel: string;
  summaryText: string;
  verifiedAccountsCount: number;
}

export interface FinancialOverviewData {
  netPosition: number;
  currency: CurrencyCode;
  monthlyInflow: number;
  monthlyOutflow: number;
  netSavings: number;
  trend: {
    value: number; // e.g. 12.4
    direction: 'up' | 'down' | 'neutral';
    label: string; // e.g. "vs last month"
  };
}

export interface QuickActionItem {
  id: string;
  label: string;
  icon: FeatherIconName;
  route?: string;
  isPrimary?: boolean;
}

export interface FinancialProtectionData {
  status: 'protected' | 'attention_required' | 'syncing';
  statusLabel: string;
  description: string;
  monitoredAccountsCount: number;
  lastVerifiedText: string;
}

export interface HomeScreenData {
  user: UserGreeting;
  confidence: FinancialConfidenceData;
  overview: FinancialOverviewData;
  quickActions: QuickActionItem[];
  protection: FinancialProtectionData;
  recentActivity: TransactionSummary[];
}
