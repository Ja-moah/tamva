import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { getConfidence, getConfidenceHistory } from '../../api/customer';
import { useTheme } from '../../theme';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { ListRow } from '../ui/ListRow';
import { SectionHeader } from '../ui/SectionHeader';
import { QueryScreen } from './QueryScreen';
import { fmt, humanize, toNumber } from './format';

/**
 * Financial Confidence: 0-100, higher = stronger *verified* financial confidence.
 * Informational; not a credit score, not a lending decision, and not an inversion
 * of any risk score. Unavailable components are shown as unavailable, not zero.
 */
export function ConfidenceLive({ showBack = true }: { showBack?: boolean }) {
  const { theme } = useTheme();
  const query = useQuery({ queryKey: ['customer-confidence'], queryFn: ({ signal }) => getConfidence(signal) });
  const history = useQuery({ queryKey: ['customer-confidence-history'], queryFn: ({ signal }) => getConfidenceHistory(signal) });

  return (
    <QueryScreen title="Financial Confidence" showBack={showBack} query={query}>
      {({ scale, institutions }) =>
        institutions.length === 0 ? (
          <EmptyState icon="shield" title="Not enough verified data yet" description={`${scale.note} Connect an account you've consented to share to build your Financial Confidence.`} />
        ) : (
          <>
            {institutions.map((item) => (
              <React.Fragment key={item.id}>
                <Card>
                  <Text style={[theme.typography.overline, { color: theme.colors.textTertiary }]}>{item.institution_name.toUpperCase()}</Text>
                  <View style={styles.row}>
                    <Text style={[theme.typography.display, { color: theme.colors.textPrimary }]}>{fmt.number(toNumber(item.score) ?? 0, 0)}</Text>
                    <Text style={[theme.typography.bodySm, { color: theme.colors.textTertiary }]}> / {scale.max}</Text>
                    <Badge label={humanize(item.band)} tone="success" style={styles.badge} />
                  </View>
                  <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                    Completeness {fmt.number((toNumber(item.completeness) ?? 0) * 100, 0)}% · as of {fmt.date(item.as_of)} · model {item.version}
                  </Text>
                </Card>
                <SectionHeader title="What it's based on" />
                <Card padding="none">
                  {(item.components ?? []).map((c, i, all) => (
                    <ListRow
                      key={c.code}
                      title={humanize(c.code)}
                      subtitle={c.available ? `Weight ${fmt.number((toNumber(c.weight) ?? 0) * 100, 0)}%` : 'Not enough verified data'}
                      rightText={c.available && c.value !== null ? fmt.number((toNumber(c.value) ?? 0) * 100, 0) : '—'}
                      showDivider={i < all.length - 1}
                    />
                  ))}
                </Card>
              </React.Fragment>
            ))}
            <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>
              Higher means stronger verified financial confidence. {scale.note}
            </Text>
            {history.data && history.data.results.length > 1 ? (
              <>
                <SectionHeader title="History" />
                <Card padding="none">
                  {history.data.results.map((h, i, all) => (
                    <ListRow key={h.id} title={fmt.date(h.as_of)} subtitle={h.institution_name} rightText={fmt.number(toNumber(h.score) ?? 0, 0)} showDivider={i < all.length - 1} />
                  ))}
                </Card>
              </>
            ) : null}
          </>
        )
      }
    </QueryScreen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'baseline', marginVertical: 6 },
  badge: { marginLeft: 12 },
});
