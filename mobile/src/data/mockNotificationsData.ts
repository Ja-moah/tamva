/**
 * TAMVA Mock Notifications Data
 *
 * Presentation-grade mock dataset for Karim Salifu.
 * Consistently aligned with existing customer state:
 * - Exactly 5 initial notifications
 * - 2 unread notifications matching HomeHeader badge count (2)
 * - Purely financial data intelligence, consent, protection, and passport lifecycle.
 */

import { NotificationItem } from '../types/notifications';

export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'CalBank consent requires review',
    body: 'Your CalBank connection needs attention before financial data can continue syncing.',
    category: 'consent',
    categoryLabel: 'Consent',
    timestamp: 'Today',
    isRead: false,
    actionRoute: '/(tabs)/consent',
    actionLabel: 'Review Consent',
    institutionName: 'CalBank',
    icon: 'alert-circle',
  },
  {
    id: 'notif-2',
    title: 'Financial Passport share expired',
    body: 'Your Financial Passport share with Accra Properties has expired.',
    category: 'passport',
    categoryLabel: 'Passport',
    timestamp: 'Yesterday',
    isRead: false,
    actionRoute: '/(tabs)/passport',
    actionLabel: 'View Passport',
    icon: 'shield',
  },
  {
    id: 'notif-3',
    title: 'Protection check completed',
    body: 'Your latest consented account data was reviewed for protection signals.',
    category: 'protection',
    categoryLabel: 'Protection',
    timestamp: 'Yesterday',
    isRead: true,
    actionRoute: '/(tabs)/protection',
    actionLabel: 'Check Protection',
    icon: 'check-circle',
  },
  {
    id: 'notif-4',
    title: 'Stanbic account connected',
    body: 'Your Stanbic account is connected and available within your consented data.',
    category: 'account_sync',
    categoryLabel: 'Account Sync',
    timestamp: '2 days ago',
    isRead: true,
    actionRoute: '/(tabs)/consent',
    actionLabel: 'View Connected Accounts',
    institutionName: 'Stanbic Bank',
    icon: 'refresh-cw',
  },
  {
    id: 'notif-5',
    title: 'MTN Mobile Money consent reviewed',
    body: 'Your consented Mobile Money data connection was reviewed.',
    category: 'consent',
    categoryLabel: 'Consent',
    timestamp: '3 days ago',
    isRead: true,
    actionRoute: '/(tabs)/consent',
    actionLabel: 'Review Consent',
    institutionName: 'MTN Mobile Money',
    icon: 'lock',
  },
];
