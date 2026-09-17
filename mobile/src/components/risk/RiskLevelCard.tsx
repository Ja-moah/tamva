/**
 * TAMVA RiskLevelCard Component
 *
 * The primary visual anchor for Risk Overview (Phase 8A).
 * Displays:
 * - Kicker label ("RISK ASSESSMENT")
 * - Prominent risk standing ("LOW RISK") with semantic badge
 * - Restrained 3-tier segmented risk scale (Low, Moderate, Elevated)
 * - Clear textual labels for accessibility (never relying on color alone)
 * - Supporting profile standing label & analytical rationale
 * - Subtle consented data attribution note
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { RiskLevel } from '../../types/risk';
import { Badge, BadgeTone } from '../ui/Badge';
import { Icon } from '../ui/Icon';

export interface RiskLevelCardProps {
  level: RiskLevel;
  levelLabel: string;
  standingLabel: string;
  explanation: string;
  attribution: string;
  isLimited?: boolean;
  isUnavailable?: boolean;
}

const SCALE_TIERS: { key: RiskLevel; label: string; tone: BadgeTone }[] = [
  { key: 'low', label: 'Low Risk', tone: 'success' },
  { key: 'moderate', label: 'Moderate Risk', tone: 'warning' },
  { key: 'elevated', label: 'Elevated Risk', tone: 'danger' },
];

export const RiskLevelCard: React.FC<RiskLevelCardProps> = ({
  level,
  levelLabel,
  standingLabel,
  explanation,
  attribution,
  isLimited,
  isUnavailable,
}) => {
  const { theme } = useTheme();

  const getActiveTone = (): {
    badgeTone: BadgeTone;
    color: string;
    lightBg: string;
  } => {
    if (isLimited || isUnavailable) {
      return {
        badgeTone: 'neutral',
        color: theme.colors.textSecondary,
        lightBg: theme.colors.backgroundAlt,
      };
    }

    switch (level) {
      case 'low':
        return {
          badgeTone: 'success',
          color: theme.colors.success,
          lightBg: theme.colors.successLight,
        };
      case 'moderate':
        return {
          badgeTone: 'warning',
          color: theme.colors.warning,
          lightBg: theme.colors.warningLight,
        };
      case 'elevated':
        return {
          badgeTone: 'danger',
          color: theme.colors.danger,
          lightBg: theme.colors.dangerLight,
        };
      default:
        return {
          badgeTone: 'neutral',
          color: theme.colors.textSecondary,
          lightBg: theme.colors.backgroundAlt,
        };
    }
  };

  const toneConfig = getActiveTone();
  const isNeutralState = Boolean(isLimited || isUnavailable);
  const activeIndex = isNeutralState
    ? -1
    : SCALE_TIERS.findIndex((tier) => tier.key === level);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
        },
      ]}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`Risk assessment: ${levelLabel}. ${standingLabel}. ${explanation}`}
    >
      {/* Top row: Kicker & Active Badge */}
      <View style={styles.headerRow}>
        <View style={styles.kickerRow}>
          <Text
            style={[
              theme.typography.captionMedium,
              {
                color: theme.colors.textTertiary,
                textTransform: 'uppercase',
                letterSpacing: 1.1,
                fontSize: 11,
              },
            ]}
          >
            Risk Assessment
          </Text>
        </View>
        <Badge
          label={levelLabel}
          tone={toneConfig.badgeTone}
          size="sm"
          showDot
        />
      </View>

      {/* Main Anchor: Large Risk Title */}
      <View style={styles.titleRow}>
        <Text
          style={[
            theme.typography.display,
            {
              color: theme.colors.textPrimary,
              fontSize: 28,
              lineHeight: 34,
              letterSpacing: -0.5,
              fontWeight: '800',
            },
          ]}
        >
          {levelLabel.toUpperCase()}
        </Text>
      </View>

      {/* Segmented Risk Scale (Restrained, Analytical Indicator) */}
      <View
        style={styles.scaleContainer}
        accessible
        accessibilityLabel={`Risk Scale: Low, Moderate, Elevated. Currently evaluated at ${levelLabel}.`}
      >
        <View style={styles.segmentsRow}>
          {SCALE_TIERS.map((tier, idx) => {
            const isActive = idx === activeIndex;
            return (
              <View
                key={tier.key}
                style={[
                  styles.segmentBar,
                  {
                    backgroundColor: isActive
                      ? toneConfig.color
                      : theme.colors.border,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* Text Labels below segments (Ensures accessibility beyond color) */}
        <View style={styles.scaleLabelsRow}>
          {SCALE_TIERS.map((tier, idx) => {
            const isActive = idx === activeIndex;
            return (
              <Text
                key={tier.key}
                style={[
                  styles.scaleLabel,
                  theme.typography.caption,
                  {
                    color: isActive
                      ? theme.colors.textPrimary
                      : theme.colors.textTertiary,
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {tier.label}
              </Text>
            );
          })}
        </View>
      </View>

      {/* Profile Standing & Rationale Section */}
      <View
        style={[
          styles.contentSection,
          {
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <Text
          style={[
            theme.typography.subheading,
            {
              color: theme.colors.textPrimary,
              fontWeight: '700',
              marginBottom: 6,
            },
          ]}
        >
          {standingLabel}
        </Text>
        <Text
          style={[
            theme.typography.body,
            {
              color: theme.colors.textSecondary,
              lineHeight: 22,
            },
          ]}
        >
          {explanation}
        </Text>
      </View>

      {/* Subtle Consented Attribution Note */}
      <View
        style={[
          styles.attributionRow,
          {
            backgroundColor: theme.colors.backgroundAlt,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <Icon
          name="info"
          size={13}
          color={theme.colors.textTertiary}
          style={styles.attributionIcon}
        />
        <Text
          style={[
            theme.typography.caption,
            {
              color: theme.colors.textSecondary,
              fontSize: 11,
              lineHeight: 16,
              flex: 1,
            },
          ]}
        >
          {attribution}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleRow: {
    marginBottom: 16,
  },
  scaleContainer: {
    marginBottom: 18,
  },
  segmentsRow: {
    flexDirection: 'row',
    gap: 6,
    height: 6,
    marginBottom: 6,
  },
  segmentBar: {
    flex: 1,
    borderRadius: 3,
  },
  scaleLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  scaleLabel: {
    fontSize: 11,
    textAlign: 'center',
    flex: 1,
  },
  contentSection: {
    borderTopWidth: 1,
    paddingTop: 14,
    marginBottom: 14,
  },
  attributionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  attributionIcon: {
    marginTop: 1,
  },
});
