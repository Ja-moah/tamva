/**
 * TAMVA Financial Protection Types
 *
 * Domain types for TAMVA's Financial Protection feature.
 * Encapsulates security monitoring, consent health, account availability,
 * and low-priority protection awareness signals derived from consented financial data.
 */

import { FeatherIconName } from '../constants/icons';
import { InstitutionType, ConsentedScope } from './accounts';

export type ProtectionStateMode =
  | 'loaded'
  | 'loading'
  | 'empty'
  | 'error';

export type ProtectionScenario =
  | 'healthy'
  | 'attention'
  | 'disconnected'
  | 'limited'
  | 'unavailable';

export type ProtectionStatus =
  | 'protected'
  | 'attention'
  | 'monitoring'
  | 'unavailable';

export type ProtectionSignalStatus =
  | 'healthy'
  | 'attention'
  | 'neutral';

export interface ProtectionSignalDetailMetric {
  label: string;
  value: string;
}

export interface ProtectionSignal {
  id: string;
  title: string;
  description: string;
  status: ProtectionSignalStatus;
  icon: FeatherIconName;
  whatThisMeans?: string;
  supportingDetails?: ProtectionSignalDetailMetric[];
  infoNote?: string;
  relevantAccountIds?: string[];
  actionLabel?: string;
}

export interface ProtectionMonitoring {
  enabled: boolean;
  lastCheckedAt: string;
  accountsMonitored: number;
  recentAlerts: number;
  statusLabel?: string;
  isAvailable?: boolean;
  alertNote?: string;
}

export interface ProtectionAccountSummary {
  total: number;
  connected: number;
  attentionRequired: number;
  disconnected: number;
}

export interface ProtectionAccountDetail {
  id: string;
  institutionName: string;
  accountName: string;
  maskedIdentifier: string;
  institutionType: InstitutionType;
  connectionStatus: 'connected' | 'attention' | 'disconnected';
  protectionStatus: ProtectionSignalStatus;
  lastChecked: string;
  consentScopes: ConsentedScope[];
  actionRequired?: string;
  statusReason?: string;
}

export interface ProtectionActivity {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  status: ProtectionSignalStatus;
  icon: FeatherIconName;
}

export interface ProtectionRecommendation {
  id: string;
  title: string;
  description: string;
  actionLabel?: string;
  priority: 'low' | 'medium' | 'high';
  icon: FeatherIconName;
}

export interface FinancialProtection {
  status: ProtectionStatus;
  statusLabel: string;
  statusDescription: string;

  monitoring: ProtectionMonitoring;

  accounts: ProtectionAccountSummary;

  accountDetails: ProtectionAccountDetail[];

  signals: ProtectionSignal[];

  recentActivity: ProtectionActivity[];

  recommendations: ProtectionRecommendation[];

  lastUpdated: string;
}
