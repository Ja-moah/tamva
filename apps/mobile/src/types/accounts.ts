/**
 * TAMVA Connected Accounts & Consent UI Types
 *
 * Domain types for connected financial institutions, account statuses,
 * data consent scopes, access durations, and screen states.
 */

import { CurrencyCode } from './financial';
import { FeatherIconName } from '../constants/icons';

export type AccountConnectionStatus =
  | 'connected'
  | 'syncing'
  | 'action_required'
  | 'disconnected';

export type InstitutionType =
  | 'bank'
  | 'mobile_money'
  | 'investment'
  | 'fintech';

export type ConsentedScope =
  | 'account_identity'
  | 'balances'
  | 'transaction_history'
  | 'income_verification';

export interface ConsentedScopeDetail {
  id: ConsentedScope;
  title: string;
  shortDescription: string;
  purposeDescription: string;
  icon: FeatherIconName;
  isRequired: boolean;
}

export type ConsentDuration =
  | '30_days'
  | '90_days'
  | '1_year'
  | 'until_revoked';

export interface ConsentDurationOption {
  id: ConsentDuration;
  label: string;
  helperText: string;
  daysEstimate?: number;
}

export interface AccountConsent {
  purpose: string;
  grantedScopes: ConsentedScope[];
  duration: ConsentDuration;
  grantedAt: string;
  expiresAt?: string;
  revokedAt?: string;
  isExpired?: boolean;
}

export interface InstitutionCatalogItem {
  id: string;
  name: string;
  type: InstitutionType;
  icon: FeatherIconName;
  categoryLabel: string;
  defaultAccountType: string;
  mockIdentifier: string;
  mockBalance: number;
  supportedScopes: ConsentedScope[];
}

export interface ConnectedAccount {
  id: string;
  institutionName: string;
  institutionType: InstitutionType;
  accountType: string; // e.g. "Current Account", "Mobile Wallet", "High-Yield Vault"
  maskedIdentifier: string; // e.g. "•• 4021"
  status: AccountConnectionStatus;
  statusMessage?: string; // e.g. "Re-authentication required by CalBank"
  lastSyncedAt: string; // e.g. "5 min ago", "1 hr ago"
  currency: CurrencyCode;
  balance?: number;
  icon: FeatherIconName;
  consentedScopes: ConsentedScope[];
  connectedSince: string; // e.g. "12 Jun 2026"
  consent?: AccountConsent;
}

export interface ConnectedAccountsSummaryData {
  totalConnected: number;
  activeCount: number;
  attentionCount: number;
  lastGlobalSync: string;
}

export interface ConnectedAccountsScreenData {
  summary: ConnectedAccountsSummaryData;
  accounts: ConnectedAccount[];
}

export type AccountsStateMode = 'loaded' | 'loading' | 'empty' | 'error';

/**
 * Deterministic helper to evaluate if consent authorization has expired
 */
export function isConsentExpired(account?: ConnectedAccount | null): boolean {
  if (!account || !account.consent) return false;
  if (account.consent.isExpired) return true;
  if (account.consent.duration === 'until_revoked') return false;

  // CalBank has an expired 30-day session
  if (account.id === 'acc-004' || account.status === 'action_required') {
    return true;
  }

  return false;
}
