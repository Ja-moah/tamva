/**
 * TAMVA Risk & Decision Intelligence Types
 *
 * Domain types for TAMVA's Risk Overview feature (Phase 8A).
 * Encapsulates financial risk assessment level, contributing profile factors,
 * analytical rationale, and consented data coverage signals.
 */

import { FeatherIconName } from '../constants/icons';
import { BadgeTone } from '../components/ui/Badge';

/**
 * Core risk level scale.
 * Note: Data availability conditions (e.g. limited or unavailable data)
 * are handled at the presentation/state mode layer, not as a risk level.
 */
export type RiskLevel = 'low' | 'moderate' | 'elevated';

/**
 * Screen lifecycle / presentation mode (Phase 8D).
 */
export type RiskStateMode =
  | 'loaded'
  | 'loading'
  | 'limited'
  | 'empty'
  | 'unavailable'
  | 'error';

/**
 * Review context for Decision Intelligence framing (Phase 8C).
 */
export type RiskDecisionContext =
  | 'financial_planning'
  | 'loan_application'
  | 'rental_application'
  | 'financial_service'
  | 'other';

/**
 * Selectable context option metadata.
 */
export interface RiskDecisionContextOption {
  id: RiskDecisionContext;
  label: string;
  description: string;
  icon: FeatherIconName;
}

/**
 * Supporting signal metric for a risk factor detail view.
 */
export interface RiskFactorSupportingSignal {
  label: string;
  value: string;
  isAvailable?: boolean;
}

/**
 * Key contributing factor derived from consented financial profile.
 */
export interface RiskFactor {
  id: string;
  title: string;
  statusLabel: string; // e.g. "Strong", "Good"
  description: string;
  supportingMetric?: string; // e.g. "52.1%"
  icon: FeatherIconName;
  badgeTone: BadgeTone;
  isAvailable?: boolean;
  unavailableReason?: string;
  supportingSignals?: RiskFactorSupportingSignal[];
  whyItMatters?: string;
  contributionNote?: string;
  dataContext?: string;
}

/**
 * Summary analytical indicator row.
 * Colors are strictly handled by semantic tone at the UI layer.
 */
export interface RiskSummaryIndicator {
  text: string;
  icon?: FeatherIconName;
  tone?: 'success' | 'neutral' | 'warning';
}

/**
 * Data coverage and assessment window metadata.
 */
export interface RiskCoverage {
  institutionsCount: number;
  assessmentWindow: string; // e.g. "12 months"
  freshnessLabel: string; // e.g. "Based on your latest available consented data"
  lastUpdated: string;
}

/**
 * Key signals synthesis for Decision Intelligence.
 */
export interface RiskDecisionKeySignals {
  riskLevel: string;
  netCashflow: string;
  savingsRate: string;
  dataSources: string;
}

/**
 * Financial position line item for Decision Intelligence detail.
 */
export interface RiskFinancialPositionItem {
  label: string;
  value: string;
  isAvailable?: boolean;
}

/**
 * Complete customer financial risk assessment.
 */
export interface RiskAssessment {
  level: RiskLevel;
  levelLabel: string; // e.g. "Low Risk"
  standingLabel: string; // e.g. "Strong financial profile"
  explanation: string;
  attribution: string;
  factors: RiskFactor[];
  summary: string;
  coverage: RiskCoverage;
  disclosure: string;
  isLimited?: boolean;
  isUnavailable?: boolean;
  decisionInsight?: {
    isAvailable?: boolean;
    isLimited?: boolean;
    outcomeLabel?: string;
    outcomeTone?: BadgeTone;
    keySignals?: RiskDecisionKeySignals;
    financialPositions?: RiskFinancialPositionItem[];
  };
  summaryIndicators?: RiskSummaryIndicator[];
}
