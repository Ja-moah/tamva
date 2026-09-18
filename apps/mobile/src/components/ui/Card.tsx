/**
 * TAMVA Card Component
 *
 * Container with standard, elevated, outlined, and interactive variants.
 * Follows TAMVA's restrained depth and radius system.
 */

import React, { useState, ReactNode } from 'react';
import {
  View,
  Pressable,
  StyleSheet,
  ViewStyle,
  Animated,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';

export type CardVariant = 'standard' | 'elevated' | 'outlined' | 'interactive';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  children: ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  onPress?: () => void;
  style?: ViewStyle;
  testID?: string;
  accessibilityLabel?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'standard',
  padding = 'md',
  onPress,
  style,
  testID,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const scaleAnim = useState(() => new Animated.Value(1))[0];

  const isClickable = variant === 'interactive' || Boolean(onPress);

  const handlePressIn = () => {
    if (!isClickable) return;
    Animated.spring(scaleAnim, {
      toValue: theme.motion.scale.pressedCard,
      useNativeDriver: Platform.OS !== 'web',
      speed: 50,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    if (!isClickable) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const handlePress = () => {
    if (!onPress) return;
    haptics.lightImpact();
    onPress();
  };

  const getPaddingStyle = (): ViewStyle => {
    switch (padding) {
      case 'none':
        return { padding: 0 };
      case 'sm':
        return { padding: theme.spacing.sm };
      case 'md':
        return { padding: theme.spacing.base };
      case 'lg':
        return { padding: theme.spacing.xl };
    }
  };

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case 'standard':
        return {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
        };
      case 'elevated':
        return {
          backgroundColor: theme.colors.surfaceElevated,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.elevation.sm,
        };
      case 'outlined':
        return {
          backgroundColor: theme.colors.transparent,
          borderWidth: 1,
          borderColor: theme.colors.borderStrong,
        };
      case 'interactive':
        return {
          backgroundColor: theme.colors.surface,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.elevation.xs,
        };
    }
  };

  const containerContent = (
    <View
      style={[
        styles.base,
        { borderRadius: theme.radius.lg },
        getVariantStyle(),
        getPaddingStyle(),
        style,
      ]}
      testID={testID}
    >
      {children}
    </View>
  );

  if (isClickable) {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Pressable
          onPress={handlePress}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
        >
          {containerContent}
        </Pressable>
      </Animated.View>
    );
  }

  return containerContent;
};

const styles = StyleSheet.create({
  base: {
    width: '100%',
    overflow: 'hidden',
  },
});
