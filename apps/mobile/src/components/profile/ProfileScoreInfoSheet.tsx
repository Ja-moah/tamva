/**
 * TAMVA ProfileScoreInfoSheet Component
 *
 * BottomSheet explaining the methodology behind the customer's Financial Confidence score.
 * Clarifies that the score describes patterns across consented accounts and is NOT
 * a credit bureau score, government credential, or credit approval guarantee.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { ProfileScore } from '../../types/profile';

export interface ProfileScoreInfoSheetProps {
  visible: boolean;
  onClose: () => void;
  score: ProfileScore | null;
}

export const ProfileScoreInfoSheet: React.FC<ProfileScoreInfoSheetProps> = ({
  visible,
  onClose,
  score,
}) => {
  const { theme } = useTheme();

  if (!score) return null;

  const pillars = [
    { label: 'Income Consistency', icon: 'trending-up' as const },
    { label: 'Financial Stability', icon: 'shield' as const },
    { label: 'Savings Behaviour', icon: 'pie-chart' as const },
    { label: 'Repayment Behaviour', icon: 'check-circle' as const },
    { label: 'Financial Resilience', icon: 'activity' as const },
  ];

  const isScoreAvailable = typeof score.score === 'number';

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="About Financial Confidence"
      subtitle="Profile indicator methodology"
      maxHeight="85%"
    >
      <View style={styles.container}>
        {/* Score Summary Box */}
        <View
          style={[
            styles.scoreBox,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.scoreRow}>
            <View>
              <Text
                style={[
                  theme.typography.captionMedium,
                  { color: theme.colors.textTertiary, fontSize: 11 },
                ]}
              >
                CURRENT SCORE
              </Text>
              <View style={styles.scoreNumberRow}>
                <Text
                  style={[
                    theme.typography.display,
                    {
                      color: theme.colors.textPrimary,
                      fontSize: isScoreAvailable ? 32 : 24,
                      lineHeight: isScoreAvailable ? 38 : 30,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {isScoreAvailable ? score.score : 'Building'}
                </Text>
                {isScoreAvailable && (
                  <Text
                    style={[
                      theme.typography.body,
                      {
                        color: theme.colors.textTertiary,
                        fontSize: 16,
                        marginLeft: 4,
                        marginBottom: 2,
                      },
                    ]}
                  >
                    / {score.maxScore}
                  </Text>
                )}
              </View>
            </View>

            <View style={styles.badgesCol}>
              <Badge label={score.ratingLabel} tone="success" size="md" />
              {score.trendLabel && (
                <View
                  style={[
                    styles.trendPill,
                    { backgroundColor: theme.colors.successLight },
                  ]}
                >
                  <Icon
                    name="trending-up"
                    size={11}
                    color={theme.colors.success}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      theme.typography.captionMedium,
                      { color: theme.colors.successText, fontSize: 10 },
                    ]}
                  >
                    {score.trendLabel}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Primary Explanation */}
        <Text
          style={[
            theme.typography.bodyMedium,
            { color: theme.colors.textPrimary, fontWeight: '600', marginTop: 14 },
          ]}
        >
          What your score represents
        </Text>

        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, marginTop: 4, lineHeight: 18 },
          ]}
        >
          Your Financial Confidence reflects patterns observed across the financial data you have consented to share with TAMVA.
        </Text>

        {/* Evaluated Pattern Pillars */}
        <Text
          style={[
            theme.typography.captionMedium,
            {
              color: theme.colors.textTertiary,
              textTransform: 'uppercase',
              letterSpacing: 0.6,
              fontSize: 10,
              marginTop: 14,
              marginBottom: 8,
            },
          ]}
        >
          BEHAVIOURAL PATTERNS CONSIDERED
        </Text>

        <View
          style={[
            styles.pillarsContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {pillars.map((pillar, idx) => (
            <View
              key={pillar.label}
              style={[
                styles.pillarItem,
                idx < pillars.length - 1 && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderBottomColor: theme.colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.pillarIconCircle,
                  { backgroundColor: theme.colors.primaryLight },
                ]}
              >
                <Icon
                  name={pillar.icon}
                  size={13}
                  color={theme.colors.primary}
                />
              </View>
              <Text
                style={[
                  theme.typography.bodyMedium,
                  { color: theme.colors.textPrimary, fontSize: 13, fontWeight: '500' },
                ]}
              >
                {pillar.label}
              </Text>
            </View>
          ))}
        </View>

        {/* Factual Non-Bureau Disclosure Notice */}
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
            This is a TAMVA profile indicator, not a credit bureau score. TAMVA describes patterns observed in consented data and does not make automated credit decisions or guarantee third-party outcomes.
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
  scoreBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreNumberRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 2,
  },
  badgesCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  trendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pillarsContainer: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: 14,
  },
  pillarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  pillarIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
});
