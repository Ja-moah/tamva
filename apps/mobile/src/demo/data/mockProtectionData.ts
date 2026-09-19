/**
 * TAMVA Financial Protection Mock Data & Controlled Scenarios
 *
 * Presentation-grade demonstration data for the Financial Protection screen.
 * Internally consistent with Home, Activity, Connected Accounts, Financial Passport,
 * and Financial Profile.
 * Account holder: Karim Salifu
 *
 * Scenarios:
 * - healthy: Baseline protected state (4 connected, 0 alerts, healthy signals)
 * - attention: Scenario A (CalBank requires attention)
 * - disconnected: Scenario B (Telecel Cash disconnected / consent revoked)
 * - limited: Scenario C (Limited coverage, 2 accounts, partial neutral signals)
 * - unavailable: Scenario D (Signals cannot currently be evaluated)
 */

import {
  FinancialProtection,
  ProtectionAccountDetail,
  ProtectionScenario,
} from '../../types/protection';

export const mockProtectionAccountsHealthy: ProtectionAccountDetail[] = [
  {
    id: 'prot-acc-gcb',
    institutionName: 'GCB Bank',
    accountName: 'Current Account',
    maskedIdentifier: '•• 4021',
    institutionType: 'bank',
    connectionStatus: 'connected',
    protectionStatus: 'healthy',
    lastChecked: 'Just now',
    consentScopes: [
      'account_identity',
      'balances',
      'transaction_history',
      'income_verification',
    ],
  },
  {
    id: 'prot-acc-stanbic',
    institutionName: 'Stanbic Bank',
    accountName: 'Executive Savings',
    maskedIdentifier: '•• 8812',
    institutionType: 'bank',
    connectionStatus: 'connected',
    protectionStatus: 'healthy',
    lastChecked: 'Just now',
    consentScopes: ['account_identity', 'balances', 'transaction_history'],
  },
  {
    id: 'prot-acc-mtn',
    institutionName: 'MTN Mobile Money',
    accountName: 'Primary MoMo Wallet',
    maskedIdentifier: '•• 3019',
    institutionType: 'mobile_money',
    connectionStatus: 'connected',
    protectionStatus: 'healthy',
    lastChecked: 'Just now',
    consentScopes: ['account_identity', 'balances', 'transaction_history'],
  },
  {
    id: 'prot-acc-calbank',
    institutionName: 'CalBank',
    accountName: 'High-Yield Vault',
    maskedIdentifier: '•• 1092',
    institutionType: 'bank',
    connectionStatus: 'connected',
    protectionStatus: 'healthy',
    lastChecked: 'Just now',
    consentScopes: ['account_identity', 'balances', 'transaction_history'],
  },
];

