/**
 * TAMVA PassportHeader Component
 *
 * Header for the Financial Passport screen:
 * Displays title, portable standing subtitle, privacy mask toggle shortcut,
 * and notifications button.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme';
import { usePrivacy } from '../../context/PrivacyContext';
import { useHaptics } from '../../hooks/useHaptics';
import { Icon } from '../ui/Icon';

export interface PassportHeaderProps {
  title?: string;
  subtitle?: string;
}

export const PassportHeader: React.FC<PassportHeaderProps> = ({
  title = 'Financial Passport',
  subtitle = 'Portable financial standing & trust profile',
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPrivate, togglePrivacy } = usePrivacy();
  const haptics = useHaptics();

  const handlePrivacyToggle = () => {
    haptics.selection();
    togglePrivacy();
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
        {/* Title & Subtitle */}
        <View style={styles.titleColumn}>
          <Text
            style={[
              theme.typography.heading,
              { color: theme.colors.textPrimary },
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, marginTop: 2 },
            ]}
          >
            {subtitle}
          </Text>
        </View>

        {/* Right Actions: Privacy Toggle & Notifications */}
        <View style={styles.actionsRow}>
          <Pressable
            onPress={handlePrivacyToggle}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: isPrivate ? theme.colors.primaryLight : theme.colors.surface,
                borderColor: isPrivate ? theme.colors.primaryMedium : theme.colors.border,
                opacity: pressed ? 0.82 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={isPrivate ? 'Reveal financial numbers' : 'Mask financial numbers'}
            accessibilityHint="Toggles privacy masking across balance displays"
          >
            <Icon
              name={isPrivate ? 'eye-off' : 'eye'}
              size={17}
              color={isPrivate ? theme.colors.primary : theme.colors.textSecondary}
            />
          </Pressable>

          <Pressable
            onPress={handleNotificationsPress}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={({ pressed }) => [
              styles.iconButton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                marginLeft: 8,
                opacity: pressed ? 0.82 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="View notifications"
          >
            <Icon name="bell" size={17} color={theme.colors.textSecondary} />
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  titleColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
