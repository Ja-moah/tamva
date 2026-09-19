import type { ActorContext } from '@tamva/client-contracts';
import { describe, expect, it } from 'vitest';

import { evaluateActor } from './policy';

const actor = (actorType: string, status = 'ACTIVE'): ActorContext => ({
  user: { id: 'user-1', email: 'customer@example.test', actor_type: actorType, status },
  tenant: null,
  memberships: [],
  roles: [],
  permissions: [],
});

describe('customer actor policy', () => {
  it('accepts only active customer identities', () => {
    expect(evaluateActor(actor('CUSTOMER'))).toEqual({
      kind: 'ok',
      user: { id: 'user-1', email: 'customer@example.test' },
    });
    expect(evaluateActor(actor('PARTNER_USER'))).toEqual({ kind: 'not_customer' });
    expect(evaluateActor(actor('CUSTOMER', 'SUSPENDED'))).toEqual({ kind: 'disabled' });
  });
});
