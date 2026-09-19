/**
 * TAMVA Financial Profile Mock Data
 *
 * Presentation-grade demonstration data for the Financial Profile screen.
 * Internally consistent with Home, Activity, Connected Accounts, and Passport.
 * Profile holder: Karim Salifu
 */

import { FinancialProfileData } from '../../types/profile';

export const mockProfileData: FinancialProfileData = {
  customer: {
    name: 'Karim Salifu',
    initials: 'KS',
    memberSince: 'January 2024',
  },
  score: {
    score: 780,
    maxScore: 850,
    rating: 'exceptional',
    ratingLabel: 'Exceptional',
    summaryText:
      'Strong transaction regularity, healthy operating balances, and active consent validation across verified accounts.',
    trendLabel: 'Improving',
    isBureauScore: false,
  },
  dimensions: [
    {
      id: 'income_consistency',
      title: 'Income Consistency',
      score: 94,
      statusLabel: 'Excellent',
      trendLabel: 'Consistent',
      description:
        'Salary and deposit regularity maintained across primary accounts for 12+ consecutive months.',
      icon: 'trending-up',
      badgeTone: 'success',
    },
    {
      id: 'financial_stability',
      title: 'Financial Stability',
      score: 88,
      statusLabel: 'Strong',
      trendLabel: 'Stable',
      description:
        'Healthy operational balances sustained with zero recorded overdrafts or negative balance events.',
      icon: 'shield',
      badgeTone: 'success',
    },
    {
      id: 'savings_discipline',
      title: 'Savings Discipline',
      score: 85,
      statusLabel: 'Strong',
      trendLabel: 'Improving',
      description:
        'Consistently retains over half of net monthly cash inflow into dedicated savings accounts.',
      icon: 'pie-chart',
      badgeTone: 'information',
    },
    {
      id: 'repayment_behaviour',
      title: 'Repayment Behaviour',
      score: 96,
      statusLabel: 'Excellent',
      trendLabel: 'Consistent',
      description:
        'Timely settlement of recurring utility and subscription obligations with no late penalties.',
      icon: 'check-circle',
      badgeTone: 'success',
    },
    {
      id: 'financial_resilience',
      title: 'Financial Resilience',
      score: 82,
      statusLabel: 'Strong',
      trendLabel: 'Improving',
      description:
        'Liquid cash reserves provide an estimated 8.2 months of regular outflow coverage.',
      icon: 'activity',
      badgeTone: 'information',
    },
  ],
  cashflow: {
    monthlyIncome: 7200.0,
    monthlyOutflow: 3450.0,
    netCashflow: 3750.0,
    savingsRatePercent: 52.1,
    currency: 'GHS',
    supportingNote:
      'GH₵3,750 net surplus retained on average across consented accounts each month.',
  },
  insights: [
    {
      id: 'insight-1',
      type: 'positive',
      title: 'Consistent Inflow Stream',
      explanation:
        'Regular monthly salary deposits from verified corporate sources recorded across 12 consecutive months.',
      badgeLabel: 'Stable Inflow',
      badgeTone: 'success',
      icon: 'trending-up',
      supportingMetric: 'GH₵7,200/mo avg',
    },
    {
      id: 'insight-2',
      type: 'positive',
      title: 'High Savings Retention',
      explanation:
        'You retain approximately 52.1% of monthly income, placing your savings discipline in a strong financial position.',
      badgeLabel: 'Strong Savings',
      badgeTone: 'success',
      icon: 'pie-chart',
      supportingMetric: '52.1% rate',
    },
    {
      id: 'insight-3',
      type: 'info',
      title: 'Resilient Buffer Runway',
      explanation:
        'Consolidated liquid balances across connected accounts cover approximately 8.2 months of regular expenses.',
      badgeLabel: '8.2 Months',
      badgeTone: 'information',
      icon: 'shield',
      supportingMetric: '8.2 mo coverage',
    },
    {
      id: 'insight-4',
      type: 'neutral',
      title: 'Multi-Institution Diversification',
      explanation:
        'Financial profile derived across 4 active institutions, reducing single-point data dependency.',
      badgeLabel: '4 Sources',
      badgeTone: 'neutral',
      icon: 'link-2',
      supportingMetric: '4 accounts',
    },
  ],
  sources: [
    {
      id: 'src-001',
      institutionName: 'GCB Bank',
      accountType: 'Main Checking',
      status: 'connected',
      icon: 'credit-card',
      contribution: 'Primary salary inflow & recurring payments',
      lastUpdated: 'Today, 09:15',
    },
    {
      id: 'src-002',
      institutionName: 'Stanbic Bank Ghana',
      accountType: 'Executive Savings',
      status: 'connected',
      icon: 'credit-card',
      contribution: 'Liquid emergency reserves & deposits',
      lastUpdated: 'Today, 08:30',
    },
    {
      id: 'src-003',
      institutionName: 'MTN Mobile Money',
      accountType: 'Primary MoMo Wallet',
      status: 'syncing',
      icon: 'smartphone',
      contribution: 'Retail transactions & mobile transfers',
      lastUpdated: 'Yesterday, 19:40',
    },
    {
      id: 'src-004',
      institutionName: 'CalBank',
      accountType: 'Investment Vault',
      status: 'connected',
      icon: 'credit-card',
      contribution: 'Long-term savings & investment yields',
      lastUpdated: '12 Sep 2026',
    },
  ],
  freshness: {
    lastUpdated: 'Updated just now',
    dataWindow: '12-month consented window',
    disclosure:
      'Based on your consented financial activity. Not a credit bureau score or government credential.',
  },
};

/**
 * Empty mock state representing a customer with no connected accounts.
 */
export const mockEmptyProfileData: FinancialProfileData | null = null;
