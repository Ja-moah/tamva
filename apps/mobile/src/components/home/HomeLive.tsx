import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getHome } from '../../api/customer';
import { useAuth } from '../../auth/AuthProvider';
import { useTheme } from '../../theme';
import { QueryScreen } from '../live/QueryScreen';
import { fmt, humanize, money, toNumber } from '../live/format';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { ListRow } from '../ui/ListRow';
import { SectionHeader } from '../ui/SectionHeader';

/** Home: every figure is a trusted backend summary; nothing is computed or estimated here. */
export function HomeLive() {
  const { theme } = useTheme();
  const router = useRouter();
  const auth = useAuth();
  const query = useQuery({ queryKey: ['customer-home'], queryFn: ({ signal }) => getHome(signal) });

  return (
    <QueryScreen title="Home" subtitle={auth.user?.email} query={query}>
      {(home) => {
        const fc = home.financial_confidence;
        const score = toNumber(fc?.score);
        const inflows = Object.entries(home.activity_30d.inflow_by_currency);
        const outflows = Object.entries(home.activity_30d.outflow_by_currency);
        return (
          <>
            <Card onPress={() => router.push('/confidence')} accessibilityLabel="Financial Confidence. Open details.">
              <Text style={[theme.typography.overline, { color: theme.colors.textTertiary }]}>FINANCIAL CONFIDENCE</Text>
              {fc && score !== null ? (
                <>
                  <View style={styles.scoreRow}>
                    <Text style={[theme.typography.display, { color: theme.colors.textPrimary }]}>{fmt.number(score, 0)}</Text>
                    <Text style={[theme.typography.bodySm, { color: theme.colors.textTertiary }]}> / {fc.scale.max}</Text>
                    <Badge label={humanize(fc.band)} tone="success" style={styles.badge} />
                  </View>
                  <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                    Based on data from {fc.institution_name} · updated {fmt.date(fc.as_of)}. {fc.scale.note}
                  </Text>
                </>
              ) : (
                <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary }]}>
                  Not enough verified data yet. Connect an account you&apos;ve consented to share to build it.
                </Text>
              )}
            </Card>

            <SectionHeader title="Last 30 days" subtitle="Observed movement on accounts you have connected. This is not a balance." />
            <Card>
              {home.activity_30d.transaction_count === 0 ? (
                <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary }]}>No activity yet.</Text>
              ) : (
                <>
                  {inflows.map(([currency, amount]) => (
                    <ListRow key={`in-${currency}`} title="Money in" rightText={money(amount, currency)} showDivider={false} />
                  ))}
                  {outflows.map(([currency, amount]) => (
                    <ListRow key={`out-${currency}`} title="Money out" rightText={money(amount, currency)} showDivider={false} />
                  ))}
                  <ListRow
                    title={`${home.activity_30d.transaction_count} transactions`}
                    showChevron
                    onPress={() => router.push('/(tabs)/activity')}
                    showDivider={false}
                  />
                </>
              )}
            </Card>

            <Card padding="none">
              <ListRow
                title="Accounts"
                subtitle={
                  home.connections.total === 0
                    ? 'None connected'
                    : `${home.connections.active} active${home.connections.needs_attention ? ` · ${home.connections.needs_attention} need attention` : ''}`
                }
                leftIcon="link"
                showChevron
                onPress={() => router.push('/accounts')}
              />
              <ListRow
                title="Data sharing"
                subtitle={`${home.consents.active} active${home.consents.expiring_within_30_days ? ` · ${home.consents.expiring_within_30_days} expiring soon` : ''}`}
                leftIcon="lock"
                showChevron
                onPress={() => router.push('/(tabs)/consent')}
              />
              <ListRow
                title="Financial Passport"
                subtitle={`${home.passport.active_shares} active share${home.passport.active_shares === 1 ? '' : 's'}`}
                leftIcon="shield"
                showChevron
                onPress={() => router.push('/(tabs)/passport')}
              />
              <ListRow
                title="Protection"
                subtitle={home.protection.events_30d === 0 ? 'No new signals' : `${home.protection.events_30d} signals in 30 days`}
                leftIcon="alert-circle"
                badge={home.protection.high_or_critical_30d > 0 ? { label: 'Review', tone: 'warning' } : undefined}
                showChevron
                onPress={() => router.push('/(tabs)/protection')}
              />
              <ListRow
                title="Notifications"
                subtitle={home.notifications.unread > 0 ? `${home.notifications.unread} unread` : 'All caught up'}
                leftIcon="bell"
                showChevron
                onPress={() => router.push('/notifications')}
                showDivider={false}
              />
            </Card>
          </>
        );
      }}
    </QueryScreen>
  );
}

const styles = StyleSheet.create({
  scoreRow: { flexDirection: 'row', alignItems: 'baseline', marginVertical: 6 },
  badge: { marginLeft: 12 },
});
