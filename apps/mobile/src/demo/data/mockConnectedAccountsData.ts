/**
 * TAMVA Mock Connected Accounts & Consent Data
 *
 * Realistic demo data reflecting Ghanaian financial institutions:
 * Tier-1 commercial banks, mobile money operators, and investment vaults.
 */

import {
  ConnectedAccount,
  ConnectedAccountsScreenData,
  ConsentedScopeDetail,
  ConsentDurationOption,
  InstitutionCatalogItem,
} from '../../types/accounts';

export const DEFAULT_CONSENT_PURPOSE =
  'Your financial information helps TAMVA build a more complete financial profile and provide financial trust insights.';

export const CONSENTED_SCOPE_DETAILS: Record<string, ConsentedScopeDetail> = {
  account_identity: {
    id: 'account_identity',
    title: 'Account Identity',
    shortDescription: 'Identifies the connected account and institution.',
    purposeDescription:
      'Required to confirm account ownership and establish your TAMVA profile.',
    icon: 'user-check',
    isRequired: true,
  },
  balances: {
    id: 'balances',
    title: 'Balances',
    shortDescription: 'Helps TAMVA understand your current financial position.',
    purposeDescription:
      'Provides real-time visibility into your available and ledger balances.',
    icon: 'credit-card',
    isRequired: false,
  },
  transaction_history: {
    id: 'transaction_history',
    title: 'Transaction History',
    shortDescription:
      'Helps TAMVA analyze income, spending and financial behaviour.',
    purposeDescription:
      'Powers your multi-account cashflow timeline and spending trends.',
    icon: 'activity',
    isRequired: false,
  },
  income_verification: {
    id: 'income_verification',
    title: 'Income Verification',
    shortDescription: 'Helps verify recurring income patterns.',
    purposeDescription:
      'Identifies regular salary streams and deposits to assess financial stability.',
    icon: 'trending-up',
    isRequired: false,
  },
};

export const CONSENT_DURATION_OPTIONS: ConsentDurationOption[] = [
  {
    id: '30_days',
    label: '30 Days',
    helperText: 'Expires in 1 month',
  },
  {
    id: '90_days',
    label: '90 Days',
    helperText: 'Recommended duration',
  },
  {
    id: '1_year',
    label: '1 Year',
    helperText: 'Annual authorization',
  },
  {
    id: 'until_revoked',
    label: 'Until Revoked',
    helperText: 'Active until you disconnect',
  },
];

export const INSTITUTION_CATALOG: InstitutionCatalogItem[] = [
  {
    id: 'cat-gcb',
    name: 'GCB Bank',
    type: 'bank',
    icon: 'credit-card',
    categoryLabel: 'Commercial Bank',
    defaultAccountType: 'Current Account',
    mockIdentifier: '•• 4021',
    mockBalance: 14500.0,
    supportedScopes: [
      'account_identity',
      'balances',
      'transaction_history',
      'income_verification',
    ],
  },
  {
    id: 'cat-stanbic',
    name: 'Stanbic Bank Ghana',
    type: 'bank',
    icon: 'credit-card',
    categoryLabel: 'Commercial Bank',
    defaultAccountType: 'Executive Savings',
    mockIdentifier: '•• 8812',
    mockBalance: 6850.5,
    supportedScopes: ['account_identity', 'balances', 'transaction_history'],
  },
  {
    id: 'cat-calbank',
    name: 'CalBank',
    type: 'bank',
    icon: 'shield',
    categoryLabel: 'Commercial Bank',
    defaultAccountType: 'High-Yield Vault',
    mockIdentifier: '•• 1092',
    mockBalance: 12400.0,
    supportedScopes: ['account_identity', 'balances', 'transaction_history'],
  },
  {
    id: 'cat-mtn',
    name: 'MTN Mobile Money',
    type: 'mobile_money',
    icon: 'smartphone',
    categoryLabel: 'Mobile Money Operator',
    defaultAccountType: 'Primary MoMo Wallet',
    mockIdentifier: '•• 3019',
    mockBalance: 1820.0,
    supportedScopes: ['account_identity', 'balances', 'transaction_history'],
  },
  {
    id: 'cat-telecel',
    name: 'Telecel Cash',
    type: 'mobile_money',
    icon: 'smartphone',
    categoryLabel: 'Mobile Money Operator',
    defaultAccountType: 'Subscriber Wallet',
    mockIdentifier: '•• 5521',
    mockBalance: 350.0,
    supportedScopes: ['account_identity', 'balances'],
  },
  {
    id: 'cat-absa',
    name: 'Absa Bank Ghana',
    type: 'bank',
    icon: 'credit-card',
    categoryLabel: 'Commercial Bank',
    defaultAccountType: 'Premier Checking',
    mockIdentifier: '•• 7734',
    mockBalance: 9200.0,
    supportedScopes: [
      'account_identity',
      'balances',
      'transaction_history',
      'income_verification',
    ],
  },
  {
    id: 'cat-ecobank',
    name: 'Ecobank Ghana',
    type: 'bank',
    icon: 'credit-card',
    categoryLabel: 'Commercial Bank',
    defaultAccountType: 'Advantage Account',
    mockIdentifier: '•• 6150',
    mockBalance: 5400.0,
    supportedScopes: ['account_identity', 'balances', 'transaction_history'],
  },
  {
    id: 'cat-fidelity',
    name: 'Fidelity Bank Ghana',
    type: 'bank',
    icon: 'credit-card',
    categoryLabel: 'Commercial Bank',
    defaultAccountType: 'Smart Account',
    mockIdentifier: '•• 9042',
    mockBalance: 3100.0,
    supportedScopes: ['account_identity', 'balances'],
  },
];

