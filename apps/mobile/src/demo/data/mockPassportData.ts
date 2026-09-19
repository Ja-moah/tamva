/**
 * TAMVA Financial Passport Mock Data
 *
 * Presentation-grade demonstration data for the Financial Passport.
 * Unified with existing Home and Connected Accounts data for Karim Salifu.
 */

import {
  FinancialPassportData,
  PassportSharePurposeItem,
  PassportShareScopeItem,
  PassportShareDurationItem,
  PassportShareRecord,
} from '../../types/passport';

export const PASSPORT_SHARE_PURPOSES: PassportSharePurposeItem[] = [
  {
    id: 'loan',
    label: 'Loan Application',
    description: 'Financial institutions evaluating credit and debt capacity.',
    icon: 'credit-card',
  },
  {
    id: 'rental',
    label: 'Rental Application',
    description: 'Landlords and leasing agents reviewing rent affordability.',
    icon: 'home',
  },
  {
    id: 'financial_service',
    label: 'Financial Service',
    description: 'Advisors and wealth platforms assessing overall standing.',
    icon: 'trending-up',
  },
  {
    id: 'employment',
    label: 'Employment Verification',
    description: 'Employers conducting financial standing background checks.',
    icon: 'briefcase',
  },
  {
    id: 'other',
    label: 'Other Purpose',
    description: 'Custom sharing purpose for private counterparties.',
    icon: 'more-horizontal',
  },
];

export const PASSPORT_SHARE_SCOPES: PassportShareScopeItem[] = [
  {
    id: 'identity',
    title: 'Identity & Standing Status',
    description:
      'Holder name, demo Passport ID, verification status, and tenure.',
    isRequired: true,
    icon: 'user-check',
  },
  {
    id: 'confidence',
    title: 'Financial Confidence',
    description: 'Calibrated 780 / 850 score, tier level, and non-bureau summary.',
    isRequired: false,
    icon: 'shield',
  },
  {
    id: 'financial_position',
    title: 'Financial Position',
    description: 'Total verified net position across consented accounts.',
    isRequired: false,
    icon: 'credit-card',
  },
  {
    id: 'cashflow',
    title: 'Income & Cashflow',
    description: 'Monthly salary inflow, outflow volume, and savings rate.',
    isRequired: false,
    icon: 'activity',
  },
  {
    id: 'behaviour',
    title: 'Behavioural Intelligence',
    description:
      '5 behavioral dimensions including consistency, stability, and resilience.',
    isRequired: false,
    icon: 'check-circle',
  },
  {
    id: 'institutions',
    title: 'Connected Institutions',
    description:
      'List of 4 contributing Ghanaian institutions powering this profile.',
    isRequired: false,
    icon: 'link-2',
  },
];

export const PASSPORT_SHARE_DURATIONS: PassportShareDurationItem[] = [
  {
    id: '7_days',
    label: '7 Days',
    description: 'Short review window for fast approvals.',
    days: 7,
  },
  {
    id: '30_days',
    label: '30 Days (Recommended)',
    description: 'Standard duration for most application processes.',
    days: 30,
    isDefault: true,
  },
  {
    id: '90_days',
    label: '90 Days',
    description: 'Extended timeframe for multi-stage evaluations.',
    days: 90,
  },
  {
    id: 'until_revoked',
    label: 'Until Revoked',
    description: 'Continuous access until you manually cancel it.',
  },
];

export const mockInitialShareHistory: PassportShareRecord[] = [
  {
    id: 'SHR-48192-TVA',
    purposeId: 'rental',
    purposeLabel: 'Rental Application',
    customPurposeNote: 'Apex Heights Apartments Lease Verification',
    scopes: ['identity', 'confidence', 'financial_position', 'cashflow'],
    durationId: '30_days',
    durationLabel: '30 Days',
    createdAt: '12 Jan 2026',
    expiresAt: '11 Feb 2026',
    createdAtTimestamp: new Date('2026-01-12T10:00:00Z').getTime(),
    expiresAtTimestamp: new Date('2026-02-11T10:00:00Z').getTime(),
    status: 'revoked',
    demoQrCode: 'tamva-demo://share/SHR-48192-TVA',
    shareUrl: 'https://demo.tamva.com/share/SHR-48192-TVA',
  },
  {
    id: 'SHR-31094-TVA',
    purposeId: 'employment',
    purposeLabel: 'Employment Verification',
    customPurposeNote: 'Standard Background Check',
    scopes: ['identity', 'confidence'],
    durationId: '7_days',
    durationLabel: '7 Days',
    createdAt: '01 Jan 2026',
    expiresAt: '08 Jan 2026',
    createdAtTimestamp: new Date('2026-01-01T10:00:00Z').getTime(),
    expiresAtTimestamp: new Date('2026-01-08T10:00:00Z').getTime(),
    status: 'expired',
    demoQrCode: 'tamva-demo://share/SHR-31094-TVA',
    shareUrl: 'https://demo.tamva.com/share/SHR-31094-TVA',
  },
];

