/**
 * TAMVA Button Component
 *
 * Production-ready button supporting primary, secondary, tertiary, and destructive variants.
 * Features haptics, loading states, accessibility, and consistent micro-interactions.
 */

import React, { useState } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
  Animated,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { FeatherIconName } from '../../constants/icons';
import { Icon } from './Icon';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  leftIcon?: FeatherIconName;
  rightIcon?: FeatherIconName;
  fullWidth?: boolean;
  style?: ViewStyle;
  testID?: string;
  accessibilityHint?: string;
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  testID,
  accessibilityHint,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const scaleAnim = useState(() => new Animated.Value(1))[0];

  const handlePressIn = () => {
    if (disabled || loading) return;
    Animated.spring(scaleAnim, {
      toValue: theme.motion.scale.pressedButton,
      useNativeDriver: Platform.OS !== 'web',
      speed: 50,
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
    if (disabled || loading) return;
    haptics.lightImpact();
    onPress();
  };

  // Resolve styles based on variant
  const getVariantStyles = (): {
    container: ViewStyle;
    text: TextStyle;
    spinnerColor: string;
    iconColor: string;
  } => {
    switch (variant) {
      case 'primary':
        return {
          container: {
            backgroundColor: theme.colors.primary,
            borderWidth: 0,
          },
          text: {
            color: theme.colors.primaryText,
          },
          spinnerColor: theme.colors.primaryText,
          iconColor: theme.colors.primaryText,
        };
      case 'secondary':
        return {
          container: {
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.borderStrong,
          },
          text: {
            color: theme.colors.textPrimary,
          },
          spinnerColor: theme.colors.textPrimary,
          iconColor: theme.colors.textPrimary,
        };
      case 'tertiary':
        return {
          container: {
            backgroundColor: theme.colors.transparent,
            borderWidth: 0,
          },
          text: {
            color: theme.colors.primary,
          },
          spinnerColor: theme.colors.primary,
          iconColor: theme.colors.primary,
        };
      case 'destructive':
        return {
          container: {
            backgroundColor: theme.colors.dangerLight,
            borderWidth: 1,
            borderColor: theme.colors.danger,
          },
          text: {
            color: theme.colors.danger,
          },
          spinnerColor: theme.colors.danger,
          iconColor: theme.colors.danger,
        };
    }
  };

  // Resolve styles based on size
  const getSizeStyles = (): {
    container: ViewStyle;
    text: TextStyle;
    iconSize: number;
  } => {
    switch (size) {
      case 'sm':
        return {
          container: {
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            minHeight: 36,
            borderRadius: theme.radius.md,
          },
          text: {
            ...theme.typography.buttonSm,
          },
          iconSize: 16,
        };
      case 'md':
        return {
          container: {
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            minHeight: 48,
            borderRadius: theme.radius.lg,
          },
          text: {
            ...theme.typography.button,
          },
          iconSize: 18,
        };
      case 'lg':
        return {
          container: {
            paddingVertical: theme.spacing.base,
            paddingHorizontal: theme.spacing.xl,
            minHeight: 56,
            borderRadius: theme.radius.lg,
          },
          text: {
            ...theme.typography.button,
            fontSize: 17,
          },
          iconSize: 20,
        };
    }
  };

  const variantStyle = getVariantStyles();
  const sizeStyle = getSizeStyles();

  return (
    <Animated.View
      style={[
        { transform: [{ scale: scaleAnim }] },
        fullWidth && styles.fullWidth,
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ disabled: disabled || loading, busy: loading }}
        style={[
          styles.base,
          sizeStyle.container,
          variantStyle.container,
          disabled && styles.disabled,
          fullWidth && styles.fullWidth,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variantStyle.spinnerColor}
            style={styles.spinner}
          />
        ) : (
          <View style={styles.contentRow}>
            {leftIcon && (
              <Icon
                name={leftIcon}
                size={sizeStyle.iconSize}
                color={variantStyle.iconColor}
                style={styles.leftIcon}
              />
            )}
            <Text
              style={[
                styles.label,
                sizeStyle.text,
                variantStyle.text,
                disabled && { color: theme.colors.textDisabled },
              ]}
              numberOfLines={1}
            >
              {label}
            </Text>
            {rightIcon && (
              <Icon
                name={rightIcon}
                size={sizeStyle.iconSize}
                color={variantStyle.iconColor}
                style={styles.rightIcon}
              />
            )}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    textAlign: 'center',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
  spinner: {
    paddingVertical: 2,
  },
  disabled: {
    opacity: 0.45,
  },
});
