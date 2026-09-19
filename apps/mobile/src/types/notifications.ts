/**
 * TAMVA Notification Types
 *
 * Domain models for customer-facing notification center:
 * categories, notification items, and filter states.
 */

import { FeatherIconName } from '../constants/icons';

/**
 * Valid customer-facing notification categories.
 * Strict constraint: Only financial data, consent, protection, and passport lifecycle.
 * TAMVA is NOT a bank or wallet; no money-transfer or payment categories.
 */
export type NotificationCategory =
  | 'consent'
  | 'protection'
  | 'account_sync'
  | 'passport'
  | 'other';

/**
 * Filter chip keys available in the Notification Center.
 */
export type NotificationFilter =
  | 'all'
  | 'unread'
  | 'consent'
  | 'protection'
  | 'passport';

/**
 * Individual customer notification item.
 */
export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory;
  categoryLabel: string;
  timestamp: string;
  isRead: boolean;
  actionRoute?: string;
  actionLabel?: string;
  institutionName?: string;
  icon: FeatherIconName;
  whatThisMeans?: string;
  relatedAccount?: string;
  receivedDate?: string;
}
