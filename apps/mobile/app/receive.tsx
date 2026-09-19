/**
 * TAMVA Receive Money Flow Orchestrator Screen
 *
 * Full customer-facing Receive Money experience:
 * 1. Choose receiving account (ReceivingAccountStep)
 * 2. View receiving details & copy credentials (ReceiveDetailsStep)
 * 3. Optional amount & note request (RequestAmountModal)
 * 4. Pre-share summary & message preview (ReceiveSummaryStep)
 * 5. Ready to receive confirmation & done CTA (ReceiveReadyStep)
 *
 * Does not create unearned incoming transactions in Activity.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { withFeatureGate } from '../src/components/ui/withFeatureGate';
import { View, StyleSheet, BackHandler, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/theme';
import { useHaptics } from '../src/hooks/useHaptics';
import {
  ReceivingAccount,
  ReceiveRequestDraft,
  ReceiveStep,
} from '../src/types/receive';
import {
  MOCK_RECEIVING_ACCOUNTS,
  formatShareDetails,
} from '../src/demo/data/mockReceiveData';
import {
  ReceivingAccountStep,
  ReceiveDetailsStep,
  ReceiveSummaryStep,
  ReceiveReadyStep,
} from '../src/components/receive';

function ReceiveMoneyScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const haptics = useHaptics();

  // 1. Step Navigation State
  const [currentStep, setCurrentStep] = useState<ReceiveStep>('select_account');

  // 2. Data State
  const [accounts] = useState<ReceivingAccount[]>(MOCK_RECEIVING_ACCOUNTS);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    MOCK_RECEIVING_ACCOUNTS.find((acc) => acc.isEligible)?.id || null
  );

  const [requestedAmount, setRequestedAmount] = useState<number | undefined>(undefined);
  const [note, setNote] = useState<string | undefined>(undefined);

  // Active receiving account object
  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === selectedAccountId) || null,
    [accounts, selectedAccountId]
  );

  // Active draft representation
  const draft: ReceiveRequestDraft = useMemo(
    () => ({
      account: selectedAccount,
      amount: requestedAmount,
      currency: 'GHS',
      note,
    }),
    [selectedAccount, requestedAmount, note]
  );

  // 3. Android Hardware Back Button Handling
  useEffect(() => {
    const handleHardwareBack = () => {
      switch (currentStep) {
        case 'select_account':
          router.back();
          return true;
        case 'details':
          setCurrentStep('select_account');
          return true;
        case 'summary':
          setCurrentStep('details');
          return true;
        case 'ready':
          router.back();
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
  }, [currentStep, router]);

  // 4. Step Transition Handlers
  const handleAccountContinue = () => {
    if (!selectedAccount) return;
    setCurrentStep('details');
  };

  const handleUpdateAmount = (amount?: number, newNote?: string) => {
    setRequestedAmount(amount);
    setNote(newNote);
  };

  const handleDetailsContinue = () => {
    setCurrentStep('summary');
  };

  const handleChangeAccount = () => {
    haptics.selection();
    setCurrentStep('select_account');
  };

  const handleTriggerShare = async () => {
    haptics.selection();
    const message = formatShareDetails(draft);

    try {
      await Share.share({
        message,
        title: 'TAMVA Receiving Details',
      });
    } catch {
      // Graceful fallback on environments where native sharing fails
    }

    setCurrentStep('ready');
  };

  const handleManageConnectedAccounts = () => {
    haptics.selection();
    router.dismissTo('/(tabs)/consent' as any);
  };

  const handleDone = () => {
    haptics.selection();
    router.back();
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {/* STEP 1: CHOOSE RECEIVING ACCOUNT */}
      {currentStep === 'select_account' && (
        <ReceivingAccountStep
          accounts={accounts}
          selectedAccountId={selectedAccountId}
          onSelectAccount={(acc) => setSelectedAccountId(acc.id)}
          onContinue={handleAccountContinue}
          onManageConnectedAccounts={handleManageConnectedAccounts}
          onBack={() => router.back()}
        />
      )}

      {/* STEP 2: RECEIVING DETAILS & COPY */}
      {currentStep === 'details' && selectedAccount && (
        <ReceiveDetailsStep
          account={selectedAccount}
          draft={draft}
          onUpdateAmount={handleUpdateAmount}
          onContinue={handleDetailsContinue}
          onChangeAccount={handleChangeAccount}
          onBack={() => setCurrentStep('select_account')}
        />
      )}

      {/* STEP 3: PRE-SHARE SUMMARY */}
      {currentStep === 'summary' && selectedAccount && (
        <ReceiveSummaryStep
          account={selectedAccount}
          draft={draft}
          onShareDetails={handleTriggerShare}
          onEditDetails={() => setCurrentStep('details')}
          onBack={() => setCurrentStep('details')}
        />
      )}

      {/* STEP 4: READY TO RECEIVE CONFIRMATION */}
      {currentStep === 'ready' && selectedAccount && (
        <ReceiveReadyStep
          account={selectedAccount}
          draft={draft}
          onShareAgain={handleTriggerShare}
          onDone={handleDone}
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


export default withFeatureGate(ReceiveMoneyScreen, {
  capability: 'customer_payments',
  wired: false,
  showBack: true,
  title: 'Receive',
  description: "TAMVA is not a bank or wallet and does not receive money.",
});
