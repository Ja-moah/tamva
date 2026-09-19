/**
 * TAMVA NotificationRow Component
 *
 * Polished, high-hierarchy notification row:
 * - Brand logo or category icon avatar
 * - Semantic category badge and relative timestamp
 * - Unread indicator (subtle visual accent, not color alone)
 * - Clear title and body hierarchy with responsive multiline wrapping
 * - Action affordance with chevron navigation hint
 * - Accessibility compliant with explicit unread state in a11y labels
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { NotificationItem, NotificationCategory } from '../../types/notifications';
import { BrandLogo } from '../ui/BrandLogo';
import { Badge, BadgeTone } from '../ui/Badge';
import { Icon } from '../ui/Icon';

export interface NotificationRowProps {
  notification: NotificationItem;
  onPress: (notification: NotificationItem) => void;
  style?: ViewStyle;
}

export const NotificationRow: React.FC<NotificationRowProps> = ({
  notification,
  onPress,
  style,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  const handlePress = () => {
    haptics.selection();
    onPress(notification);
  };

  const getCategoryBadgeTone = (category: NotificationCategory): BadgeTone => {
    switch (category) {
      case 'consent':
        return 'warning';
      case 'passport':
        return 'information';
      case 'protection':
        return 'success';
      case 'account_sync':
      case 'other':
      default:
        return 'neutral';
    }
  };

  const accessibilityLabel = `${
    notification.isRead ? 'Read' : 'Unread'
  } notification: ${notification.title}. ${notification.body}. Received ${
    notification.timestamp
  }. Category: ${notification.categoryLabel}.${
    notification.actionLabel ? ` Tap to ${notification.actionLabel.toLowerCase()}.` : ''
  }`;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: notification.isRead
            ? theme.colors.surface
            : theme.colors.surfaceElevated,
          borderColor: notification.isRead
            ? theme.colors.border
            : theme.colors.primaryMedium,
          borderRadius: theme.radius.lg,
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: !notification.isRead }}
    >
      {/* Unread Accent Bar on the Left Edge for Non-Color Accessibility */}
      {!notification.isRead && (
        <View
          style={[
            styles.unreadAccentBar,
            { backgroundColor: theme.colors.primary },
          ]}
        />
      )}

      <View style={styles.contentRow}>
        {/* Left Icon / Brand Logo */}
        <View style={styles.avatarWrapper}>
          {notification.institutionName ? (
            <BrandLogo
              name={notification.institutionName}
              containerSize={42}
              shape="rounded"
              fallbackIcon={notification.icon}
              fallbackBg={theme.colors.backgroundAlt}
              fallbackIconColor={theme.colors.textPrimary}
            />
          ) : (
            <View
              style={[
                styles.categoryIconTile,
                {
                  backgroundColor: !notification.isRead
                    ? theme.colors.primaryLight
                    : theme.colors.backgroundAlt,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Icon
                name={notification.icon}
                size={18}
                color={
                  !notification.isRead
                    ? theme.colors.primary
                    : theme.colors.textSecondary
                }
              />
            </View>
          )}
        </View>

        {/* Center Text Column */}
        <View style={styles.textColumn}>
          {/* Header Row: Category Badge + Timestamp */}
          <View style={styles.metaRow}>
            <View style={styles.badgeWrapper}>
              <Badge
                label={notification.categoryLabel}
                tone={getCategoryBadgeTone(notification.category)}
                size="sm"
              />
            </View>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textTertiary, fontSize: 11 },
              ]}
            >
              {notification.timestamp}
            </Text>
          </View>

          {/* Title */}
          <Text
            style={[
              theme.typography.bodyMedium,
              {
                color: theme.colors.textPrimary,
                fontWeight: notification.isRead ? '600' : '700',
                marginTop: 4,
              },
            ]}
            numberOfLines={2}
          >
            {notification.title}
          </Text>

          {/* Body */}
          <Text
            style={[
              theme.typography.caption,
              {
                color: theme.colors.textSecondary,
                lineHeight: 18,
                marginTop: 3,
              },
            ]}
            numberOfLines={3}
          >
            {notification.body}
          </Text>

          {/* Action Link (if defined) */}
          {notification.actionLabel && (
            <View style={styles.actionRow}>
              <Text
                style={[
                  theme.typography.captionMedium,
                  { color: theme.colors.primary, fontSize: 12 },
                ]}
              >
                {notification.actionLabel}
              </Text>
              <Icon
                name="arrow-right"
                size={12}
                color={theme.colors.primary}
                style={{ marginLeft: 4 }}
              />
            </View>
          )}
        </View>

        {/* Right Unread Dot & Chevron */}
        <View style={styles.rightColumn}>
          {!notification.isRead && (
            <View
              style={[
                styles.unreadDot,
                {
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.surface,
                },
              ]}
              accessible={false}
            />
          )}
          <Icon
            name="chevron-right"
            size={14}
            color={theme.colors.textTertiary}
            style={styles.chevron}
          />
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 10,
    minHeight: 72,
    position: 'relative',
  },
  unreadAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3.5,
    zIndex: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
  },
  avatarWrapper: {
    marginRight: 12,
    paddingTop: 2,
  },
  categoryIconTile: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  badgeWrapper: {
    flexShrink: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  rightColumn: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginLeft: 8,
    paddingTop: 4,
    gap: 12,
    flexShrink: 0,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1,
  },
  chevron: {
    marginTop: 2,
  },
});
