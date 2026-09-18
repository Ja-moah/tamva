/**
 * TAMVA ProcessingStep Component (Screen 6)
 *
 * Indeterminate processing screen with subtle motion and deterministic timing.
 * Back navigation is intentionally locked during in-flight processing.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, ActivityIndicator } from 'react-native';
import { useTheme } from '../../theme';
import { TransferDraft } from '../../types/transfer';

export interface ProcessingStepProps {
  draft: TransferDraft;
  onComplete: () => void;
}

export const ProcessingStep: React.FC<ProcessingStepProps> = ({
  draft,
  onComplete,
}) => {
  const { theme } = useTheme();
  const pulseAnim = useState(() => new Animated.Value(1))[0];

  useEffect(() => {
    // Subtle pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Deterministic mock timer (1800ms) to simulate switch processing
    const timer = setTimeout(() => {
      onComplete();
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View
        style={[
          styles.spinnerCircle,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </Animated.View>

      <Text
        style={[
          theme.typography.heading,
          { color: theme.colors.textPrimary, marginTop: 28, textAlign: 'center' },
        ]}
      >
        Sending money
      </Text>

      <Text
        style={[
          theme.typography.bodyMedium,
          {
            color: theme.colors.textSecondary,
            marginTop: 8,
            textAlign: 'center',
            maxWidth: 280,
            lineHeight: 22,
          },
        ]}
      >
        Your transfer of{' '}
        <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>
          GH₵{draft.amount.toFixed(2)}
        </Text>{' '}
        to {draft.recipient?.name} is being processed.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  spinnerCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
});
