/**
 * TAMVA HomeHeader Component
 *
 * Clean, premium top bar displaying user greeting, avatar,
 * privacy toggle trigger, and notification indicator.
 * Keeps user financial numbers the primary visual focus.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme';
import { usePrivacy } from '../../context/PrivacyContext';
import { useHaptics } from '../../hooks/useHaptics';
import { Avatar } from '../ui/Avatar';
import { Icon } from '../ui/Icon';
import { UserGreeting } from '../../types/home';

export interface HomeHeaderProps {
  user: UserGreeting;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ user }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { isPrivate, togglePrivacy } = usePrivacy();
  const haptics = useHaptics();

  const handleNotificationPress = () => {
    haptics.lightImpact();
    router.push('/notifications');
  };

  const handleProfilePress = () => {
    haptics.lightImpact();
    router.push('/(tabs)/profile');
  };

  const handlePrivacyToggle = () => {
    haptics.selection();
    togglePrivacy();
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
      {/* Left Column: User Profile & Greeting */}
      <View style={styles.leftCol}>
        <Pressable
          onPress={handleProfilePress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [
            styles.avatarButton,
            {
              opacity: pressed ? 0.82 : 1,
              transform: [{ scale: pressed ? 0.96 : 1 }],
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={`Account profile for ${user.userName}`}
          accessibilityHint="Navigates to your profile and security preferences"
        >
          <Avatar
            source={user.avatarUrl}
            name={user.userName}
            size="md"
            showStatus={true}
            statusColor={theme.colors.success}
          />
        </Pressable>

        <View style={styles.greetingCol}>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary },
            ]}
          >
            {user.greeting}
          </Text>
          <Text
            style={[
              theme.typography.subheading,
              { color: theme.colors.textPrimary, marginTop: 1 },
            ]}
            numberOfLines={1}
          >
            {user.userName}
          </Text>
        </View>
      </View>

      {/* Right Column: Actions (Privacy Toggle + Notification Trigger) */}
      <View style={styles.rightCol}>
        {/* Global Privacy Mask Toggle */}
        <Pressable
          onPress={handlePrivacyToggle}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: isPrivate ? theme.colors.primaryLight : theme.colors.surface,
              borderColor: isPrivate ? theme.colors.primaryMedium : theme.colors.border,
              opacity: pressed ? 0.75 : 1,
              transform: [{ scale: pressed ? 0.94 : 1 }],
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={isPrivate ? 'Reveal balances' : 'Hide balances'}
          accessibilityHint={isPrivate ? 'Shows sensitive financial values across dashboard' : 'Masks sensitive financial values across dashboard'}
          accessibilityState={{ selected: isPrivate }}
        >
          <Icon
            name={isPrivate ? 'eye-off' : 'eye'}
            size={18}
            color={isPrivate ? theme.colors.primary : theme.colors.textSecondary}
          />
        </Pressable>

        {/* Notifications Icon with Badge */}
        <Pressable
          onPress={handleNotificationPress}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              opacity: pressed ? 0.75 : 1,
              transform: [{ scale: pressed ? 0.94 : 1 }],
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={user.unreadNotificationsCount > 0 ? `Notifications, ${user.unreadNotificationsCount} unread` : 'Notifications'}
          accessibilityHint="Navigates to security and account notifications"
        >
          <Icon name="bell" size={18} color={theme.colors.textPrimary} />
          {user.unreadNotificationsCount > 0 && (
            <View
              style={[
                styles.unreadBadge,
                {
                  backgroundColor: theme.colors.danger,
                  borderColor: theme.colors.background,
                },
              ]}
            >
              <Text style={styles.unreadText}>
                {user.unreadNotificationsCount}
              </Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarButton: {
    marginRight: 12,
  },
  greetingCol: {
    justifyContent: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  unreadText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
  },
});
