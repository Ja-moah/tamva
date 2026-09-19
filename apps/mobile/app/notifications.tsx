/**
 * TAMVA Customer Mobile — Notification Center
 *
 * Provides a clean, focused notification center for consented financial data,
 * protection signals, account sync updates, and Financial Passport lifecycle events.
 *
 * Features:
 * - ScreenHeader with back navigation, dynamic unread subtitle, and "Mark all read" action
 * - Category filter chips: All, Unread (with live count), Consent, Protection, Passport
 * - High-hierarchy NotificationRow with official brand logos, category badges, unread indicators
 * - Tapping a notification marks it as read and seamlessly routes to the relevant experience
 * - Fully accessible empty states for zero-notification and filtered scenarios
 * - Purely financial-data intelligence framing — zero banking or wallet claims
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  BackHandler,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/theme';
import { useHaptics } from '../src/hooks/useHaptics';
import { useNotifications } from '../src/context/NotificationsContext';
import {
  NotificationFilter,
  NotificationItem,
} from '../src/types/notifications';
import { ScreenHeader } from '../src/components/ui/ScreenHeader';
import { Chip } from '../src/components/ui/Chip';
import { EmptyState } from '../src/components/ui/EmptyState';
import { ErrorState } from '../src/components/ui/ErrorState';
import { describeError } from '../src/api/errors';
import {
  NotificationRow,
  NotificationDetailView,
} from '../src/components/notifications';

export default function NotificationsScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();

  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    isLoading,
    isError,
    error,
    isRefreshing,
    refresh,
  } = useNotifications();

  const [selectedFilter, setSelectedFilter] = useState<NotificationFilter>('all');
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  // Intercept Android hardware back button when viewing notification details
  useEffect(() => {
    if (!selectedNotification) return;

    const onHardwareBack = () => {
      setSelectedNotification(null);
      return true; // prevent dismissing entire Notification Center
    };

    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      onHardwareBack
    );
    return () => subscription.remove();
  }, [selectedNotification]);

  // Filtered list computation
  const filteredNotifications = useMemo(() => {
    switch (selectedFilter) {
      case 'unread':
        return notifications.filter((n) => !n.isRead);
      case 'consent':
        return notifications.filter((n) => n.category === 'consent');
      case 'protection':
        return notifications.filter((n) => n.category === 'protection');
      case 'passport':
        return notifications.filter((n) => n.category === 'passport');
      case 'all':
      default:
        return notifications;
    }
  }, [notifications, selectedFilter]);

  const handleNotificationPress = (item: NotificationItem) => {
    // 1. Mark as read immediately
    if (!item.isRead) {
      markAsRead(item.id);
    }

    // 2. Open notification detail view (do not navigate directly)
    setSelectedNotification({ ...item, isRead: true });
  };

  const handleBackToList = () => {
    haptics.selection();
    setSelectedNotification(null);
  };

  const handleDetailActionPress = (item: NotificationItem) => {
    if (!item.actionRoute) return;

    // Dismiss Notification Center modal and navigate cleanly to destination tab
    router.dismissTo(item.actionRoute as any);
  };

  const handleMarkAllAsRead = () => {
    haptics.success();
    markAllAsRead();
  };

  const handleFilterSelect = (filter: NotificationFilter) => {
    haptics.selection();
    setSelectedFilter(filter);
  };

  const renderFilterChips = () => (
    <View style={styles.filterSection}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        <Chip
          label="All"
          selected={selectedFilter === 'all'}
          onPress={() => handleFilterSelect('all')}
          style={styles.filterChip}
        />
        <Chip
          label="Unread"
          selected={selectedFilter === 'unread'}
          count={unreadCount > 0 ? unreadCount : undefined}
          onPress={() => handleFilterSelect('unread')}
          style={styles.filterChip}
        />
        <Chip
          label="Consent"
          selected={selectedFilter === 'consent'}
          onPress={() => handleFilterSelect('consent')}
          style={styles.filterChip}
        />
        <Chip
          label="Protection"
          selected={selectedFilter === 'protection'}
          onPress={() => handleFilterSelect('protection')}
          style={styles.filterChip}
        />
        <Chip
          label="Passport"
          selected={selectedFilter === 'passport'}
          onPress={() => handleFilterSelect('passport')}
          style={styles.filterChip}
        />
      </ScrollView>
    </View>
  );

  if (selectedNotification) {
    return (
      <NotificationDetailView
        notification={selectedNotification}
        onBack={handleBackToList}
        onActionPress={handleDetailActionPress}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 1. SCREEN HEADER */}
      <ScreenHeader
        title="Notifications"
        subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
        showBack={true}
        onBackPress={() => router.back()}
        borderBottom={true}
        rightElement={
          unreadCount > 0 ? (
            <Pressable
              onPress={handleMarkAllAsRead}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={({ pressed }) => [
                styles.markAllButton,
                { opacity: pressed ? 0.7 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Mark all notifications as read"
            >
              <Text
                numberOfLines={1}
                style={[
                  theme.typography.buttonSm,
                  styles.markAllText,
                  { color: theme.colors.primary },
                ]}
              >
                Mark all read
              </Text>
            </Pressable>
          ) : null
        }
      />

      {/* 2. CATEGORY FILTER BAR */}
      {renderFilterChips()}

      {/* 3. NOTIFICATION LIST OR EMPTY STATE */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={refresh} />}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 16 },
        ]}
      >
        {isLoading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator color={theme.colors.primary} />
          </View>
        ) : isError && notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ErrorState
              title="Unable to load notifications"
              message={describeError(error)}
              onRetry={refresh}
              retryLabel="Try again"
            />
          </View>
        ) : filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <EmptyState
              icon={selectedFilter === 'unread' ? 'check-circle' : 'bell'}
              title="You're all caught up"
              description={
                selectedFilter === 'unread'
                  ? 'No unread notifications right now. Your consented financial alerts are up to date.'
                  : selectedFilter !== 'all'
                  ? `No ${selectedFilter} notifications found.`
                  : 'Important updates about your consented financial data will appear here.'
              }
              actionLabel={selectedFilter !== 'all' ? 'View All Notifications' : undefined}
              onActionPress={selectedFilter !== 'all' ? () => setSelectedFilter('all') : undefined}
            />
          </View>
        ) : (
          filteredNotifications.map((item) => (
            <NotificationRow
              key={item.id}
              notification={item}
              onPress={handleNotificationPress}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  markAllButton: {
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingVertical: 6,
    paddingHorizontal: 4,
    flexShrink: 0,
  },
  markAllText: {
    textAlign: 'right',
  },
  filterSection: {
    paddingVertical: 12,
  },
  filterScrollContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    marginRight: 0,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  emptyContainer: {
    paddingTop: 40,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