// ─────────────────────────────────────────────────────────────
// 1. DEFAULT HEALTHY SCENARIO
// ─────────────────────────────────────────────────────────────
export const mockProtectionDataHealthy: FinancialProtection = {
  status: 'protected',
  statusLabel: 'Protected',
  statusDescription:
    'No immediate protection actions are required.\nBased on your latest consented financial data.',

  monitoring: {
    enabled: true,
    statusLabel: 'Active',
    lastCheckedAt: 'Just now',
    accountsMonitored: 4,
    recentAlerts: 0,
    isAvailable: true,
  },

  accounts: {
    total: 4,
    connected: 4,
    attentionRequired: 0,
    disconnected: 0,
  },

  accountDetails: mockProtectionAccountsHealthy,

  signals: [
    {
      id: 'consent_health',
      title: 'Consent health',
      description:
        'Your connected account permissions are active and within their consent periods.',
      status: 'healthy',
      icon: 'shield',
      whatThisMeans:
        'TAMVA can use the data scopes you have approved for these connected accounts.',
      supportingDetails: [
        { label: 'Connected accounts', value: '4' },
        { label: 'Active consent', value: '4' },
        { label: 'Requiring review', value: '0' },
        { label: 'Latest review', value: 'Today' },
      ],
      relevantAccountIds: [
        'prot-acc-gcb',
        'prot-acc-stanbic',
        'prot-acc-mtn',
        'prot-acc-calbank',
      ],
      actionLabel: 'Review permissions',
    },
    {
      id: 'account_connections',
      title: 'Account connections',
      description:
        'Your connected institutions are currently available in the latest account data.',
      status: 'healthy',
      icon: 'check-circle',
      whatThisMeans:
        'Your monitored accounts are currently connected and available to TAMVA within their approved consent scopes.',
      supportingDetails: [
        { label: 'Monitored', value: '4' },
        { label: 'Connected', value: '4' },
        { label: 'Attention required', value: '0' },
        { label: 'Disconnected', value: '0' },
      ],
      relevantAccountIds: [
        'prot-acc-gcb',
        'prot-acc-stanbic',
        'prot-acc-mtn',
        'prot-acc-calbank',
      ],
      actionLabel: 'View connected accounts',
    },
    {
      id: 'activity_monitoring',
      title: 'Activity monitoring',
      description:
        'No protection-related activity currently requires your attention.',
      status: 'healthy',
      icon: 'activity',
      whatThisMeans:
        'TAMVA checks the latest consented account data available to identify changes that may require your attention. This is a protection signal based on available consented account data. It is not continuous real-time monitoring.',
      supportingDetails: [
        { label: 'Monitoring state', value: 'Active' },
        { label: 'Accounts monitored', value: '4' },
        { label: 'Recent alerts', value: '0' },
        { label: 'Latest check', value: 'Just now' },
      ],
      infoNote:
        'Monitoring reflects the latest consented data available to TAMVA.',
    },
    {
      id: 'account_access',
      title: 'Account access',
      description:
        'Your connected account access is currently available based on the latest consented data.',
      status: 'healthy',
      icon: 'lock',
      whatThisMeans:
        'No connected account currently requires access review.',
      supportingDetails: [
        { label: 'Access issues', value: '0' },
        { label: 'Re-authentication required', value: '0' },
        { label: 'Disconnected accounts', value: '0' },
        { label: 'Latest access check', value: 'Just now' },
      ],
      infoNote:
        'If an account needs attention, TAMVA will show the affected connection and the action required.',
    },
  ],

  recentActivity: [
    {
      id: 'act-1',
      title: 'Consent reviewed',
      description: 'GCB Bank',
      timestamp: 'Today',
      status: 'healthy',
      icon: 'shield',
    },
    {
      id: 'act-2',
      title: 'Connection checked',
      description: 'Stanbic Bank',
      timestamp: 'Today',
      status: 'healthy',
      icon: 'refresh-cw',
    },
    {
      id: 'act-3',
      title: 'Consent period reviewed',
      description: 'MTN Mobile Money',
      timestamp: 'Yesterday',
      status: 'healthy',
      icon: 'clock',
    },
  ],

  recommendations: [
    {
      id: 'rec-1',
      title: 'Review connected permissions',
      description:
        'Check your connected account permissions periodically to keep your financial data current.',
      actionLabel: 'Review accounts',
      priority: 'low',
      icon: 'sliders',
    },
  ],

  lastUpdated: 'Just now',
};

// Default export aliases to healthy dataset
export const mockProtectionData: FinancialProtection = mockProtectionDataHealthy;
export const mockProtectionAccounts: ProtectionAccountDetail[] = mockProtectionAccountsHealthy;

