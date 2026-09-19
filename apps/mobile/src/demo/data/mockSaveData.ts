/**
 * TAMVA Mock Save Data
 *
 * Mock data, goal templates, connected funding accounts, and period-accurate
 * contribution calculators for the customer-facing Save Money experience.
 *
 * All financial institutions and rules are local TAMVA demonstration data.
 */

import {
  SavingsGoalTemplate,
  SavingsFundingAccount,
  SavingsFrequency,
  SavingsPlan,
} from '../../types/save';

export const MOCK_CUSTOMER_NAME = 'Karim Salifu';

/**
 * Recent net cash flow context (GH₵3,750.00)
 * Derived from customer's latest consented monthly net cash flow.
 * Strictly labeled "Recent net cash flow" — NOT "available balance".
 */
export const MOCK_RECENT_NET_CASH_FLOW = 3750.0;
export const MOCK_CASH_FLOW_LABEL = 'Recent net cash flow';
export const MOCK_CASH_FLOW_DESCRIPTION = 'Based on your latest consented cashflow data.';

/**
 * Goal templates with realistic starter values and icons.
 */
export const MOCK_SAVINGS_GOAL_TEMPLATES: SavingsGoalTemplate[] = [
  {
    id: 'template-emergency',
    name: 'Emergency Fund',
    description: 'Build a financial buffer',
    defaultTarget: 5000.0,
    icon: 'shield',
    category: 'Security',
  },
  {
    id: 'template-school',
    name: 'School Fees',
    description: 'Prepare for upcoming education costs',
    defaultTarget: 3000.0,
    icon: 'book-open',
    category: 'Education',
  },
  {
    id: 'template-laptop',
    name: 'New Laptop',
    description: 'Save toward a technology purchase',
    defaultTarget: 8000.0,
    icon: 'monitor',
    category: 'Technology',
  },
  {
    id: 'template-travel',
    name: 'Travel',
    description: 'Set aside money for a trip',
    defaultTarget: 6000.0,
    icon: 'compass',
    category: 'Lifestyle',
  },
];

/**
 * Karim Salifu's connected funding accounts for savings contributions.
 * 4 active eligible accounts; 1 disconnected account (Telecel Cash).
 */
export const MOCK_SAVINGS_FUNDING_ACCOUNTS: SavingsFundingAccount[] = [
  {
    id: 'fund-gcb-4021',
    institutionName: 'GCB Bank',
    accountType: 'Current Account',
    maskedIdentifier: '•• 4021',
    balance: 14500.0,
    currency: 'GHS',
    isEligible: true,
    status: 'active',
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
    status: 'active',
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
    status: 'active',
    brandKey: 'mtn',
    icon: 'smartphone',
  },
  {
    id: 'fund-calbank-1092',
    institutionName: 'CalBank',
    accountType: 'High-Yield Vault',
    maskedIdentifier: '•• 1092',
    balance: 4120.0,
    currency: 'GHS',
    isEligible: true,
    status: 'active',
    brandKey: 'calbank',
    icon: 'shield',
  },
  {
    id: 'fund-telecel-5521',
    institutionName: 'Telecel Cash',
    accountType: 'Subscriber Wallet',
    maskedIdentifier: '•• 5521',
    balance: 350.0,
    currency: 'GHS',
    isEligible: false,
    status: 'disconnected',
    statusReason: 'Connection expired. Re-authenticate in Connected Accounts to use Telecel Cash.',
    brandKey: 'telecel',
    icon: 'smartphone',
  },
];

/**
 * Suggested quick amounts for target configuration
 */
export const QUICK_TARGET_AMOUNTS = [500, 1000, 2500, 5000, 10000];

/**
 * Preset target durations for quick selection
 */
export interface TargetDateOption {
  id: string;
  label: string;
  monthsAhead: number;
}

export const TARGET_DATE_PRESETS: TargetDateOption[] = [
  { id: '3_months', label: '3 Months', monthsAhead: 3 },
  { id: '6_months', label: '6 Months', monthsAhead: 6 },
  { id: '12_months', label: '1 Year (Dec 2026)', monthsAhead: 12 },
  { id: '24_months', label: '2 Years', monthsAhead: 24 },
];

/**
 * Helper to get a formatted date string for a given number of months ahead
 */
export function getPresetTargetDate(monthsAhead: number, fromDate: Date = new Date()): string {
  const d = new Date(fromDate);
  d.setMonth(d.getMonth() + monthsAhead);
  return d.toISOString();
}

/**
 * Format date into human-readable Month Year (e.g. "December 2026")
 */
