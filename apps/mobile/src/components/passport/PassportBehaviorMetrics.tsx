/**
 * TAMVA PassportBehaviorMetrics Component
 *
 * Cohesive analytical system visualising the 5 core behavioural dimensions:
 * 1. Income Consistency
 * 2. Financial Stability
 * 3. Savings Discipline
 * 4. Repayment Behaviour
 * 5. Financial Resilience
 *
 * Presented as an integrated, grouped intelligence report with clean hairline dividers.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { PassportBehaviorMetric } from '../../types/passport';

export interface PassportBehaviorMetricsProps {
  metrics: PassportBehaviorMetric[];
}

export const PassportBehaviorMetrics: React.FC<PassportBehaviorMetricsProps> = ({
  metrics,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text
          style={[
            theme.typography.captionMedium,
            {
              color: theme.colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              fontSize: 11,
            },
          ]}
        >
          BEHAVIOURAL INTELLIGENCE
        </Text>
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textTertiary, marginTop: 2 },
          ]}
        >
          5-dimension profile evaluated across 12-month consented transaction history
        </Text>
      </View>

      {/* Grouped Analytical Intelligence Card */}
      <Card variant="elevated" padding="none" style={styles.groupCard}>
        {metrics.map((metric, index) => {
          const isLast = index === metrics.length - 1;

          return (
            <View
              key={metric.id}
              style={[
                styles.metricRow,
                {
                  borderBottomColor: theme.colors.border,
                  borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                },
              ]}
            >
              <View style={styles.rowTopLine}>
                <View style={styles.titleWithIcon}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: theme.colors.primaryLight },
                    ]}
                  >
                    <Icon
                      name={metric.icon}
                      size={15}
                      color={theme.colors.primary}
                    />
                  </View>

                  <Text
                    style={[
                      theme.typography.bodyMedium,
                      {
                        color: theme.colors.textPrimary,
                        fontWeight: '600',
                        fontSize: 14,
                      },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {metric.title}
                  </Text>
                </View>

                <View style={styles.badgeWrapper}>
                  <Badge
                    label={metric.ratingLabel}
                    tone={metric.badgeTone}
                    size="sm"
                  />
                </View>
              </View>

              <Text
                style={[
                  theme.typography.caption,
                  {
                    color: theme.colors.textSecondary,
                    marginTop: 6,
                    lineHeight: 18,
                    paddingLeft: 42,
                  },
                ]}
              >
                {metric.description}
              </Text>
            </View>
          );
        })}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  sectionHeader: {
    marginBottom: 10,
  },
  groupCard: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  metricRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowTopLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  badgeWrapper: {
    flexShrink: 0,
  },
});
