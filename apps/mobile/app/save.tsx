/**
 * TAMVA Save Money Flow Orchestrator Screen
 *
 * Full customer-facing Save Money experience:
 * 1. Goal selection & net cash flow context (SavingsGoalStep)
 * 2. Custom goal creation modal (CustomGoalModal)
 * 3. Target amount & timeframe configuration (SavingsTargetStep)
 * 4. Contribution frequency selection (ContributionPlanStep)
 * 5. Choose funding source account (FundingAccountStep)
 * 6. Review plan breakdown (SavingsReviewStep)
 * 7. Confirmation receipt at 0% (SavingsCreatedStep)
 * 8. Plan details inspection & progress bar (SavingsPlanDetails)
 * 9. Development demo contribution modal (DemoContributionModal)
 *
 * Local/mock state session persistence. No real money moved. Activity untouched.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { withFeatureGate } from '../src/components/ui/withFeatureGate';
import { View, StyleSheet, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/theme';
import { useHaptics } from '../src/hooks/useHaptics';
import {
  SavingsGoalTemplate,
  SavingsFundingAccount,
  SavingsFrequency,
  SavingsPlanDraft,
  SavingsPlan,
  SaveFlowStep,
} from '../src/types/save';
import {
  MOCK_SAVINGS_GOAL_TEMPLATES,
  MOCK_SAVINGS_FUNDING_ACCOUNTS,
  saveSessionPlan,
  recordDemoContribution,
  getSessionPlans,
} from '../src/demo/data/mockSaveData';
import {
  SavingsGoalStep,
  CustomGoalModal,
  CustomGoalData,
  SavingsTargetStep,
  ContributionPlanStep,
  FundingAccountStep,
  SavingsReviewStep,
  SavingsCreatedStep,
  SavingsPlanDetails,
  DemoContributionModal,
} from '../src/components/save';

function SaveMoneyScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const haptics = useHaptics();

  // 1. Navigation Flow State
  const [currentStep, setCurrentStep] = useState<SaveFlowStep>('goal_select');

  // 2. Modals State
  const [isCustomModalVisible, setIsCustomModalVisible] = useState(false);
  const [isDemoModalVisible, setIsDemoModalVisible] = useState(false);

  // 3. Draft State
  const [goalName, setGoalName] = useState('Emergency Fund');
  const [goalDescription, setGoalDescription] = useState('Build a financial buffer');
  const [goalIcon, setGoalIcon] = useState<SavingsGoalTemplate['icon']>('shield');
  const [targetAmount, setTargetAmount] = useState(5000.0);
  const [targetDate, setTargetDate] = useState<string | undefined>(undefined);
  const [frequency, setFrequency] = useState<SavingsFrequency>('monthly');

  // 4. Funding Accounts
  const [fundingAccounts] = useState<SavingsFundingAccount[]>(
    MOCK_SAVINGS_FUNDING_ACCOUNTS
  );
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    MOCK_SAVINGS_FUNDING_ACCOUNTS.find((a) => a.isEligible)?.id || null
  );

  const selectedAccount = useMemo(
    () => fundingAccounts.find((a) => a.id === selectedAccountId) || null,
    [fundingAccounts, selectedAccountId]
  );

  // Active Draft object
  const draft: SavingsPlanDraft = useMemo(
    () => ({
      goalName,
      goalDescription,
      goalIcon,
      targetAmount,
      currency: 'GHS',
      targetDate,
      frequency,
      fundingAccount: selectedAccount,
    }),
    [
      goalName,
      goalDescription,
      goalIcon,
      targetAmount,
      targetDate,
      frequency,
      selectedAccount,
    ]
  );

  // 5. Active Plan State (Once created)
  const [activePlan, setActivePlan] = useState<SavingsPlan | null>(null);

  // 6. Android Hardware Back Button Handling
  useEffect(() => {
    const handleHardwareBack = () => {
      if (isCustomModalVisible) {
        setIsCustomModalVisible(false);
        return true;
      }
      if (isDemoModalVisible) {
        setIsDemoModalVisible(false);
        return true;
      }

      switch (currentStep) {
        case 'goal_select':
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)');
          }
          return true;
        case 'target_amount':
          setCurrentStep('goal_select');
          return true;
        case 'contribution_plan':
          setCurrentStep('target_amount');
          return true;
        case 'funding_account':
          setCurrentStep('contribution_plan');
          return true;
        case 'review':
          setCurrentStep('funding_account');
          return true;
        case 'created':
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)');
          }
          return true;
        case 'plan_details':
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(tabs)');
          }
          return true;
        default:
          return false;
      }
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleHardwareBack
    );
    return () => subscription.remove();
  }, [currentStep, isCustomModalVisible, isDemoModalVisible, router]);

  // 7. Handlers for Goal Selection (Step 1)
  const handleSelectTemplate = (template: SavingsGoalTemplate) => {
    setGoalName(template.name);
    setGoalDescription(template.description);
    setGoalIcon(template.icon);
    setTargetAmount(template.defaultTarget);
    setCurrentStep('target_amount');
  };

  const handleOpenCustomGoal = () => {
    setIsCustomModalVisible(true);
  };

  const handleSaveCustomGoal = (customData: CustomGoalData) => {
    setGoalName(customData.name);
    setGoalDescription('Personalized savings goal');
    setGoalIcon('target');
    setTargetAmount(customData.targetAmount);
    setTargetDate(customData.targetDate);
    setCurrentStep('target_amount');
  };

  // 8. Handlers for Target Configuration (Step 2)
  const handleTargetContinue = (amount: number, date?: string) => {
    setTargetAmount(amount);
    setTargetDate(date);
    setCurrentStep('contribution_plan');
  };

  // 9. Handlers for Contribution Plan (Step 3)
  const handlePlanContinue = (freq: SavingsFrequency) => {
    setFrequency(freq);
    setCurrentStep('funding_account');
  };

  // 10. Handlers for Funding Account (Step 4)
  const handleSelectAccount = (account: SavingsFundingAccount) => {
    setSelectedAccountId(account.id);
  };

  const handleFundingContinue = () => {
    if (!selectedAccount) return;
    setCurrentStep('review');
  };

  const handleManageConnectedAccounts = () => {
    haptics.selection();
    router.push('/(tabs)/consent');
  };

  // 11. Handlers for Review (Step 5)
  const handleCreatePlan = () => {
    if (!selectedAccount) return;

    const newPlan: SavingsPlan = {
      id: `plan-${Date.now()}`,
      goalName,
      goalDescription,
      goalIcon,
      targetAmount,
      savedAmount: 0.0,
      currency: 'GHS',
      targetDate,
      frequency,
      fundingAccount: selectedAccount,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveSessionPlan(newPlan);
    setActivePlan(newPlan);
    setCurrentStep('created');
  };

  // 12. Handlers for Confirmation (Step 6)
  const handleViewPlan = () => {
    setCurrentStep('plan_details');
  };

  const handleDone = () => {
    haptics.selection();
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  // 13. Handlers for Plan Details (Step 7) & Demo Contribution
  const handleOpenDemo = () => {
    setIsDemoModalVisible(true);
  };

  const handleConfirmDemoContribution = (amount: number) => {
    if (!activePlan) return;
    const updated = recordDemoContribution(activePlan.id, amount);
    if (updated) {
      setActivePlan(updated);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {/* STEP 1: GOAL SELECTION */}
      {currentStep === 'goal_select' && (
        <SavingsGoalStep
          templates={MOCK_SAVINGS_GOAL_TEMPLATES}
          onSelectTemplate={handleSelectTemplate}
          onOpenCustomGoal={handleOpenCustomGoal}
          onBack={handleDone}
        />
      )}

      {/* STEP 2: TARGET AMOUNT */}
      {currentStep === 'target_amount' && (
        <SavingsTargetStep
          goalName={goalName}
          goalDescription={goalDescription}
          goalIcon={goalIcon}
          initialAmount={targetAmount}
          initialTargetDate={targetDate}
          onContinue={handleTargetContinue}
          onBack={() => setCurrentStep('goal_select')}
        />
      )}

      {/* STEP 3: CONTRIBUTION PLAN */}
      {currentStep === 'contribution_plan' && (
        <ContributionPlanStep
          goalName={goalName}
          targetAmount={targetAmount}
          targetDate={targetDate}
          initialFrequency={frequency}
          onContinue={handlePlanContinue}
          onBack={() => setCurrentStep('target_amount')}
        />
      )}

      {/* STEP 4: FUNDING ACCOUNT */}
      {currentStep === 'funding_account' && (
        <FundingAccountStep
          accounts={fundingAccounts}
          selectedAccountId={selectedAccountId}
          onSelectAccount={handleSelectAccount}
          onContinue={handleFundingContinue}
          onManageConnectedAccounts={handleManageConnectedAccounts}
          onBack={() => setCurrentStep('contribution_plan')}
        />
      )}

      {/* STEP 5: REVIEW PLAN */}
      {currentStep === 'review' && (
        <SavingsReviewStep
          draft={draft}
          onCreatePlan={handleCreatePlan}
          onEditPlan={() => setCurrentStep('target_amount')}
          onBack={() => setCurrentStep('funding_account')}
        />
      )}

      {/* STEP 6: PLAN CREATED CONFIRMATION */}
      {currentStep === 'created' && activePlan && (
        <SavingsCreatedStep
          plan={activePlan}
          onViewPlan={handleViewPlan}
          onDone={handleDone}
        />
      )}

      {/* STEP 7: SAVINGS PLAN DETAILS */}
      {currentStep === 'plan_details' && activePlan && (
        <SavingsPlanDetails
          plan={activePlan}
          onOpenDemoContribution={handleOpenDemo}
          onDone={handleDone}
          onBack={() => setCurrentStep('created')}
        />
      )}

      {/* CUSTOM GOAL MODAL */}
      <CustomGoalModal
        visible={isCustomModalVisible}
        onSave={handleSaveCustomGoal}
        onClose={() => setIsCustomModalVisible(false)}
      />

      {/* DEMO CONTRIBUTION MODAL */}
      {activePlan && (
        <DemoContributionModal
          visible={isDemoModalVisible}
          goalName={activePlan.goalName}
          onConfirm={handleConfirmDemoContribution}
          onClose={() => setIsDemoModalVisible(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});


export default withFeatureGate(SaveMoneyScreen, {
  capability: 'customer_payments',
  wired: false,
  showBack: true,
  title: 'Save',
  description: "TAMVA does not hold or grow savings.",
});
