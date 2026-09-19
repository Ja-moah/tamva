/**
 * Shared frame for live screens: header, pull-to-refresh, and distinct loading,
 * error (with retry) and content states. Errors are shown in plain language and
 * are never replaced by empty or success states.
 */
import type { UseQueryResult } from '@tanstack/react-query';
import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { describeError } from '../../api/errors';
import { useTheme } from '../../theme';
import { ErrorState } from '../ui/ErrorState';
import { ScreenHeader } from '../ui/ScreenHeader';

export function QueryScreen<T>({
  title,
  subtitle,
  showBack,
  query,
  children,
  headerRight,
}: {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  query: UseQueryResult<T>;
  children: (data: T) => React.ReactNode;
  headerRight?: React.ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title={title} subtitle={subtitle} showBack={showBack} rightElement={headerRight} borderBottom />
      {query.isPending ? (
        <View style={styles.center} accessibilityRole="progressbar" accessibilityLabel={`Loading ${title}`}>
          <ActivityIndicator color={theme.colors.primary} />
        </View>
      ) : query.isError && !query.data ? (
        <View style={styles.center}>
          <ErrorState
            title={`Unable to load ${title.toLowerCase()}`}
            message={describeError(query.error)}
            onRetry={() => void query.refetch()}
            retryLabel="Try again"
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}
        >
          {children(query.data as T)}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 12, paddingBottom: 64 },
});
