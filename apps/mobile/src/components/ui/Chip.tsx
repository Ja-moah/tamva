/**
 * TAMVA Chip Component
 *
 * Filter and selection chip with active states, haptics, and accessible roles.
 */

import React, { useState } from 'react';
import {
  Pressable,
  Text,
  View,
  StyleSheet,
  ViewStyle,
  Animated,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { FeatherIconName } from '../../constants/icons';
import { Icon } from './Icon';

export interface ChipProps {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onPress: () => void;
  icon?: FeatherIconName;
  count?: number;
  style?: ViewStyle;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  disabled = false,
  onPress,
  icon,
  count,
  style,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const scaleAnim = useState(() => new Animated.Value(1))[0];

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(scaleAnim, {
      toValue: theme.motion.scale.pressedChip,
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
    haptics.selection();
    onPress();
  };

  const getBackgroundColor = () => {
    if (disabled) return theme.colors.backgroundAlt;
    if (selected) return theme.colors.primary;
    return theme.colors.surface;
  };

  const getBorderColor = () => {
    if (disabled) return theme.colors.border;
    if (selected) return theme.colors.primary;
    return theme.colors.border;
  };

  const getTextColor = () => {
    if (disabled) return theme.colors.textDisabled;
    if (selected) return theme.colors.primaryText;
    return theme.colors.textPrimary;
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        accessibilityRole="checkbox"
        accessibilityState={{ selected, disabled }}
        accessibilityLabel={label}
        style={[
          styles.container,
          {
            backgroundColor: getBackgroundColor(),
            borderColor: getBorderColor(),
            borderRadius: theme.radius.full,
          },
          disabled && styles.disabled,
          style,
        ]}
      >
        {icon && (
          <Icon
            name={icon}
            size={14}
            color={getTextColor()}
            style={styles.icon}
          />
        )}

        <Text
          style={[
            theme.typography.bodySmMedium,
            { color: getTextColor(), fontSize: 13 },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>

        {typeof count === 'number' && (
          <View
            style={[
              styles.countBadge,
              {
                backgroundColor: selected
                  ? 'rgba(255, 255, 255, 0.25)'
                  : theme.colors.backgroundAlt,
              },
            ]}
          >
            <Text
              style={[
                styles.countText,
                { color: getTextColor() },
              ]}
            >
              {count}
            </Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    minHeight: 34,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 6,
  },
  countBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  countText: {
    fontSize: 11,
    fontWeight: '700',
  },
  disabled: {
    opacity: 0.5,
  },
});
