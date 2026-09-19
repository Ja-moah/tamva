import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Text } from 'react-native';

import { generatePassport, getPassport, getProfile, listPassportShares, revokePassportShare } from '../../api/customer';
import { describeError } from '../../api/errors';
import { useTheme } from '../../theme';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { EmptyState } from '../ui/EmptyState';
import { ListRow } from '../ui/ListRow';
import { SectionHeader } from '../ui/SectionHeader';
import { QueryScreen } from './QueryScreen';
import { fmt, humanize } from './format';

const scalar = (value: unknown): string | null =>
  typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' ? String(value) : null;

/**
 * Financial Passport: a customer-controlled snapshot that can be shared with one
 * recipient, for one purpose, for a limited time, and revoked. Only summary
 * sections exist; raw transactions, counterparties and balances are never in it.
 */
export function PassportLive() {
  const { theme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const passport = useQuery({ queryKey: ['customer-passport'], queryFn: ({ signal }) => getPassport(signal) });
  const profile = useQuery({ queryKey: ['customer-profile'], queryFn: ({ signal }) => getProfile(signal) });
  const shares = useQuery({ queryKey: ['customer-passport-shares'], queryFn: ({ signal }) => listPassportShares(signal) });

  const refreshAll = () => {
    for (const key of ['customer-passport', 'customer-passport-shares', 'customer-home']) {
      void queryClient.invalidateQueries({ queryKey: [key] });
    }
  };
  const generate = useMutation({
    mutationFn: generatePassport,
    onSuccess: refreshAll,
    onError: (error) => Alert.alert("Couldn't create your Passport", describeError(error)),
  });
  const revoke = useMutation({
    mutationFn: revokePassportShare,
    onSuccess: refreshAll,
    onError: (error) => Alert.alert("Couldn't revoke", describeError(error)),
  });

  const withPassport = new Set((passport.data?.institutions ?? []).map((p) => p.institution_id));
  const needing = (profile.data?.institutions ?? []).filter((p) => !withPassport.has(p.institution_id));

  return (
    <QueryScreen title="Financial Passport" subtitle="Share a summary, on your terms" query={passport}>
      {({ institutions }) => (
        <>
          {institutions.length === 0 && needing.length === 0 ? (
            <EmptyState icon="shield" title="No Passport yet" description="A Passport is built from your Financial Profile. Not enough verified data yet: connect an account you've consented to share first." />
          ) : null}
          {institutions.map((p) => {
            const entries = Object.entries(p.snapshot.sections);
            return (
              <React.Fragment key={p.snapshot.id}>
                <SectionHeader title={p.institution_name} subtitle={`Created ${fmt.dateTime(p.snapshot.created_at)}`} />
                <Card padding="none">
                  {entries.map(([code, payload], i) => {
                    const fields = Object.entries((payload ?? {}) as Record<string, unknown>)
                      .map(([k, v]) => [k, scalar(v)] as const)
                      .filter(([, v]) => v !== null)
                      .slice(0, 3);
                    return (
                      <ListRow
                        key={code}
                        title={humanize(code)}
                        subtitle={fields.map(([k, v]) => `${humanize(k)}: ${v}`).join(' · ') || undefined}
                        showDivider={i < entries.length - 1}
                      />
                    );
                  })}
                </Card>
                <Button
                  label="Refresh from latest profile"
                  variant="secondary"
                  size="sm"
                  loading={generate.isPending && generate.variables === p.institution_id}
                  onPress={() => generate.mutate(p.institution_id)}
                />
              </React.Fragment>
            );
          })}
          {needing.map((p) => (
            <Card key={p.institution_id}>
              <Text style={[theme.typography.bodyMedium, { color: theme.colors.textPrimary }]}>{p.institution_name}</Text>
              <Text style={[theme.typography.caption, { color: theme.colors.textSecondary, marginVertical: 6 }]}>
                You have a profile here but no Passport yet.
              </Text>
              <Button
                label="Create Passport"
                loading={generate.isPending && generate.variables === p.institution_id}
                onPress={() => generate.mutate(p.institution_id)}
              />
            </Card>
          ))}

          {institutions.length > 0 ? (
            <Button label="Share my Passport" onPress={() => router.push('/passport-share')} fullWidth />
          ) : null}

          <SectionHeader title="Shares" subtitle="Each share is for one recipient and purpose, and expires." />
          {shares.data && shares.data.results.length > 0 ? (
            shares.data.results.map((s) => (
              <Card key={s.id}>
                <Text style={[theme.typography.bodyMedium, { color: theme.colors.textPrimary }]}>{s.recipient_institution_name}</Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                  {humanize(s.purpose_code)} · {s.allowed_sections.map(humanize).join(', ')}
                </Text>
                <Text style={[theme.typography.caption, { color: theme.colors.textTertiary, marginVertical: 6 }]}>
                  {s.status === 'REVOKED' ? `Revoked ${fmt.date(s.revoked_at)}` : `Expires ${fmt.date(s.expires_at)}`}
                </Text>
                <Badge label={humanize(s.status)} tone={s.status === 'ACTIVE' ? 'success' : 'neutral'} />
                {s.status === 'ACTIVE' ? (
                  <Button
                    label="Revoke"
                    variant="destructive"
                    size="sm"
                    style={{ marginTop: 12 }}
                    loading={revoke.isPending && revoke.variables === s.id}
                    onPress={() =>
                      Alert.alert(`Revoke ${s.recipient_institution_name}'s access?`, 'They will no longer be able to use this share.', [
                        { text: 'Keep', style: 'cancel' },
                        { text: 'Revoke', style: 'destructive', onPress: () => revoke.mutate(s.id) },
                      ])
                    }
                  />
                ) : null}
              </Card>
            ))
          ) : (
            <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary }]}>You haven&apos;t shared your Passport.</Text>
          )}
        </>
      )}
    </QueryScreen>
  );
}
