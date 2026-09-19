import type { NotificationItem as ApiNotification } from '@tamva/client-contracts';

import type { Formatters } from '../i18n/format';
import type { NotificationItem } from '../types/notifications';

const KNOWN: NotificationItem['category'][] = ['consent', 'protection', 'account_sync', 'passport'];

/**
 * Backend notification -> the customer app's presentation model.
 * The backend sends its own category codes (e.g. "CASE"); only the ones the app
 * has a design for are mapped and everything else is "other". Nothing is invented.
 */
export function mapNotification(item: ApiNotification, formatter: Formatters): NotificationItem {
  const lowered = item.category.toLowerCase();
  const category = (KNOWN as string[]).includes(lowered) ? (lowered as NotificationItem['category']) : 'other';
  return {
    id: item.id,
    title: item.subject,
    body: item.body,
    category,
    categoryLabel: item.category.replaceAll('_', ' ').toLowerCase().replace(/^./, (c) => c.toUpperCase()),
    timestamp: formatter.relative(item.created_at),
    receivedDate: formatter.dateTime(item.created_at),
    isRead: item.read_at !== null,
    icon: category === 'consent' ? 'lock' : category === 'passport' ? 'shield' : 'bell',
  };
}