// ─────────────────────────────────────────────────────────────
// 2. SCENARIO A: ATTENTION NEEDED (CalBank requires review)
// ─────────────────────────────────────────────────────────────
export const mockProtectionDataAttention: FinancialProtection = {
  status: 'attention',
  statusLabel: 'Attention needed',
  statusDescription:
    'One or more protection settings may need your review.\nBased on your latest consented financial data.',

  monitoring: {
    enabled: true,
    statusLabel: 'Active',
    lastCheckedAt: 'Just now',
    accountsMonitored: 4,
    recentAlerts: 1,
    alertNote: '1 account needs review',
    isAvailable: true,
  },

  accounts: {
    total: 4,
    connected: 3,
    attentionRequired: 1,
    disconnected: 0,
  },

  accountDetails: [
    mockProtectionAccountsHealthy[0],
    mockProtectionAccountsHealthy[1],
    mockProtectionAccountsHealthy[2],
    {
      id: 'prot-acc-calbank',
      institutionName: 'CalBank',
      accountName: 'High-Yield Vault',
      maskedIdentifier: '•• 1092',
      institutionType: 'bank',
      connectionStatus: 'attention',
      protectionStatus: 'attention',
      statusReason: 'Account access requires review.',
      actionRequired: 'Review account',
      lastChecked: 'Just now',
      consentScopes: ['account_identity', 'balances', 'transaction_history'],
    },
  ],

  signals: [
    mockProtectionDataHealthy.signals[0],
    {
      ...mockProtectionDataHealthy.signals[1],
      status: 'attention',
      description:
        '1 connected institution requires your review in the latest account data.',
    },
    mockProtectionDataHealthy.signals[2],
    {
      ...mockProtectionDataHealthy.signals[3],
      status: 'attention',
      description: 'CalBank access requires review.',
    },
  ],

  recentActivity: [
    {
      id: 'act-attn-1',
      title: 'Access review required',
      description: 'CalBank',
      timestamp: 'Today',
      status: 'attention',
      icon: 'alert-triangle',
    },
    mockProtectionDataHealthy.recentActivity[1],
    mockProtectionDataHealthy.recentActivity[0],
  ],

  recommendations: [
    {
      id: 'rec-attn-1',
      title: 'Review the account that needs attention',
      description:
        'CalBank requires an access review to maintain uninterrupted data synchronization.',
      actionLabel: 'Review account',
      priority: 'medium',
      icon: 'alert-circle',
    },
  ],

  lastUpdated: 'Just now',
};

// ─────────────────────────────────────────────────────────────
// 3. SCENARIO B: DISCONNECTED ACCOUNT (Telecel Cash consent revoked)
// ─────────────────────────────────────────────────────────────
export const mockProtectionDataDisconnected: FinancialProtection = {
  status: 'attention',
  statusLabel: 'Attention needed',
  statusDescription:
    'One or more protection settings may need your review.\nBased on your latest consented financial data.',

  monitoring: {
    enabled: true,
    statusLabel: 'Active',
    lastCheckedAt: 'Just now',
    accountsMonitored: 4,
    recentAlerts: 1,
    alertNote: '1 disconnected account',
    isAvailable: true,
  },

  accounts: {
    total: 4,
    connected: 3,
    attentionRequired: 0,
    disconnected: 1,
  },

  accountDetails: [
    mockProtectionAccountsHealthy[0],
    mockProtectionAccountsHealthy[1],
    mockProtectionAccountsHealthy[2],
    {
      id: 'prot-acc-telecel',
      institutionName: 'Telecel Cash',
      accountName: 'Subscriber Wallet',
      maskedIdentifier: '•• 5521',
      institutionType: 'mobile_money',
      connectionStatus: 'disconnected',
      protectionStatus: 'attention',
      statusReason: 'Consent has been revoked for this connection.',
      actionRequired: 'Reconnect account',
      lastChecked: 'Yesterday',
      consentScopes: ['account_identity', 'balances'],
    },
  ],

  signals: [
    {
      ...mockProtectionDataHealthy.signals[0],
      status: 'attention',
      description: 'Consent has been revoked for Telecel Cash.',
    },
    {
      ...mockProtectionDataHealthy.signals[1],
      status: 'attention',
      description: 'Telecel Cash is currently disconnected.',
    },
    mockProtectionDataHealthy.signals[2],
    mockProtectionDataHealthy.signals[3],
  ],

  recentActivity: [
    {
      id: 'act-disc-1',
      title: 'Consent revoked',
      description: 'Telecel Cash',
      timestamp: 'Yesterday',
      status: 'attention',
      icon: 'alert-circle',
    },
    mockProtectionDataHealthy.recentActivity[0],
    mockProtectionDataHealthy.recentActivity[1],
  ],

  recommendations: [
    {
      id: 'rec-disc-1',
      title: 'Reconnect or review the disconnected account',
      description:
        'Consent for Telecel Cash was revoked. Reconnecting will resume data synchronization.',
      actionLabel: 'Reconnect account',
      priority: 'medium',
      icon: 'refresh-cw',
    },
  ],

  lastUpdated: 'Just now',
};

