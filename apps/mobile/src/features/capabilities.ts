import type { CapabilityState } from '@tamva/client-contracts';
import { useQuery } from '@tanstack/react-query';

import { getCapabilities } from '../api/endpoints';
import { useAuth } from '../auth/AuthProvider';

export function useCapabilities() {
  const { status } = useAuth();
  return useQuery({
    queryKey: ['capabilities'],
    queryFn: ({ signal }) => getCapabilities(signal),
    enabled: status === 'authenticated',
    staleTime: 5 * 60_000,
  });
}

/** Unknown or unloaded capabilities are treated as unavailable. */
export function useCapabilityState(code: string): { state: CapabilityState; isLoading: boolean } {
  const { data, isPending } = useCapabilities();
  return { state: data?.[code] ?? 'NOT_AVAILABLE', isLoading: isPending };
}

export { resolveAvailability } from './availability';
