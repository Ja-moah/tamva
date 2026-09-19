/**
 * TAMVA Risk & Decision Intelligence Mock Data
 *
 * Presentation-grade demonstration data for the Risk Overview feature (Phase 8A).
 * Consistently aligned with Karim Salifu's consented profile data.
 */

import {
  RiskAssessment,
  RiskDecisionContext,
  RiskDecisionContextOption,
} from '../../types/risk';

export const mockRiskAssessment: RiskAssessment = {
  level: 'low',
  levelLabel: 'Low Risk',
  standingLabel: 'Strong financial profile',
  explanation:
    'Your latest consented financial data indicates a stable financial position with consistent income, positive cash flow and strong savings behaviour.',
  attribution: 'Based on the latest consented financial data available to TAMVA.',
  factors: [
    {
      id: 'income_consistency',
      title: 'Income Consistency',
      statusLabel: 'Strong',
      description: 'Consistent income activity supports a stable financial profile.',
      icon: 'trending-up',
      badgeTone: 'success',
      supportingSignals: [
        { label: 'Monthly inflow', value: 'GH₵7,200' },
        { label: 'Income activity', value: 'Consistent' },
        { label: 'Contributing accounts', value: '4 connected accounts' },
      ],
      whyItMatters:
        'Consistent income activity can provide a stronger foundation for assessing financial stability.',
      contributionNote:
        'This is one of several signals contributing to your current Low Risk assessment.',
      dataContext: 'Based on the latest consented financial data available to TAMVA.',
    },
    {
      id: 'financial_stability',
      title: 'Financial Stability',
      statusLabel: 'Strong',
      description:
        'Positive cash flow and available financial resources support financial stability.',
      icon: 'shield',
      badgeTone: 'success',
      supportingSignals: [
        { label: 'Consolidated balance', value: 'GH₵28,450' },
        { label: 'Monthly inflow', value: 'GH₵7,200' },
        { label: 'Monthly outflow', value: 'GH₵3,450' },
        { label: 'Net monthly cashflow', value: 'GH₵3,750' },
      ],
      whyItMatters:
        'Positive net cash flow combined with an available operating balance helps protect against unexpected deficits.',
      contributionNote:
        'This is one of several signals contributing to your current Low Risk assessment.',
      dataContext: 'Based on the latest consented financial data available to TAMVA.',
    },
    {
      id: 'savings_discipline',
      title: 'Savings Discipline',
      statusLabel: 'Strong',
      description:
        'A healthy portion of monthly inflow is retained, supporting stronger financial resilience.',
      supportingMetric: '52.1%',
      icon: 'pie-chart',
      badgeTone: 'information',
      supportingSignals: [
        { label: 'Savings rate', value: '52.1%' },
        { label: 'Monthly inflow', value: 'GH₵7,200' },
        { label: 'Monthly outflow', value: 'GH₵3,450' },
        { label: 'Net cashflow', value: 'GH₵3,750' },
      ],
      whyItMatters:
        'Retaining cash flow surplus strengthens your capacity to build assets and handle future commitments.',
      contributionNote:
        'This is one of several signals contributing to your current Low Risk assessment.',
      dataContext: 'Based on the latest consented financial data available to TAMVA.',
    },
    {
      id: 'financial_resilience',
      title: 'Financial Resilience',
      statusLabel: 'Good',
      description:
        'Available financial resources provide a reasonable buffer against short-term financial pressure.',
      icon: 'activity',
      badgeTone: 'information',
      supportingSignals: [
        { label: 'Consolidated balance', value: 'GH₵28,450' },
        { label: 'Net monthly cashflow', value: 'GH₵3,750' },
      ],
      whyItMatters:
        'Available financial resources provide a reasonable buffer against short-term pressure.',
      contributionNote:
        'This is one of several signals contributing to your current Low Risk assessment.',
      dataContext: 'Based on the latest consented financial data available to TAMVA.',
    },
  ],
  summary:
    'Your assessment is supported by consistent income activity, positive monthly cash flow and a strong savings rate. TAMVA currently has data from 4 connected institutions.',
  summaryIndicators: [
    {
      text: 'Consistent salary deposits across primary accounts',
      icon: 'check',
      tone: 'success',
    },
    {
      text: 'Positive consolidated cash flow with surplus retention',
      icon: 'check',
      tone: 'success',
    },
  ],
  coverage: {
    institutionsCount: 4,
    assessmentWindow: '12 months',
    freshnessLabel: 'Based on your latest available consented data',
    lastUpdated: 'Updated today',
  },
  decisionInsight: {
    isAvailable: true,
    outcomeLabel: 'Strong profile',
    outcomeTone: 'success',
    keySignals: {
      riskLevel: 'Low Risk',
      netCashflow: 'GH₵3,750',
      savingsRate: '52.1%',
      dataSources: '4 institutions',
    },
    financialPositions: [
      { label: 'Consolidated balance', value: 'GH₵28,450', isAvailable: true },
      { label: 'Monthly inflow', value: 'GH₵7,200', isAvailable: true },
      { label: 'Monthly outflow', value: 'GH₵3,450', isAvailable: true },
      { label: 'Net monthly cashflow', value: 'GH₵3,750', isAvailable: true },
      { label: 'Savings rate', value: '52.1%', isAvailable: true },
    ],
  },
  disclosure:
    'This assessment reflects signals calculated from the financial data currently available to TAMVA. It is not a guaranteed lending or financial-services decision.',
};

