/**
 * TAMVA OnboardingVisualTwo Component
 *
 * Screen 2 Visual: "Understand your financial position."
 * Simplified financial intelligence composition showcasing balance, cashflow,
 * and savings rate signals as an explicit example view.
 * Distinct from Home dashboard; crafted specifically for onboarding presentation.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';

export const OnboardingVisualTwo: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.xl,
        },
      ]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Example financial intelligence view showing consolidated balance of GH₵28,450, positive monthly inflow of GH₵7,200, net cashflow of GH₵3,750, and 52.1% savings rate."
    >
      {/* Subtle Example Disclaimer Badge (Correction 3) */}
      <View
        style={[
          styles.exampleTag,
          {
            backgroundColor: theme.colors.backgroundAlt,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.full,
          },
        ]}
      >
        <Icon name="info" size={12} color={theme.colors.textTertiary} />
        <Text
          style={[
            theme.typography.captionMedium,
            { color: theme.colors.textSecondary, fontSize: 10, letterSpacing: 0.3 },
          ]}
        >
          Example financial view
        </Text>
      </View>

      {/* Main Financial Position Card */}
      <View
        style={[
          styles.mainCard,
          {
            backgroundColor: theme.colors.backgroundAlt,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        {/* Top Row: Kicker & Confidence Signal */}
        <View style={styles.cardHeaderRow}>
          <Text
            style={[
              theme.typography.captionMedium,
              {
                color: theme.colors.textTertiary,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
                fontSize: 10,
              },
            ]}
          >
            Consolidated View
          </Text>
          <Badge label="Confidence: Strong" tone="success" size="sm" showDot />
        </View>

        {/* Hero Amount */}
        <View style={styles.amountContainer}>
          <Text
            style={[
              theme.typography.display,
              {
                color: theme.colors.textPrimary,
                fontSize: 26,
                lineHeight: 32,
                fontWeight: '800',
                letterSpacing: -0.5,
              },
            ]}
          >
            GH₵28,450
          </Text>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textTertiary, fontSize: 11, marginTop: 2 },
            ]}
          >
            Consolidated balance across accounts
          </Text>
        </View>

        {/* 3-Column Metrics Strip */}
        <View
          style={[
            styles.metricsStrip,
            {
              borderTopColor: theme.colors.border,
            },
          ]}
        >
          {/* Col 1: Inflow */}
          <View style={styles.metricCol}>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textTertiary, fontSize: 10 },
              ]}
            >
              Monthly Inflow
            </Text>
            <Text
              style={[
                theme.typography.label,
                { color: theme.colors.success, fontSize: 12, fontWeight: '700', marginTop: 2 },
              ]}
            >
              +GH₵7,200
            </Text>
          </View>

          <View style={[styles.colDivider, { backgroundColor: theme.colors.border }]} />

          {/* Col 2: Net Cashflow */}
          <View style={styles.metricCol}>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textTertiary, fontSize: 10 },
              ]}
            >
              Net Cashflow
            </Text>
            <Text
              style={[
                theme.typography.label,
                { color: theme.colors.primary, fontSize: 12, fontWeight: '700', marginTop: 2 },
              ]}
            >
              +GH₵3,750
            </Text>
          </View>

          <View style={[styles.colDivider, { backgroundColor: theme.colors.border }]} />

          {/* Col 3: Savings Rate */}
          <View style={styles.metricCol}>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textTertiary, fontSize: 10 },
              ]}
            >
              Savings Rate
            </Text>
            <Text
              style={[
                theme.typography.label,
                { color: theme.colors.textPrimary, fontSize: 12, fontWeight: '700', marginTop: 2 },
              ]}
            >
              52.1%
            </Text>
          </View>
        </View>
      </View>

      {/* Analytical Observation Callout */}
      <View
        style={[
          styles.insightCallout,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <Icon name="trending-up" size={14} color={theme.colors.primary} />
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, fontSize: 11, flex: 1 },
          ]}
          numberOfLines={1}
        >
          Positive cash flow with surplus retention
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 270,
    borderWidth: 1,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  exampleTag: {
    position: 'absolute',
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderWidth: 1,
    gap: 5,
    zIndex: 2,
  },
  mainCard: {
    width: '100%',
    borderWidth: 1,
    padding: 14,
    marginTop: 18,
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  amountContainer: {
    marginBottom: 12,
  },
  metricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  metricCol: {
    flex: 1,
    alignItems: 'center',
  },
  colDivider: {
    width: 1,
    height: 24,
    opacity: 0.6,
  },
  insightCallout: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    gap: 8,
  },
});
