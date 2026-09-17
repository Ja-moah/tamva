/**
 * TAMVA Notifications Context
 *
 * Provides application-wide state for customer notifications,
 * unread count synchronization, and mark-as-read mutations.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { NotificationItem } from '../types/notifications';
import { mockNotifications } from '../data/mockNotificationsData';

interface NotificationsContextValue {
  notifications: NotificationItem[];
  unreadCount: number;
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
  const [notifications, setNotifications] = useState<NotificationItem[]>(
    initialNotifications
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications]
  );

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((item) => (item.isRead ? item : { ...item, isRead: true }))
    );
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const resetNotifications = useCallback(() => {
    setNotifications(mockNotifications);
  }, []);

  const value = useMemo(
    () => ({
      notifications,
      unreadCount,
      markAsRead,
      markAllAsRead,
      clearAll,
      resetNotifications,
    }),
    [
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