/**
 * Limited Data Risk Assessment Scenario (Phase 8D).
 * Represents partial consented data where only income consistency can be confirmed.
 * Prevents false reassurance: assessment is explicitly "Assessment limited".
 * Does not emit fake zeros: missing metrics are marked isAvailable: false ("Not available").
 * Account count is synchronized between Coverage and Decision Intelligence.
 */
const LIMITED_CONNECTED_ACCOUNTS = 1;
const formatAccountsCount = (count: number): string =>
  count === 1 ? '1 connected account' : `${count} connected accounts`;

export const mockLimitedRiskAssessment: RiskAssessment = {
  level: 'low',
  levelLabel: 'Assessment limited',
  standingLabel: 'Limited data coverage',
  isLimited: true,
  explanation:
    'Some financial signals are unavailable, so TAMVA cannot provide a complete risk assessment from the current data.',
  attribution: 'Based on the latest consented financial data available to TAMVA.',
  factors: [
    {
      id: 'income_consistency',
      title: 'Income Consistency',
      statusLabel: 'Strong',
      description: 'Consistent income activity supports a stable financial profile.',
      icon: 'trending-up',
      badgeTone: 'success',
      isAvailable: true,
      supportingSignals: [
        { label: 'Monthly inflow', value: 'GH₵7,200', isAvailable: true },
        { label: 'Income activity', value: 'Consistent', isAvailable: true },
        {
          label: 'Contributing accounts',
          value: formatAccountsCount(LIMITED_CONNECTED_ACCOUNTS),
          isAvailable: true,
        },
      ],
      whyItMatters:
        'Consistent income activity can provide a stronger foundation for assessing financial stability.',
      contributionNote:
        'This signal is available and contributes to your current risk assessment.',
      dataContext: 'Based on the latest consented financial data available to TAMVA.',
    },
    {
      id: 'financial_stability',
      title: 'Financial Stability',
      statusLabel: 'Not available',
      description: 'Assessment unavailable from current data.',
      icon: 'shield',
      badgeTone: 'neutral',
      isAvailable: false,
      unavailableReason:
        "There isn't enough consented financial data available to assess this factor right now.",
      supportingSignals: [
        { label: 'Consolidated balance', value: 'Not available', isAvailable: false },
        { label: 'Monthly inflow', value: 'GH₵7,200', isAvailable: true },
        { label: 'Monthly outflow', value: 'Not available', isAvailable: false },
        { label: 'Net monthly cashflow', value: 'Not available', isAvailable: false },
      ],
      contributionNote:
        'This signal is currently unavailable from consented data.',
      dataContext: 'Based on the latest consented financial data available to TAMVA.',
    },
    {
      id: 'savings_discipline',
      title: 'Savings Discipline',
      statusLabel: 'Not available',
      description: 'Assessment unavailable from current data.',
      icon: 'pie-chart',
      badgeTone: 'neutral',
      isAvailable: false,
      unavailableReason:
        "There isn't enough consented financial data available to assess this factor right now.",
      supportingSignals: [
        { label: 'Savings rate', value: 'Not available', isAvailable: false },
        { label: 'Monthly inflow', value: 'GH₵7,200', isAvailable: true },
        { label: 'Monthly outflow', value: 'Not available', isAvailable: false },
        { label: 'Net cashflow', value: 'Not available', isAvailable: false },
      ],
      contributionNote:
        'This signal is currently unavailable from consented data.',
      dataContext: 'Based on the latest consented financial data available to TAMVA.',
    },
    {
      id: 'financial_resilience',
      title: 'Financial Resilience',
      statusLabel: 'Not available',
      description: 'Assessment unavailable from current data.',
      icon: 'activity',
      badgeTone: 'neutral',
      isAvailable: false,
      unavailableReason:
        "There isn't enough consented financial data available to assess this factor right now.",
      supportingSignals: [
        { label: 'Consolidated balance', value: 'Not available', isAvailable: false },
        { label: 'Net monthly cashflow', value: 'Not available', isAvailable: false },
      ],
      contributionNote:
        'This signal is currently unavailable from consented data.',
      dataContext: 'Based on the latest consented financial data available to TAMVA.',
    },
  ],
  summary:
    'Assessment is limited due to partial financial data coverage. Only income consistency could be verified from currently available data.',
  summaryIndicators: [
    {
      text: 'Consistent income activity is available from the connected data.',
      icon: 'check',
      tone: 'success',
    },
    {
      text: 'Cash flow and savings signals are currently unavailable.',
      icon: 'info',
      tone: 'neutral',
    },
  ],
  coverage: {
    institutionsCount: LIMITED_CONNECTED_ACCOUNTS,
    assessmentWindow: 'Limited',
    freshnessLabel: 'Partial consented data',
    lastUpdated: 'Updated today',
  },
  decisionInsight: {
    isAvailable: true,
    isLimited: true,
    outcomeLabel: 'Limited signals',
    outcomeTone: 'neutral',
    keySignals: {
      riskLevel: 'Assessment limited',
      netCashflow: 'Not available',
      savingsRate: 'Not available',
      dataSources: formatAccountsCount(LIMITED_CONNECTED_ACCOUNTS),
    },
    financialPositions: [
      { label: 'Consolidated balance', value: 'Not available', isAvailable: false },
      { label: 'Monthly inflow', value: 'GH₵7,200', isAvailable: true },
      { label: 'Monthly outflow', value: 'Not available', isAvailable: false },
      { label: 'Net monthly cashflow', value: 'Not available', isAvailable: false },
      { label: 'Savings rate', value: 'Not available', isAvailable: false },
    ],
  },
  disclosure:
    'This assessment reflects signals calculated from the financial data currently available to TAMVA. It is not a guaranteed lending or financial-services decision.',
};

