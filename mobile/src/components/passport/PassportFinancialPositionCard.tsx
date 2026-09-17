/**
 * TAMVA PassportFinancialPositionCard Component
 *
 * Displays consolidated financial standing, including total net position,
 * monthly cashflow dynamics (inflow vs outflow), net savings rate,
 * and estimated reserve runway.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { MoneyDisplay } from '../financial/MoneyDisplay';
import { PassportFinancialPosition } from '../../types/passport';

export interface PassportFinancialPositionCardProps {
  position: PassportFinancialPosition;
}

export const PassportFinancialPositionCard: React.FC<
  PassportFinancialPositionCardProps
> = ({ position }) => {
  const { theme } = useTheme();

  return (
    <Card variant="elevated" padding="none" style={styles.card}>
      <View style={styles.content}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <View style={styles.headerTitleRow}>
            <Icon
              name="credit-card"
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
              FINANCIAL STANDING
            </Text>
          </View>

          <View
            style={[
              styles.liveBadge,
              { backgroundColor: theme.colors.primaryLight },
            ]}
          >
            <View
              style={[
                styles.liveDot,
                { backgroundColor: theme.colors.primary },
              ]}
            />
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.primary, fontSize: 10 },
              ]}
            >
              Consolidated
            </Text>
          </View>
        </View>

        {/* Big Total Position Display */}
        <View style={styles.balanceContainer}>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textTertiary, marginBottom: 4 },
            ]}
          >
            Consolidated Net Balance
          </Text>
          <MoneyDisplay
            amount={position.totalNetWorth}
            currency={position.currency}
            size="display"
          />
        </View>

        {/* Cashflow Breakdown Metrics (3 columns) */}
        <View
          style={[
            styles.metricsRow,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {/* Monthly Inflow */}
          <View style={styles.metricItem}>
            <View style={styles.metricLabelRow}>
              <Icon
                name="arrow-down-left"
                size={12}
                color={theme.colors.success}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, fontSize: 11 },
                ]}
              >
                Inflow
              </Text>
            </View>
            <View style={{ marginTop: 2 }}>
              <MoneyDisplay
                amount={position.monthlyInflow}
                currency={position.currency}
                size="sm"
                flow="income"
                showSign
              />
            </View>
          </View>

          <View
            style={[
              styles.metricDivider,
              { backgroundColor: theme.colors.border },
            ]}
          />

          {/* Monthly Outflow */}
          <View style={styles.metricItem}>
            <View style={styles.metricLabelRow}>
              <Icon
                name="arrow-up-right"
                size={12}
                color={theme.colors.textSecondary}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, fontSize: 11 },
                ]}
              >
                Outflow
              </Text>
            </View>
            <View style={{ marginTop: 2 }}>
              <MoneyDisplay
                amount={position.monthlyOutflow}
                currency={position.currency}
                size="sm"
                flow="neutral"
                showSign={false}
              />
            </View>
          </View>

          <View
            style={[
              styles.metricDivider,
              { backgroundColor: theme.colors.border },
            ]}
          />

          {/* Savings Rate */}
          <View style={styles.metricItem}>
            <View style={styles.metricLabelRow}>
              <Icon
                name="pie-chart"
                size={12}
                color={theme.colors.primary}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, fontSize: 11 },
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
                  marginTop: 2,
                  fontWeight: '600',
                  fontSize: 13,
                },
              ]}
            >
              ~{position.savingsRatePercent}%
            </Text>
          </View>
        </View>

        {/* Reserve Runway Footer */}
        <View
          style={[
            styles.runwayRow,
            {
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          <Icon
            name="shield"
            size={14}
            color={theme.colors.success}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, flex: 1, fontSize: 11 },
            ]}
          >
            Estimated reserve runway:{' '}
            <Text
              style={{
                color: theme.colors.textPrimary,
                fontWeight: '600',
              }}
            >
              {position.resilienceMonths} months
            </Text>{' '}
            of regular outflow coverage
          </Text>
        </View>
      </View>
    </Card>
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  balanceContainer: {
    marginVertical: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 24,
  },
  runwayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
