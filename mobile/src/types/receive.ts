/**
 * TAMVA Receive Money UI Types
 *
 * Types and data contracts for the customer-facing Receive Money experience.
 * Designed for local/mock state with seamless future backend API integration.
 */

import { CurrencyCode } from './financial';
import { FeatherIconName } from '../constants/icons';

export type ReceivingAccountStatus = 'active' | 'disconnected' | 'restricted';
export type ReceivingAccountMethod = 'bank' | 'mobile_money';

export interface ReceivingAccount {
  id: string;
  institutionName: string;
  accountType: string;
  maskedIdentifier: string;
  fullMaskedAccount: string;
  accountHolderName: string;
  balance: number;
  currency: CurrencyCode;
  isEligible: boolean;
  status: ReceivingAccountStatus;
  statusReason?: string;
  brandKey?: string;
  method: ReceivingAccountMethod;
  icon?: FeatherIconName;
}

export interface ReceiveRequestDraft {
  account: ReceivingAccount | null;
  amount?: number;
  currency: CurrencyCode;
  note?: string;
}

export type ReceiveStep =
  | 'select_account'
  | 'details'
  | 'summary'
  | 'ready';