// ─────────────────────────────────────────────────────────────
// 4. SCENARIO C: LIMITED PROTECTION DATA (Monitoring state)
// ─────────────────────────────────────────────────────────────
export const mockProtectionDataLimited: FinancialProtection = {
  status: 'monitoring',
  statusLabel: 'Monitoring',
  statusDescription:
    'TAMVA is monitoring the latest consented data available.\nAdditional account connections can improve coverage.',

  monitoring: {
    enabled: true,
    statusLabel: 'Limited coverage',
    lastCheckedAt: 'Just now',
    accountsMonitored: 2,
    recentAlerts: 0,
    isAvailable: true,
  },

  accounts: {
    total: 2,
    connected: 2,
    attentionRequired: 0,
    disconnected: 0,
  },

  accountDetails: [
    mockProtectionAccountsHealthy[0],
    mockProtectionAccountsHealthy[2],
  ],

  signals: [
    mockProtectionDataHealthy.signals[0],
    mockProtectionDataHealthy.signals[1],
    {
      ...mockProtectionDataHealthy.signals[2],
      status: 'neutral',
      description: 'Activity monitoring data is currently limited.',
    },
    {
      ...mockProtectionDataHealthy.signals[3],
      status: 'neutral',
      description: 'Account access signals cannot be evaluated from available data.',
    },
  ],

  recentActivity: [
    mockProtectionDataHealthy.recentActivity[0],
    mockProtectionDataHealthy.recentActivity[2],
  ],

  recommendations: [
    {
      id: 'rec-lim-1',
      title: 'Connect another account to improve protection coverage',
      description:
        'Connecting additional financial accounts helps TAMVA evaluate broader protection signals.',
      actionLabel: 'Connect account',
      priority: 'low',
      icon: 'sliders',
    },
  ],

  lastUpdated: 'Just now',
};

// ─────────────────────────────────────────────────────────────
// 5. SCENARIO D: PROTECTION UNAVAILABLE
// ─────────────────────────────────────────────────────────────
export const mockProtectionDataUnavailable: FinancialProtection = {
  status: 'unavailable',
  statusLabel: 'Protection unavailable',
  statusDescription:
    'Protection signals cannot be evaluated from the available data.\nCheck your account connections or try again later.',

  monitoring: {
    enabled: false,
    statusLabel: 'Unavailable',
    lastCheckedAt: 'Unavailable',
    accountsMonitored: 0,
    recentAlerts: 0,
    isAvailable: false,
  },

  accounts: {
    total: 0,
    connected: 0,
    attentionRequired: 0,
    disconnected: 0,
  },

  accountDetails: [],

  signals: [
    {
      ...mockProtectionDataHealthy.signals[0],
      status: 'neutral',
      description: 'Consent evaluation unavailable.',
    },
    {
      ...mockProtectionDataHealthy.signals[1],
      status: 'neutral',
      description: 'Account connection data unavailable.',
    },
    {
      ...mockProtectionDataHealthy.signals[2],
      status: 'neutral',
      description: 'Activity monitoring unavailable.',
    },
    {
      ...mockProtectionDataHealthy.signals[3],
      status: 'neutral',
      description: 'Account access data unavailable.',
    },
  ],

  recentActivity: [],

  recommendations: [
    {
      id: 'rec-unavail-1',
      title: 'Protection signals currently unavailable',
      description:
        'Data feeds are currently unable to evaluate protection status. Please check your connections.',
      actionLabel: 'Check connections',
      priority: 'low',
      icon: 'alert-circle',
    },
  ],

  lastUpdated: 'Unavailable',
};

// Map of all scenarios for QA Switcher and state tests
export const mockProtectionScenarios: Record<
  ProtectionScenario,
  FinancialProtection
> = {
  healthy: mockProtectionDataHealthy,
  attention: mockProtectionDataAttention,
  disconnected: mockProtectionDataDisconnected,
  limited: mockProtectionDataLimited,
  unavailable: mockProtectionDataUnavailable,
};
