/**
 * What survives an app restart.
 *
 * The refresh token is the only credential kept, and only on native, in
 * SecureStore (Keychain / Keystore). The access token is never persisted. On the
 * web there is no secure store, so nothing is persisted and a reload signs out.
 * A small non-secret "who signed in last" hint is kept alongside it so the app can
 * greet the right person while the session is restored.
 */
import { Platform } from 'react-native';

import type { RefreshPersistence } from '../api/client';

const REFRESH_KEY = 'tamva.auth.refresh';
const HINT_KEY = 'tamva.session.hint';

export interface SessionHint {
  userId: string;
  email: string;
  savedAt: string;
}

export interface HintStore {
  read(): Promise<SessionHint | null>;
  save(hint: SessionHint): Promise<void>;
  clear(): Promise<void>;
}

export function parseHint(raw: string | null): SessionHint | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<SessionHint>;
    return typeof value.userId === 'string' && typeof value.email === 'string'
      ? { userId: value.userId, email: value.email, savedAt: String(value.savedAt ?? '') }
      : null;
  } catch {
    return null;
  }
}

async function store() {
  return import('expo-secure-store');
}

const native = Platform.OS !== 'web';

export const refreshPersistence: RefreshPersistence = {
  async read() {
    if (!native) return null;
    return (await store()).getItemAsync(REFRESH_KEY);
  },
  async write(token) {
    if (!native) return;
    await (await store()).setItemAsync(REFRESH_KEY, token);
  },
  async clear() {
    if (!native) return;
    await (await store()).deleteItemAsync(REFRESH_KEY);
  },
};

export const hintStore: HintStore = {
  async read() {
    if (!native) return null;
    try {
      return parseHint(await (await store()).getItemAsync(HINT_KEY));
    } catch {
      return null;
    }
  },
  async save(hint) {
    if (!native) return;
    try {
      await (await store()).setItemAsync(HINT_KEY, JSON.stringify(hint));
    } catch {
      // Remembering is a convenience; sign-in works without it.
    }
  },
  async clear() {
    if (!native) return;
    try {
      await (await store()).deleteItemAsync(HINT_KEY);
    } catch {
      // Nothing to clear.
    }
  },
};