/**
 * Unavailable Risk Assessment Scenario (Phase 8D).
 * Engine or data sources are temporarily unable to compute risk metrics.
 * Preserves known provenance metadata without stale calculations.
 */
export const mockUnavailableRiskAssessment: RiskAssessment = {
  level: 'low',
  levelLabel: 'Unavailable',
  standingLabel: 'Assessment unavailable',
  isUnavailable: true,
  explanation:
    "We couldn't calculate your current risk assessment from the available financial data.",
  attribution: 'Based on the latest consented financial data available to TAMVA.',
  factors: [
    {
      id: 'income_consistency',
      title: 'Income Consistency',
      statusLabel: 'Not available',
      description: 'Assessment unavailable from current data.',
      icon: 'trending-up',
      badgeTone: 'neutral',
      isAvailable: false,
      unavailableReason:
        "There isn't enough consented financial data available to assess this factor right now.",
      supportingSignals: [
        { label: 'Monthly inflow', value: 'Not available', isAvailable: false },
        { label: 'Income activity', value: 'Not available', isAvailable: false },
        { label: 'Contributing accounts', value: 'Not available', isAvailable: false },
      ],
      contributionNote:
        'This signal is currently unavailable from consented data.',
      dataContext: 'Based on the latest consented financial data available to TAMVA.',
    },
    {
      id: 'financial_stability',
      title: 'Financial Stability',
      statusLabel: 'Not available',
      description: 'Assessment unavailable from current data.',
      icon: 'shield',
      badgeTone: 'neutral',
      isAvailable: false,
      unavailableReason:
        "There isn't enough consented financial data available to assess this factor right now.",
      supportingSignals: [
        { label: 'Consolidated balance', value: 'Not available', isAvailable: false },
        { label: 'Monthly inflow', value: 'Not available', isAvailable: false },
        { label: 'Monthly outflow', value: 'Not available', isAvailable: false },
        { label: 'Net monthly cashflow', value: 'Not available', isAvailable: false },
      ],
      contributionNote:
        'This signal is currently unavailable from consented data.',
      dataContext: 'Based on the latest consented financial data available to TAMVA.',
    },
    {
      id: 'savings_discipline',
      title: 'Savings Discipline',
      statusLabel: 'Not available',
      description: 'Assessment unavailable from current data.',
      icon: 'pie-chart',
      badgeTone: 'neutral',
      isAvailable: false,
      unavailableReason:
        "There isn't enough consented financial data available to assess this factor right now.",
      supportingSignals: [
        { label: 'Savings rate', value: 'Not available', isAvailable: false },
        { label: 'Monthly inflow', value: 'Not available', isAvailable: false },
        { label: 'Monthly outflow', value: 'Not available', isAvailable: false },
        { label: 'Net cashflow', value: 'Not available', isAvailable: false },
      ],
      contributionNote:
        'This signal is currently unavailable from consented data.',
      dataContext: 'Based on the latest consented financial data available to TAMVA.',
    },
    {
      id: 'financial_resilience',
      title: 'Financial Resilience',
      statusLabel: 'Not available',
      description: 'Assessment unavailable from current data.',
      icon: 'activity',
      badgeTone: 'neutral',
      isAvailable: false,
      unavailableReason:
        "There isn't enough consented financial data available to assess this factor right now.",
      supportingSignals: [
        { label: 'Consolidated balance', value: 'Not available', isAvailable: false },
        { label: 'Net monthly cashflow', value: 'Not available', isAvailable: false },
      ],
      contributionNote:
        'This signal is currently unavailable from consented data.',
      dataContext: 'Based on the latest consented financial data available to TAMVA.',
    },
  ],
  summary:
    "We couldn't calculate your current risk assessment from the available financial data.",
  summaryIndicators: [],
  coverage: {
    institutionsCount: 4,
    assessmentWindow: '12 months',
    freshnessLabel: 'Not available',
    lastUpdated: 'Updated today',
  },
  decisionInsight: {
    isAvailable: false,
  },
  disclosure:
    'This assessment reflects signals calculated from the financial data currently available to TAMVA. It is not a guaranteed lending or financial-services decision.',
};

