/**
 * What the app remembers between launches.
 *
 * There is no token to store: the backend uses a cookie session held by the
 * native networking stack, so JavaScript never touches a credential. We keep
 * only a small, non-secret "who signed in last" hint (in SecureStore on native,
 * because it is personal data) so the app can greet the right person while it
 * re-verifies the session with GET /me/. On the web there is no secure store;
 * nothing is persisted there and the browser's own cookie is the whole session.
 */
import { Platform } from 'react-native';

const KEY = 'tamva.session.hint';

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

export const hintStore: HintStore = {
  async read() {
    if (Platform.OS === 'web') return null;
    try {
      const SecureStore = await import('expo-secure-store');
      return parseHint(await SecureStore.getItemAsync(KEY));
    } catch {
      return null;
    }
  },
  async save(hint) {
    if (Platform.OS === 'web') return;
    try {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.setItemAsync(KEY, JSON.stringify(hint));
    } catch {
      // Remembering is a convenience; sign-in works without it.
    }
  },
  async clear() {
    if (Platform.OS === 'web') return;
    try {
      const SecureStore = await import('expo-secure-store');
      await SecureStore.deleteItemAsync(KEY);
    } catch {
      // Nothing to clear.
    }
  },
};
