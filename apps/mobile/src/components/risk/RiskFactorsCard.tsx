/**
 * TAMVA RiskFactorsCard Component
 *
 * Displays key contributing factors to the customer's risk assessment (Phase 8A):
 * - Income Consistency
 * - Financial Stability
 * - Savings Discipline (with 52.1% savings rate highlight)
 * - Financial Resilience
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { RiskFactor } from '../../types/risk';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';

export interface RiskFactorsCardProps {
  factors: RiskFactor[];
  onSelectFactor?: (factor: RiskFactor) => void;
}

export const RiskFactorsCard: React.FC<RiskFactorsCardProps> = ({
  factors,
  onSelectFactor,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  const handleFactorPress = (factor: RiskFactor) => {
    if (onSelectFactor) {
      haptics.selection();
      onSelectFactor(factor);
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
      accessibilityRole="summary"
      accessibilityLabel="Key contributing factors to risk assessment"
    >
      {/* Section Header */}
      <View style={styles.header}>
        <Text
          style={[
            theme.typography.subheading,
            { color: theme.colors.textPrimary, fontWeight: '700' },
          ]}
        >
          Key factors
        </Text>
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, marginTop: 2 },
          ]}
        >
          Contributing signals from consented financial data
        </Text>
      </View>

      {/* Factor Rows */}
      <View style={styles.list}>
        {factors.map((factor, index) => {
          const isLast = index === factors.length - 1;
          const isInteractive = Boolean(onSelectFactor);

          return (
            <Pressable
              key={factor.id}
              disabled={!isInteractive}
              onPress={() => handleFactorPress(factor)}
              style={({ pressed }) => [
                styles.factorRow,
                pressed && { backgroundColor: theme.colors.backgroundAlt },
                !isLast && {
                  borderBottomWidth: 1,
                  borderBottomColor: theme.colors.border,
                },
              ]}
              accessible
              accessibilityRole={isInteractive ? 'button' : 'text'}
              accessibilityLabel={`${factor.title}: ${factor.statusLabel}. ${factor.description}${
                isInteractive ? '. Tap to view details.' : ''
              }`}
            >
              {/* Left: Icon glyph container */}
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: theme.colors.backgroundAlt,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <Icon
                  name={factor.icon}
                  size={18}
                  color={theme.colors.primary}
                />
              </View>

              {/* Center: Title, Description, and Metric Highlight */}
              <View style={styles.textColumn}>
                <View style={styles.titleRow}>
                  <Text
                    style={[
                      theme.typography.label,
                      { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '700' },
                    ]}
                  >
                    {factor.title}
                  </Text>
                </View>
                <Text
                  style={[
                    theme.typography.caption,
                    {
                      color: theme.colors.textSecondary,
                      marginTop: 2,
                      lineHeight: 18,
                    },
                  ]}
                >
                  {factor.description}
                </Text>
              </View>

              {/* Right: Status Badge & Optional Interactive Chevron */}
              <View style={styles.badgeColumn}>
                <Badge
                  label={factor.statusLabel}
                  tone={factor.badgeTone}
                  size="sm"
                />
                {isInteractive && (
                  <Icon
                    name="chevron-right"
                    size={16}
                    color={theme.colors.textTertiary}
                    style={styles.chevronIcon}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
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
    marginBottom: 14,
  },
  list: {
    flexDirection: 'column',
  },
  factorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    minHeight: 56,
    gap: 12,
    borderRadius: 8,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeColumn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chevronIcon: {
    marginLeft: 2,
  },
});
