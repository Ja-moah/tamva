/**
 * TAMVA Notifications Context
 *
 * Provides application-wide state for customer notifications,
 * unread count synchronization, and mark-as-read mutations.
 */

import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { NotificationItem as ApiNotification } from '@tamva/client-contracts';
import { NotificationItem } from '../types/notifications';
import { mockNotifications } from '../demo/data/mockNotificationsData';
import { listNotifications, markNotificationRead, markNotificationsRead } from '../api/endpoints';
import { useAuth } from '../auth/AuthProvider';
import { DEMO_MODE } from '../config/env';
import { makeFormatters } from '../i18n/format';
import { mapNotification } from '../features/notificationMapping';

interface NotificationsContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  isRefreshing: boolean;
  refresh: () => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  resetNotifications: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(
  undefined
);

export interface NotificationsProviderProps {
  children: ReactNode;
  initialNotifications?: NotificationItem[];
}

export const NotificationsProvider: React.FC<NotificationsProviderProps> = ({
  children,
  initialNotifications = mockNotifications,
}) => {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const formatter = useMemo(() => makeFormatters(), []);
  const query = useQuery({
    queryKey: ['customer-notifications'],
    queryFn: ({ signal }) => listNotifications({ page_size: 100 }, signal),
    enabled: !DEMO_MODE && auth.status === 'authenticated',
  });

  const toItem = useCallback((item: ApiNotification) => mapNotification(item, formatter), [formatter]);

  const notifications = useMemo(
    () => (DEMO_MODE ? initialNotifications : (query.data?.results ?? []).map(toItem)),
    [initialNotifications, query.data, toItem]
  );

  const readOne = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customer-notifications'] }),
  });
  const readMany = useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customer-notifications'] }),
  });

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const markAsRead = useCallback((id: string) => {
    if (!DEMO_MODE) readOne.mutate(id);
  }, [readOne]);

  const markAllAsRead = useCallback(() => {
    const ids = notifications.filter((item) => !item.isRead).map((item) => item.id);
    if (!DEMO_MODE && ids.length > 0) readMany.mutate(ids);
  }, [notifications, readMany]);

  const clearAll = useCallback(() => {
    if (DEMO_MODE) queryClient.setQueryData(['customer-notifications'], { results: [] });
  }, [queryClient]);

  const resetNotifications = useCallback(() => {
    if (!DEMO_MODE) void queryClient.invalidateQueries({ queryKey: ['customer-notifications'] });
  }, [queryClient]);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      isLoading: !DEMO_MODE && query.isPending && auth.status === 'authenticated',
      isError: !DEMO_MODE && query.isError,
      error: query.error,
      isRefreshing: query.isRefetching,
      refresh: () => void query.refetch(),
      markAsRead,
      markAllAsRead,
      clearAll,
      resetNotifications,
    }),
    [
      query,
      auth.status,
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearAll,
      resetNotifications,
    ]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export function useNotifications(): NotificationsContextValue {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error(
      'useNotifications must be used within a NotificationsProvider'
    );
  }
  return context;
}
