/**
 * Completes account recovery from the emailed link (tamva://reset-password?token=…).
 * The token is single-use and expires; a successful reset ends every session.
 */
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { confirmRecovery } from '../src/api/endpoints';
import { ApiError, describeError } from '../src/api/errors';
import { Button } from '../src/components/ui/Button';
import { Input } from '../src/components/ui/Input';
import { ScreenHeader } from '../src/components/ui/ScreenHeader';
import { useTheme } from '../src/theme';

export default function ResetPasswordScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (password.length < 8) return setError('Use at least 8 characters.');
    if (password !== confirm) return setError("The passwords don't match.");
    setBusy(true);
    setError('');
    try {
      await confirmRecovery(String(token ?? ''), password);
      Alert.alert('Password changed', 'You have been signed out everywhere. Sign in with your new password.');
      router.replace('/(auth)/sign-in');
    } catch (caught) {
      const details = caught instanceof ApiError ? (caught.details as Record<string, string[]> | null) : null;
      setError(details?.new_password?.[0] ?? details?.token?.[0] ?? describeError(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: theme.colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenHeader title="Choose a new password" showBack />
      <ScrollView contentContainerStyle={styles.content}>
        {!token ? (
          <Text style={[theme.typography.bodySm, { color: theme.colors.textSecondary }]}>
            This reset link is incomplete. Request a new one from Forgot password.
          </Text>
        ) : (
          <View style={styles.form}>
            <Input label="New password" isPassword value={password} onChangeText={setPassword} autoComplete="new-password" />
            <Input label="Confirm new password" isPassword value={confirm} onChangeText={setConfirm} autoComplete="new-password" errorMessage={error || undefined} />
            <Button label="Change password" onPress={() => void submit()} loading={busy} disabled={!password || !confirm} fullWidth />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({ content: { padding: 16 }, form: { gap: 16 } });
