import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

import { getVersion, listNotificationPreferences, setNotificationPreference } from '../../api/endpoints';
import { describeError } from '../../api/errors';
import { useAuth } from '../../auth/AuthProvider';
import { DEMO_MODE } from '../../config/env';
import { usePrivacy } from '../../context/PrivacyContext';
import { useTheme } from '../../theme';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ErrorState } from '../ui/ErrorState';
import { ListRow } from '../ui/ListRow';
import { ScreenHeader } from '../ui/ScreenHeader';
import { SectionHeader } from '../ui/SectionHeader';

const CHANNELS: { code: string; label: string }[] = [
  { code: 'IN_APP', label: 'In the app' },
  { code: 'EMAIL', label: 'Email' },
  { code: 'SMS', label: 'Text message' },
  { code: 'PUSH', label: 'Push notification' },
];
// Categories the backend emits today; a preference row is created on first change.
const CATEGORIES: { code: string; label: string }[] = [{ code: 'CASE', label: 'Security & review updates' }];

export function SettingsScreen() {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const auth = useAuth();
  const { isPrivate, togglePrivacy } = usePrivacy();

  const prefs = useQuery({
    queryKey: ['customer-notification-preferences'],
    queryFn: ({ signal }) => listNotificationPreferences(signal),
    enabled: !DEMO_MODE && auth.status === 'authenticated',
  });
  const version = useQuery({
    queryKey: ['version'],
    queryFn: ({ signal }) => getVersion(signal),
    enabled: !DEMO_MODE,
    staleTime: 10 * 60_000,
  });
  const save = useMutation({
    mutationFn: setNotificationPreference,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['customer-notification-preferences'] }),
    onError: (error) => Alert.alert("Couldn't save that", describeError(error)),
  });

  const enabled = (category: string, channel: string) =>
    prefs.data?.results.find((p) => p.category === category && p.channel === channel)?.enabled ?? true;

  const confirmSignOut = () =>
    Alert.alert('Sign out of TAMVA?', 'You will need to sign in again to see your data.', [
      { text: 'Stay signed in', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void auth.signOut() },
    ]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="Settings" showBack borderBottom />
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader title="Privacy" />
        <Card padding="none">
          <ListRow
            title="Hide amounts on screen"
            subtitle="Masks balances and figures in the app"
            leftIcon="eye-off"
            rightElement={
              <Switch
                value={isPrivate}
                onValueChange={togglePrivacy}
                accessibilityLabel="Hide amounts on screen"
                trackColor={{ true: theme.colors.primary }}
              />
            }
            showDivider={false}
          />
        </Card>

        <SectionHeader title="Notifications" subtitle="Choose how TAMVA tells you. Some required notices can't be turned off." />
        {DEMO_MODE ? null : prefs.isError ? (
          <ErrorState
            title="Unable to load preferences"
            message={describeError(prefs.error)}
            onRetry={() => void prefs.refetch()}
            retryLabel="Try again"
          />
        ) : (
          CATEGORIES.map((category) => (
            <Card key={category.code} padding="none">
              <Text style={[theme.typography.bodyMedium, styles.cardTitle, { color: theme.colors.textPrimary }]}>
                {category.label}
              </Text>
              {CHANNELS.map((channel, index) => (
                <ListRow
                  key={channel.code}
                  title={channel.label}
                  rightElement={
                    <Switch
                      value={enabled(category.code, channel.code)}
                      disabled={prefs.isPending || save.isPending}
                      onValueChange={(value) =>
                        save.mutate({ category: category.code, channel: channel.code, enabled: value })
                      }
                      accessibilityLabel={`${category.label} via ${channel.label}`}
                      trackColor={{ true: theme.colors.primary }}
                    />
                  }
                  showDivider={index < CHANNELS.length - 1}
                />
              ))}
            </Card>
          ))
        )}

        <SectionHeader title="Account" />
        <Card padding="none">
          <ListRow title="Signed in as" subtitle={auth.user?.email ?? auth.hint?.email ?? '—'} leftIcon="user" showDivider={false} />
        </Card>
        <View style={styles.signOut}>
          <Button label="Sign out" onPress={confirmSignOut} variant="destructive" fullWidth />
        </View>

        <SectionHeader title="About" />
        <Card padding="none">
          <ListRow
            title="TAMVA service"
            subtitle={
              version.data
                ? `API ${version.data.api_version} · ${version.data.environment} · app ${version.data.application_version}`
                : version.isError
                  ? 'Unable to reach TAMVA'
                  : DEMO_MODE
                    ? 'Demo mode'
                    : 'Checking…'
            }
            leftIcon="info"
            showDivider={false}
          />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 8, paddingBottom: 64 },
  cardTitle: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  signOut: { marginTop: 8 },
});
