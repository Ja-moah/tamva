/**
 * TAMVA MetricCard Component
 *
 * Financial intelligence metric card displaying KPIs, balances, or behavioural scores
 * with trend indicators, supporting context, and privacy awareness.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { FeatherIconName } from '../../constants/icons';
import { MoneyDisplay } from './MoneyDisplay';
import { CurrencyCode } from '../../types/financial';

export interface MetricCardProps {
  title: string;
  value: number | string;
  isCurrency?: boolean;
  currency?: CurrencyCode;
  supportingText?: string;
  trend?: {
    value: number; // e.g. 5.2%
    direction: 'up' | 'down' | 'neutral';
    label?: string; // e.g. "vs last month"
    isPositive?: boolean; // If undefined, up is positive, down is negative
  };
  icon?: FeatherIconName;
  onPress?: () => void;
  style?: ViewStyle;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  isCurrency = false,
  currency = 'GHS',
  supportingText,
  trend,
  icon,
  onPress,
  style,
}) => {
  const { theme } = useTheme();

  const getTrendColor = () => {
    if (!trend) return theme.colors.textSecondary;
    if (trend.direction === 'neutral') return theme.colors.textSecondary;
    const isGood = trend.isPositive !== undefined ? trend.isPositive : trend.direction === 'up';
    return isGood ? theme.colors.income : theme.colors.outflow;
  };

  const getTrendIcon = (): FeatherIconName => {
    if (!trend || trend.direction === 'neutral') return 'minus' as any;
    return trend.direction === 'up' ? 'trending-up' : 'trending-down';
  };

  return (
    <Card
      variant="standard"
      padding="md"
      onPress={onPress}
      style={style}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, flex: 1 },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>

        {icon && (
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: theme.colors.primaryLight },
            ]}
          >
            <Icon name={icon} size={14} color={theme.colors.primary} />
          </View>
        )}
      </View>

      {/* Main Metric Value */}
      <View style={styles.valueRow}>
        {isCurrency && typeof value === 'number' ? (
          <MoneyDisplay
            amount={value}
            currency={currency}
            size="lg"
          />
        ) : (
          <Text
            style={[
              theme.typography.numericLg,
              { color: theme.colors.textPrimary },
            ]}
          >
            {value}
          </Text>
        )}
      </View>

      {/* Footer / Trend Row */}
      {(trend || supportingText) && (
        <View style={styles.footerRow}>
          {trend && (
            <View style={styles.trendBadge}>
              <Icon
                name={getTrendIcon()}
                size={12}
                color={getTrendColor()}
                style={{ marginRight: 3 }}
              />
              <Text
                style={[
                  theme.typography.captionMedium,
                  { color: getTrendColor() },
                ]}
              >
                {trend.value > 0 ? `+${trend.value}%` : `${trend.value}%`}
              </Text>
              {trend.label && (
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textTertiary, marginLeft: 4 },
                  ]}
                  numberOfLines={1}
                >
                  {trend.label}
                </Text>
              )}
            </View>
          )}

          {!trend && supportingText && (
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary },
              ]}
              numberOfLines={1}
            >
              {supportingText}
            </Text>
          )}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconWrapper: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  valueRow: {
    marginVertical: 4,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