export function formatTargetDate(dateString?: string): string {
  if (!dateString) return 'No target date';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  } catch {
    return dateString;
  }
}

/**
 * Contribution Estimate Calculation Result
 */
export interface ContributionEstimateResult {
  amount: number | null;
  frequencyLabel: string;
  periodCount: number;
  label: string;
  description: string;
  displayText: string;
}

/**
 * Calculate the estimated contribution using the actual number of contribution
 * periods between current date and selected target date.
 *
 * Rules:
 * - Weekly: target amount ÷ number of weekly contribution periods
 * - Every 2 weeks: target amount ÷ number of biweekly contribution periods
 * - Monthly: target amount ÷ number of monthly contribution periods
 * - Flexible: return null and display "No fixed contribution required."
 *
 * Does not calculate weekly/biweekly simply by multiplying months.
 * Uses the actual selected target date and reference date.
 */
export function calculateEstimatedContribution(
  targetAmount: number,
  frequency: SavingsFrequency,
  targetDateString?: string,
  referenceDate: Date = new Date()
): ContributionEstimateResult {
  const label = 'Estimated contribution';
  const description = 'Based on your target and selected timeframe.';

  if (frequency === 'flexible') {
    return {
      amount: null,
      frequencyLabel: 'Flexible',
      periodCount: 0,
      label,
      description,
      displayText: 'No fixed contribution required.',
    };
  }

  if (!targetDateString) {
    const freqLabel =
      frequency === 'weekly'
        ? 'Weekly'
        : frequency === 'biweekly'
        ? 'Every 2 weeks'
        : 'Monthly';
    return {
      amount: null,
      frequencyLabel: freqLabel,
      periodCount: 0,
      label,
      description,
      displayText: 'Select a target date to estimate contribution.',
    };
  }

  const targetDate = new Date(targetDateString);
  if (isNaN(targetDate.getTime())) {
    return {
      amount: null,
      frequencyLabel: 'Monthly',
      periodCount: 0,
      label,
      description,
      displayText: 'Invalid target date.',
    };
  }

  const diffMs = targetDate.getTime() - referenceDate.getTime();
  const diffDays = Math.max(1, Math.round(diffMs / (1000 * 60 * 60 * 24)));

  let periodCount = 1;
  let frequencyLabel = 'Monthly';

  switch (frequency) {
    case 'weekly': {
      frequencyLabel = 'Weekly';
      // target amount ÷ number of weekly contribution periods
      periodCount = Math.max(1, Math.floor(diffDays / 7));
      break;
    }
    case 'biweekly': {
      frequencyLabel = 'Every 2 weeks';
      // target amount ÷ number of biweekly contribution periods
      periodCount = Math.max(1, Math.floor(diffDays / 14));
      break;
    }
    case 'monthly': {
      frequencyLabel = 'Monthly';
      // target amount ÷ number of monthly contribution periods
      const yearDiff = targetDate.getFullYear() - referenceDate.getFullYear();
      const monthDiff = targetDate.getMonth() - referenceDate.getMonth();
      const rawMonths = yearDiff * 12 + monthDiff;
      periodCount = Math.max(1, rawMonths);
      break;
    }
  }

  const estimatedAmount = targetAmount / periodCount;
  const formattedAmount = `GH₵${estimatedAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const periodSuffix =
    frequency === 'weekly'
      ? '/ week'
      : frequency === 'biweekly'
      ? '/ 2 weeks'
      : '/ month';

  return {
    amount: estimatedAmount,
    frequencyLabel,
    periodCount,
    label,
    description,
    displayText: `${formattedAmount} ${periodSuffix}`,
  };
}

/**
 * In-memory active session plans store
 */
let sessionActivePlans: SavingsPlan[] = [];

export function getSessionPlans(): SavingsPlan[] {
  return sessionActivePlans;
}

export function saveSessionPlan(plan: SavingsPlan): void {
  const existingIdx = sessionActivePlans.findIndex((p) => p.id === plan.id);
  if (existingIdx >= 0) {
    sessionActivePlans[existingIdx] = plan;
  } else {
    sessionActivePlans.unshift(plan);
  }
}

export function recordDemoContribution(planId: string, contributionAmount: number): SavingsPlan | null {
  const plan = sessionActivePlans.find((p) => p.id === planId);
  if (!plan) return null;

  const updatedSaved = plan.savedAmount + contributionAmount;
  const updatedPlan: SavingsPlan = {
    ...plan,
    savedAmount: updatedSaved,
    status: updatedSaved >= plan.targetAmount ? 'completed' : 'active',
    updatedAt: new Date().toISOString(),
  };

  saveSessionPlan(updatedPlan);
  return updatedPlan;
}
