/**
 * TAMVA Send Money Flow Orchestrator Screen
 *
 * Full customer-facing transaction experience:
 * 1. Select funding account (SourceAccountStep)
 * 2. Select recipient (SelectRecipientStep)
 * 3. Enter amount & note (EnterAmountStep)
 * 4. Review transfer (ReviewTransferStep)
 * 5. Confirm / Authenticate PIN (AuthenticatePinStep)
 * 6. Processing state (ProcessingStep)
 * 7. Success receipt (SuccessStep)
 * 8. Failure handling (FailedStep)
 * 9. Transaction Details inspection (TransactionDetailSheet)
 *
 * Integrated with Activity mock state so successful transactions appear immediately.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { withFeatureGate } from '../src/components/ui/withFeatureGate';
import { View, StyleSheet, BackHandler } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/theme';
import { useHaptics } from '../src/hooks/useHaptics';
import {
  FundingAccount,
  TransferRecipient,
  TransferDraft,
  TransferStep,
  TransferResult,
} from '../src/types/transfer';
import { ActivityTransaction } from '../src/types/activity';
import {
  MOCK_FUNDING_ACCOUNTS,
  MOCK_RECIPIENTS,
  calculateEstimatedFee,
} from '../src/demo/data/mockTransferData';
import { addActivityTransaction } from '../src/demo/data/mockActivityData';
import {
  SourceAccountStep,
  SelectRecipientStep,
  EnterAmountStep,
  ReviewTransferStep,
  AuthenticatePinStep,
  ProcessingStep,
  SuccessStep,
  FailedStep,
} from '../src/components/send';
import { TransactionDetailSheet } from '../src/components/activity/TransactionDetailSheet';

function SendMoneyScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const haptics = useHaptics();

  // 1. Core Step State
  const [currentStep, setCurrentStep] = useState<TransferStep>('source');

  // 2. Data State
  const [fundingAccounts] = useState<FundingAccount[]>(MOCK_FUNDING_ACCOUNTS);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(
    MOCK_FUNDING_ACCOUNTS.find((acc) => acc.isEligible)?.id || null
  );

  const [recipients, setRecipients] = useState<TransferRecipient[]>(MOCK_RECIPIENTS);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);

  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState<string>('');
  const [simulateFailure, setSimulateFailure] = useState<boolean>(false);

  // 3. Result & Details State
  const [result, setResult] = useState<TransferResult | null>(null);
  const [activityTx, setActivityTx] = useState<ActivityTransaction | null>(null);
  const [isDetailSheetVisible, setIsDetailSheetVisible] = useState(false);

  // Active funding account and recipient objects
  const selectedAccount = useMemo(
    () => fundingAccounts.find((a) => a.id === selectedAccountId) || null,
    [fundingAccounts, selectedAccountId]
  );

  const selectedRecipient = useMemo(
    () => recipients.find((r) => r.id === selectedRecipientId) || null,
    [recipients, selectedRecipientId]
  );

  // Active draft representation
  const draft: TransferDraft = useMemo(
    () => ({
      sourceAccount: selectedAccount,
      recipient: selectedRecipient,
      amount,
      currency: 'GHS',
      estimatedFee: calculateEstimatedFee(amount, selectedRecipient?.method),
      note,
    }),
    [selectedAccount, selectedRecipient, amount, note]
  );

  // 4. Android Hardware Back Button Handling
  useEffect(() => {
    const handleHardwareBack = () => {
      switch (currentStep) {
        case 'source':
          router.back();
          return true;
        case 'recipient':
          setCurrentStep('source');
          return true;
        case 'amount':
          setCurrentStep('recipient');
          return true;
        case 'review':
          setCurrentStep('amount');
          return true;
        case 'auth':
          setCurrentStep('review');
          return true;
        case 'processing':
          // Suppress back during transaction processing
          return true;
        case 'success':
        case 'failure':
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

  // 5. Navigation Step Handlers
  const handleSourceAccountContinue = () => {
    if (!selectedAccount) return;
    setCurrentStep('recipient');
  };

  const handleSelectRecipient = (recipient: TransferRecipient) => {
    setSelectedRecipientId(recipient.id);
  };

  const handleAddNewRecipient = (newRec: TransferRecipient) => {
    setRecipients((prev) => [newRec, ...prev]);
    setSelectedRecipientId(newRec.id);
  };

  const handleRecipientContinue = () => {
    if (!selectedRecipient) return;
    setCurrentStep('amount');
  };

  const handleAmountContinue = (enteredAmount: number, enteredNote: string) => {
    setAmount(enteredAmount);
    setNote(enteredNote);
    setCurrentStep('review');
  };

  const handleReviewConfirm = () => {
    setCurrentStep('auth');
  };

  const handleReviewEdit = () => {
    setCurrentStep('amount');
  };

  const handlePinSuccess = () => {
    setSimulateFailure(false);
    setCurrentStep('processing');
  };

  const handlePinSimulateFailure = () => {
    setSimulateFailure(true);
    setCurrentStep('processing');
  };

  // 6. Processing Completion Logic
  const handleProcessingComplete = useCallback(() => {
    if (simulateFailure) {
      setCurrentStep('failure');
      return;
    }

    if (!selectedAccount || !selectedRecipient) return;

    // Generate unique mock reference and transaction identifiers
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    const txReference = `TVA-TXN-${randomDigits}`;
    const txId = `tx-send-${Date.now()}`;

    // Timestamp formatting
    const now = new Date();
    const formattedTime = now.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    const formattedDate = `${now.getDate()} Sep 2026, ${formattedTime}`;

    const transferResult: TransferResult = {
      transactionId: txId,
      status: 'completed',
      timestamp: formattedDate,
      rawDate: '2026-09-14', // Aligns with mockActivityData "TODAY" section
      reference: txReference,
      amount,
      currency: 'GHS',
      fee: draft.estimatedFee,
      total: amount + draft.estimatedFee,
      sourceAccount: selectedAccount,
      recipient: selectedRecipient,
      note: note || undefined,
    };

    // Construct Activity Transaction to append directly to user's activity timeline
    const newActivityTransaction: ActivityTransaction = {
      id: txReference,
      title: `Transfer to ${selectedRecipient.name}`,
      category:
        selectedRecipient.method === 'mobile_money'
          ? 'Mobile Money Transfer'
          : selectedRecipient.method === 'bank'
          ? 'Bank Transfer'
          : 'Instant TAMVA Transfer',
      date: `Today, ${formattedTime}`,
      rawDate: '2026-09-14',
      amount,
      currency: 'GHS',
      flow: 'outflow',
      status: 'completed',
      accountLabel: `${selectedAccount.institutionName} ${selectedAccount.maskedIdentifier}`,
      icon: 'arrow-up-right',
      categoryTag: 'transfers',
      note: note || undefined,
    };

    // Register into shared Activity state
    addActivityTransaction(newActivityTransaction);

    setResult(transferResult);
    setActivityTx(newActivityTransaction);
    setCurrentStep('success');
  }, [
    simulateFailure,
    selectedAccount,
    selectedRecipient,
    amount,
    draft.estimatedFee,
    note,
  ]);

  // 7. Exit Actions
  const handleDone = () => {
    haptics.selection();
    router.back();
  };

  const handleTryAgain = () => {
    haptics.selection();
    setCurrentStep('review');
  };

  const handleBackToHome = () => {
    haptics.selection();
    router.back();
  };

  const handleViewTransaction = () => {
    haptics.selection();
    setIsDetailSheetVisible(true);
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {/* SCREEN 1: SELECT SOURCE ACCOUNT */}
      {currentStep === 'source' && (
        <SourceAccountStep
          accounts={fundingAccounts}
          selectedAccountId={selectedAccountId}
          onSelectAccount={(acc) => setSelectedAccountId(acc.id)}
          onContinue={handleSourceAccountContinue}
          onBack={() => router.back()}
        />
      )}

      {/* SCREEN 2: SELECT RECIPIENT */}
      {currentStep === 'recipient' && (
        <SelectRecipientStep
          recipients={recipients}
          selectedRecipientId={selectedRecipientId}
          onSelectRecipient={handleSelectRecipient}
          onAddNewRecipient={handleAddNewRecipient}
          onContinue={handleRecipientContinue}
          onBack={() => setCurrentStep('source')}
        />
      )}

      {/* SCREEN 3: ENTER AMOUNT */}
      {currentStep === 'amount' && selectedAccount && selectedRecipient && (
        <EnterAmountStep
          sourceAccount={selectedAccount}
          recipient={selectedRecipient}
          initialAmount={amount}
          initialNote={note}
          onContinue={handleAmountContinue}
          onBack={() => setCurrentStep('recipient')}
        />
      )}

      {/* SCREEN 4: REVIEW TRANSFER */}
      {currentStep === 'review' && (
        <ReviewTransferStep
          draft={draft}
          onConfirm={handleReviewConfirm}
          onEdit={handleReviewEdit}
          onBack={() => setCurrentStep('amount')}
        />
      )}

      {/* SCREEN 5: AUTHENTICATE PIN */}
      {currentStep === 'auth' && (
        <AuthenticatePinStep
          draft={draft}
          onSuccess={handlePinSuccess}
          onSimulateFailure={handlePinSimulateFailure}
          onBack={() => setCurrentStep('review')}
        />
      )}

      {/* SCREEN 6: PROCESSING */}
      {currentStep === 'processing' && (
        <ProcessingStep
          draft={draft}
          onComplete={handleProcessingComplete}
        />
      )}

      {/* SCREEN 7: SUCCESS */}
      {currentStep === 'success' && result && (
        <SuccessStep
          result={result}
          onViewTransaction={handleViewTransaction}
          onDone={handleDone}
        />
      )}

      {/* SCREEN 8: FAILED STATE */}
      {currentStep === 'failure' && (
        <FailedStep
          draft={draft}
          referenceId="TVA-ERR-8821"
          errorMessage="Destination operator switch timed out. Your account balance was not charged."
          onTryAgain={handleTryAgain}
          onBackToHome={handleBackToHome}
        />
      )}

      {/* TRANSACTION DETAILS SHEET (Activity-consistent inspection) */}
      <TransactionDetailSheet
        transaction={activityTx}
        visible={isDetailSheetVisible}
        onClose={() => setIsDetailSheetVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});


export default withFeatureGate(SendMoneyScreen, {
  capability: 'customer_payments',
  wired: false,
  showBack: true,
  title: 'Send',
  description: "TAMVA is not a bank or wallet and does not send money.",
});
