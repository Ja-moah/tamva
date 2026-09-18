/**
 * TAMVA Input Component
 *
 * Production-ready text input featuring focused states, error messaging,
 * password visibility toggle, left/right icons, and accessibility tags.
 */

import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { useTheme } from '../../theme';
import { FeatherIconName } from '../../constants/icons';
import { Icon } from './Icon';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  helperText?: string;
  errorMessage?: string;
  leftIcon?: FeatherIconName;
  rightIcon?: FeatherIconName;
  onRightIconPress?: () => void;
  isPassword?: boolean;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  inputStyle?: ViewStyle;
  required?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  helperText,
  errorMessage,
  leftIcon,
  rightIcon,
  onRightIconPress,
  isPassword = false,
  disabled = false,
  containerStyle,
  inputStyle,
  required = false,
  secureTextEntry,
  onFocus,
  onBlur,
  ...restProps
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const hasError = Boolean(errorMessage);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  // Determine border color based on state
  const getBorderColor = () => {
    if (disabled) return theme.colors.border;
    if (hasError) return theme.colors.danger;
    if (isFocused) return theme.colors.borderFocus;
    return theme.colors.border;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelContainer}>
          <Text
            style={[
              theme.typography.label,
              { color: disabled ? theme.colors.textDisabled : theme.colors.textPrimary },
            ]}
          >
            {label}
            {required && <Text style={{ color: theme.colors.danger }}> *</Text>}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: disabled ? theme.colors.backgroundAlt : theme.colors.surface,
            borderColor: getBorderColor(),
            borderRadius: theme.radius.md,
            borderWidth: isFocused || hasError ? 1.5 : 1,
          },
          inputStyle,
        ]}
      >
        {leftIcon && (
          <View style={styles.leftIconWrapper}>
            <Icon
              name={leftIcon}
              size={18}
              color={
                disabled
                  ? theme.colors.textDisabled
                  : isFocused
                  ? theme.colors.primary
                  : theme.colors.textTertiary
              }
            />
          </View>
        )}

        <TextInput
          editable={!disabled}
          placeholderTextColor={theme.colors.textTertiary}
          secureTextEntry={isPassword ? !showPassword : secureTextEntry}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[
            styles.textInput,
            theme.typography.body,
            {
              color: disabled ? theme.colors.textDisabled : theme.colors.textPrimary,
              paddingLeft: leftIcon ? 8 : theme.spacing.base,
              paddingRight: isPassword || rightIcon ? 8 : theme.spacing.base,
            },
          ]}
          accessibilityLabel={label}
          accessibilityState={{ disabled }}
          {...restProps}
        />

        {isPassword ? (
          <Pressable
            onPress={togglePasswordVisibility}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.rightActionWrapper}
            accessibilityRole="button"
            accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          >
            <Icon
              name={showPassword ? 'eye-off' : 'eye'}
              size={18}
              color={theme.colors.textSecondary}
            />
          </Pressable>
        ) : rightIcon ? (
          <Pressable
            onPress={onRightIconPress}
            disabled={!onRightIconPress || disabled}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.rightActionWrapper}
            accessibilityRole={onRightIconPress ? 'button' : undefined}
          >
            <Icon
              name={rightIcon}
              size={18}
              color={disabled ? theme.colors.textDisabled : theme.colors.textSecondary}
            />
          </Pressable>
        ) : null}
      </View>

      {(hasError || helperText) && (
        <View style={styles.feedbackContainer}>
          {hasError && (
            <Icon
              name="alert-circle"
              size={14}
              color={theme.colors.danger}
              style={styles.feedbackIcon}
            />
          )}
          <Text
            style={[
              theme.typography.caption,
              { color: hasError ? theme.colors.danger : theme.colors.textSecondary },
            ]}
          >
            {errorMessage || helperText}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  labelContainer: {
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
  },
  textInput: {
    flex: 1,
    height: '100%',
    paddingVertical: 12,
  },
  leftIconWrapper: {
    paddingLeft: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rightActionWrapper: {
    paddingRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 44,
    minWidth: 44,
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 2,
  },
  feedbackIcon: {
    marginRight: 4,
  },
});
