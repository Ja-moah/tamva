/**
 * TAMVA SectionHeader Component
 *
 * Section titles with overline, action buttons, and semantic badges.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { Badge, BadgeTone } from './Badge';

export interface SectionHeaderProps {
  title: string;
  overline?: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
  badge?: {
    label: string;
    tone?: BadgeTone;
  };
  style?: ViewStyle;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  overline,
  subtitle,
  actionLabel,
  onActionPress,
  badge,
  style,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  const handleActionPress = () => {
    if (!onActionPress) return;
    haptics.lightImpact();
    onActionPress();
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.leftCol}>
        {overline && (
          <Text
            style={[
              theme.typography.overline,
              { color: theme.colors.textTertiary, marginBottom: 2 },
            ]}
          >
            {overline}
          </Text>
        )}

        <View style={styles.titleRow}>
          <Text
            style={[
              theme.typography.subheading,
              { color: theme.colors.textPrimary },
            ]}
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
          >
            {subtitle}
          </Text>
        )}
      </View>

      {actionLabel && onActionPress && (
        <Pressable
          onPress={handleActionPress}
          hitSlop={{ top: 12, bottom: 12, left: 16, right: 16 }}
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          accessibilityHint={`Navigates to view all ${title.toLowerCase()}`}
          style={({ pressed }) => [
            styles.actionBtn,
            { opacity: pressed ? 0.6 : 1 },
          ]}
        >
          <Text
            style={[
              theme.typography.label,
              { color: theme.colors.primary },
            ]}
          >
            {actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    width: '100%',
  },
  leftCol: {
    flex: 1,
    paddingRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    marginLeft: 8,
  },
  actionBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
});
