/**
 * TAMVA Financial Passport Types
 *
 * Domain types for TAMVA's portable financial identity and trust profile.
 * Represents customer financial standing, stability, and behavioural indicators
 * derived strictly from consented multi-institution accounts.
 */

import { CurrencyCode, FinancialConfidenceRating } from './financial';
import { BadgeTone } from '../components/ui/Badge';
import { FeatherIconName } from '../constants/icons';

export type PassportStatus = 'active' | 'draft' | 'under_review' | 'expired';

export type PassportMetricRating =
  | 'excellent'
  | 'strong'
  | 'good'
  | 'moderate'
  | 'building'
  | 'needs_attention';

export type PassportStateMode = 'loaded' | 'loading' | 'empty' | 'error';

export interface PassportIdentity {
  holderName: string;
  initials: string;
  passportId: string;
  status: PassportStatus;
  statusLabel: string;
  memberSince: string;
  jurisdiction: string;
}

export interface PassportConfidence {
  score: number;
  maxScore: number;
  rating: FinancialConfidenceRating;
  ratingLabel: string;
  summaryText: string;
  percentileText?: string;
  isBureauScore: false;
}

export interface PassportFinancialPosition {
  totalNetWorth: number;
  currency: CurrencyCode;
  monthlyInflow: number;
  monthlyOutflow: number;
  netSavings: number;
  savingsRatePercent: number;
  resilienceMonths: number;
}

export interface PassportBehaviorMetric {
  id: string;
  title: string;
  rating: PassportMetricRating;
  ratingLabel: string;
  description: string;
  icon: FeatherIconName;
  badgeTone: BadgeTone;
}

export interface PassportInstitutionSource {
  id: string;
  name: string;
  type: 'bank' | 'mobile_money' | 'investment';
  icon: FeatherIconName;
  accountType: string;
  status: 'connected' | 'syncing';
}

export interface PassportInstitutionsSummary {
  totalConnected: number;
  sources: PassportInstitutionSource[];
}

export interface PassportFreshness {
  lastCalculated: string;
  dataWindow: string;
  disclosure: string;
}

// ─────────────────────────────────────────────────────────────
// Passport Sharing & QR Types (Phase 5B)
// ─────────────────────────────────────────────────────────────

export type PassportSharePurposeId =
  | 'loan'
  | 'rental'
  | 'financial_service'
  | 'employment'
  | 'other';

export interface PassportSharePurposeItem {
  id: PassportSharePurposeId;
  label: string;
  description: string;
  icon: FeatherIconName;
}

export type PassportShareScopeId =
  | 'identity'
  | 'confidence'
  | 'financial_position'
  | 'cashflow'
  | 'behaviour'
  | 'institutions';

export interface PassportShareScopeItem {
  id: PassportShareScopeId;
  title: string;
  description: string;
  isRequired: boolean;
  icon: FeatherIconName;
}

export type PassportShareDurationId =
  | '7_days'
  | '30_days'
  | '90_days'
  | 'until_revoked';

export interface PassportShareDurationItem {
  id: PassportShareDurationId;
  label: string;
  description: string;
  days?: number;
  isDefault?: boolean;
}

export type PassportShareStatus = 'active' | 'revoked' | 'expired';

export interface PassportShareRecord {
  id: string; // e.g. 'SHR-84920-TVA'
  purposeId: PassportSharePurposeId;
  purposeLabel: string;
  customPurposeNote?: string;
  scopes: PassportShareScopeId[];
  durationId: PassportShareDurationId;
  durationLabel: string;
  createdAt: string;
  expiresAt: string;
  createdAtTimestamp: number;
  expiresAtTimestamp?: number;
  status: PassportShareStatus;
  demoQrCode: string;
  shareUrl: string;
}

export type PassportShareStep =
  | 'purpose'
  | 'scopes'
  | 'duration'
  | 'review'
  | 'success';

export interface FinancialPassportData {
  identity: PassportIdentity;
  confidence: PassportConfidence;
  financialPosition: PassportFinancialPosition;
  behaviorMetrics: PassportBehaviorMetric[];
  institutionsSummary: PassportInstitutionsSummary;
  freshness: PassportFreshness;
  activeShare?: PassportShareRecord | null;
  shareHistory?: PassportShareRecord[];
}
