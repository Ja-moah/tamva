import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Switch, Text, View } from 'react-native';

import { getConsentCatalogue, grantConsent } from '../../api/customer';
import { describeError } from '../../api/errors';
import { useTheme } from '../../theme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import { ListRow } from '../ui/ListRow';
import { SectionHeader } from '../ui/SectionHeader';
import { QueryScreen } from './QueryScreen';
import { fmt } from './format';

const DAY_CHOICES = [30, 90, 365];

/** Grant purpose-bound, time-limited access to one institution. Nothing is preselected except a sensible duration. */
export function ConsentGrantScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['consent-catalogue'], queryFn: ({ signal }) => getConsentCatalogue(signal) });
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [purposeCode, setPurposeCode] = useState<string | null>(null);
  const [scopes, setScopes] = useState<string[]>([]);
  const [days, setDays] = useState(90);
  const [today] = useState(() => Date.now());

  const grant = useMutation({
    mutationFn: grantConsent,
    onSuccess: () => {
      for (const key of ['customer-consents', 'customer-home', 'customer-security']) {
        void queryClient.invalidateQueries({ queryKey: [key] });
      }
      Alert.alert('Access granted', 'You can revoke it at any time from Consent & data sharing.');
      router.back();
    },
    onError: (error) => Alert.alert("Couldn't grant access", describeError(error)),
  });

  return (
    <QueryScreen title="Grant access" subtitle="Choose who, why and for how long" showBack query={query}>
      {(catalogue) => {
        const institution = catalogue.institutions.find((i) => i.id === institutionId);
        const purpose = institution?.purposes.find((p) => p.code === purposeCode);
        const maxDays = catalogue.duration_days.max;
        const expires = new Date(today + days * 86_400_000);
        const ready = Boolean(institution && purpose && scopes.length > 0);
        const submit = () => {
          if (!institution || !purpose) return;
          Alert.alert(
            `Give ${institution.name} access?`,
            `Purpose: ${purpose.name}. ${scopes.length} data scope${scopes.length === 1 ? '' : 's'}. Access ends ${fmt.date(expires)} and you can revoke it sooner.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Grant access',
                onPress: () =>
                  grant.mutate({
                    institution_id: institution.id,
                    purpose_code: purpose.code,
                    scope_codes: scopes,
                    expires_at: expires.toISOString(),
                  }),
              },
            ]
          );
        };
        return (
          <>
            <SectionHeader title="Institution" />
            <View style={styles.chips}>
              {catalogue.institutions.map((i) => (
                <Chip
                  key={i.id}
                  label={i.name}
                  selected={i.id === institutionId}
                  onPress={() => {
                    setInstitutionId(i.id);
                    setPurposeCode(null);
                  }}
                />
              ))}
            </View>
            {institution ? (
              <>
                <SectionHeader title="Purpose" subtitle="Access can only be used for this purpose." />
                <Card padding="none">
                  {institution.purposes.map((p, i) => (
                    <ListRow
                      key={p.code}
                      title={p.name}
                      subtitle={p.description || undefined}
                      rightElement={<Chip label={p.code === purposeCode ? 'Selected' : 'Choose'} selected={p.code === purposeCode} onPress={() => setPurposeCode(p.code)} />}
                      showDivider={i < institution.purposes.length - 1}
                    />
                  ))}
                </Card>
              </>
            ) : null}
            {purpose ? (
              <>
                <SectionHeader title="Data" subtitle="Only what you switch on is shared." />
                <Card padding="none">
                  {catalogue.scopes.map((s, i) => (
                    <ListRow
                      key={s.code}
                      title={s.name}
                      subtitle={s.description || undefined}
                      rightElement={
                        <Switch
                          value={scopes.includes(s.code)}
                          onValueChange={(on) => setScopes(on ? [...scopes, s.code] : scopes.filter((c) => c !== s.code))}
                          accessibilityLabel={`Share ${s.name}`}
                          trackColor={{ true: theme.colors.primary }}
                        />
                      }
                      showDivider={i < catalogue.scopes.length - 1}
                    />
                  ))}
                </Card>
                <SectionHeader title="Duration" subtitle={`At most ${maxDays} days. You can revoke sooner.`} />
                <View style={styles.chips}>
                  {DAY_CHOICES.filter((d) => d <= maxDays).map((d) => (
                    <Chip key={d} label={`${d} days`} selected={d === days} onPress={() => setDays(d)} />
                  ))}
                </View>
                <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>Ends {fmt.date(expires)}.</Text>
              </>
            ) : null}
            <Button label="Review and grant" onPress={submit} disabled={!ready} loading={grant.isPending} fullWidth />
          </>
        );
      }}
    </QueryScreen>
  );
}

const styles = StyleSheet.create({ chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 } });