export const mockFinancialPassportData: FinancialPassportData = {
  identity: {
    holderName: 'Karim Salifu',
    initials: 'KS',
    passportId: 'TVA-PASS-004821',
    status: 'active',
    statusLabel: 'Active Profile',
    memberSince: 'January 2024',
    jurisdiction: 'Ghana (GHS)',
  },
  confidence: {
    score: 780,
    maxScore: 850,
    rating: 'exceptional',
    ratingLabel: 'Exceptional',
    summaryText:
      'Derived from 4 connected institutions across 12 months of consistent transaction activity and active consent.',
    percentileText: 'Top 6% across verified TAMVA profiles',
    isBureauScore: false,
  },
  financialPosition: {
    totalNetWorth: 28450.0,
    currency: 'GHS',
    monthlyInflow: 7200.0,
    monthlyOutflow: 3450.0,
    netSavings: 3750.0,
    savingsRatePercent: 52,
    resilienceMonths: 8.2,
  },
  behaviorMetrics: [
    {
      id: 'metric-income-consistency',
      title: 'Income Consistency',
      rating: 'excellent',
      ratingLabel: 'Excellent',
      description:
        'Regular monthly salary and deposit history verified for 12+ consecutive months.',
      icon: 'trending-up',
      badgeTone: 'success',
    },
    {
      id: 'metric-financial-stability',
      title: 'Financial Stability',
      rating: 'strong',
      ratingLabel: 'Strong',
      description:
        'Maintains positive operating balances across all accounts with zero overdraft occurrences.',
      icon: 'shield',
      badgeTone: 'success',
    },
    {
      id: 'metric-savings-discipline',
      title: 'Savings Discipline',
      rating: 'strong',
      ratingLabel: 'Strong',
      description:
        'Consistently retains ~52% of net monthly cash inflow in interest-bearing accounts.',
      icon: 'pie-chart',
      badgeTone: 'information',
    },
    {
      id: 'metric-repayment-behaviour',
      title: 'Repayment Behaviour',
      rating: 'excellent',
      ratingLabel: 'Excellent',
      description:
        'Flawless record of recurring obligations and bill payments without late penalties.',
      icon: 'check-circle',
      badgeTone: 'success',
    },
    {
      id: 'metric-financial-resilience',
      title: 'Financial Resilience',
      rating: 'strong',
      ratingLabel: 'Strong',
      description:
        'Liquid cash reserves represent ~8.2 months of regular average outflows.',
      icon: 'activity',
      badgeTone: 'information',
    },
  ],
  institutionsSummary: {
    totalConnected: 4,
    sources: [
      {
        id: 'src-001',
        name: 'GCB Bank',
        type: 'bank',
        icon: 'credit-card',
        accountType: 'Main Checking',
        status: 'connected',
      },
      {
        id: 'src-002',
        name: 'Stanbic Bank Ghana',
        type: 'bank',
        icon: 'credit-card',
        accountType: 'Executive Savings',
        status: 'connected',
      },
      {
        id: 'src-003',
        name: 'MTN Mobile Money',
        type: 'mobile_money',
        icon: 'smartphone',
        accountType: 'Primary MoMo Wallet',
        status: 'syncing',
      },
      {
        id: 'src-004',
        name: 'CalBank',
        type: 'bank',
        icon: 'credit-card',
        accountType: 'Investment Vault',
        status: 'connected',
      },
    ],
  },
  freshness: {
    lastCalculated: 'Updated just now',
    dataWindow: '12-month consented window',
    disclosure:
      'Factual profile derived strictly from your consented financial accounts. Not an official credit bureau score or government credential.',
  },
  activeShare: null,
  shareHistory: mockInitialShareHistory,
};
