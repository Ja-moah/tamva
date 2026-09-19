/**
 * TAMVA Financial Profile Data Hook
 *
 * Manages presentation state, refresh simulation, and lifecycle modes
 * (loaded, loading, empty, error) for the Financial Profile screen.
 */

import { useState, useCallback } from 'react';
import { FinancialProfileData, ProfileStateMode } from '../types/profile';
import { mockProfileData } from '../demo/data/mockProfileData';
import { useHaptics } from './useHaptics';

export interface UseFinancialProfileReturn {
  data: FinancialProfileData | null;
  stateMode: ProfileStateMode;
  setStateMode: (mode: ProfileStateMode) => void;
  isRefreshing: boolean;
  handleRefresh: () => Promise<void>;
}

export function useFinancialProfile(
  initialMode: ProfileStateMode = 'loaded'
): UseFinancialProfileReturn {
  const [stateMode, setStateMode] = useState<ProfileStateMode>(initialMode);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const haptics = useHaptics();

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    haptics.lightImpact();

    try {
      // Simulate light local refresh delay
      await new Promise((resolve) => setTimeout(resolve, 800));
      setStateMode('loaded');
      haptics.success();
    } catch {
      setStateMode('error');
      haptics.error();
    } finally {
      setIsRefreshing(false);
    }
  }, [haptics]);

  const getData = (): FinancialProfileData | null => {
    switch (stateMode) {
      case 'loaded':
        return mockProfileData;
      case 'empty':
      case 'loading':
      case 'error':
      default:
        return null;
    }
  };

  return {
    data: getData(),
    stateMode,
    setStateMode,
    isRefreshing,
    handleRefresh,
  };
}
