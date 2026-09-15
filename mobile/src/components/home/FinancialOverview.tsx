/**
 * TAMVA FinancialOverview Component
 *
 * Clean financial position presenter displaying total position,
 * monthly cashflow (inflow vs outflow), and directional growth trends.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { Divider } from '../ui/Divider';
import { MoneyDisplay } from '../financial/MoneyDisplay';
import { FinancialOverviewData } from '../../types/home';

export interface FinancialOverviewProps {
  overview: FinancialOverviewData;
  onPressDetails?: () => void;
}

export const FinancialOverview: React.FC<FinancialOverviewProps> = ({
  overview,
  onPressDetails,
}) => {
  const { theme } = useTheme();

  return (
    <Card
      variant="elevated"
      padding="none"
      style={styles.card}
      onPress={onPressDetails}
      accessibilityLabel={`Total financial position overview: ${overview.currency} ${overview.netPosition}`}
    >
      {/* Top Half: Primary Total Position */}
      <View style={styles.topSection}>
        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.textSecondary, fontSize: 13 },
              ]}
            >
              Total Net Position
            </Text>
            {onPressDetails && (
              <Icon
                name="chevron-right"
                size={13}
                color={theme.colors.textTertiary}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>

          {overview.trend && (
            <View
              style={[
                styles.trendBadge,
                { backgroundColor: theme.colors.successLight },
              ]}
            >
              <Icon
                name="trending-up"
                size={12}
                color={theme.colors.success}
                style={{ marginRight: 3 }}
              />
              <Text
                style={[
                  theme.typography.captionMedium,
                  { color: theme.colors.successText, fontSize: 11 },
                ]}
              >
                +{overview.trend.value}%
              </Text>
            </View>
          )}
        </View>

        <View style={styles.balanceRow}>
          <MoneyDisplay
            amount={overview.netPosition}
            currency={overview.currency}
            size="display"
            showPrivacyToggle={false}
          />
        </View>

        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textTertiary, marginTop: 4 },
          ]}
        >
          Across connected accounts · Consented data
        </Text>
      </View>

      <Divider variant="subtle" />

      {/* Bottom Half: Inflow vs Outflow Cashflow Summary */}
      <View style={styles.bottomSection}>
        {/* Monthly Inflow */}
        <View style={styles.flowColumn}>
          <View style={styles.flowLabelRow}>
            <Icon
              name="arrow-down-left"
              size={13}
              color={theme.colors.income}
              style={{ marginRight: 5 }}
            />
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary },
              ]}
            >
              Monthly Inflow
            </Text>
          </View>
          <View style={styles.flowAmountRow}>
            <MoneyDisplay
              amount={overview.monthlyInflow}
              currency={overview.currency}
              flow="income"
              showSign={true}
              size="sm"
            />
          </View>
        </View>

        <Divider orientation="vertical" variant="subtle" />

        {/* Monthly Outflow */}
        <View style={[styles.flowColumn, { paddingLeft: 16 }]}>
          <View style={styles.flowLabelRow}>
            <Icon
              name="arrow-up-right"
              size={13}
              color={theme.colors.textTertiary}
              style={{ marginRight: 5 }}
            />
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary },
              ]}
            >
              Monthly Outflow
            </Text>
          </View>
          <View style={styles.flowAmountRow}>
            <MoneyDisplay
              amount={overview.monthlyOutflow}
              currency={overview.currency}
              flow="outflow"
              showSign={true}
              size="sm"
            />
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 12,
  },
  topSection: {
    padding: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  balanceRow: {
    marginVertical: 4,
  },
  bottomSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  flowColumn: {
    flex: 1,
  },
  flowLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  flowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  flowAmountRow: {
    marginTop: 2,
  },
});
