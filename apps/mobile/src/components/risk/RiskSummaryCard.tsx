/**
 * TAMVA RiskSummaryCard Component
 *
 * "Why this assessment?" section (Phase 8A):
 * Concisely explains the rationale behind the risk assessment
 * in informative, analytical language without promotional tone.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { RiskSummaryIndicator } from '../../types/risk';
import { Icon } from '../ui/Icon';

export interface RiskSummaryCardProps {
  summary: string;
  indicators?: RiskSummaryIndicator[];
  isLimited?: boolean;
  isUnavailable?: boolean;
}

const DEFAULT_INDICATORS: RiskSummaryIndicator[] = [
  {
    text: 'Consistent income activity is available from the connected data',
    icon: 'check',
    tone: 'success',
  },
  {
    text: 'Positive consolidated cash flow with surplus retention',
    icon: 'check',
    tone: 'success',
  },
];

export const RiskSummaryCard: React.FC<RiskSummaryCardProps> = ({
  summary,
  indicators,
  isLimited,
  isUnavailable,
}) => {
  const { theme } = useTheme();

  const displayedIndicators =
    indicators !== undefined ? indicators : isUnavailable ? [] : DEFAULT_INDICATORS;

  const getIndicatorColor = (tone?: 'success' | 'neutral' | 'warning') => {
    switch (tone) {
      case 'neutral':
        return theme.colors.textTertiary;
      case 'warning':
        return theme.colors.warning;
      case 'success':
      default:
        return theme.colors.success;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
        },
      ]}
      accessible
      accessibilityRole="text"
      accessibilityLabel={`Why this assessment: ${summary}`}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text
            style={[
              theme.typography.subheading,
              { color: theme.colors.textPrimary, fontWeight: '700' },
            ]}
          >
            Why this assessment?
          </Text>
        </View>
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, marginTop: 2 },
          ]}
        >
          Synthesis of consented behavioural observations
        </Text>
      </View>

      {/* Rationale Text */}
      <Text
        style={[
          theme.typography.body,
          {
            color: theme.colors.textPrimary,
            lineHeight: 22,
          },
        ]}
      >
        {summary}
      </Text>

      {/* Analytical Callout Indicators */}
      {displayedIndicators.length > 0 && (
        <View
          style={[
            styles.calloutBox,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          {displayedIndicators.map((item, index) => {
            const iconName = item.icon || (item.tone === 'neutral' ? 'info' : 'check');
            const iconColor = getIndicatorColor(item.tone);

            return (
              <View key={`${item.text}-${index}`} style={styles.indicatorItem}>
                <Icon
                  name={iconName}
                  size={14}
                  color={iconColor}
                  style={styles.checkIcon}
                />
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textSecondary, flex: 1 },
                  ]}
                >
                  {item.text}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  header: {
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  calloutBox: {
    marginTop: 14,
    padding: 12,
    gap: 8,
  },
  indicatorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkIcon: {
    marginTop: 1,
  },
});
