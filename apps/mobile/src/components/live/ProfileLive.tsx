import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { Text } from 'react-native';

import { getProfile } from '../../api/customer';
import { useTheme } from '../../theme';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { ListRow } from '../ui/ListRow';
import { SectionHeader } from '../ui/SectionHeader';
import { QueryScreen } from './QueryScreen';
import { fmt, humanize, numText, toNumber } from './format';

/** Financial Profile: only what the backend computed; unsupported dimensions are stated, not estimated. */
export function ProfileLive() {
  const { theme } = useTheme();
  const router = useRouter();
  const query = useQuery({ queryKey: ['customer-profile'], queryFn: ({ signal }) => getProfile(signal) });

  return (
    <QueryScreen title="Financial Profile" subtitle="Built from accounts you've connected" query={query}>
      {({ institutions }) =>
        institutions.length === 0 ? (
          <EmptyState
            icon="user"
            title="No profile yet"
            description="Your profile is built once an account you've consented to share has data. Not enough verified data yet."
          />
        ) : (
          <>
            <Card onPress={() => router.push('/confidence')} accessibilityLabel="Open Financial Confidence">
              <Text style={[theme.typography.bodyMedium, { color: theme.colors.textPrimary }]}>Financial Confidence</Text>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                See the score, what it&apos;s based on, and how it changes.
              </Text>
            </Card>
            {institutions.map((p) => (
                <React.Fragment key={p.id}>
                  <SectionHeader title={p.institution_name} subtitle={`As of ${fmt.date(p.as_of)} · data confidence ${humanize(p.data_confidence)}`} />
                  <Card padding="none">
                    <ListRow
                      title="Account coverage"
                      subtitle={`${p.covered_account_count} of ${p.account_count} accounts have data`}
                      rightText={`${fmt.number((toNumber(p.coverage_ratio) ?? 0) * 100, 0)}%`}
                    />
                    {p.cash_flow ? (
                      <>
                        <ListRow title="Money in" rightText={numText(p.cash_flow.total_inflows, 2)} />
                        <ListRow title="Money out" rightText={numText(p.cash_flow.total_outflows, 2)} />
                        <ListRow title="Net cash flow" subtitle={`${p.cash_flow.transaction_count} transactions`} rightText={numText(p.cash_flow.net_cash_flow, 2)} />
                      </>
                    ) : null}
                    {p.income ? (
                      <ListRow title="Estimated income" subtitle={`Method: ${humanize(p.income.methodology)}`} rightText={numText(p.income.estimated_total, 2)} />
                    ) : null}
                    {p.savings ? (
                      <ListRow
                        title="Savings rate"
                        rightText={`${fmt.number((toNumber(p.savings.savings_rate) ?? 0) * 100, 1)}%`}
                        showDivider={false}
                      />
                    ) : null}
                  </Card>
                  <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>
                    Amounts are in each account&apos;s own currency. Not enough verified data yet for: {p.not_available.map(humanize).join(', ').toLowerCase()}.
                  </Text>
                </React.Fragment>
            ))}
          </>
        )
      }
    </QueryScreen>
  );
}
