/**
 * TAMVA Send Money UI Types
 *
 * Types and data contracts for the customer-facing Send Money experience.
 * Structured cleanly for local/mock state with seamless future backend API integration.
 */

import { CurrencyCode, TransactionStatus } from './financial';
import { FeatherIconName } from '../constants/icons';

export type RecipientMethod = 'tamva' | 'bank' | 'mobile_money';

export interface FundingAccount {
  id: string;
  institutionName: string;
  accountType: string;
  maskedIdentifier: string;
  balance: number;
  currency: CurrencyCode;
  isEligible: boolean;
  ineligibilityReason?: string;
  brandKey?: string;
  icon?: FeatherIconName;
}

export interface TransferRecipient {
  id: string;
  name: string;
  method: RecipientMethod;
  institutionName: string;
  maskedAccount: string;
  networkOrBank: string;
  avatarUrl?: string;
  brandKey?: string;
  isRecent?: boolean;
  isSaved?: boolean;
  tag?: string;
}

export interface TransferDraft {
  sourceAccount: FundingAccount | null;
  recipient: TransferRecipient | null;
  amount: number;
  currency: CurrencyCode;
  estimatedFee: number;
  note: string;
}

export type TransferStep =
  | 'source'
  | 'recipient'
  | 'amount'
  | 'review'
  | 'auth'
  | 'processing'
  | 'success'
  | 'failure';

export interface TransferResult {
  transactionId: string;
  status: TransactionStatus;
  timestamp: string;
  rawDate: string;
  reference: string;
  amount: number;
  currency: CurrencyCode;
  fee: number;
  total: number;
  sourceAccount: FundingAccount;
  recipient: TransferRecipient;
  note?: string;
  errorMessage?: string;
}
