/**
 * TAMVA IconButton Component
 *
 * Dedicated icon button for toolbars, headers, and quick actions.
 * Guarantees minimum 44x44 touch targets for accessibility.
 */

import React, { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  ViewStyle,
  Animated,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { FeatherIconName } from '../../constants/icons';
import { Icon } from './Icon';

export type IconButtonVariant = 'default' | 'subtle' | 'destructive' | 'filled';
export type IconButtonSize = 'sm' | 'md' | 'lg';

export interface IconButtonProps {
  icon: FeatherIconName;
  onPress: () => void;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  accessibilityLabel: string;
  style?: ViewStyle;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  variant = 'default',
  size = 'md',
  disabled = false,
  accessibilityLabel,
  style,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const scaleAnim = useState(() => new Animated.Value(1))[0];

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: theme.motion.scale.pressedButton,
      useNativeDriver: Platform.OS !== 'web',
      speed: 60,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: Platform.OS !== 'web',
      speed: 40,
      bounciness: 4,
    }).start();
  };

  const handlePress = () => {
    if (disabled) return;
    haptics.lightImpact();
    onPress();
  };

  const getSizeStyles = (): { size: number; iconSize: number } => {
    switch (size) {
      case 'sm':
        return { size: 36, iconSize: 18 };
      case 'md':
        return { size: 44, iconSize: 20 };
      case 'lg':
        return { size: 52, iconSize: 24 };
    }
  };

  const getVariantStyles = (): {
    backgroundColor: string;
    borderColor?: string;
    iconColor: string;
  } => {
    switch (variant) {
      case 'default':
        return {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          iconColor: theme.colors.textPrimary,
        };
      case 'subtle':
        return {
          backgroundColor: theme.colors.transparent,
          iconColor: theme.colors.textSecondary,
        };
      case 'filled':
        return {
          backgroundColor: theme.colors.primary,
          iconColor: theme.colors.primaryText,
        };
      case 'destructive':
        return {
          backgroundColor: theme.colors.dangerLight,
          borderColor: theme.colors.dangerMedium,
          iconColor: theme.colors.danger,
        };
    }
  };

  const sizeStyle = getSizeStyles();
  const variantStyle = getVariantStyles();

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={[
          styles.container,
          {
            width: sizeStyle.size,
            height: sizeStyle.size,
            borderRadius: theme.radius.full,
            backgroundColor: variantStyle.backgroundColor,
            borderColor: variantStyle.borderColor || 'transparent',
            borderWidth: variantStyle.borderColor ? 1 : 0,
          },
          disabled && styles.disabled,
          style,
        ]}
      >
        <Icon
          name={icon}
          size={sizeStyle.iconSize}
          color={disabled ? theme.colors.textDisabled : variantStyle.iconColor}
        />
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.45,
  },
});
