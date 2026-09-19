/**
 * TAMVA AuthenticatePinStep Component (Screen 5)
 *
 * 4-digit transaction PIN confirmation experience:
 * - Clear amount and recipient reminder
 * - Masked PIN indicators
 * - Tactile numeric keypad with haptics
 * - Realistic feedback for demo testing:
 *   - '1234' (or any 4 digits): Success
 *   - '9999': Simulates failure state
 *   - '0000': Simulates incorrect PIN error feedback
 * - No real PIN or credentials are ever logged or persisted.
 */

import React, { startTransition, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { TransferDraft } from '../../types/transfer';
import { ScreenHeader } from '../ui/ScreenHeader';
import { Icon } from '../ui/Icon';
import { NumericKeypad } from './NumericKeypad';
import { DEMO_FAILURE_PIN, DEMO_INCORRECT_PIN } from '../../demo/data/mockTransferData';

export interface AuthenticatePinStepProps {
  draft: TransferDraft;
  onSuccess: () => void;
  onSimulateFailure: () => void;
  onBack: () => void;
}

export const AuthenticatePinStep: React.FC<AuthenticatePinStepProps> = ({
  draft,
  onSuccess,
  onSimulateFailure,
  onBack,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [shakeAnim] = useState(new Animated.Value(0));

  const triggerShake = () => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleKeyPress = (digit: string) => {
    if (pin.length >= 4) return;
    setErrorMessage('');
    const newPin = pin + digit;
    setPin(newPin);
  };

  const handleDelete = () => {
    setErrorMessage('');
    setPin((prev) => prev.slice(0, -1));
  };

  // Evaluate PIN when all 4 digits are entered
  useEffect(() => {
    if (pin.length === 4) {
      if (pin === DEMO_INCORRECT_PIN) {
        haptics.warning();
        triggerShake();
        startTransition(() => setErrorMessage('Incorrect PIN. Please try again.'));
        setTimeout(() => {
          setPin('');
        }, 500);
      } else if (pin === DEMO_FAILURE_PIN) {
        haptics.selection();
        onSimulateFailure();
      } else {
        haptics.success();
        onSuccess();
      }
    }
  }, [pin]);

  if (!draft.recipient) return null;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 1. SCREEN HEADER */}
      <ScreenHeader
        title="Confirm transfer"
        subtitle="Security authorization"
        showBack={true}
        onBackPress={onBack}
        borderBottom={true}
      />

      {/* 2. AUTHENTICATION PROMPT */}
      <View
        style={[
          styles.content,
          { paddingBottom: Math.max(insets.bottom, 24) + 16 },
        ]}
      >
        {/* Reminder Pill */}
        <View
          style={[
            styles.reminderPill,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Icon name="lock" size={16} color={theme.colors.primary} />
          <Text
            style={[
              theme.typography.captionMedium,
              { color: theme.colors.textSecondary, marginLeft: 8 },
            ]}
          >
            Authorizing{' '}
            <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>
              GH₵{draft.amount.toFixed(2)}
            </Text>{' '}
            to {draft.recipient.name}
          </Text>
        </View>

        {/* Title & Instructions */}
        <Text
          style={[
            theme.typography.heading,
            { color: theme.colors.textPrimary, marginTop: 24, textAlign: 'center' },
          ]}
        >
          Enter transaction PIN
        </Text>
        <Text
          style={[
            theme.typography.bodyMedium,
            {
              color: theme.colors.textSecondary,
              marginTop: 6,
              textAlign: 'center',
            },
          ]}
        >
          Enter your 4-digit security PIN to approve this transfer
        </Text>

        {/* 4 MASKED PIN INDICATORS */}
        <Animated.View
          style={[
            styles.dotsContainer,
            { transform: [{ translateX: shakeAnim }] },
          ]}
        >
          {[0, 1, 2, 3].map((index) => {
            const isFilled = pin.length > index;
            return (
              <View
                key={`dot-${index}`}
                style={[
                  styles.dot,
                  {
                    borderColor: isFilled
                      ? theme.colors.primary
                      : theme.colors.border,
                    backgroundColor: isFilled
                      ? theme.colors.primary
                      : 'transparent',
                  },
                ]}
              />
            );
          })}
        </Animated.View>

        {/* Error Message */}
        <View style={styles.errorContainer}>
          {Boolean(errorMessage) ? (
            <Text style={[styles.errorText, { color: theme.colors.danger }]}>
              {errorMessage}
            </Text>
          ) : (
            <Text style={[styles.hintText, { color: theme.colors.textTertiary }]}>
              Demo PIN: enter 1234 (or 9999 to test failure)
            </Text>
          )}
        </View>

        {/* NUMERIC KEYPAD */}
        <View style={styles.keypadWrapper}>
          <NumericKeypad
            onKeyPress={handleKeyPress}
            onDelete={handleDelete}
            mode="pin"
            disabled={pin.length === 4}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reminderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 18,
    marginVertical: 24,
  },
  dot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
  errorContainer: {
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  hintText: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans_400Regular',
  },
  keypadWrapper: {
    width: '100%',
    paddingBottom: 8,
  },
});
