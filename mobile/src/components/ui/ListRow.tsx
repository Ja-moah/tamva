/**
 * TAMVA ListRow Component
 *
 * Versatile list row for menus, settings, account items, and permissions.
 */

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { FeatherIconName } from '../../constants/icons';
import { Icon } from './Icon';
import { Badge, BadgeTone } from './Badge';

export interface ListRowProps {
  title: string;
  subtitle?: string;
  leftIcon?: FeatherIconName;
  leftIconColor?: string;
  leftIconBg?: string;
  leftElement?: React.ReactNode;
  rightText?: string;
  rightElement?: React.ReactNode;
  badge?: {
    label: string;
    tone?: BadgeTone;
  };
  showChevron?: boolean;
  onPress?: () => void;
  destructive?: boolean;
  showDivider?: boolean;
  style?: ViewStyle;
}

export const ListRow: React.FC<ListRowProps> = ({
  title,
  subtitle,
  leftIcon,
  leftIconColor,
  leftIconBg,
  leftElement,
  rightText,
  rightElement,
  badge,
  showChevron = true,
  onPress,
  destructive = false,
  showDivider = true,
  style,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  const handlePress = () => {
    if (!onPress) return;
    haptics.lightImpact();
    onPress();
  };

  const isInteractive = Boolean(onPress);

  return (
    <Pressable
      onPress={isInteractive ? handlePress : undefined}
      disabled={!isInteractive}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed && isInteractive ? theme.colors.backgroundAlt : theme.colors.surface,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: showDivider ? StyleSheet.hairlineWidth : 0,
        },
        style,
      ]}
      accessibilityRole={isInteractive ? 'button' : 'none'}
      accessibilityLabel={`${title}${subtitle ? `, ${subtitle}` : ''}`}
    >
      {/* Left Slot */}
      {leftElement ? (
        <View style={styles.leftSlot}>{leftElement}</View>
      ) : leftIcon ? (
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: leftIconBg || (destructive ? theme.colors.dangerLight : theme.colors.backgroundAlt),
            },
          ]}
        >
          <Icon
            name={leftIcon}
            size={18}
            color={leftIconColor || (destructive ? theme.colors.danger : theme.colors.textPrimary)}
          />
        </View>
      ) : null}

      {/* Title / Subtitle */}
      <View style={styles.textColumn}>
        <View style={styles.titleRow}>
          <Text
            style={[
              theme.typography.bodyMedium,
              {
                color: destructive ? theme.colors.danger : theme.colors.textPrimary,
              },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>

          {badge && (
            <Badge
              label={badge.label}
              tone={badge.tone || 'neutral'}
              size="sm"
              style={styles.badge}
            />
          )}
        </View>

        {subtitle && (
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, marginTop: 2 },
            ]}
            numberOfLines={2}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {/* Right Slot */}
      <View style={styles.rightSlot}>
        {rightText && (
          <Text
            style={[
              theme.typography.bodySm,
              { color: theme.colors.textSecondary, marginRight: 6 },
            ]}
          >
            {rightText}
          </Text>
        )}

        {rightElement}

        {showChevron && isInteractive && !rightElement && (
          <Icon
            name="chevron-right"
            size={18}
            color={theme.colors.textTertiary}
          />
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  leftSlot: {
    marginRight: 14,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    marginLeft: 8,
  },
  rightSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
});
