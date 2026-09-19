import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { listConsents } from '../../api/endpoints';
import { useAuth } from '../../auth/AuthProvider';
import { useNotifications } from '../../context/NotificationsContext';
import { useCapabilities } from '../../features/capabilities';
import { useFormatters } from '../../i18n/useFormatters';
import { useTheme } from '../../theme';
import { Card } from '../ui/Card';
import { ListRow } from '../ui/ListRow';
import { ScreenHeader } from '../ui/ScreenHeader';
import { SectionHeader } from '../ui/SectionHeader';

/**
 * Home when the backend has no customer dashboard yet: only what is real —
 * notifications and consent — plus a plain list of what is still to come.
 * No balances, scores or activity are shown or estimated.
 */
export function HomeLive() {
  const { theme } = useTheme();
  const router = useRouter();
  const auth = useAuth();
  const format = useFormatters();
  const { unreadCount, refresh: refreshNotifications, isRefreshing } = useNotifications();
  const capabilities = useCapabilities();
  const consents = useQuery({
    queryKey: ['customer-consents'],
    queryFn: ({ signal }) => listConsents(signal),
  });

  const active = (consents.data?.results ?? []).filter((c) => c.status === 'GRANTED');
  const soonest = active.map((c) => c.expires_at).sort()[0];
  const upcoming = [
    ['customer_financial_confidence', 'Financial Confidence'],
    ['customer_financial_profile', 'Financial Profile'],
    ['customer_activity', 'Activity'],
    ['customer_passport', 'Financial Passport'],
    ['customer_protection', 'Protection'],
  ].filter(([code]) => (capabilities.data?.[code] ?? 'NOT_AVAILABLE') !== 'AVAILABLE');

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Home" subtitle={auth.user?.email} />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing || consents.isRefetching}
            onRefresh={() => {
              refreshNotifications();
              void consents.refetch();
            }}
          />
        }
      >
        <Card padding="none">
          <ListRow
            title="Notifications"
            subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'You are all caught up'}
            leftIcon="bell"
            showChevron
            onPress={() => router.push('/notifications')}
          />
          <ListRow
            title="Data sharing"
            subtitle={
              consents.isError
                ? 'Unable to load right now'
                : consents.isPending
                  ? 'Loading…'
                  : active.length === 0
                    ? 'No active consents'
                    : `${active.length} active · next expires ${format.date(soonest)}`
            }
            leftIcon="lock"
            showChevron
            onPress={() => router.push('/(tabs)/consent')}
            showDivider={false}
          />
        </Card>

        {upcoming.length > 0 ? (
          <>
            <SectionHeader
              title="Still to come"
              subtitle="These parts of TAMVA are not connected to your data yet, so nothing is shown for them."
            />
            <Card>
              {upcoming.map(([code, label]) => (
                <View key={code} style={styles.upcomingRow} accessible accessibilityLabel={`${label}: not available yet`}>
                  <Text style={[theme.typography.bodySm, { color: theme.colors.textPrimary }]}>{label}</Text>
                  <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>Not available yet</Text>
                </View>
              ))}
            </Card>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 8, paddingBottom: 48 },
  upcomingRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
});
