/**
 * TAMVA Financial Protection Hook
 *
 * Manages presentation state, refresh simulation, lifecycle modes
 * (loaded, loading, empty, error), and controlled demonstration scenarios
 * (healthy, attention, disconnected, limited, unavailable) for Financial Protection.
 */

import { useState, useCallback } from 'react';
import {
  FinancialProtection,
  ProtectionStateMode,
  ProtectionScenario,
} from '../types/protection';
import {
  mockProtectionScenarios,
} from '../demo/data/mockProtectionData';
import { useHaptics } from './useHaptics';

export interface UseFinancialProtectionReturn {
  data: FinancialProtection | null;
  stateMode: ProtectionStateMode;
  setStateMode: (mode: ProtectionStateMode) => void;
  scenario: ProtectionScenario;
  setScenario: (scenario: ProtectionScenario) => void;
  isRefreshing: boolean;
  handleRefresh: () => Promise<void>;
}

export function useFinancialProtection(
  initialMode: ProtectionStateMode = 'loaded',
  initialScenario: ProtectionScenario = 'healthy'
): UseFinancialProtectionReturn {
  const [stateMode, setStateMode] = useState<ProtectionStateMode>(initialMode);
  const [scenario, setScenario] = useState<ProtectionScenario>(initialScenario);
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

  const getData = (): FinancialProtection | null => {
    switch (stateMode) {
      case 'loaded':
        return mockProtectionScenarios[scenario] || mockProtectionScenarios.healthy;
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
    scenario,
    setScenario,
    isRefreshing,
    handleRefresh,
  };
}
