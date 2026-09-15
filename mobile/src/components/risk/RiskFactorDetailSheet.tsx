/**
 * TAMVA RiskFactorDetailSheet Component
 *
 * Interactive detail BottomSheet for individual Risk Factors (Phase 8B).
 * Displays:
 * - Factor title & current status badge (e.g. "Strong", "Good")
 * - Concise qualitative explanation
 * - Structured supporting signals list (with safe "Not available" fallbacks)
 * - "Why it matters" analytical explanation
 * - Multi-signal contribution callout ("This is one of several signals contributing to your current Low Risk assessment.")
 * - Consented data source & freshness notice
 * - Accessible 48px+ Done button
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { RiskFactor } from '../../types/risk';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';

export interface RiskFactorDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  factor: RiskFactor | null;
}

export const RiskFactorDetailSheet: React.FC<RiskFactorDetailSheetProps> = ({
  visible,
  onClose,
  factor,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  if (!factor) return null;

  const isAssessed = factor.isAvailable !== false;
  const statusLabel = isAssessed ? factor.statusLabel : 'Assessment unavailable';
  const statusTone = isAssessed ? factor.badgeTone : 'neutral';

  const handleDonePress = () => {
    haptics.selection();
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={factor.title}
      subtitle="Risk factor details"
      maxHeight="85%"
    >
      <View style={styles.container}>
        {/* 1. Status Header Card */}
        <View
          style={[
            styles.statusCard,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.lg,
            },
          ]}
        >
          <View style={styles.statusLeft}>
            <View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Icon
                name={factor.icon}
                size={20}
                color={theme.colors.primary}
              />
            </View>
            <View style={styles.statusTextCol}>
              <Text
                style={[
                  theme.typography.captionMedium,
                  { color: theme.colors.textSecondary, fontSize: 11 },
                ]}
              >
                Current Assessment
              </Text>
              <Text
                style={[
                  theme.typography.subheading,
                  { color: theme.colors.textPrimary, fontWeight: '700', marginTop: 1 },
                ]}
                numberOfLines={1}
              >
                {factor.title}
              </Text>
            </View>
          </View>

          <Badge
            label={statusLabel}
            tone={statusTone}
            size="md"
            showDot
          />
        </View>

        {/* 2. Qualitative Factor Explanation */}
        <View style={styles.section}>
          <Text
            style={[
              theme.typography.body,
              { color: theme.colors.textSecondary, lineHeight: 22 },
            ]}
          >
            {isAssessed
              ? factor.description
              : factor.unavailableReason ||
                "There isn't enough consented financial data available to assess this factor right now."}
          </Text>
        </View>

        {/* 3. Supporting Signals List (Structured, Compact) */}
        {factor.supportingSignals && factor.supportingSignals.length > 0 && (
          <View style={styles.section}>
            <Text
              style={[
                theme.typography.captionMedium,
                {
                  color: theme.colors.textTertiary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  fontSize: 11,
                  marginBottom: 8,
                },
              ]}
            >
              Supporting Signals
            </Text>

            <View
              style={[
                styles.signalsList,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                  borderRadius: theme.radius.md,
                },
              ]}
            >
              {factor.supportingSignals.map((signal, idx) => {
                const isLast = idx === (factor.supportingSignals?.length ?? 0) - 1;
                const isValueAvailable =
                  signal.isAvailable !== false && Boolean(signal.value);

                return (
                  <View
                    key={signal.label}
                    style={[
                      styles.signalRow,
                      !isLast && {
                        borderBottomWidth: 1,
                        borderBottomColor: theme.colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        theme.typography.caption,
                        { color: theme.colors.textSecondary, flex: 1 },
                      ]}
                    >
                      {signal.label}
                    </Text>
                    <Text
                      style={[
                        theme.typography.label,
                        {
                          color: isValueAvailable
                            ? theme.colors.textPrimary
                            : theme.colors.textTertiary,
                          fontWeight: '700',
                          fontStyle: isValueAvailable ? 'normal' : 'italic',
                        },
                      ]}
                    >
                      {isValueAvailable ? signal.value : 'Not available'}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* 4. Why It Matters Section */}
        {factor.whyItMatters && (
          <View style={styles.section}>
            <Text
              style={[
                theme.typography.subheading,
                {
                  color: theme.colors.textPrimary,
                  fontSize: 15,
                  fontWeight: '700',
                  marginBottom: 6,
                },
              ]}
            >
              Why it matters
            </Text>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary, lineHeight: 21 },
              ]}
            >
              {factor.whyItMatters}
            </Text>
          </View>
        )}

        {/* 5. Factor Contribution to Overall Risk */}
        <View
          style={[
            styles.calloutBox,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <Icon
            name="info"
            size={14}
            color={theme.colors.primary}
            style={styles.calloutIcon}
          />
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, lineHeight: 18, flex: 1 },
            ]}
          >
            {factor.contributionNote ||
              (factor.isAvailable === false
                ? 'This signal is currently unavailable from consented data.'
                : 'This is one of several signals contributing to your current financial risk assessment.')}
          </Text>
        </View>

        {/* 6. Consented Data Source / Context */}
        <View style={styles.contextBox}>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textTertiary, fontSize: 11, textAlign: 'center' },
            ]}
          >
            {factor.dataContext ||
              'Based on the latest consented financial data available to TAMVA.'}
          </Text>
        </View>

        {/* 7. Action: 48px+ Done Button */}
        <Button
          label="Done"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleDonePress}
          style={styles.doneButton}
        />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingTop: 4,
    paddingBottom: 8,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextCol: {
    flex: 1,
    minWidth: 0,
  },
  section: {
    marginBottom: 16,
  },
  signalsList: {
    borderWidth: 1,
    overflow: 'hidden',
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 44,
  },
  calloutBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    marginBottom: 16,
  },
  calloutIcon: {
    marginTop: 2,
  },
  contextBox: {
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  doneButton: {
    minHeight: 48,
  },
});
