/**
 * TAMVA ActivitySummaryCard Component
 *
 * Compact, premium cashflow summary displaying:
 * - Period header (e.g. "September 2026 Cashflow")
 * - Total Inflow with income styling
 * - Total Outflow with neutral/outflow styling
 * - Net Cashflow with positive/negative indicators
 * Reuses MoneyDisplay to respect privacy masking automatically.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { ActivitySummary } from '../../types/activity';
import { MoneyDisplay } from '../financial/MoneyDisplay';
import { Icon } from '../ui/Icon';

export interface ActivitySummaryCardProps {
  summary: ActivitySummary;
}

export const ActivitySummaryCard: React.FC<ActivitySummaryCardProps> = ({ summary }) => {
  const { theme } = useTheme();

  const isNetPositive = summary.netCashflow >= 0;

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          ...theme.elevation.sm,
        },
      ]}
      accessibilityRole="summary"
      accessibilityLabel={`Cashflow summary for ${summary.periodLabel}: Inflow ${summary.totalInflow} ${summary.currency}, Outflow ${summary.totalOutflow} ${summary.currency}, Net ${summary.netCashflow} ${summary.currency}`}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.periodIndicator,
              { backgroundColor: theme.colors.primaryLight },
            ]}
          >
            <Icon name="calendar" size={13} color={theme.colors.primary} />
          </View>
          <Text
            style={[
              theme.typography.captionMedium,
              { color: theme.colors.textSecondary, marginLeft: 8 },
            ]}
          >
            {summary.periodLabel} Cashflow
          </Text>
        </View>

        <View
          style={[
            styles.netBadge,
            {
              backgroundColor: isNetPositive
                ? theme.colors.successLight
                : theme.colors.dangerLight,
              borderColor: isNetPositive
                ? theme.colors.successMedium
                : theme.colors.dangerMedium,
              borderWidth: 1,
            },
          ]}
        >
          <Text
            style={[
              theme.typography.captionMedium,
              {
                fontSize: 11,
                color: isNetPositive ? theme.colors.successText : theme.colors.dangerText,
                fontWeight: '600',
              },
            ]}
          >
            {isNetPositive ? '+ Net Inflow' : '- Net Outflow'}
          </Text>
        </View>
      </View>

      {/* Main Net Amount Display */}
      <View style={styles.netSection}>
        <Text
          style={[
            theme.typography.caption,
            {
              color: theme.colors.textTertiary,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              fontSize: 11,
            },
          ]}
        >
          Net Cashflow
        </Text>
        <View style={styles.netAmountRow}>
          <MoneyDisplay
            amount={Math.abs(summary.netCashflow)}
            currency={summary.currency}
            flow={isNetPositive ? 'income' : 'outflow'}
            size="lg"
            showSign={false}
          />
        </View>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      {/* Two Column Inflow vs Outflow */}
      <View style={styles.breakdownRow}>
        {/* Total Inflow */}
        <View style={styles.breakdownCol}>
          <View style={styles.labelWithIcon}>
            <Icon
              name="arrow-down-left"
              size={12}
              color={theme.colors.income}
              style={{ marginRight: 5 }}
            />
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary },
              ]}
            >
              Total Inflow
            </Text>
          </View>
          <View style={styles.metricVal}>
            <MoneyDisplay
              amount={summary.totalInflow}
              currency={summary.currency}
              flow="income"
              size="sm"
            />
          </View>
        </View>

        {/* Vertical Divider */}
        <View style={[styles.verticalDivider, { backgroundColor: theme.colors.border }]} />

        {/* Total Outflow */}
        <View style={styles.breakdownCol}>
          <View style={styles.labelWithIcon}>
            <Icon
              name="arrow-up-right"
              size={12}
              color={theme.colors.textTertiary}
              style={{ marginRight: 5 }}
            />
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary },
              ]}
            >
              Total Outflow
            </Text>
          </View>
          <View style={styles.metricVal}>
            <MoneyDisplay
              amount={summary.totalOutflow}
              currency={summary.currency}
              flow="outflow"
              size="sm"
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 14,
    padding: 16,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodIndicator: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  netBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  netSection: {
    marginBottom: 14,
  },
  netAmountRow: {
    marginTop: 4,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownCol: {
    flex: 1,
  },
  labelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tinyDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  metricVal: {
    marginTop: 2,
  },
  verticalDivider: {
    width: 1,
    height: 28,
    marginHorizontal: 12,
  },
});
