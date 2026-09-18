/**
 * TAMVA 404 Fallback Screen
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../src/theme';
import { EmptyState } from '../src/components/ui/EmptyState';

export default function NotFoundScreen() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <EmptyState
        icon="alert-circle"
        title="Screen Not Found"
        description="The requested screen route does not exist in the TAMVA application foundation."
        actionLabel="Return to Foundation"
        onActionPress={() => router.replace('/(tabs)')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
