/**
 * TAMVA Mock Receive Data
 *
 * Mock data and templates for the Receive Money experience.
 *
 * NOTE: All bank/account eligibility rules and mock values in this file
 * are local demonstration mock data only and do not reflect real institutional policies.
 */

import { ReceivingAccount, ReceiveRequestDraft } from '../../types/receive';

export const MOCK_CUSTOMER_NAME = 'Karim Salifu';

export const MOCK_RECEIVING_ACCOUNTS: ReceivingAccount[] = [
  {
    id: 'rec-acc-gcb-4021',
    institutionName: 'GCB Bank',
    accountType: 'Current Account',
    maskedIdentifier: '•• 4021',
    fullMaskedAccount: '•••• •••• 4021',
    accountHolderName: MOCK_CUSTOMER_NAME,
    balance: 14500.0,
    currency: 'GHS',
    isEligible: true,
    status: 'active',
    brandKey: 'gcb',
    method: 'bank',
    icon: 'credit-card',
  },
  {
    id: 'rec-acc-stanbic-8812',
    institutionName: 'Stanbic Bank',
    accountType: 'Executive Savings',
    maskedIdentifier: '•• 8812',
    fullMaskedAccount: '•••• •••• 8812',
    accountHolderName: MOCK_CUSTOMER_NAME,
    balance: 6850.5,
    currency: 'GHS',
    isEligible: true,
    status: 'active',
    brandKey: 'stanbic',
    method: 'bank',
    icon: 'credit-card',
  },
  {
    id: 'rec-acc-momo-3019',
    institutionName: 'MTN Mobile Money',
    accountType: 'Primary MoMo Wallet',
    maskedIdentifier: '•• 3019',
    fullMaskedAccount: '024 ••• 3019',
    accountHolderName: MOCK_CUSTOMER_NAME,
    balance: 1820.0,
    currency: 'GHS',
    isEligible: true,
    status: 'active',
    brandKey: 'mtn',
    method: 'mobile_money',
    icon: 'smartphone',
  },
  {
    id: 'rec-acc-calbank-1092',
    institutionName: 'CalBank',
    accountType: 'High-Yield Vault',
    maskedIdentifier: '•• 1092',
    fullMaskedAccount: '•••• •••• 1092',
    accountHolderName: MOCK_CUSTOMER_NAME,
    balance: 4120.0,
    currency: 'GHS',
    isEligible: true,
    status: 'active',
    brandKey: 'calbank',
    method: 'bank',
    icon: 'shield',
  },
  {
    id: 'rec-acc-telecel-5521',
    institutionName: 'Telecel Cash',
    accountType: 'Subscriber Wallet',
    maskedIdentifier: '•• 5521',
    fullMaskedAccount: '020 ••• 5521',
    accountHolderName: MOCK_CUSTOMER_NAME,
    balance: 350.0,
    currency: 'GHS',
    isEligible: false,
    status: 'disconnected',
    statusReason: 'Connection expired. Re-authenticate in Connected Accounts to receive funds via Telecel Cash.',
    brandKey: 'telecel',
    method: 'mobile_money',
    icon: 'smartphone',
  },
];

/**
 * Format clean, concise text for sharing or copying
 */
export function formatShareDetails(draft: ReceiveRequestDraft): string {
  if (!draft.account) return '';

  const isMoMo = draft.account.method === 'mobile_money';
  const lines: string[] = [
    draft.account.accountHolderName,
    draft.account.institutionName,
    isMoMo
      ? `Mobile Number: ${draft.account.fullMaskedAccount}`
      : `${draft.account.accountType}: ${draft.account.fullMaskedAccount}`,
  ];

  if (draft.amount && draft.amount > 0) {
    const formattedAmount = `GH₵${draft.amount.toFixed(2)}`;
    if (draft.note && draft.note.trim().length > 0) {
      lines.push(`Requested: ${formattedAmount} (${draft.note.trim()})`);
    } else {
      lines.push(`Requested: ${formattedAmount}`);
    }
  }

  return lines.join('\n');
}
