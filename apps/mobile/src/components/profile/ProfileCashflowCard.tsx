/**
 * TAMVA ProfileCashflowCard Component
 *
 * Displays financial cashflow dynamics:
 * - Monthly Inflow (GH₵7,200)
 * - Monthly Outflow (GH₵3,450)
 * - Net Cashflow Surplus (GH₵3,750)
 * - Savings Rate (52.1%)
 *
 * Strictly integrates with MoneyDisplay to respect global privacy masking.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { MoneyDisplay } from '../financial/MoneyDisplay';
import { ProfileCashflow } from '../../types/profile';

export interface ProfileCashflowCardProps {
  cashflow?: ProfileCashflow | null;
  onPress?: () => void;
}

export const ProfileCashflowCard: React.FC<ProfileCashflowCardProps> = ({
  cashflow,
  onPress,
}) => {
  const { theme } = useTheme();

  if (!cashflow) {
    return (
      <Card variant="elevated" padding="none" style={styles.card}>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <Icon
                name="activity"
                size={15}
                color={theme.colors.primary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  theme.typography.captionMedium,
                  {
                    color: theme.colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                    fontSize: 11,
                  },
                ]}
              >
                CASHFLOW DYNAMICS
              </Text>
            </View>
            <View
              style={[
                styles.tagPill,
                { backgroundColor: theme.colors.backgroundAlt },
              ]}
            >
              <Text
                style={[
                  theme.typography.captionMedium,
                  { color: theme.colors.textTertiary, fontSize: 10 },
                ]}
              >
                Building
              </Text>
            </View>
          </View>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, marginTop: 10, lineHeight: 18 },
            ]}
          >
            Consolidated cashflow dynamics will appear here once consistent account activity is recorded across your connected institutions.
          </Text>
        </View>
      </Card>
    );
  }

  const isNetAvailable = typeof cashflow.netCashflow === 'number';
  const isIncomeAvailable = typeof cashflow.monthlyIncome === 'number';
  const isOutflowAvailable = typeof cashflow.monthlyOutflow === 'number';
  const isSavingsAvailable = typeof cashflow.savingsRatePercent === 'number';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={
        isNetAvailable
          ? `Cashflow dynamics: Net monthly surplus ${cashflow.netCashflow} ${cashflow.currency}`
          : 'Cashflow dynamics building'
      }
      accessibilityHint={onPress ? 'Tap to view detailed cashflow breakdown' : undefined}
    >
      <Card variant="elevated" padding="none" style={styles.card}>
      <View style={styles.content}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Icon
              name="activity"
              size={15}
              color={theme.colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                theme.typography.captionMedium,
                {
                  color: theme.colors.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                  fontSize: 11,
                },
              ]}
            >
              CASHFLOW DYNAMICS
            </Text>
          </View>

          <View
            style={[
              styles.tagPill,
              { backgroundColor: theme.colors.primaryLight },
            ]}
          >
            <View
              style={[
                styles.tagDot,
                { backgroundColor: theme.colors.primary },
              ]}
            />
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.primary, fontSize: 10 },
              ]}
            >
              12M Average
            </Text>
          </View>
        </View>

        {/* Big Net Surplus Display */}
        <View style={styles.netCashflowContainer}>
          <Text
            style={[
              theme.typography.captionMedium,
              {
                color: theme.colors.textSecondary,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              },
            ]}
          >
            Net Monthly Cashflow Surplus
          </Text>
          <View style={{ marginTop: 4, marginBottom: 8 }}>
            {isNetAvailable ? (
              <MoneyDisplay
                amount={cashflow.netCashflow!}
                currency={cashflow.currency}
                size="display"
                flow="income"
                showSign
              />
            ) : (
              <Text
                style={[
                  theme.typography.bodyMedium,
                  { color: theme.colors.textSecondary, fontSize: 20, fontWeight: '600' },
                ]}
              >
                Calculating...
              </Text>
            )}
          </View>
        </View>

        {/* Analytical Breakdown: Inflow, Outflow, Savings Rate */}
        <View
          style={[
            styles.breakdownBox,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* Inflow */}
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLabelGroup}>
              <Icon
                name="arrow-down-left"
                size={13}
                color={theme.colors.success}
                style={{ marginRight: 8 }}
              />
              <Text
                style={[
                  theme.typography.captionMedium,
                  { color: theme.colors.textSecondary, fontSize: 13 },
                ]}
              >
                Inflow
              </Text>
            </View>
            <View>
              {isIncomeAvailable ? (
                <MoneyDisplay
                  amount={cashflow.monthlyIncome!}
                  currency={cashflow.currency}
                  size="sm"
                  flow="income"
                  showSign
                />
              ) : (
                <Text
                  style={[
                    theme.typography.captionMedium,
                    { color: theme.colors.textTertiary, fontSize: 12 },
                  ]}
                >
                  —
                </Text>
              )}
            </View>
          </View>

          <View
            style={[
              styles.breakdownDivider,
              { backgroundColor: theme.colors.border },
            ]}
          />

          {/* Outflow */}
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLabelGroup}>
              <Icon
                name="arrow-up-right"
                size={13}
                color={theme.colors.textSecondary}
                style={{ marginRight: 8 }}
              />
              <Text
                style={[
                  theme.typography.captionMedium,
                  { color: theme.colors.textSecondary, fontSize: 13 },
                ]}
              >
                Outflow
              </Text>
            </View>
            <View>
              {isOutflowAvailable ? (
                <MoneyDisplay
                  amount={cashflow.monthlyOutflow!}
                  currency={cashflow.currency}
                  size="sm"
                  flow="neutral"
                  showSign={false}
                />
              ) : (
                <Text
                  style={[
                    theme.typography.captionMedium,
                    { color: theme.colors.textTertiary, fontSize: 12 },
                  ]}
                >
                  —
                </Text>
              )}
            </View>
          </View>

          <View
            style={[
              styles.breakdownDivider,
              { backgroundColor: theme.colors.border },
            ]}
          />

          {/* Savings Rate */}
          <View style={styles.breakdownRow}>
            <View style={styles.breakdownLabelGroup}>
              <Icon
                name="pie-chart"
                size={13}
                color={theme.colors.primary}
                style={{ marginRight: 8 }}
              />
              <Text
                style={[
                  theme.typography.captionMedium,
                  { color: theme.colors.textSecondary, fontSize: 13 },
                ]}
              >
                Savings Rate
              </Text>
            </View>
            <Text
              style={[
                theme.typography.bodyMedium,
                {
                  color: theme.colors.textPrimary,
                  fontWeight: '700',
                  fontSize: 13,
                },
              ]}
            >
              {isSavingsAvailable ? `${cashflow.savingsRatePercent}%` : '—'}
            </Text>
          </View>
        </View>

        {/* Context Note */}
        {cashflow.supportingNote && (
          <View
            style={[
              styles.contextRow,
              {
                borderTopColor: theme.colors.border,
              },
            ]}
          >
            <Icon
              name="info"
              size={13}
              color={theme.colors.textTertiary}
              style={{ marginRight: 6, marginTop: 1 }}
            />
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, flex: 1, fontSize: 11, lineHeight: 16 },
              ]}
            >
              {cashflow.supportingNote}
            </Text>
            {onPress && (
              <Icon
                name="chevron-right"
                size={14}
                color={theme.colors.textTertiary}
                style={{ marginLeft: 6, marginTop: 1 }}
              />
            )}
          </View>
        )}
      </View>
    </Card>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  netCashflowContainer: {
    marginTop: 12,
    marginBottom: 4,
  },
  breakdownBox: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 4,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  breakdownLabelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  breakdownDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
