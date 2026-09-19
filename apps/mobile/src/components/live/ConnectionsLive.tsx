import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { Alert, Text } from 'react-native';

import { disconnectConnection, listConnections } from '../../api/customer';
import { describeError } from '../../api/errors';
import { useTheme } from '../../theme';
import { Badge, type BadgeTone } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { QueryScreen } from './QueryScreen';
import { fmt, humanize } from './format';

const TONE: Record<string, BadgeTone> = {
  ACTIVE: 'success',
  PENDING_AUTHORIZATION: 'warning',
  PAUSED: 'warning',
  FAILED: 'danger',
  REVOKED: 'neutral',
};

/** Accounts connected through providers. Provider credentials are never shown. */
export function ConnectionsLive() {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['customer-connections'], queryFn: ({ signal }) => listConnections(signal) });
  const disconnect = useMutation({
    mutationFn: disconnectConnection,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['customer-connections'] });
      void queryClient.invalidateQueries({ queryKey: ['customer-home'] });
    },
    onError: (error) => Alert.alert("Couldn't disconnect", describeError(error)),
  });

  return (
    <QueryScreen title="Connected accounts" subtitle="Accounts linked through your institutions" showBack query={query}>
      {(page) =>
        page.results.length === 0 ? (
          <EmptyState
            icon="link"
            title="No connected accounts"
            description="Accounts are linked with an institution you've given consent to. Grant consent under Consent & data sharing; your institution then connects the account."
          />
        ) : (
          <>
            {page.results.map((c) => (
              <Card key={c.id}>
                <Text style={[theme.typography.bodyMedium, { color: theme.colors.textPrimary }]}>{c.institution_name}</Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  {c.provider_name} · {humanize(c.purpose_code)} · {humanize(c.scope_code)}
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, marginVertical: 6 }]}>
                  {c.last_synced_at ? `Last updated ${fmt.dateTime(c.last_synced_at)}` : 'No data received yet'}
                </Text>
                <Badge label={humanize(c.state)} tone={TONE[c.state] ?? 'neutral'} />
                {c.status !== 'REVOKED' ? (
                  <Button
                    label="Disconnect"
                    variant="destructive"
                    size="sm"
                    style={{ marginTop: 12 }}
                    loading={disconnect.isPending && disconnect.variables === c.id}
                    onPress={() =>
                      Alert.alert(
                        `Disconnect ${c.institution_name}?`,
                        'TAMVA will stop collecting data from this connection. Data already received stays on record until consent is revoked or it expires.',
                        [
                          { text: 'Keep connected', style: 'cancel' },
                          { text: 'Disconnect', style: 'destructive', onPress: () => disconnect.mutate(c.id) },
                        ]
                      )
                    }
                  />
                ) : null}
              </Card>
            ))}
          </>
        )
      }
    </QueryScreen>
  );
}
