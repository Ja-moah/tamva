/**
 * TAMVA Save Money UI Types
 *
 * Types and data contracts for the customer-facing Save Money experience.
 * Local/mock state designed for future backend API integration.
 */

import { CurrencyCode } from './financial';
import { FeatherIconName } from '../constants/icons';

export type SavingsFrequency = 'weekly' | 'biweekly' | 'monthly' | 'flexible';

export type SavingsPlanStatus = 'draft' | 'active' | 'paused' | 'completed';

export interface SavingsGoalTemplate {
  id: string;
  name: string;
  description: string;
  defaultTarget: number;
  icon: FeatherIconName;
  category: string;
}

export interface SavingsFundingAccount {
  id: string;
  institutionName: string;
  accountType: string;
  maskedIdentifier: string;
  balance: number;
  currency: CurrencyCode;
  isEligible: boolean;
  status: 'active' | 'disconnected';
  statusReason?: string;
  brandKey?: string;
  icon?: FeatherIconName;
}

export interface SavingsPlanDraft {
  goalName: string;
  goalDescription: string;
  goalIcon: FeatherIconName;
  targetAmount: number;
  currency: CurrencyCode;
  targetDate?: string; // ISO date string e.g. "2026-12-31" or human readable
  frequency: SavingsFrequency;
  fundingAccount: SavingsFundingAccount | null;
}

export interface SavingsPlan {
  id: string;
  goalName: string;
  goalDescription: string;
  goalIcon: FeatherIconName;
  targetAmount: number;
  savedAmount: number;
  currency: CurrencyCode;
  targetDate?: string;
  frequency: SavingsFrequency;
  fundingAccount: SavingsFundingAccount;
  status: SavingsPlanStatus;
  createdAt: string;
  updatedAt: string;
}

export type SaveFlowStep =
  | 'goal_select'
  | 'target_amount'
  | 'contribution_plan'
  | 'funding_account'
  | 'review'
  | 'created'
  | 'plan_details';