export const mockConnectedAccounts: ConnectedAccount[] = [
  {
    id: 'acc-001',
    institutionName: 'GCB Bank',
    institutionType: 'bank',
    accountType: 'Current Account',
    maskedIdentifier: '•• 4021',
    status: 'connected',
    lastSyncedAt: '5 min ago',
    currency: 'GHS',
    balance: 14500.0,
    icon: 'credit-card',
    consentedScopes: [
      'account_identity',
      'balances',
      'transaction_history',
      'income_verification',
    ],
    connectedSince: '14 Jan 2026',
    consent: {
      purpose: DEFAULT_CONSENT_PURPOSE,
      grantedScopes: [
        'account_identity',
        'balances',
        'transaction_history',
        'income_verification',
      ],
      duration: '90_days',
      grantedAt: '14 Jan 2026',
      expiresAt: '14 Apr 2026',
    },
  },
  {
    id: 'acc-002',
    institutionName: 'Stanbic Bank Ghana',
    institutionType: 'bank',
    accountType: 'Executive Savings',
    maskedIdentifier: '•• 8812',
    status: 'connected',
    lastSyncedAt: '42 min ago',
    currency: 'GHS',
    balance: 6850.5,
    icon: 'credit-card',
    consentedScopes: ['account_identity', 'balances', 'transaction_history'],
    connectedSince: '03 Feb 2026',
    consent: {
      purpose: DEFAULT_CONSENT_PURPOSE,
      grantedScopes: ['account_identity', 'balances', 'transaction_history'],
      duration: '1_year',
      grantedAt: '03 Feb 2026',
      expiresAt: '03 Feb 2027',
    },
  },
  {
    id: 'acc-003',
    institutionName: 'MTN Mobile Money',
    institutionType: 'mobile_money',
    accountType: 'Primary MoMo Wallet',
    maskedIdentifier: '•• 3019',
    status: 'syncing',
    lastSyncedAt: 'Syncing in progress...',
    currency: 'GHS',
    balance: 1820.0,
    icon: 'smartphone',
    consentedScopes: ['account_identity', 'balances', 'transaction_history'],
    connectedSince: '12 Feb 2026',
    consent: {
      purpose: DEFAULT_CONSENT_PURPOSE,
      grantedScopes: ['account_identity', 'balances', 'transaction_history'],
      duration: '90_days',
      grantedAt: '12 Feb 2026',
      expiresAt: '12 May 2026',
    },
  },
  {
    id: 'acc-004',
    institutionName: 'CalBank',
    institutionType: 'bank',
    accountType: 'High-Yield Vault',
    maskedIdentifier: '•• 1092',
    status: 'action_required',
    statusMessage: 'Consent authorization expired. Re-authorization required.',
    lastSyncedAt: '1 day ago',
    currency: 'GHS',
    balance: 12400.0,
    icon: 'shield',
    consentedScopes: ['account_identity', 'balances'],
    connectedSince: '20 Mar 2026',
    consent: {
      purpose: DEFAULT_CONSENT_PURPOSE,
      grantedScopes: ['account_identity', 'balances'],
      duration: '30_days',
      grantedAt: '20 Mar 2026',
      expiresAt: '19 Apr 2026',
      isExpired: true,
    },
  },
  {
    id: 'acc-005',
    institutionName: 'Telecel Cash',
    institutionType: 'mobile_money',
    accountType: 'Subscriber Wallet',
    maskedIdentifier: '•• 5521',
    status: 'disconnected',
    statusMessage: 'Consent revoked. Data access discontinued.',
    lastSyncedAt: '7 days ago',
    currency: 'GHS',
    balance: 350.0,
    icon: 'smartphone',
    consentedScopes: ['account_identity'],
    connectedSince: '01 Apr 2026',
    consent: {
      purpose: DEFAULT_CONSENT_PURPOSE,
      grantedScopes: ['account_identity'],
      duration: 'until_revoked',
      grantedAt: '01 Apr 2026',
      revokedAt: '07 Sep 2026',
    },
  },
];

export const mockConnectedAccountsData: ConnectedAccountsScreenData = {
  summary: {
    totalConnected: 4, // 4 active/syncing/attention, 1 disconnected
    activeCount: 2,
    attentionCount: 1,
    lastGlobalSync: '5 min ago',
  },
  accounts: mockConnectedAccounts,
};

export const mockEmptyConnectedAccountsData: ConnectedAccountsScreenData = {
  summary: {
    totalConnected: 0,
    activeCount: 0,
    attentionCount: 0,
    lastGlobalSync: 'Never',
  },
  accounts: [],
};
