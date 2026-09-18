/**
 * TAMVA Skeleton Component
 *
 * Smooth pulsating placeholders for content loading states.
 * Prepares consistent layouts without jarring layout shift.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Animated,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme';

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  circle?: boolean;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  borderRadius,
  circle = false,
  style,
}) => {
  const { theme } = useTheme();
  const pulseAnim = useState(() => new Animated.Value(0.4))[0];

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.85,
          duration: 900,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 900,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  const computedRadius = circle
    ? typeof width === 'number'
      ? width / 2
      : 9999
    : borderRadius !== undefined
    ? borderRadius
    : theme.radius.sm;

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: circle && typeof width === 'number' ? width : (width as any),
          height: circle && typeof width === 'number' ? width : (height as any),
          borderRadius: computedRadius,
          backgroundColor: theme.colors.borderStrong,
          opacity: pulseAnim,
        },
        style,
      ]}
      accessibilityRole="none"
      accessibilityLabel="Loading content"
    />
  );
};

export const SkeletonCard: React.FC<{ height?: number; style?: ViewStyle }> = ({
  height = 100,
  style,
}) => {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
          padding: theme.spacing.base,
        },
        style,
      ]}
    >
      <View style={styles.cardHeaderRow}>
        <Skeleton circle width={36} height={36} />
        <View style={styles.cardHeaderTexts}>
          <Skeleton width="60%" height={14} style={{ marginBottom: 6 }} />
          <Skeleton width="35%" height={10} />
        </View>
      </View>
      <Skeleton width="80%" height={24} style={{ marginTop: 16 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
  cardContainer: {
    borderWidth: 1,
    width: '100%',
    marginBottom: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeaderTexts: {
    marginLeft: 12,
    flex: 1,
  },
});
