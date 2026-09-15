/**
 * TAMVA ProfileInsightDetailSheet Component
 *
 * BottomSheet explaining an individual behavioural insight.
 * Factual, explainable observations derived from consented account records
 * without vague AI claims or automated credit scoring implications.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { usePrivacy } from '../../context/PrivacyContext';
import { maskEmbeddedCurrency } from '../../utils/currency';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { ProfileInsight } from '../../types/profile';

export interface ProfileInsightDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  insight: ProfileInsight | null;
}

export const ProfileInsightDetailSheet: React.FC<
  ProfileInsightDetailSheetProps
> = ({ visible, onClose, insight }) => {
  const { theme } = useTheme();
  const { isPrivate } = usePrivacy();

  if (!insight) return null;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={insight.title}
      subtitle="Behavioural observation"
      maxHeight="80%"
    >
      <View style={styles.container}>
        {/* Top Header Card */}
        <View
          style={[
            styles.headerCard,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.headerRow}>
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
                size={16}
                color={
                  insight.badgeTone === 'success'
                    ? theme.colors.success
                    : theme.colors.primary
                }
              />
            </View>

            <View style={{ flex: 1, marginRight: 8 }}>
              <Text
                style={[
                  theme.typography.bodyMedium,
                  { color: theme.colors.textPrimary, fontWeight: '600' },
                ]}
              >
                {insight.title}
              </Text>
            </View>

            <Badge
              label={insight.badgeLabel}
              tone={insight.badgeTone}
              size="sm"
            />
          </View>
        </View>

        {/* What We Observed */}
        <Text
          style={[
            theme.typography.bodyMedium,
            { color: theme.colors.textPrimary, fontWeight: '600', marginTop: 16 },
          ]}
        >
          What we observed
        </Text>

        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, marginTop: 4, lineHeight: 18 },
          ]}
        >
          {insight.explanation}
        </Text>

        {/* Supporting Signal (if provided in mock data) */}
        {insight.supportingMetric && (
          <View
            style={[
              styles.metricCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Text
              style={[
                theme.typography.captionMedium,
                {
                  color: theme.colors.textTertiary,
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: 0.6,
                },
              ]}
            >
              SUPPORTING SIGNAL
            </Text>
            <Text
              style={[
                theme.typography.bodyMedium,
                {
                  color: theme.colors.textPrimary,
                  fontWeight: '600',
                  fontSize: 14,
                  marginTop: 2,
                },
              ]}
            >
              {maskEmbeddedCurrency(insight.supportingMetric, isPrivate)}
            </Text>
          </View>
        )}

        {/* Explainability Footnote */}
        <View
          style={[
            styles.noticeBox,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Icon
            name="info"
            size={13}
            color={theme.colors.textTertiary}
            style={{ marginRight: 8, marginTop: 1 }}
          />
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, fontSize: 11, lineHeight: 16, flex: 1 },
            ]}
          >
            Your profile shows patterns derived directly across available consented data feeds. TAMVA does not perform automated credit scoring or risk underwriting.
          </Text>
        </View>

        {/* Dismiss Button */}
        <Button
          label="Done"
          onPress={onClose}
          variant="primary"
          size="md"
          fullWidth
        />
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 24,
  },
  headerCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  metricCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 14,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 14,
    marginBottom: 16,
  },
});
