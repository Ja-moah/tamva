/**
 * TAMVA PassportConfidenceCard Component
 *
 * Dedicated presenter for the Financial Confidence score within the Passport.
 * Emphasizes the calibrated 5-tier meter, factual summary, and non-bureau framing.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { PassportConfidence } from '../../types/passport';

export interface PassportConfidenceCardProps {
  confidence: PassportConfidence;
  onPress?: () => void;
}

export const PassportConfidenceCard: React.FC<PassportConfidenceCardProps> = ({
  confidence,
  onPress,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const scaleAnim = useState(() => new Animated.Value(1))[0];

  const { score, maxScore, ratingLabel, summaryText, percentileText } =
    confidence;
  const progress = Math.min(Math.max(score / maxScore, 0), 1);

  const handlePressIn = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 0.985,
      useNativeDriver: Platform.OS !== 'web',
      speed: 60,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    if (!onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      speed: 40,
      bounciness: 2,
    }).start();
  };

  const handlePress = () => {
    if (!onPress) return;
    haptics.lightImpact();
    onPress();
  };

  // 5 calibrated segments representing trust tiers
  const segmentCount = 5;
  const segments = Array.from({ length: segmentCount }, (_, index) => {
    const segmentStart = index / segmentCount;
    const segmentEnd = (index + 1) / segmentCount;
    const isFullyFilled = progress >= segmentEnd;
    const isPartiallyFilled =
      progress > segmentStart && progress < segmentEnd;
    const segmentFill = isFullyFilled
      ? 1
      : isPartiallyFilled
      ? (progress - segmentStart) / (segmentEnd - segmentStart)
      : 0;

    return { index, segmentFill, isFullyFilled };
  });

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={onPress ? handlePress : undefined}
        onPressIn={onPress ? handlePressIn : undefined}
        onPressOut={onPress ? handlePressOut : undefined}
        disabled={!onPress}
        accessibilityRole="button"
        accessibilityLabel={`Financial Confidence score ${score} of ${maxScore}, rated ${ratingLabel}`}
      >
        <Card variant="elevated" padding="none" style={styles.card}>
          <View style={styles.content}>
            {/* Header: Label + Rating Badge */}
            <View style={styles.headerRow}>
              <View style={styles.labelWrapper}>
                <Icon
                  name="shield"
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
                  FINANCIAL CONFIDENCE
                </Text>
              </View>

              <Badge label={ratingLabel} tone="success" size="md" />
            </View>

            {/* Score Number + Max Score */}
            <View style={styles.scoreRow}>
              <View style={styles.scoreNumberWrapper}>
                <Text
                  style={[
                    theme.typography.display,
                    {
                      color: theme.colors.textPrimary,
                      fontSize: 44,
                      lineHeight: 48,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {score}
                </Text>
                <Text
                  style={[
                    theme.typography.body,
                    {
                      color: theme.colors.textTertiary,
                      fontSize: 18,
                      marginLeft: 4,
                      marginBottom: 4,
                      fontWeight: '500',
                    },
                  ]}
                >
                  / {maxScore}
                </Text>
              </View>

              {percentileText && (
                <View
                  style={[
                    styles.percentileBadge,
                    { backgroundColor: theme.colors.successLight },
                  ]}
                >
                  <Icon
                    name="trending-up"
                    size={12}
                    color={theme.colors.success}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      theme.typography.captionMedium,
                      { color: theme.colors.successText, fontSize: 11 },
                    ]}
                  >
                    {percentileText}
                  </Text>
                </View>
              )}
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
              <Icon
                name="info"
                size={13}
                color={theme.colors.textTertiary}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, fontSize: 11, flex: 1 },
                ]}
              >
                Calculated purely from consented account activity • Not a credit bureau score
              </Text>
            </View>
          </View>
        </Card>
      </Pressable>
    </Animated.View>
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
  labelWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 10,
    marginBottom: 12,
  },
  scoreNumberWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  percentileBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
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
