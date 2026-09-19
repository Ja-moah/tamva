import type { Consent } from '@tamva/client-contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';

import { listConsents, revokeConsent } from '../../api/endpoints';
import { describeError } from '../../api/errors';
import { useFormatters } from '../../i18n/useFormatters';
import { useTheme } from '../../theme';
import { Badge } from '../ui/Badge';
import { EmptyState } from '../ui/EmptyState';
import { ErrorState } from '../ui/ErrorState';
import { Button } from '../ui/Button';
import { ScreenHeader } from '../ui/ScreenHeader';
import { useRouter } from 'expo-router';

export function LiveConsentScreen() {
  const { theme } = useTheme();
  const format = useFormatters();
  const router = useRouter();
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['customer-consents'],
    queryFn: ({ signal }) => listConsents(signal),
  });
  const revoke = useMutation({
    mutationFn: revokeConsent,
    onSuccess: () => {
      for (const key of ['customer-consents', 'customer-home', 'customer-security']) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
    },
  });

  const confirmRevoke = (consent: Consent) => {
    Alert.alert(
      'Revoke consent?',
      `${consent.institution_name} will no longer be able to use this consent for ${consent.purpose_name}.`,
      [
        { text: 'Keep consent', style: 'cancel' },
        { text: 'Revoke', style: 'destructive', onPress: () => revoke.mutate(consent.id) },
      ]
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        title="Consent & data sharing"
        subtitle="Purpose-bound access you control"
        borderBottom
        rightElement={<Button label="Grant" size="sm" variant="secondary" onPress={() => router.push('/consent-grant')} accessibilityHint="Give an institution access to your data" />}
      />
      {query.isPending ? (
        <View style={styles.center}><ActivityIndicator color={theme.colors.primary} /></View>
      ) : query.isError ? (
        <View style={styles.center}>
          <ErrorState
            title="Unable to load consent"
            message={describeError(query.error)}
            retryLabel="Try again"
            onRetry={() => void query.refetch()}
          />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={() => void query.refetch()} />}
        >
          {(query.data?.results.length ?? 0) === 0 ? (
            <EmptyState
              icon="lock"
              title="No consent records"
              description="When you grant an institution purpose-bound access, it will appear here. Use Grant to give an institution purpose-bound, time-limited access."
            />
          ) : (
            query.data?.results.map((consent) => (
              <View
                key={consent.id}
                style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}
              >
                <View style={styles.row}>
                  <View style={styles.heading}>
                    <Text style={[theme.typography.bodyMedium, { color: theme.colors.textPrimary }]}>
                      {consent.institution_name}
                    </Text>
                    <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>
                      {consent.purpose_name}
                    </Text>
                  </View>
                  <Badge
                    label={consent.status}
                    tone={consent.status === 'GRANTED' ? 'success' : consent.status === 'EXPIRED' ? 'warning' : 'neutral'}
                    size="sm"
                  />
                </View>
                <Text style={[theme.typography.caption, styles.label, { color: theme.colors.textTertiary }]}>SCOPES</Text>
                <Text style={[theme.typography.bodySm, { color: theme.colors.textPrimary }]}>
                  {consent.scope_codes.map((scope) => scope.replaceAll('_', ' ')).join(' · ')}
                </Text>
                <View style={styles.dates}>
                  <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Granted {format.date(consent.granted_at)}</Text>
                  <Text style={[theme.typography.caption, { color: theme.colors.textSecondary }]}>Expires {format.date(consent.expires_at)}</Text>
                </View>
                {consent.status === 'GRANTED' ? (
                  <Pressable
                    accessibilityRole="button"
                    disabled={revoke.isPending}
                    onPress={() => confirmRevoke(consent)}
                    style={({ pressed }) => [styles.revoke, { borderColor: theme.colors.danger, opacity: pressed ? 0.7 : 1 }]}
                  >
                    <Text style={[theme.typography.buttonSm, { color: theme.colors.danger }]}>Revoke consent</Text>
                  </Pressable>
                ) : null}
              </View>
            ))
          )}
          {revoke.isError ? (
            <Text accessibilityRole="alert" style={[theme.typography.caption, { color: theme.colors.danger }]}> {describeError(revoke.error)} </Text>
          ) : null}
          <Text style={[theme.typography.caption, styles.note, { color: theme.colors.textTertiary }]}>
            Granting new consent requires the institution, purpose and scope catalogue. That flow remains unavailable until the backend publishes it.
          </Text>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { padding: 16, paddingBottom: 48, gap: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  heading: { flex: 1, gap: 3 },
  label: { marginTop: 16, marginBottom: 4, letterSpacing: 0.7 },
  dates: { marginTop: 12, gap: 2 },
  revoke: { marginTop: 16, minHeight: 44, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  note: { marginTop: 8, lineHeight: 18, textAlign: 'center' },
});
