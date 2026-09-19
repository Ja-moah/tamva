import type { ActorContext } from '@tamva/client-contracts';

export interface CustomerUser {
  id: string;
  email: string;
}

export type ActorVerdict =
  | { kind: 'ok'; user: CustomerUser }
  | { kind: 'not_customer' }
  | { kind: 'disabled' };

/**
 * This app is for customers. An institution operator who signs in here is told
 * where to go instead of being shown an empty customer app, and an account the
 * backend has suspended or deactivated is refused even if a session still exists.
 */
export function evaluateActor(actor: ActorContext): ActorVerdict {
  if (actor.user.status !== 'ACTIVE') return { kind: 'disabled' };
  if (actor.user.actor_type !== 'CUSTOMER') return { kind: 'not_customer' };
  return { kind: 'ok', user: { id: actor.user.id, email: actor.user.email } };
}

export function verdictMessage(verdict: ActorVerdict): string | null {
  if (verdict.kind === 'not_customer') {
    return 'This app is for TAMVA customers. Institution staff should use the TAMVA console.';
  }
  if (verdict.kind === 'disabled') {
    return 'This account is not active. Contact your institution for help.';
  }
  return null;
}
