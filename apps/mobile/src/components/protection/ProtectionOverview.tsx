/**
 * TAMVA ProtectionOverview Component
 *
 * One cohesive analytical card container presenting the 4 core protection signals:
 * - Consent health
 * - Account connections
 * - Activity monitoring
 * - Account access
 *
 * Each row is pressable to inspect signal details via ProtectionSignalSheet.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { ProtectionSignal } from '../../types/protection';

export interface ProtectionOverviewProps {
  signals: ProtectionSignal[];
  onSelectSignal?: (signal: ProtectionSignal) => void;
}

export const ProtectionOverview: React.FC<ProtectionOverviewProps> = ({
  signals,
  onSelectSignal,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  const handleRowPress = (signal: ProtectionSignal) => {
    haptics.selection();
    if (onSelectSignal) {
      onSelectSignal(signal);
    }
  };

  return (
    <View style={styles.container}>
      <Text
        style={[
          theme.typography.subheading,
          { color: theme.colors.textPrimary, marginBottom: 12, paddingHorizontal: 4 },
        ]}
      >
        Protection overview
      </Text>

      <Card variant="standard" padding="none" style={styles.card}>
        {signals.map((signal, index) => {
          const isLast = index === signals.length - 1;
          const tone =
            signal.status === 'healthy'
              ? 'success'
              : signal.status === 'attention'
              ? 'warning'
              : 'neutral';
          const label =
            signal.status === 'healthy'
              ? 'Healthy'
              : signal.status === 'attention'
              ? 'Attention'
              : 'Not available';

          return (
            <Pressable
              key={signal.id}
              onPress={() => handleRowPress(signal)}
              style={({ pressed }) => [
                styles.rowContainer,
                !isLast && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: theme.colors.border,
                },
                {
                  backgroundColor: pressed
                    ? theme.colors.backgroundAlt
                    : 'transparent',
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${signal.title}: ${label}. Tap to inspect details.`}
            >
              {/* Row Header: Icon + Title + Status Badge + Chevron */}
              <View style={styles.rowHeader}>
                <View style={styles.titleWithIcon}>
                  <View
                    style={[
                      styles.iconCircle,
                      { backgroundColor: theme.colors.backgroundAlt },
                    ]}
                  >
                    <Icon
                      name={signal.icon}
                      size={16}
                      color={theme.colors.textPrimary}
                    />
                  </View>
                  <Text
                    style={[
                      theme.typography.bodyMedium,
                      { color: theme.colors.textPrimary, fontWeight: '600' },
                    ]}
                  >
                    {signal.title}
                  </Text>
                </View>

                <View style={styles.badgeChevronRow}>
                  <Badge
                    label={label}
                    tone={tone}
                    size="sm"
                    showDot
                  />
                  <Icon
                    name="chevron-right"
                    size={14}
                    color={theme.colors.textTertiary}
                    style={styles.chevron}
                  />
                </View>
              </View>

              {/* Description */}
              <Text
                style={[
                  theme.typography.bodySm,
                  {
                    color: theme.colors.textSecondary,
                    lineHeight: 19,
                    marginTop: 6,
                    paddingTop: 2,
                  },
                ]}
              >
                {signal.description}
              </Text>
            </Pressable>
          );
        })}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  rowContainer: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 52,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeChevronRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chevron: {
    marginLeft: 6,
  },
});
