import { useInfiniteQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TextInput, View } from 'react-native';

import { listActivity } from '../../api/customer';
import { describeError } from '../../api/errors';
import { useTheme } from '../../theme';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { ScreenHeader } from '../ui/ScreenHeader';
import { fmt, humanize, money } from './format';

const DIRECTIONS = [
  { key: '', label: 'All' },
  { key: 'CREDIT', label: 'Money in' },
  { key: 'DEBIT', label: 'Money out' },
];

/** The customer's canonical transactions, with server-side search, filter and paging. */
export function ActivityLive() {
  const { theme } = useTheme();
  const [direction, setDirection] = useState('');
  const [search, setSearch] = useState('');
  const [submitted, setSubmitted] = useState('');

  const query = useInfiniteQuery({
    queryKey: ['customer-activity', direction, submitted],
    initialPageParam: 1,
    queryFn: ({ pageParam, signal }) =>
      listActivity({ page: pageParam, page_size: 25, direction, search: submitted }, signal),
    getNextPageParam: (last, pages) => (last.next ? pages.length + 1 : undefined),
  });
  const rows = query.data?.pages.flatMap((page) => page.results) ?? [];

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Activity" subtitle="Transactions from your connected accounts" />
      <View style={styles.filters}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={() => setSubmitted(search.trim())}
          returnKeyType="search"
          placeholder="Search by name or category"
          placeholderTextColor={theme.colors.textTertiary}
          accessibilityLabel="Search activity"
          style={[styles.search, { borderColor: theme.colors.border, color: theme.colors.textPrimary, backgroundColor: theme.colors.surface }]}
        />
        <View style={styles.chips}>
          {DIRECTIONS.map((d) => (
            <Chip key={d.key} label={d.label} selected={direction === d.key} onPress={() => setDirection(d.key)} />
          ))}
        </View>
      </View>
      {query.isPending ? (
        <View style={styles.center}><ActivityIndicator color={theme.colors.primary} /></View>
      ) : query.isError && rows.length === 0 ? (
        <View style={styles.center}>
          <ErrorState title="Unable to load activity" message={describeError(query.error)} onRetry={() => void query.refetch()} retryLabel="Try again" />
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={query.isRefetching && !query.isFetchingNextPage} onRefresh={() => void query.refetch()} />}
          ListEmptyComponent={
            <EmptyState
              icon="activity"
              title="No activity to show"
              description={submitted || direction ? 'Nothing matches these filters.' : 'Transactions from accounts you connect will appear here.'}
            />
          }
          renderItem={({ item }) => (
            <View
              style={[styles.row, { borderBottomColor: theme.colors.border }]}
              accessible
              accessibilityLabel={`${item.direction === 'CREDIT' ? 'Money in' : 'Money out'} ${money(item.amount, item.currency)}, ${item.counterparty || humanize(item.type)}, ${fmt.date(item.occurred_at)}`}
            >
              <View style={styles.rowMain}>
                <Text style={[theme.typography.bodyMedium, { color: theme.colors.textPrimary }]} numberOfLines={1}>
                  {item.counterparty || humanize(item.type)}
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>
                  {[item.category && humanize(item.category), item.institution_name, item.account].filter(Boolean).join(' · ')}
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>{fmt.dateTime(item.occurred_at)}</Text>
              </View>
              <Text
                style={[theme.typography.numeric, { color: item.direction === 'CREDIT' ? theme.colors.income : theme.colors.textPrimary }]}
              >
                {item.direction === 'CREDIT' ? '+' : '−'}{money(item.amount, item.currency)}
              </Text>
            </View>
          )}
          ListFooterComponent={
            query.hasNextPage ? (
              <View style={styles.more}>
                <Button label="Load more" variant="secondary" loading={query.isFetchingNextPage} onPress={() => void query.fetchNextPage()} />
              </View>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  filters: { padding: 16, gap: 10 },
  search: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15 },
  chips: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  list: { paddingHorizontal: 16, paddingBottom: 48 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  rowMain: { flex: 1 },
  more: { paddingVertical: 16 },
});
