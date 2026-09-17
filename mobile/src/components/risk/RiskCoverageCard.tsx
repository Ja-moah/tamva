/**
 * TAMVA RiskCoverageCard Component
 *
 * Compact Data Coverage & Freshness section (Phase 8A):
 * Highlights:
 * - 4 connected institutions
 * - 12-month assessment window
 * - Based on latest available consented data
 * Kept restrained and compact without redundant institution listing.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { RiskCoverage } from '../../types/risk';
import { Icon } from '../ui/Icon';

export interface RiskCoverageCardProps {
  coverage: RiskCoverage;
}

export const RiskCoverageCard: React.FC<RiskCoverageCardProps> = ({ coverage }) => {
  const { theme } = useTheme();

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
      accessibilityRole="summary"
      accessibilityLabel={`Data coverage: ${coverage.institutionsCount} connected institutions, ${coverage.assessmentWindow} assessment window, ${coverage.freshnessLabel}`}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text
          style={[
            theme.typography.subheading,
            { color: theme.colors.textPrimary, fontWeight: '700' },
          ]}
        >
          Data coverage
        </Text>
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, marginTop: 2 },
          ]}
        >
          Consented parameters supporting this assessment
        </Text>
      </View>

      {/* 3-Item Compact Metric Row */}
      <View style={styles.metricsRow}>
        {/* Metric 1: Institutions */}
        <View
          style={[
            styles.metricTile,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <View style={styles.tileHeader}>
            <Icon
              name="database"
              size={14}
              color={theme.colors.primary}
            />
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, fontSize: 11 },
              ]}
              numberOfLines={1}
            >
              Coverage
            </Text>
          </View>
          <Text
            style={[
              theme.typography.label,
              {
                color:
                  coverage.institutionsCount != null && coverage.institutionsCount > 0
                    ? theme.colors.textPrimary
                    : theme.colors.textTertiary,
                marginTop: 4,
                fontWeight: '700',
                fontStyle:
                  coverage.institutionsCount != null && coverage.institutionsCount > 0
                    ? 'normal'
                    : 'italic',
              },
            ]}
            numberOfLines={1}
          >
            {coverage.institutionsCount != null && coverage.institutionsCount > 0
              ? coverage.institutionsCount === 1
                ? '1 account'
                : `${coverage.institutionsCount} accounts`
              : 'Not available'}
          </Text>
        </View>

        {/* Metric 2: Assessment Window */}
        <View
          style={[
            styles.metricTile,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <View style={styles.tileHeader}>
            <Icon
              name="calendar"
              size={14}
              color={theme.colors.primary}
            />
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, fontSize: 11 },
              ]}
              numberOfLines={1}
            >
              Window
            </Text>
          </View>
          <Text
            style={[
              theme.typography.label,
              {
                color:
                  coverage.assessmentWindow && coverage.assessmentWindow !== 'Not available'
                    ? theme.colors.textPrimary
                    : theme.colors.textTertiary,
                marginTop: 4,
                fontWeight: '700',
                fontStyle:
                  coverage.assessmentWindow && coverage.assessmentWindow !== 'Not available'
                    ? 'normal'
                    : 'italic',
              },
            ]}
            numberOfLines={1}
          >
            {coverage.assessmentWindow || 'Not available'}
          </Text>
        </View>

        {/* Metric 3: Data Freshness */}
        {(() => {
          const isFreshnessUnavailable =
            !coverage.freshnessLabel || coverage.freshnessLabel === 'Not available';
          const isFreshnessPartial =
            Boolean(coverage.freshnessLabel) &&
            (coverage.freshnessLabel.includes('Partial') ||
              coverage.freshnessLabel.includes('Limited') ||
              coverage.freshnessLabel.includes('outdated'));

          const iconName = isFreshnessUnavailable
            ? 'info'
            : isFreshnessPartial
            ? 'info'
            : 'check-circle';
          const iconColor = isFreshnessUnavailable
            ? theme.colors.textTertiary
            : isFreshnessPartial
            ? theme.colors.textSecondary
            : theme.colors.success;
          const freshnessText = isFreshnessUnavailable
            ? 'Not available'
            : isFreshnessPartial
            ? 'Partial data'
            : 'Consented data';

          return (
            <View
              style={[
                styles.metricTile,
                {
                  backgroundColor: theme.colors.backgroundAlt,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              <View style={styles.tileHeader}>
                <Icon
                  name={iconName}
                  size={14}
                  color={iconColor}
                />
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textSecondary, fontSize: 11 },
                  ]}
                  numberOfLines={1}
                >
                  Freshness
                </Text>
              </View>
              <Text
                style={[
                  theme.typography.label,
                  {
                    color: isFreshnessUnavailable
                      ? theme.colors.textTertiary
                      : theme.colors.textPrimary,
                    marginTop: 4,
                    fontWeight: '700',
                    fontStyle: isFreshnessUnavailable ? 'italic' : 'normal',
                  },
                ]}
                numberOfLines={1}
              >
                {freshnessText}
              </Text>
            </View>
          );
        })()}
      </View>
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
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  metricTile: {
    flex: 1,
    padding: 10,
    minWidth: 0,
  },
  tileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
});
