/**
 * TAMVA PassportShareSheet Component
 *
 * Multi-step BottomSheet flow for sharing the Financial Passport:
 * 1. Purpose Selection
 * 2. Information / Scope Customization (Identity required; others optional)
 * 3. Access Duration Selection
 * 4. Staged Pre-Authorization Review
 * 5. Share Generation & Success Presentation
 */

import React, { startTransition, useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { BottomSheet } from '../ui/BottomSheet';
import { PassportSharePurpose } from './PassportSharePurpose';
import { PassportShareScopes } from './PassportShareScopes';
import { PassportShareDuration } from './PassportShareDuration';
import { PassportShareReview } from './PassportShareReview';
import { PassportShareSuccess } from './PassportShareSuccess';
import {
  PassportShareStep,
  PassportSharePurposeId,
  PassportShareScopeId,
  PassportShareDurationId,
  PassportShareRecord,
  PassportIdentity,
} from '../../types/passport';

export interface PassportShareSheetProps {
  visible: boolean;
  onClose: () => void;
  identity: PassportIdentity;
  isCreating: boolean;
  onCreateShare: (
    purposeId: PassportSharePurposeId,
    scopes: PassportShareScopeId[],
    durationId: PassportShareDurationId,
    customNote?: string
  ) => Promise<PassportShareRecord>;
  onShowQr: (share: PassportShareRecord) => void;
}

const ALL_SCOPES: PassportShareScopeId[] = [
  'identity',
  'confidence',
  'financial_position',
  'cashflow',
  'behaviour',
  'institutions',
];

export const PassportShareSheet: React.FC<PassportShareSheetProps> = ({
  visible,
  onClose,
  identity,
  isCreating,
  onCreateShare,
  onShowQr,
}) => {
  const { theme } = useTheme();

  const [step, setStep] = useState<PassportShareStep>('purpose');
  const [selectedPurposeId, setSelectedPurposeId] =
    useState<PassportSharePurposeId>('loan');
  const [customNote, setCustomNote] = useState<string>('');
  const [selectedScopes, setSelectedScopes] =
    useState<PassportShareScopeId[]>(ALL_SCOPES);
  const [selectedDurationId, setSelectedDurationId] =
    useState<PassportShareDurationId>('30_days');
  const [createdShare, setCreatedShare] =
    useState<PassportShareRecord | null>(null);

  // Reset state whenever opening
  useEffect(() => {
    if (visible) {
      startTransition(() => {
        setStep('purpose');
        setSelectedPurposeId('loan');
        setCustomNote('');
        setSelectedScopes(ALL_SCOPES);
        setSelectedDurationId('30_days');
        setCreatedShare(null);
      });
    }
  }, [visible]);

  const handleToggleScope = (scopeId: PassportShareScopeId) => {
    if (scopeId === 'identity') return; // Required

    setSelectedScopes((prev) => {
      if (prev.includes(scopeId)) {
        return prev.filter((s) => s !== scopeId);
      } else {
        return [...prev, scopeId];
      }
    });
  };

  const handleCreateConfirm = async () => {
    try {
      const record = await onCreateShare(
        selectedPurposeId,
        selectedScopes,
        selectedDurationId,
        customNote.trim() || undefined
      );
      setCreatedShare(record);
      setStep('success');
    } catch {
      // Handled by hook haptics
    }
  };

  const getSheetTitle = () => {
    switch (step) {
      case 'purpose':
        return 'Share Financial Passport';
      case 'scopes':
        return 'Information to Share';
      case 'duration':
        return 'Access Duration';
      case 'review':
        return 'Review Share Details';
      case 'success':
        return 'Share Created';
    }
  };

  const getSheetSubtitle = () => {
    switch (step) {
      case 'purpose':
        return 'Step 1 of 4 • Select purpose';
      case 'scopes':
        return 'Step 2 of 4 • Choose scopes';
      case 'duration':
        return 'Step 3 of 4 • Set validity';
      case 'review':
        return 'Step 4 of 4 • Confirm authorization';
      case 'success':
        return 'Passport presentation active';
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={getSheetTitle()}
      subtitle={getSheetSubtitle()}
      maxHeight="86%"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {step === 'purpose' && (
          <PassportSharePurpose
            selectedPurposeId={selectedPurposeId}
            onSelectPurpose={setSelectedPurposeId}
            customNote={customNote}
            onChangeCustomNote={setCustomNote}
            onContinue={() => setStep('scopes')}
          />
        )}

        {step === 'scopes' && (
          <PassportShareScopes
            selectedScopes={selectedScopes}
            onToggleScope={handleToggleScope}
            onBack={() => setStep('purpose')}
            onContinue={() => setStep('duration')}
          />
        )}

        {step === 'duration' && (
          <PassportShareDuration
            selectedDurationId={selectedDurationId}
            onSelectDuration={setSelectedDurationId}
            onBack={() => setStep('scopes')}
            onContinue={() => setStep('review')}
          />
        )}

        {step === 'review' && (
          <PassportShareReview
            purposeId={selectedPurposeId}
            customNote={customNote}
            selectedScopes={selectedScopes}
            durationId={selectedDurationId}
            holderName={identity.holderName}
            passportId={identity.passportId}
            isCreating={isCreating}
            onBack={() => setStep('duration')}
            onConfirm={handleCreateConfirm}
          />
        )}

        {step === 'success' && createdShare && (
          <PassportShareSuccess
            share={createdShare}
            onShowQr={() => {
              onClose();
              onShowQr(createdShare);
            }}
            onDone={onClose}
          />
        )}
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
  },
});
