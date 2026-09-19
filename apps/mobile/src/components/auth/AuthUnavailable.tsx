import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useTheme } from '../../theme';
import { ScreenHeader } from '../ui/ScreenHeader';
import { UnavailableState } from '../ui/UnavailableState';

/**
 * Registration and account recovery have no backend endpoint. Before sign-in
 * the capability manifest can't be read (it needs a session), so these two
 * screens state the fact directly instead of simulating a success.
 */
export function AuthUnavailable({ title, description }: { title: string; description: string }) {
  const { theme } = useTheme();
  const router = useRouter();
  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title={title} showBack />
      <ScrollView contentContainerStyle={styles.content}>
        <UnavailableState
          title={title}
          description={description}
          actionLabel="Back to sign in"
          onActionPress={() => router.replace('/(auth)/sign-in')}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center' },
});
