/**
 * TAMVA Mock Notifications Data
 *
 * Presentation-grade mock dataset for Karim Salifu.
 * Consistently aligned with existing customer state:
 * - Exactly 5 initial notifications
 * - 2 unread notifications matching HomeHeader badge count (2)
 * - Purely financial data intelligence, consent, protection, and passport lifecycle.
 */

import { NotificationItem } from '../../types/notifications';

export const mockNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'CalBank consent requires review',
    body: 'Your CalBank connection needs attention before financial data can continue syncing.',
    category: 'consent',
    categoryLabel: 'Consent',
    timestamp: 'Today',
    receivedDate: 'Today at 09:15 GMT',
    isRead: false,
    actionRoute: '/(tabs)/consent',
    actionLabel: 'Review in Connected Accounts',
    institutionName: 'CalBank',
    relatedAccount: 'CalBank High-Yield Vault ••1092',
    whatThisMeans:
      'Your periodic 90-day consent token for CalBank has reached its scheduled review window. Until re-consented, fresh balance and transaction data cannot be synchronized.',
    icon: 'alert-circle',
  },
  {
    id: 'notif-2',
    title: 'Financial Passport share expired',
    body: 'Your Financial Passport share with Accra Properties has expired.',
    category: 'passport',
    categoryLabel: 'Passport',
    timestamp: 'Yesterday',
    receivedDate: 'Yesterday at 16:40 GMT',
    isRead: false,
    actionRoute: '/(tabs)/passport',
    actionLabel: 'View Financial Passport',
    relatedAccount: 'Recipient: Accra Properties Ltd',
    whatThisMeans:
      'The time-bounded consent granted to Accra Properties Ltd has reached its 30-day expiry limit. Their access to your shared financial metrics is now automatically revoked.',
    icon: 'shield',
  },
  {
    id: 'notif-3',
    title: 'Protection check completed',
    body: 'Your latest consented account data was reviewed for protection signals.',
    category: 'protection',
    categoryLabel: 'Protection',
    timestamp: 'Yesterday',
    receivedDate: 'Yesterday at 11:00 GMT',
    isRead: true,
    actionRoute: '/(tabs)/protection',
    actionLabel: 'View Financial Protection',
    relatedAccount: '4 monitored institutions',
    whatThisMeans:
      'TAMVA completed a protection-data check across your connected accounts using the latest consented financial data available to TAMVA.',
    icon: 'check-circle',
  },
  {
    id: 'notif-4',
    title: 'Stanbic account connected',
    body: 'Your Stanbic account is connected and available within your consented data.',
    category: 'account_sync',
    categoryLabel: 'Account Sync',
    timestamp: '2 days ago',
    receivedDate: '13 Sep 2026, 10:22 GMT',
    isRead: true,
    actionRoute: '/(tabs)/consent',
    actionLabel: 'View Connected Accounts',
    institutionName: 'Stanbic Bank',
    relatedAccount: 'Stanbic Executive Current ••4821',
    whatThisMeans:
      'Your consented Stanbic Bank Ghana account connection was completed. Available account and transaction data can now contribute to your TAMVA financial profile.',
    icon: 'refresh-cw',
  },
  {
    id: 'notif-5',
    title: 'MTN Mobile Money consent reviewed',
    body: 'Your consented Mobile Money data connection was reviewed.',
    category: 'consent',
    categoryLabel: 'Consent',
    timestamp: '3 days ago',
    receivedDate: '12 Sep 2026, 08:30 GMT',
    isRead: true,
    actionRoute: '/(tabs)/consent',
    actionLabel: 'View Consent Settings',
    institutionName: 'MTN Mobile Money',
    relatedAccount: 'MTN MoMo Wallet ••9412',
    whatThisMeans:
      'Your Mobile Money consent was reviewed and remains active. Available consented account data can continue contributing to your TAMVA financial picture.',
    icon: 'lock',
  },
];
