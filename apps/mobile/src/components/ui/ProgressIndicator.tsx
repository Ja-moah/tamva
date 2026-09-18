/**
 * TAMVA Progress Indicator Component
 *
 * Linear bar and circular progress indicators.
 * Smoothly visualizes completion rates, confidence scores, and loading states.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  Animated,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme';

export type ProgressTone = 'primary' | 'success' | 'warning' | 'danger';

export interface LinearProgressProps {
  progress?: number; // 0 to 1
  tone?: ProgressTone;
  height?: number;
  indeterminate?: boolean;
  style?: ViewStyle;
}

export const LinearProgress: React.FC<LinearProgressProps> = ({
  progress = 0,
  tone = 'primary',
  height = 6,
  indeterminate = false,
  style,
}) => {
  const { theme } = useTheme();
  const animatedProgress = useState(() => new Animated.Value(0))[0];
  const indeterminateAnim = useState(() => new Animated.Value(0))[0];

  // Animate determinate progress change
  useEffect(() => {
    if (!indeterminate) {
      Animated.timing(animatedProgress, {
        toValue: Math.min(Math.max(progress, 0), 1),
        duration: theme.motion.duration.normal,
        useNativeDriver: false,
      }).start();
    }
  }, [progress, indeterminate, theme]);

  // Indeterminate loop
  useEffect(() => {
    if (indeterminate) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(indeterminateAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: false,
          }),
          Animated.timing(indeterminateAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [indeterminate]);

  const getToneColor = (): string => {
    switch (tone) {
      case 'primary':
        return theme.colors.primary;
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'danger':
        return theme.colors.danger;
    }
  };

  const barColor = getToneColor();

  const widthInterpolation = indeterminate
    ? indeterminateAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ['0%', '70%', '100%'],
      })
    : animatedProgress.interpolate({
        inputRange: [0, 1],
        outputRange: ['0%', '100%'],
      });

  return (
    <View
      style={[
        styles.track,
        {
          height,
          backgroundColor: theme.colors.border,
          borderRadius: height / 2,
        },
        style,
      ]}
      accessibilityRole="progressbar"
      accessibilityValue={{
        min: 0,
        max: 100,
        now: indeterminate ? undefined : Math.round(progress * 100),
      }}
    >
      <Animated.View
        style={[
          styles.fill,
          {
            backgroundColor: barColor,
            width: widthInterpolation,
            borderRadius: height / 2,
          },
        ]}
      />
    </View>
  );
};

export interface CircularProgressProps {
  size?: 'sm' | 'md' | 'lg';
  tone?: ProgressTone;
  style?: ViewStyle;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  size = 'md',
  tone = 'primary',
  style,
}) => {
  const { theme } = useTheme();

  const getToneColor = (): string => {
    switch (tone) {
      case 'primary':
        return theme.colors.primary;
      case 'success':
        return theme.colors.success;
      case 'warning':
        return theme.colors.warning;
      case 'danger':
        return theme.colors.danger;
    }
  };

  const spinnerSize = size === 'sm' ? 'small' : size === 'lg' ? 'large' : 'small';

  return (
    <ActivityIndicator
      size={spinnerSize}
      color={getToneColor()}
      style={style}
    />
  );
};

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
    width: '100%',
  },
  fill: {
    height: '100%',
  },
});

