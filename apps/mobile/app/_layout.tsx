/**
 * TAMVA Root Application Layout
 *
 * Configures font loading, safe areas, theme provider, privacy provider,
 * gesture handler, and toast system.
 */

import React, { useState } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

import { ThemeProvider, useTheme } from '../src/theme';
import { PrivacyProvider } from '../src/context/PrivacyContext';
import { OnboardingProvider } from '../src/context/OnboardingContext';
import { NotificationsProvider } from '../src/context/NotificationsContext';
import { ToastProvider } from '../src/components/ui/Toast';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../src/auth/AuthProvider';
import { DemoBanner } from '../src/components/ui/DemoBanner';
import { OfflineBanner } from '../src/components/ui/OfflineBanner';

function RootNavigation() {
  const { theme, isDark } = useTheme();
  const stack = (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.colors.background },
        animation: 'fade_from_bottom',
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding/index" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="send" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="receive" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="save" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="consent-grant" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="passport-share" options={{ presentation: 'modal', headerShown: false }} />
      <Stack.Screen name="reset-password" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="help" options={{ headerShown: false }} />
      <Stack.Screen name="accounts" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" options={{ title: 'Not Found', headerShown: true }} />
    </Stack>
  );

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {stack}
    </>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: false, refetchOnWindowFocus: false },
          mutations: { retry: false },
        },
      })
  );
  const [fontsLoaded, fontError] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A7F64" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider initialMode="light">
            <AuthProvider>
              <PrivacyProvider initialPrivate={false}>
                <NotificationsProvider>
                  <ToastProvider>
                    <OnboardingProvider>
                      <DemoBanner />
                      <OfflineBanner />
                      <RootNavigation />
                    </OnboardingProvider>
                  </ToastProvider>
                </NotificationsProvider>
              </PrivacyProvider>
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
  },
});
