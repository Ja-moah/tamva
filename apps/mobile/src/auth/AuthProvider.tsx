/**
 * Customer authentication state.
 *
 * Sign-in posts to /auth/login/, then re-reads /me/ and applies the customer
 * policy. A 401 from any later call returns the app to sign-in. Nothing secret
 * is kept in JavaScript or in AsyncStorage.
 */
import { useQueryClient } from '@tanstack/react-query';
import { Platform } from 'react-native';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { getMe, login as apiLogin, logout as apiLogout } from '../api/endpoints';
import { apiClient } from '../api/client';
import { ApiError, describeError } from '../api/errors';
import { evaluateActor, verdictMessage, type CustomerUser } from './policy';
import { hintStore, refreshPersistence, type SessionHint } from './storage';

export type AuthStatus = 'loading' | 'anonymous' | 'authenticated' | 'error';

interface AuthContextValue {
  status: AuthStatus;
  user: CustomerUser | null;
  /** Remembered from the last sign-in, shown while the session is re-verified. */
  hint: SessionHint | null;
  /** Why the last attempt did not sign you in, in plain language. */
  message: string | null;
  signIn: (identifier: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  retry: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [hint, setHint] = useState<SessionHint | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const attempt = useRef(0);

  const clearLocal = useCallback(async () => {
    setUser(null);
    queryClient.clear();
    await apiClient.clearTokens();
    await hintStore.clear();
  }, [queryClient]);

  const verify = useCallback(async () => {
    const mine = ++attempt.current;
    setStatus('loading');
    const remembered = await hintStore.read();
    if (mine === attempt.current) setHint(remembered);
    try {
      // Native: restore the persisted refresh token and mint a fresh access token.
      const restored = await apiClient.restoreSession();
      if (mine !== attempt.current) return;
      if (restored === 'none') {
        setUser(null);
        setStatus('anonymous');
        return;
      }
      if (restored === 'unreachable') {
        setMessage(describeError(new ApiError({ kind: 'network', code: 'network_error', message: 'unreachable' })));
        setStatus('error');
        return;
      }
      const verdict = evaluateActor(await getMe());
      if (mine !== attempt.current) return;
      if (verdict.kind === 'ok') {
        setUser(verdict.user);
        setMessage(null);
        setStatus('authenticated');
      } else {
        setMessage(verdictMessage(verdict));
        await clearLocal();
        setStatus('anonymous');
      }
    } catch (error) {
      if (mine !== attempt.current) return;
      if (error instanceof ApiError && (error.isUnauthenticated || error.isForbidden)) {
        setUser(null);
        setStatus('anonymous');
      } else {
        // Offline or the server is down: don't pretend the session ended.
        setMessage(describeError(error));
        setStatus('error');
      }
    }
  }, [clearLocal]);

  useEffect(() => {
    const timer = setTimeout(() => void verify(), 0);
    return () => clearTimeout(timer);
  }, [verify]);

  useEffect(() => {
    apiClient.setUnauthenticatedHandler(() => {
      setUser(null);
      setStatus('anonymous');
      setMessage('Your session has ended. Please sign in again.');
      queryClient.clear();
    });
    return () => apiClient.setUnauthenticatedHandler(null);
  }, [queryClient]);

  const signIn = useCallback(
    async (identifier: string, password: string) => {
      setMessage(null);
      try {
        await apiLogin(identifier, password, Platform.OS);
        const verdict = evaluateActor(await getMe());
        if (verdict.kind !== 'ok') {
          await apiLogout().catch(() => undefined);
          setMessage(verdictMessage(verdict));
          return false;
        }
        await hintStore.save({ userId: verdict.user.id, email: verdict.user.email, savedAt: new Date().toISOString() });
        queryClient.clear();
        setUser(verdict.user);
        setStatus('authenticated');
        return true;
      } catch (error) {
        setMessage(
          error instanceof ApiError && error.status === 400
            ? "That email or password doesn't match an active account."
            : describeError(error)
        );
        return false;
      }
    },
    [queryClient]
  );

  const signOut = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Sign the device out locally even if the server can't be reached.
    }
    await clearLocal();
    setMessage(null);
    setStatus('anonymous');
  }, [clearLocal]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, hint, message, signIn, signOut, retry: () => void verify() }),
    [status, user, hint, message, signIn, signOut, verify]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside <AuthProvider>');
  return value;
}
