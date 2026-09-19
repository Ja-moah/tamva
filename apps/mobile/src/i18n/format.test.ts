import { describe, expect, it } from 'vitest';

import { makeFormatters } from './format';

describe('customer formatting', () => {
  it('keeps the record currency and never converts an amount', () => {
    const format = makeFormatters('en-GH', 'UTC');
    expect(format.money(12.5, 'GHS')).toContain('12.50');
    expect(format.money(12.5, 'USD')).toContain('$');
  });

  it('returns a safe placeholder for invalid dates', () => {
    expect(makeFormatters('en', 'UTC').date('not-a-date')).toBe('—');
  });
});