/**
 * Available Decision Intelligence review contexts (Phase 8C).
 */
export const DECISION_CONTEXT_OPTIONS: RiskDecisionContextOption[] = [
  {
    id: 'financial_planning',
    label: 'Financial Planning',
    description: 'Personal budgeting, cashflow forecasting, and surplus retention',
    icon: 'compass',
  },
  {
    id: 'loan_application',
    label: 'Loan Application',
    description: 'Credit and borrowing assessment context',
    icon: 'briefcase',
  },
  {
    id: 'rental_application',
    label: 'Rental Application',
    description: 'Tenancy, lease, and payment stability review',
    icon: 'home',
  },
  {
    id: 'financial_service',
    label: 'Financial Service',
    description: 'Fintech service, advisory, or account qualification review',
    icon: 'sliders',
  },
  {
    id: 'other',
    label: 'Other',
    description: 'General consented financial standing review',
    icon: 'file-text',
  },
];

/**
 * Contextual explanatory copy per selected decision context.
 * Strict conservative framing: "may provide useful context", "may support".
 */
export const DECISION_CONTEXT_EXPLANATIONS: Record<RiskDecisionContext, string> = {
  financial_planning:
    'Your current profile highlights positive cash flow and strong savings behaviour, providing useful context for your financial planning.',
  loan_application:
    'Your current profile shows positive cash flow, consistent income activity and strong savings behaviour. These signals may provide useful context during a lender\'s review.',
  rental_application:
    'Your current profile shows a positive cash flow position and consistent financial activity. These signals may provide useful context during a rental application review.',
  financial_service:
    'Your current financial profile provides a consolidated view of income, cash flow and financial behaviour that may support a financial-service review.',
  other:
    'Your current financial profile provides a consolidated view of the financial signals currently available to TAMVA.',
};

/**
 * Strict conservative disclosure for Decision Intelligence (Phase 8C).
 */
export const DECISION_INTELLIGENCE_DISCLOSURE =
  'This assessment provides financial context based on the data currently available to TAMVA. It does not represent a guaranteed lending, rental or financial-services decision.';

