/**
 * TAMVA Risk Overview Hook
 *
 * Manages presentation state, refresh simulation, and lifecycle modes
 * (loaded, loading, empty, error) for the Risk Overview feature (Phase 8A).
 */

import { useState, useCallback } from 'react';
import { RiskAssessment, RiskStateMode } from '../types/risk';
import {
  mockRiskAssessment,
  mockLimitedRiskAssessment,
  mockUnavailableRiskAssessment,
} from '../demo/data/mockRiskData';
import { useHaptics } from './useHaptics';

export interface UseRiskOverviewReturn {
  data: RiskAssessment | null;
  stateMode: RiskStateMode;
  setStateMode: (mode: RiskStateMode) => void;
  isRefreshing: boolean;
  handleRefresh: () => Promise<void>;
}

export function useRiskOverview(
  initialMode: RiskStateMode = 'loaded'
): UseRiskOverviewReturn {
  const [stateMode, setStateMode] = useState<RiskStateMode>(initialMode);
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

  const getData = (): RiskAssessment | null => {
    switch (stateMode) {
      case 'loaded':
        return mockRiskAssessment;
      case 'limited':
        return mockLimitedRiskAssessment;
      case 'unavailable':
        return mockUnavailableRiskAssessment;
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
