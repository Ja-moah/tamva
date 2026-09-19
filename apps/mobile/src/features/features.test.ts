import { describe, expect, it } from 'vitest';

import { describeError, ApiError } from '../api/errors';
import { makeFormatters } from '../i18n/format';
import { resolveAvailability } from './availability';
import { mapNotification } from './notificationMapping';

const base = {
  id: 'n1',
  category: 'CASE',
  channel: 'IN_APP',
  subject: 'Review needed',
  body: 'A check on your data needs a look.',
  status: 'SENT',
  read_at: null,
  created_at: '2026-09-18T10:00:00Z',
};

describe('screen availability', () => {
  it('shows real data only when the capability is available AND the app has wired it', () => {
    expect(resolveAvailability('AVAILABLE', true)).toBe('live');
    expect(resolveAvailability('PARTIAL', true)).toBe('partial');
    expect(resolveAvailability('NOT_AVAILABLE', true)).toBe('unavailable');
    expect(resolveAvailability('DISABLED', true)).toBe('unavailable');
    // A backend that later reports AVAILABLE must not light up code that was never wired.
    expect(resolveAvailability('AVAILABLE', false)).toBe('unavailable');
  });
});

describe('notification mapping', () => {
  const fmt = makeFormatters('en', 'UTC');

  it('maps unknown backend categories to "other" instead of mislabelling them', () => {
    const item = mapNotification(base, fmt);
    expect(item.category).toBe('other');
    expect(item.categoryLabel).toBe('Case');
    expect(item.isRead).toBe(false);
    expect(item.title).toBe('Review needed');
  });

  it('recognises designed categories regardless of case', () => {
    expect(mapNotification({ ...base, category: 'CONSENT' }, fmt).category).toBe('consent');
    expect(mapNotification({ ...base, category: 'Passport' }, fmt).category).toBe('passport');
  });

  it('reads read state from the backend timestamp', () => {
    expect(mapNotification({ ...base, read_at: '2026-09-18T11:00:00Z' }, fmt).isRead).toBe(true);
  });
});

describe('customer-safe error text', () => {
  const http = (status: number) =>
    new ApiError({ kind: 'http', status, code: 'x', message: 'raw server detail' });

  it('never leaks server detail for server faults or auth problems', () => {
    expect(describeError(http(500))).not.toContain('raw server detail');
    expect(describeError(http(401))).toMatch(/sign in again/i);
  });

  it('distinguishes offline from timeouts', () => {
    expect(describeError(new ApiError({ kind: 'network', code: 'n', message: 'x' }))).toMatch(/offline/i);
    expect(describeError(new ApiError({ kind: 'timeout', code: 't', message: 'x' }))).toMatch(/too long/i);
  });
});
