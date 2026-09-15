/**
 * TAMVA ProfileDimensions Component
 *
 * Cohesive analytical presentation of the 5 core financial behaviour dimensions:
 * 1. Income Consistency
 * 2. Financial Stability
 * 3. Savings Discipline
 * 4. Repayment Behaviour
 * 5. Financial Resilience
 *
 * Designed as a single grouped analytical container with clean rows and dividers
 * to eliminate card-wall fatigue and emphasize institutional intelligence.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { ProfileDimension } from '../../types/profile';

export interface ProfileDimensionsProps {
  dimensions: ProfileDimension[];
  onSelectDimension?: (dimension: ProfileDimension) => void;
}

export const ProfileDimensions: React.FC<ProfileDimensionsProps> = ({
  dimensions,
  onSelectDimension,
}) => {
  const { theme } = useTheme();

  return (
    <Card variant="elevated" padding="none" style={styles.card}>
      <View style={styles.content}>
        {/* Section Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Icon
              name="pie-chart"
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
              BEHAVIOURAL INTELLIGENCE
            </Text>
          </View>
          <Text
            style={[
              theme.typography.captionMedium,
              { color: theme.colors.textPrimary, fontSize: 11 },
            ]}
          >
            5 Dimensions Evaluated
          </Text>
        </View>

        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, marginTop: 6, marginBottom: 12, lineHeight: 18 },
          ]}
        >
          Evaluated across your consented financial data:
        </Text>

        {/* Grouped Dimensions Rows */}
        <View
          style={[
            styles.listContainer,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {dimensions.map((dim, index) => {
            const isLast = index === dimensions.length - 1;

            return (
              <View key={dim.id}>
                <Pressable
                  onPress={onSelectDimension ? () => onSelectDimension(dim) : undefined}
                  disabled={!onSelectDimension}
                  style={({ pressed }) => [
                    styles.dimensionRow,
                    { opacity: pressed ? 0.85 : 1 },
                  ]}
                  accessibilityRole={onSelectDimension ? 'button' : undefined}
                  accessibilityLabel={`${dim.title}, score ${dim.score} of 100, ${dim.statusLabel}`}
                  accessibilityHint={onSelectDimension ? 'Tap to inspect dimension score and supporting signals' : undefined}
                >
                  {/* Main Row: Icon + Title on left; Score + Chevron on right */}
                  <View style={styles.rowTop}>
                    <View style={styles.titleWithIcon}>
                      <View
                        style={[
                          styles.iconCircle,
                          {
                            backgroundColor:
                              dim.badgeTone === 'success'
                                ? theme.colors.successLight
                                : theme.colors.primaryLight,
                          },
                        ]}
                      >
                        <Icon
                          name={dim.icon}
                          size={14}
                          color={
                            dim.badgeTone === 'success'
                              ? theme.colors.success
                              : theme.colors.primary
                          }
                        />
                      </View>

                      <View style={styles.titleWrapper}>
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
                        >
                          {dim.title}
                        </Text>
                        <View style={styles.statusSubRow}>
                          <Text
                            style={[
                              theme.typography.captionMedium,
                              {
                                color:
                                  dim.badgeTone === 'success'
                                    ? theme.colors.successText
                                    : dim.badgeTone === 'warning'
                                    ? theme.colors.warningText
                                    : theme.colors.primary,
                                fontSize: 12,
                                fontWeight: '500',
                              },
                            ]}
                          >
                            {dim.statusLabel || 'Building'}
                          </Text>
                          {dim.trendLabel && (
                            <Text
                              style={[
                                theme.typography.caption,
                                {
                                  color: theme.colors.textTertiary,
                                  fontSize: 11,
                                  marginLeft: 8,
                                },
                              ]}
                            >
                              • {dim.trendLabel}
                            </Text>
                          )}
                        </View>
                      </View>
                    </View>

                    <View style={styles.scoreRightWrapper}>
                      <Text
                        style={[
                          theme.typography.bodyMedium,
                          {
                            color: theme.colors.textPrimary,
                            fontSize: typeof dim.score === 'number' ? 17 : 13,
                            fontWeight: '700',
                          },
                        ]}
                      >
                        {typeof dim.score === 'number' ? dim.score : 'Building'}
                      </Text>
                      {onSelectDimension && (
                        <Icon
                          name="chevron-right"
                          size={15}
                          color={theme.colors.textTertiary}
                          style={{ marginLeft: 6 }}
                        />
                      )}
                    </View>
                  </View>

                  {/* Micro Progress / Strength Indicator (Omitted if score is undefined) */}
                  {typeof dim.score === 'number' && (
                    <View
                      style={[
                        styles.microProgressTrack,
                        { backgroundColor: theme.colors.surface },
                      ]}
                    >
                      <View
                        style={[
                          styles.microProgressFill,
                          {
                            width: `${Math.min(Math.max(dim.score, 0), 100)}%`,
                            backgroundColor:
                              dim.badgeTone === 'success'
                                ? theme.colors.success
                                : theme.colors.primary,
                          },
                        ]}
                      />
                    </View>
                  )}

                  {/* Dimension Explanation */}
                  <Text
                    style={[
                      theme.typography.caption,
                      {
                        color: theme.colors.textSecondary,
                        marginTop: 6,
                        lineHeight: 17,
                        fontSize: 12,
                      },
                    ]}
                  >
                    {dim.description}
                  </Text>
                </Pressable>

                {!isLast && (
                  <View
                    style={[
                      styles.rowDivider,
                      { backgroundColor: theme.colors.border },
                    ]}
                  />
                )}
              </View>
            );
          })}
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
  listContainer: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  dimensionRow: {
    padding: 12,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
    minWidth: 0,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  titleWrapper: {
    flex: 1,
    minWidth: 0,
  },
  statusSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  scoreRightWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  microProgressTrack: {
    height: 3,
    borderRadius: 2,
    width: '100%',
    marginTop: 8,
    marginBottom: 2,
    overflow: 'hidden',
  },
  microProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
});
