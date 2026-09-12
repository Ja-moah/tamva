import * as SecureStore from "expo-secure-store";

const sessionKey = "tamva.session";

export function readSession(): Promise<string | null> {
  return SecureStore.getItemAsync(sessionKey);
}

export function saveSession(session: string): Promise<void> {
  return SecureStore.setItemAsync(sessionKey, session);
}

export function clearSession(): Promise<void> {
  return SecureStore.deleteItemAsync(sessionKey);
}
