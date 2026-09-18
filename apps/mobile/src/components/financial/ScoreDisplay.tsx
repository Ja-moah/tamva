/**
 * TAMVA ScoreDisplay Component
 *
 * Visual presenter for TAMVA Financial Confidence and Trust scores.
 * Features a calibrated progress meter, semantic rating badges, and contextual copy.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  Animated,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { LinearProgress } from '../ui/ProgressIndicator';
import { Badge, BadgeTone } from '../ui/Badge';
import { Icon } from '../ui/Icon';
import { FinancialConfidenceRating } from '../../types/financial';

export interface ScoreDisplayProps {
  score: number;
  maxScore?: number;
  label?: string;
  ratingLabel?: string;
  rating?: FinancialConfidenceRating;
  summaryText?: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export const ScoreDisplay: React.FC<ScoreDisplayProps> = ({
  score,
  maxScore = 850,
  label = 'Financial Confidence',
  ratingLabel,
  rating = 'good',
  summaryText,
  onPress,
  style,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const scaleAnim = useState(() => new Animated.Value(1))[0];

  const progress = Math.min(Math.max(score / maxScore, 0), 1);

  const getRatingMetadata = (): { tone: BadgeTone; defaultLabel: string } => {
    switch (rating) {
      case 'exceptional':
        return { tone: 'success', defaultLabel: 'Exceptional' };
      case 'very_good':
        return { tone: 'success', defaultLabel: 'Very Good' };
      case 'good':
        return { tone: 'information', defaultLabel: 'Good' };
      case 'fair':
        return { tone: 'warning', defaultLabel: 'Fair' };
      case 'developing':
      default:
        return { tone: 'neutral', defaultLabel: 'Developing' };
    }
  };

  const meta = getRatingMetadata();
  const displayRating = ratingLabel || meta.defaultLabel;

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

  // 5 calibrated gauge segments representing financial trust tiers
  const segmentCount = 5;
  const segments = Array.from({ length: segmentCount }, (_, index) => {
    const segmentStart = index / segmentCount;
    const segmentEnd = (index + 1) / segmentCount;
    let fill = 0;
    if (progress >= segmentEnd) {
      fill = 1;
    } else if (progress > segmentStart) {
      fill = (progress - segmentStart) / (segmentEnd - segmentStart);
    }
    return { index, fill };
  });

  const cardContent = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: 20,
          ...theme.elevation.xs,
        },
        style,
      ]}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <Text
          style={[
            theme.typography.captionMedium,
            { color: theme.colors.textSecondary, fontSize: 13 },
          ]}
        >
          {label}
        </Text>

        <Badge
          label={displayRating}
          tone={meta.tone}
          size="sm"
        />
      </View>

      {/* Main Score Value with Baseline Alignment */}
      <View style={styles.scoreRow}>
        <Text
          style={[
            styles.scoreNumber,
            { color: theme.colors.textPrimary },
          ]}
        >
          {score}
        </Text>
        <Text
          style={[
            styles.maxScore,
            { color: theme.colors.textTertiary },
          ]}
        >
          / {maxScore}
        </Text>
      </View>

      {/* Calibrated Multi-Segment Gauge */}
      <View style={styles.gaugeTrack}>
        {segments.map(({ index, fill }) => (
          <View
            key={index}
            style={[
              styles.gaugeSegment,
              { backgroundColor: theme.colors.backgroundAlt },
            ]}
          >
            {fill > 0 && (
              <View
                style={[
                  styles.gaugeFill,
                  {
                    width: `${fill * 100}%`,
                    backgroundColor:
                      meta.tone === 'danger'
                        ? theme.colors.danger
                        : meta.tone === 'warning'
                        ? theme.colors.warning
                        : theme.colors.primary,
                  },
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {/* Summary / Behavioral Insight */}
      {summaryText && (
        <Text
          style={[
            styles.summaryText,
            theme.typography.caption,
            { color: theme.colors.textSecondary },
          ]}
        >
          {summaryText}
        </Text>
      )}

      {/* Subtle Link Prompt */}
      {onPress && (
        <View style={styles.footerRow}>
          <Text
            style={[
              theme.typography.captionMedium,
              { color: theme.colors.primary, fontSize: 12 },
            ]}
          >
            View Financial Passport
          </Text>
          <Icon
            name="chevron-right"
            size={13}
            color={theme.colors.primary}
            style={{ marginLeft: 4 }}
          />
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityLabel={`Financial Confidence score: ${score} of ${maxScore}, rating: ${displayRating}. Tap to view Financial Passport.`}
          accessibilityHint="Navigates to your portable Financial Passport"
        >
          {cardContent}
        </Pressable>
      </Animated.View>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderWidth: 1,
    width: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 14,
  },
  scoreNumber: {
    fontSize: 42,
    lineHeight: 46,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  maxScore: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    marginLeft: 6,
    marginBottom: 2,
  },
  gaugeTrack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 5,
    marginBottom: 12,
  },
  gaugeSegment: {
    flex: 1,
    height: 5,
    borderRadius: 2.5,
    overflow: 'hidden',
  },
  gaugeFill: {
    height: '100%',
    borderRadius: 2.5,
  },
  summaryText: {
    fontSize: 13,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
});
