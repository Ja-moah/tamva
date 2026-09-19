import { useIsFetching, useQueryClient } from '@tanstack/react-query';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

import { ApiError } from '../../api/errors';
import { useTheme } from '../../theme';

/**
 * Appears when the most recent request failed for connectivity reasons, and
 * offers a retry. Driven by real request outcomes rather than a polled flag, so
 * it reflects whether TAMVA can actually be reached.
 */
export const OfflineBanner: React.FC = () => {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const fetching = useIsFetching();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const cache = queryClient.getQueryCache();
    return cache.subscribe(() => {
      const failed = cache.getAll().some((q) => q.state.status === 'error' && q.state.error instanceof ApiError && q.state.error.isConnectivity);
      const recovered = cache.getAll().some((q) => q.state.status === 'success' && q.state.dataUpdatedAt > Date.now() - 5_000);
      setOffline(failed && !recovered);
    });
  }, [queryClient]);

  if (!offline) return null;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="You appear to be offline. Tap to retry."
      onPress={() => void queryClient.refetchQueries({ type: 'active' })}
      style={[styles.bar, { backgroundColor: theme.colors.warningLight }]}
    >
      <Text style={[theme.typography.captionMedium, { color: theme.colors.warningText }]}>
        {fetching > 0 ? 'Reconnecting…' : "You're offline. Showing what was last loaded. Tap to retry."}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({ bar: { alignItems: 'center', paddingVertical: 6, paddingHorizontal: 12 } });
