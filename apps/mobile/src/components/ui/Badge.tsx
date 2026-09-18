/**
 * TAMVA Badge Component
 *
 * Semantic status indicator badge supporting success, warning,
 * danger, neutral, and information tones.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import { FeatherIconName } from '../../constants/icons';
import { Icon } from './Icon';

export type BadgeTone = 'success' | 'warning' | 'danger' | 'neutral' | 'information';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  label: string;
  tone?: BadgeTone;
  size?: BadgeSize;
  showDot?: boolean;
  icon?: FeatherIconName;
  style?: ViewStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  tone = 'neutral',
  size = 'md',
  showDot = false,
  icon,
  style,
}) => {
  const { theme } = useTheme();

  const getToneStyles = (): {
    background: string;
    text: string;
    border?: string;
    dot: string;
  } => {
    switch (tone) {
      case 'success':
        return {
          background: theme.colors.successLight,
          text: theme.colors.successText,
          border: theme.colors.successMedium,
          dot: theme.colors.success,
        };
      case 'warning':
        return {
          background: theme.colors.warningLight,
          text: theme.colors.warningText,
          border: theme.colors.warningMedium,
          dot: theme.colors.warning,
        };
      case 'danger':
        return {
          background: theme.colors.dangerLight,
          text: theme.colors.dangerText,
          border: theme.colors.dangerMedium,
          dot: theme.colors.danger,
        };
      case 'information':
        return {
          background: theme.colors.infoLight,
          text: theme.colors.infoText,
          border: theme.colors.infoMedium,
          dot: theme.colors.info,
        };
      case 'neutral':
        return {
          background: theme.colors.backgroundAlt,
          text: theme.colors.textSecondary,
          border: theme.colors.border,
          dot: theme.colors.textTertiary,
        };
    }
  };

  const toneStyles = getToneStyles();
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: toneStyles.background,
          borderColor: toneStyles.border || 'transparent',
          paddingVertical: isSmall ? 2 : 4,
          paddingHorizontal: isSmall ? 8 : 10,
          borderRadius: theme.radius.full,
        },
        style,
      ]}
      accessibilityRole="text"
    >
      {showDot && (
        <View
          style={[
            styles.dot,
            {
              backgroundColor: toneStyles.dot,
              width: isSmall ? 5 : 6,
              height: isSmall ? 5 : 6,
              borderRadius: 3,
            },
          ]}
        />
      )}

      {icon && (
        <Icon
          name={icon}
          size={isSmall ? 10 : 12}
          color={toneStyles.text}
          style={styles.icon}
        />
      )}

      <Text
        style={[
          styles.text,
          isSmall ? theme.typography.caption : theme.typography.label,
          {
            color: toneStyles.text,
            fontSize: isSmall ? 11 : 12,
            lineHeight: isSmall ? 14 : 16,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    marginRight: 5,
  },
  icon: {
    marginRight: 4,
  },
  text: {
    fontWeight: '600',
  },
});
