/**
 * TAMVA Authentication Stack Layout
 *
 * Manages the authentication navigation group:
 * - index: Authentication Welcome
 * - sign-in: Sign In
 * - forgot-password: Forgot Password UX Shell
 * - sign-up: Create Account Handoff
 */

import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '../../src/theme';

export default function AuthLayout() {
  const { theme } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'fade_from_bottom',
      }}
    >
      <Stack.Screen
        name="index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="sign-in"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="forgot-password"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="sign-up"
        options={{ headerShown: false }}
      />
    </Stack>
  );
}
