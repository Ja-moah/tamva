/**
 * TAMVA RiskHeader Component
 *
 * Header for the Risk & Decision Intelligence Overview:
 * Displays navigation back action, title, supporting intelligence subtitle,
 * and notifications shortcut.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { Icon } from '../ui/Icon';

export interface RiskHeaderProps {
  title?: string;
  subtitle?: string;
  onBackPress?: () => void;
}

export const RiskHeader: React.FC<RiskHeaderProps> = ({
  title = 'Risk Overview',
  subtitle = 'Risk & decision intelligence',
  onBackPress,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();

  const handleBackPress = () => {
    haptics.selection();
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)');
    }
  };

  const handleNotificationsPress = () => {
    haptics.lightImpact();
    router.push('/notifications');
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 16),
          backgroundColor: theme.colors.background,
        },
      ]}
    >
      <View style={styles.contentRow}>
        {/* Left: Navigation back button */}
        <Pressable
          onPress={handleBackPress}
          style={({ pressed }) => [
            styles.iconButton,
            {
              backgroundColor: pressed
                ? theme.colors.backgroundAlt
                : theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          hitSlop={8}
        >
          <Icon
            name="chevron-left"
            size={20}
            color={theme.colors.textPrimary}
          />
        </Pressable>

        {/* Center: Title & Subtitle */}
        <View style={styles.titleColumn}>
          <Text
            style={[
              theme.typography.heading,
              { color: theme.colors.textPrimary },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, marginTop: 2 },
            ]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        </View>

        {/* Right: Notifications Shortcut */}
        <Pressable
          onPress={handleNotificationsPress}
          style={({ pressed }) => [
            styles.iconButton,
            {
              backgroundColor: pressed
                ? theme.colors.backgroundAlt
                : theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          hitSlop={8}
        >
          <Icon
            name="bell"
            size={18}
            color={theme.colors.textSecondary}
          />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleColumn: {
    flex: 1,
    justifyContent: 'center',
    minWidth: 0,
  },
});
