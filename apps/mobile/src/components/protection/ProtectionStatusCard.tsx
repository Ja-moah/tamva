/**
 * TAMVA ProtectionStatusCard Component
 *
 * Visual hero anchor for the Financial Protection screen.
 * Displays overall protection standing, calibrated status glyph, status label,
 * and conservative consented-data attribution across all 4 lifecycle states:
 * - protected: Calm green shield, Active indicator
 * - attention: Alert glyph, Attention indicator (warning tone)
 * - monitoring: Activity glyph, Monitoring indicator (informational tone)
 * - unavailable: Neutral glyph, Unavailable indicator (neutral tone)
 *
 * Strictly uses TAMVA semantic theme tokens without hardcoded hex colors.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { ProtectionStatus } from '../../types/protection';

export interface ProtectionStatusCardProps {
  status: ProtectionStatus;
  statusLabel: string;
  statusDescription: string;
}

export const ProtectionStatusCard: React.FC<ProtectionStatusCardProps> = ({
  status,
  statusLabel,
  statusDescription,
}) => {
  const { theme } = useTheme();

  // Calibrate status visuals using strictly theme semantic tokens
  const getStatusConfig = () => {
    switch (status) {
      case 'attention':
        return {
          icon: 'alert-circle' as const,
          iconColor: theme.colors.warning,
          badgeBg: theme.colors.warningLight,
          badgeBorder: theme.colors.warningMedium,
          dotColor: theme.colors.warning,
          indicatorText: 'Attention',
        };
      case 'monitoring':
        return {
          icon: 'activity' as const,
          iconColor: theme.colors.info,
          badgeBg: theme.colors.infoLight,
          badgeBorder: theme.colors.infoMedium,
          dotColor: theme.colors.info,
          indicatorText: 'Monitoring',
        };
      case 'unavailable':
        return {
          icon: 'alert-circle' as const,
          iconColor: theme.colors.textTertiary,
          badgeBg: theme.colors.backgroundAlt,
          badgeBorder: theme.colors.border,
          dotColor: theme.colors.textTertiary,
          indicatorText: 'Unavailable',
        };
      case 'protected':
      default:
        return {
          icon: 'shield' as const,
          iconColor: theme.colors.success,
          badgeBg: theme.colors.successLight,
          badgeBorder: theme.colors.successMedium,
          dotColor: theme.colors.success,
          indicatorText: 'Active',
        };
    }
  };

  const config = getStatusConfig();

  return (
    <Card
      variant="standard"
      padding="none"
      style={styles.card}
      accessibilityLabel={`Protection Status: ${statusLabel}. ${statusDescription}`}
    >
      <View style={styles.cardContent}>
        {/* Top Header Label & Live Indicator */}
        <View style={styles.topRow}>
          <Text
            style={[
              theme.typography.captionMedium,
              {
                color: theme.colors.textSecondary,
                fontSize: 12,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              },
            ]}
          >
            Financial Protection
          </Text>
          <View style={styles.liveIndicatorRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: config.dotColor },
              ]}
            />
            <Text
              style={[
                theme.typography.captionMedium,
                {
                  color: config.dotColor,
                  fontSize: 12,
                },
              ]}
            >
              {config.indicatorText}
            </Text>
          </View>
        </View>

        {/* Hero Section: Glyph + Status Label */}
        <View style={styles.heroRow}>
          <View
            style={[
              styles.shieldBadge,
              {
                backgroundColor: config.badgeBg,
                borderColor: config.badgeBorder,
              },
            ]}
          >
            <Icon
              name={config.icon}
              size={24}
              color={config.iconColor}
            />
          </View>
          <View style={styles.heroTextColumn}>
            <Text
              style={[
                theme.typography.heading,
                { color: theme.colors.textPrimary, fontSize: 24, lineHeight: 28 },
              ]}
            >
              {statusLabel}
            </Text>
          </View>
        </View>

        {/* Reassuring Explanation & Attribution */}
        <View
          style={[
            styles.descriptionBox,
            { borderTopColor: theme.colors.border },
          ]}
        >
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.textSecondary, lineHeight: 22 },
            ]}
          >
            {statusDescription}
          </Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 16,
  },
  cardContent: {
    padding: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  liveIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  shieldBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTextColumn: {
    flex: 1,
    minWidth: 0,
  },
  descriptionBox: {
    marginTop: 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
  },
});
