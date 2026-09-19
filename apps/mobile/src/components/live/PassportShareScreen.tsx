import { PASSPORT_SECTIONS } from '@tamva/client-contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';

import { createPassportShare, getConsentCatalogue, getPassport } from '../../api/customer';
import { describeError } from '../../api/errors';
import { useTheme } from '../../theme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Chip } from '../ui/Chip';
import { SectionHeader } from '../ui/SectionHeader';
import { QueryScreen } from './QueryScreen';
import { fmt, humanize } from './format';

const DAY_CHOICES = [7, 30, 90];

/** Create a recipient-specific, purpose-specific, scoped, time-limited share. The secret is shown once. */
export function PassportShareScreen() {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const passport = useQuery({ queryKey: ['customer-passport'], queryFn: ({ signal }) => getPassport(signal) });
  const catalogue = useQuery({ queryKey: ['consent-catalogue'], queryFn: ({ signal }) => getConsentCatalogue(signal) });
  const [issuer, setIssuer] = useState<string | null>(null);
  const [recipient, setRecipient] = useState<string | null>(null);
  const [purpose, setPurpose] = useState<string | null>(null);
  const [sections, setSections] = useState<string[]>([]);
  const [days, setDays] = useState(7);
  const [secret, setSecret] = useState<string | null>(null);
  const [today] = useState(() => Date.now());

  const create = useMutation({
    mutationFn: createPassportShare,
    onSuccess: (share) => {
      setSecret(share.token);
      for (const key of ['customer-passport-shares', 'customer-home']) void queryClient.invalidateQueries({ queryKey: [key] });
    },
    onError: (error) =>
      Alert.alert("Couldn't create the share", `${describeError(error)}\n\nThe recipient must already have your consent under Consent & data sharing.`),
  });

  return (
    <QueryScreen title="Share Passport" subtitle="One recipient, one purpose, limited time" showBack query={passport}>
      {(p) => {
        const issuerId = issuer ?? (p.institutions.length === 1 ? p.institutions[0].institution_id : null);
        const recipients = (catalogue.data?.institutions ?? []).filter((i) => i.id !== issuerId);
        const recipientObj = recipients.find((i) => i.id === recipient);
        const ready = Boolean(issuerId && recipientObj && purpose && sections.length > 0);
        if (secret) {
          return (
            <Card>
              <Text style={[theme.typography.subheading, { color: theme.colors.textPrimary }]}>Share created</Text>
              <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary, marginVertical: 8 }]}>
                Give this code to the recipient. It is shown only once and cannot be retrieved again; you can revoke the share at any time.
              </Text>
              <TextInput
                value={secret}
                editable={false}
                selectTextOnFocus
                accessibilityLabel="Share code"
                style={[styles.secret, { borderColor: theme.colors.border, color: theme.colors.textPrimary }]}
              />
              <Button label="Done" onPress={() => setSecret(null)} fullWidth style={{ marginTop: 12 }} />
            </Card>
          );
        }
        return (
          <>
            {p.institutions.length > 1 ? (
              <>
                <SectionHeader title="Passport" />
                <View style={styles.chips}>
                  {p.institutions.map((i) => (
                    <Chip key={i.institution_id} label={i.institution_name} selected={i.institution_id === issuerId} onPress={() => setIssuer(i.institution_id)} />
                  ))}
                </View>
              </>
            ) : null}
            <SectionHeader title="Recipient" />
            <View style={styles.chips}>
              {recipients.map((i) => (
                <Chip key={i.id} label={i.name} selected={i.id === recipient} onPress={() => { setRecipient(i.id); setPurpose(null); }} />
              ))}
            </View>
            {recipientObj ? (
              <>
                <SectionHeader title="Purpose" />
                <View style={styles.chips}>
                  {recipientObj.purposes.map((pu) => (
                    <Chip key={pu.code} label={pu.name} selected={pu.code === purpose} onPress={() => setPurpose(pu.code)} />
                  ))}
                </View>
              </>
            ) : null}
            <SectionHeader title="What to share" subtitle="Summaries only. Never transactions, counterparties or balances." />
            <View style={styles.chips}>
              {PASSPORT_SECTIONS.map((s) => (
                <Chip key={s} label={humanize(s)} selected={sections.includes(s)} onPress={() => setSections(sections.includes(s) ? sections.filter((x) => x !== s) : [...sections, s])} />
              ))}
            </View>
            <SectionHeader title="Expires" />
            <View style={styles.chips}>
              {DAY_CHOICES.map((d) => (
                <Chip key={d} label={`${d} days`} selected={d === days} onPress={() => setDays(d)} />
              ))}
            </View>
            <Text style={[theme.typography.caption, { color: theme.colors.textTertiary }]}>
              Ends {fmt.date(new Date(today + days * 86_400_000))}.
            </Text>
            <Button
              label="Create share"
              disabled={!ready}
              loading={create.isPending}
              fullWidth
              onPress={() =>
                issuerId && recipientObj && purpose
                  ? create.mutate({
                      issuer_institution_id: issuerId,
                      recipient_institution_id: recipientObj.id,
                      purpose_code: purpose,
                      allowed_sections: sections,
                      expires_at: new Date(Date.now() + days * 86_400_000).toISOString(),
                    })
                  : undefined
              }
            />
          </>
        );
      }}
    </QueryScreen>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  secret: { borderWidth: 1, borderRadius: 10, padding: 12, fontFamily: 'Courier', fontSize: 13 },
});
