/**
 * TAMVA Root Route Index Gatekeeper (Phase 9A)
 *
 * Inspects onboarding completion state:
 * - If first-time user: Redirects to /onboarding
 * - If onboarding completed: Redirects to /(auth)
 */

import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useOnboarding } from '../src/hooks/useOnboarding';
import { useTheme } from '../src/theme';
import { useAuth } from '../src/auth/AuthProvider';

export default function RootIndex() {
  const { theme } = useTheme();
  const { hasCompletedOnboarding, isLoading } = useOnboarding();
  const auth = useAuth();

  if (isLoading || auth.status === 'loading') {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="small" color={theme.colors.primary} />
      </View>
    );
  }

  if (!hasCompletedOnboarding) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href={auth.status === 'authenticated' ? '/(tabs)' : '/(auth)'} />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
