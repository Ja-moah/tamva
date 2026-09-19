/**
 * TAMVA Home Screen Data Hook
 *
 * Encapsulates state management for the Home screen.
 * Seamlessly manages loaded, loading, error, and empty states.
 * Ready for drop-in replacement with real React Query / TanStack query later.
 */

import { useState, useEffect, useCallback } from 'react';
import { HomeScreenData } from '../types/home';
import { mockHomeData, mockEmptyHomeData } from '../demo/data/mockHomeData';
import { useNotifications } from '../context/NotificationsContext';

export type ScreenStateMode = 'loaded' | 'loading' | 'error' | 'empty';

export interface UseHomeDataReturn {
  data: HomeScreenData | null;
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  errorMessage: string | null;
  status: ScreenStateMode;
  refresh: () => Promise<void>;
  setStatus: (status: ScreenStateMode) => void;
}

export function useHomeData(initialState: ScreenStateMode = 'loaded'): UseHomeDataReturn {
  const [status, setStatus] = useState<ScreenStateMode>(initialState);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { unreadCount } = useNotifications();

  const refresh = useCallback(async () => {
    setStatus('loading');
    setErrorMessage(null);
    try {
      // Simulate light async network roundtrip
      await new Promise((resolve) => setTimeout(resolve, 600));
      setStatus('loaded');
    } catch {
      setStatus('error');
      setErrorMessage('Unable to retrieve latest financial intelligence. Please check connection.');
    }
  }, []);

  const getData = (): HomeScreenData | null => {
    switch (status) {
      case 'loaded':
        return {
          ...mockHomeData,
          user: {
            ...mockHomeData.user,
            unreadNotificationsCount: unreadCount,
          },
        };
      case 'empty':
        return mockEmptyHomeData;
      case 'loading':
      case 'error':
      default:
        return null;
    }
  };

  return {
    data: getData(),
    isLoading: status === 'loading',
    isError: status === 'error',
    isEmpty: status === 'empty',
    errorMessage: status === 'error' ? (errorMessage || 'Failed to fetch financial data.') : null,
    status,
    refresh,
    setStatus,
  };
}
