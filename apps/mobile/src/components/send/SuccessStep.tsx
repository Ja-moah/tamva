/**
 * TAMVA SuccessStep Component (Screen 7)
 *
 * Polished transaction receipt screen:
 * - Restrained, executive-grade visual language
 * - Distinct transfer confirmation details
 * - Primary CTA: "View transaction" (opens full detail view)
 * - Secondary Action: "Done" (returns cleanly to Home)
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { TransferResult } from '../../types/transfer';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { MoneyDisplay } from '../financial/MoneyDisplay';

export interface SuccessStepProps {
  result: TransferResult;
  onViewTransaction: () => void;
  onDone: () => void;
}

export const SuccessStep: React.FC<SuccessStepProps> = ({
  result,
  onViewTransaction,
  onDone,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  useEffect(() => {
    haptics.success();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 32) + 16,
            paddingBottom: Math.max(insets.bottom, 24) + 120,
          },
        ]}
      >
        {/* Success Icon */}
        <View
          style={[
            styles.successCircle,
            {
              backgroundColor: theme.colors.primaryLight,
              borderColor: theme.colors.primary,
            },
          ]}
        >
          <Icon name="check" size={32} color={theme.colors.primary} />
        </View>

        {/* Title & Amount */}
        <Text
          style={[
            theme.typography.heading,
            { color: theme.colors.textPrimary, marginTop: 20, textAlign: 'center' },
          ]}
        >
          Money sent
        </Text>

        <View style={styles.amountWrapper}>
          <MoneyDisplay
            amount={result.amount}
            currency={result.currency}
            size="lg"
          />
        </View>

        <Text
          style={[
            theme.typography.bodyMedium,
            { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 4 },
          ]}
        >
          Sent to{' '}
          <Text style={{ color: theme.colors.textPrimary, fontWeight: '700' }}>
            {result.recipient.name}
          </Text>
        </Text>

        {/* Structured Summary Receipt Card */}
        <Card variant="outlined" style={styles.receiptCard}>
          {/* FROM */}
          <View style={styles.receiptRow}>
            <Text style={[styles.receiptLabel, { color: theme.colors.textSecondary }]}>
              From
            </Text>
            <Text
              style={[
                theme.typography.bodyMedium,
                { color: theme.colors.textPrimary, fontWeight: '600' },
              ]}
            >
              {result.sourceAccount.institutionName} {result.sourceAccount.maskedIdentifier}
            </Text>
          </View>

          <View
            style={[
              styles.rowDivider,
              { backgroundColor: theme.colors.border },
            ]}
          />

          {/* TO */}
          <View style={styles.receiptRow}>
            <Text style={[styles.receiptLabel, { color: theme.colors.textSecondary }]}>
              To
            </Text>
            <View style={styles.alignRight}>
              <Text
                style={[
                  theme.typography.bodyMedium,
                  { color: theme.colors.textPrimary, fontWeight: '600' },
                ]}
              >
                {result.recipient.name}
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textTertiary, marginTop: 1 },
                ]}
              >
                {result.recipient.networkOrBank} • {result.recipient.maskedAccount}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.rowDivider,
              { backgroundColor: theme.colors.border },
            ]}
          />

          {/* REFERENCE ID */}
          <View style={styles.receiptRow}>
            <Text style={[styles.receiptLabel, { color: theme.colors.textSecondary }]}>
              Reference
            </Text>
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.textPrimary, fontFamily: 'monospace' },
              ]}
            >
              {result.reference}
            </Text>
          </View>

          <View
            style={[
              styles.rowDivider,
              { backgroundColor: theme.colors.border },
            ]}
          />

          {/* DATE / TIME */}
          <View style={styles.receiptRow}>
            <Text style={[styles.receiptLabel, { color: theme.colors.textSecondary }]}>
              Date & Time
            </Text>
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.textPrimary },
              ]}
            >
              {result.timestamp}
            </Text>
          </View>

          {/* NOTE (if present) */}
          {Boolean(result.note) && (
            <>
              <View
                style={[
                  styles.rowDivider,
                  { backgroundColor: theme.colors.border },
                ]}
              />
              <View style={styles.receiptRow}>
                <Text
                  style={[
                    styles.receiptLabel,
                    { color: theme.colors.textSecondary },
                  ]}
                >
                  Note
                </Text>
                <Text
                  style={[
                    theme.typography.captionMedium,
                    { color: theme.colors.textPrimary },
                  ]}
                >
                  {result.note}
                </Text>
              </View>
            </>
          )}
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
          label="View transaction"
          variant="primary"
          size="lg"
          fullWidth={true}
          onPress={onViewTransaction}
          accessibilityHint="Opens transaction detail sheet"
        />

        <View style={styles.secondaryButtonWrapper}>
          <Button
            label="Done"
            variant="tertiary"
            size="md"
            fullWidth={true}
            onPress={onDone}
            accessibilityHint="Dismisses transfer flow and returns to home"
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
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountWrapper: {
    marginVertical: 10,
  },
  receiptCard: {
    width: '100%',
    padding: 16,
    marginTop: 24,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  receiptLabel: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  alignRight: {
    alignItems: 'flex-end',
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
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
