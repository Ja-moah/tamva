/**
 * TAMVA ProfileInsights Component
 *
 * Presents explainable, data-derived behavioural insights based strictly
 * on consented multi-institution transaction patterns.
 * Explicitly avoids credit bureau or loan guarantee claims.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { usePrivacy } from '../../context/PrivacyContext';
import { maskEmbeddedCurrency } from '../../utils/currency';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { ProfileInsight } from '../../types/profile';

export interface ProfileInsightsProps {
  insights: ProfileInsight[];
  onSelectInsight?: (insight: ProfileInsight) => void;
}

export const ProfileInsights: React.FC<ProfileInsightsProps> = ({
  insights,
  onSelectInsight,
}) => {
  const { theme } = useTheme();
  const { isPrivate } = usePrivacy();

  return (
    <Card variant="elevated" padding="none" style={styles.card}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Icon
              name="check-circle"
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
              FINANCIAL INTELLIGENCE
            </Text>
          </View>
          <Text
            style={[
              theme.typography.captionMedium,
              { color: theme.colors.textPrimary, fontSize: 11 },
            ]}
          >
            {insights.length} Key Insights
          </Text>
        </View>

        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, marginTop: 6, marginBottom: 12, lineHeight: 18 },
          ]}
        >
          Factual observations inferred from 12-month aggregated account history:
        </Text>

        {/* Insights List */}
        <View style={styles.insightsList}>
          {insights.map((insight) => (
            <Pressable
              key={insight.id}
              onPress={onSelectInsight ? () => onSelectInsight(insight) : undefined}
              disabled={!onSelectInsight}
              style={({ pressed }) => [
                styles.insightItem,
                {
                  backgroundColor: theme.colors.backgroundAlt,
                  borderColor: theme.colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              accessibilityRole={onSelectInsight ? 'button' : undefined}
              accessibilityLabel={`${insight.title}, ${insight.badgeLabel}`}
              accessibilityHint={onSelectInsight ? 'Tap to inspect observation details' : undefined}
            >
              <View style={styles.insightHeader}>
                <View style={styles.iconAndTitle}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor:
                          insight.badgeTone === 'success'
                            ? theme.colors.successLight
                            : insight.badgeTone === 'information'
                            ? theme.colors.primaryLight
                            : theme.colors.surface,
                      },
                    ]}
                  >
                    <Icon
                      name={insight.icon}
                      size={14}
                      color={
                        insight.badgeTone === 'success'
                          ? theme.colors.success
                          : theme.colors.primary
                      }
                    />
                  </View>
                  <Text
                    style={[
                      theme.typography.bodyMedium,
                      {
                        color: theme.colors.textPrimary,
                        fontWeight: '600',
                        fontSize: 13,
                        flex: 1,
                      },
                    ]}
                    numberOfLines={1}
                  >
                    {insight.title}
                  </Text>
                </View>

                <View style={styles.badgeRow}>
                  <Badge
                    label={insight.badgeLabel}
                    tone={insight.badgeTone}
                    size="sm"
                  />
                  {onSelectInsight && (
                    <Icon
                      name="chevron-right"
                      size={14}
                      color={theme.colors.textTertiary}
                      style={{ marginLeft: 6 }}
                    />
                  )}
                </View>
              </View>

              <Text
                style={[
                  theme.typography.caption,
                  {
                    color: theme.colors.textSecondary,
                    marginTop: 6,
                    lineHeight: 18,
                    fontSize: 12,
                  },
                ]}
              >
                {insight.explanation}
              </Text>

              {insight.supportingMetric && (
                <View
                  style={[
                    styles.metricRow,
                    { borderTopColor: theme.colors.border },
                  ]}
                >
                  <Text
                    style={[
                      theme.typography.captionMedium,
                      { color: theme.colors.textTertiary, fontSize: 11 },
                    ]}
                  >
                    Supporting metric: {maskEmbeddedCurrency(insight.supportingMetric, isPrivate)}
                  </Text>
                </View>
              )}
            </Pressable>
          ))}
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightsList: {
    gap: 10,
  },
  insightItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconAndTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    minWidth: 0,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0,
  },
  metricRow: {
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
