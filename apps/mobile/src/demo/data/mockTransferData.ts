/**
 * TAMVA Mock Transfer Data
 *
 * Mock data and configuration for the Send Money experience.
 *
 * NOTE: All bank/account eligibility rules and recipient information in this file
 * are TAMVA local demonstration mock data only and do not reflect actual institutional policies.
 */

import { FundingAccount, TransferRecipient, RecipientMethod } from '../../types/transfer';

export const MOCK_CUSTOMER_NAME = 'Karim Salifu';

/**
 * Karim Salifu's connected funding sources.
 * Eligibility is marked for demo purposes.
 */
export const MOCK_FUNDING_ACCOUNTS: FundingAccount[] = [
  {
    id: 'fund-gcb-4021',
    institutionName: 'GCB Bank',
    accountType: 'Current Account',
    maskedIdentifier: '•• 4021',
    balance: 14500.0,
    currency: 'GHS',
    isEligible: true,
    brandKey: 'gcb',
    icon: 'credit-card',
  },
  {
    id: 'fund-stanbic-8812',
    institutionName: 'Stanbic Bank',
    accountType: 'Executive Savings',
    maskedIdentifier: '•• 8812',
    balance: 6850.5,
    currency: 'GHS',
    isEligible: true,
    brandKey: 'stanbic',
    icon: 'credit-card',
  },
  {
    id: 'fund-momo-3019',
    institutionName: 'MTN Mobile Money',
    accountType: 'Primary MoMo Wallet',
    maskedIdentifier: '•• 3019',
    balance: 1820.0,
    currency: 'GHS',
    isEligible: true,
    brandKey: 'mtn',
    icon: 'smartphone',
  },
  {
    id: 'fund-calbank-1092',
    institutionName: 'CalBank',
    accountType: 'High-Yield Vault',
    maskedIdentifier: '•• 1092',
    balance: 12400.0,
    currency: 'GHS',
    isEligible: false,
    ineligibilityReason: 'Demo setting: High-Yield Vault is not configured for outward transfers in this demonstration.',
    brandKey: 'calbank',
    icon: 'shield',
  },
];

/**
 * Realistic Ghanaian banking and mobile money recipients.
 * Personal information is properly masked for privacy.
 */
export const MOCK_RECIPIENTS: TransferRecipient[] = [
  {
    id: 'rec-001',
    name: 'Ama Mensah',
    method: 'mobile_money',
    institutionName: 'MTN Mobile Money',
    networkOrBank: 'MTN MoMo',
    maskedAccount: '024 ••• 1234',
    brandKey: 'mtn',
    isRecent: true,
    isSaved: true,
    tag: 'Family',
  },
  {
    id: 'rec-002',
    name: 'Kwame Boateng',
    method: 'bank',
    institutionName: 'GCB Bank',
    networkOrBank: 'GCB Bank',
    maskedAccount: '•• 4821',
    brandKey: 'gcb',
    isRecent: true,
    isSaved: true,
    tag: 'Contractor',
  },
  {
    id: 'rec-003',
    name: 'Abena Osei',
    method: 'bank',
    institutionName: 'Stanbic Bank',
    networkOrBank: 'Stanbic Bank Ghana',
    maskedAccount: '•• 9012',
    brandKey: 'stanbic',
    isRecent: true,
    isSaved: true,
    tag: 'Colleague',
  },
  {
    id: 'rec-004',
    name: 'Kofi Mensah',
    method: 'tamva',
    institutionName: 'TAMVA Network',
    networkOrBank: 'Instant TAMVA ID',
    maskedAccount: '@kofim',
    brandKey: undefined,
    isRecent: true,
    isSaved: true,
    tag: 'Personal',
  },
  {
    id: 'rec-005',
    name: 'Yaw Addo',
    method: 'mobile_money',
    institutionName: 'Telecel Cash',
    networkOrBank: 'Telecel Cash',
    maskedAccount: '020 ••• 7741',
    brandKey: 'telecel',
    isRecent: false,
    isSaved: true,
    tag: 'Vendor',
  },
  {
    id: 'rec-006',
    name: 'Akua Poku',
    method: 'bank',
    institutionName: 'Absa Bank Ghana',
    networkOrBank: 'Absa Bank',
    maskedAccount: '•• 3319',
    brandKey: 'absa',
    isRecent: false,
    isSaved: true,
    tag: 'Landlord',
  },
];

/**
 * Configurable mock fee calculation.
 * Structured so that real backend pricing tiers can replace this function.
 */
export function calculateEstimatedFee(amount: number, method?: RecipientMethod): number {
  // Configurable mock transfer fee: 0.00 for current mock environment
  return 0.0;
}

/**
 * Demo PIN configurations for testing
 */
export const DEMO_PIN = '1234';
export const DEMO_FAILURE_PIN = '9999';
export const DEMO_INCORRECT_PIN = '0000';
