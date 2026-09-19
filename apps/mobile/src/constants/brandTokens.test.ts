import { roles, teal } from '@tamva/brand';
import { describe, expect, it } from 'vitest';

import { Colors } from './tokens';

describe('Mobile colours come from the shared brand tokens', () => {
  it('uses deep teal as the light-theme primary', () => {
    expect(Colors.primary).toBe(roles.light.primary);
    expect(Colors.primary).toBe(teal[600]);
    expect(Colors.primaryDark).toBe(teal[700]);
  });

  it('takes semantic colours from the shared families', () => {
    expect(Colors.warningDark).toBeDefined();
    expect(Colors.dangerDark).toBeDefined();
  });
});
