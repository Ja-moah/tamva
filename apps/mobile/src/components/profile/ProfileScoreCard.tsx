/**
 * TAMVA ProfileScoreCard Component
 *
 * Dedicated presenter for the Financial Confidence score within the Financial Profile.
 * Emphasizes the calibrated 5-tier meter, qualitative trend, and factual non-bureau framing.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { ProfileScore } from '../../types/profile';

export interface ProfileScoreCardProps {
  score: ProfileScore;
  onPress?: () => void;
}

export const ProfileScoreCard: React.FC<ProfileScoreCardProps> = ({
  score,
  onPress,
}) => {
  const { theme } = useTheme();

  const { score: currentScore, maxScore, ratingLabel, summaryText, trendLabel } = score;
  const isScoreAvailable = typeof currentScore === 'number';
  const progress = isScoreAvailable ? Math.min(Math.max(currentScore / maxScore, 0), 1) : 0;

  // 5 calibrated segments representing trust tiers
  const segmentCount = 5;
  const segments = Array.from({ length: segmentCount }, (_, index) => {
    if (!isScoreAvailable) {
      return { index, segmentFill: 0 };
    }
    const segmentStart = index / segmentCount;
    const segmentEnd = (index + 1) / segmentCount;
    const isFullyFilled = progress >= segmentEnd;
    const isPartiallyFilled = progress > segmentStart && progress < segmentEnd;
    const segmentFill = isFullyFilled
      ? 1
      : isPartiallyFilled
      ? (progress - segmentStart) / (segmentEnd - segmentStart)
      : 0;

    return { index, segmentFill };
  });

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        { opacity: pressed ? 0.92 : 1 },
      ]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={
        isScoreAvailable
          ? `Financial Confidence score ${currentScore} of ${maxScore}, rated ${ratingLabel}`
          : `Financial Confidence score building, rated ${ratingLabel}`
      }
      accessibilityHint={onPress ? 'Tap to learn how your Financial Confidence score is calculated' : undefined}
    >
      <Card
        variant="elevated"
        padding="none"
        style={styles.card}
      >
      <View style={styles.content}>
        {/* Primary Score & Hierarchy Section */}
        <View style={styles.topScoreSection}>
          <View style={styles.scoreRow}>
            <View style={styles.scoreNumberWrapper}>
              <Text
                style={[
                  theme.typography.display,
                  {
                    color: theme.colors.textPrimary,
                    fontSize: isScoreAvailable ? 42 : 30,
                    lineHeight: isScoreAvailable ? 46 : 36,
                    fontWeight: '700',
                    letterSpacing: -0.5,
                  },
                ]}
              >
                {isScoreAvailable ? currentScore : 'Building'}
              </Text>
              {isScoreAvailable && (
                <Text
                  style={[
                    theme.typography.body,
                    {
                      color: theme.colors.textTertiary,
                      fontSize: 17,
                      marginLeft: 5,
                      marginBottom: 5,
                      fontWeight: '500',
                    },
                  ]}
                >
                  / {maxScore}
                </Text>
              )}
            </View>

            <View style={styles.statusGroup}>
              <Badge label={ratingLabel} tone="success" size="md" />
              {trendLabel && (
                <View
                  style={[
                    styles.trendBadge,
                    { backgroundColor: theme.colors.successLight },
                  ]}
                >
                  <Icon
                    name="trending-up"
                    size={11}
                    color={theme.colors.success}
                    style={{ marginRight: 3 }}
                  />
                  <Text
                    style={[
                      theme.typography.captionMedium,
                      { color: theme.colors.successText, fontSize: 11 },
                    ]}
                  >
                    {trendLabel}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Section Descriptor Kicker */}
          <View style={styles.labelWrapper}>
            <Icon
              name="shield"
              size={13}
              color={theme.colors.primary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                theme.typography.captionMedium,
                {
                  color: theme.colors.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  fontSize: 11,
                },
              ]}
            >
              FINANCIAL CONFIDENCE
            </Text>
          </View>
        </View>

        {/* Calibrated 5-Tier Meter */}
        <View style={styles.meterContainer}>
          <View style={styles.segmentsRow}>
            {segments.map((seg) => (
              <View
                key={seg.index}
                style={[
                  styles.segmentTrack,
                  { backgroundColor: theme.colors.backgroundAlt },
                ]}
              >
                {seg.segmentFill > 0 && (
                  <View
                    style={[
                      styles.segmentFill,
                      {
                        width: `${seg.segmentFill * 100}%`,
                        backgroundColor: theme.colors.primary,
                      },
                    ]}
                  />
                )}
              </View>
            ))}
          </View>

          <View style={styles.meterLabelsRow}>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textTertiary, fontSize: 10 },
              ]}
            >
              Developing
            </Text>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textTertiary, fontSize: 10 },
              ]}
            >
              Fair
            </Text>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textTertiary, fontSize: 10 },
              ]}
            >
              Good
            </Text>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textTertiary, fontSize: 10 },
              ]}
            >
              Very Good
            </Text>
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.successText, fontSize: 10 },
              ]}
            >
              Exceptional
            </Text>
          </View>
        </View>

        {/* Summary Narrative */}
        <Text
          style={[
            theme.typography.caption,
            {
              color: theme.colors.textSecondary,
              marginTop: 12,
              lineHeight: 18,
            },
          ]}
        >
          {summaryText}
        </Text>

        {/* Non-Bureau Notice Banner */}
        <View
          style={[
            styles.noticeBanner,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
            <Icon
              name="info"
              size={13}
              color={theme.colors.textTertiary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, fontSize: 11, flex: 1, lineHeight: 15 },
              ]}
            >
              Based on your consented financial activity • Not a credit bureau score
            </Text>
          </View>
          {onPress && (
            <Icon
              name="chevron-right"
              size={14}
              color={theme.colors.textTertiary}
              style={{ marginLeft: 6 }}
            />
          )}
        </View>
      </View>
    </Card>
    </Pressable>
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
  topScoreSection: {
    marginBottom: 12,
  },
  labelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  scoreNumberWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  statusGroup: {
    alignItems: 'flex-end',
    gap: 4,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  meterContainer: {
    width: '100%',
    marginVertical: 4,
  },
  segmentsRow: {
    flexDirection: 'row',
    gap: 4,
    width: '100%',
    height: 6,
  },
  segmentTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  segmentFill: {
    height: '100%',
    borderRadius: 3,
  },
  meterLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 12,
  },
});
