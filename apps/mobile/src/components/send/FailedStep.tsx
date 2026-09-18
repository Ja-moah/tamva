/**
 * TAMVA FailedStep Component (Screen 8)
 *
 * Failure state handling for transfer exceptions:
 * - Clear, non-accusatory explanation
 * - Confirmation that no funds were debited
 * - Technical reference tracking ID
 * - Clear recovery pathways: "Try again" or "Back to Home"
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { TransferDraft } from '../../types/transfer';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

export interface FailedStepProps {
  draft: TransferDraft;
  referenceId?: string;
  errorMessage?: string;
  onTryAgain: () => void;
  onBackToHome: () => void;
}

export const FailedStep: React.FC<FailedStepProps> = ({
  draft,
  referenceId = 'TVA-ERR-8821',
  errorMessage = 'Destination operator switch timed out. Your account balance was not charged.',
  onTryAgain,
  onBackToHome,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  useEffect(() => {
    haptics.error();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 32) + 24,
            paddingBottom: Math.max(insets.bottom, 24) + 120,
          },
        ]}
      >
        {/* Error Icon */}
        <View
          style={[
            styles.errorCircle,
            {
              backgroundColor: theme.colors.dangerLight,
              borderColor: theme.colors.danger,
            },
          ]}
        >
          <Icon name="alert-circle" size={32} color={theme.colors.danger} />
        </View>

        {/* Title */}
        <Text
          style={[
            theme.typography.heading,
            { color: theme.colors.textPrimary, marginTop: 24, textAlign: 'center' },
          ]}
        >
          Transfer couldn&apos;t be completed
        </Text>

        <Text
          style={[
            theme.typography.bodyMedium,
            {
              color: theme.colors.textSecondary,
              textAlign: 'center',
              marginTop: 8,
              lineHeight: 22,
              maxWidth: 300,
            },
          ]}
        >
          The transfer was not completed. No money was sent.
        </Text>

        {/* Technical Notice Card */}
        <Card variant="outlined" style={styles.errorCard}>
          <View style={styles.cardHeaderRow}>
            <Icon name="info" size={16} color={theme.colors.danger} />
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.danger, marginLeft: 8, fontWeight: '600' },
              ]}
            >
              Diagnostic Information
            </Text>
          </View>

          <Text
            style={[
              theme.typography.bodySm,
              { color: theme.colors.textSecondary, marginTop: 8, lineHeight: 20 },
            ]}
          >
            {errorMessage}
          </Text>

          <View
            style={[
              styles.divider,
              { backgroundColor: theme.colors.border },
            ]}
          />

          <View style={styles.referenceRow}>
            <Text style={[styles.metaLabel, { color: theme.colors.textTertiary }]}>
              Reference Code
            </Text>
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.textPrimary, fontFamily: 'monospace' },
              ]}
            >
              {referenceId}
            </Text>
          </View>

          <View style={styles.referenceRow}>
            <Text style={[styles.metaLabel, { color: theme.colors.textTertiary }]}>
              Intended Destination
            </Text>
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.textPrimary },
              ]}
            >
              {draft.recipient?.name} ({draft.recipient?.networkOrBank})
            </Text>
          </View>
        </Card>
      </ScrollView>

      {/* FIXED BOTTOM ACTIONS */}
      <View
        style={[
          styles.bottomActions,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <Button
          label="Try again"
          variant="primary"
          size="lg"
          fullWidth={true}
          onPress={onTryAgain}
          accessibilityHint="Returns to transfer review screen"
        />

        <View style={styles.secondaryButtonWrapper}>
          <Button
            label="Back to Home"
            variant="tertiary"
            size="md"
            fullWidth={true}
            onPress={onBackToHome}
            accessibilityHint="Dismisses transfer and returns to home screen"
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
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  errorCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorCard: {
    width: '100%',
    padding: 16,
    marginTop: 28,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    marginVertical: 12,
  },
  referenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  metaLabel: {
    fontSize: 12,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  secondaryButtonWrapper: {
    marginTop: 8,
  },
});
