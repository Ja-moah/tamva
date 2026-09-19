/**
 * TAMVA main tabs.
 *
 * One canonical structure: Home · Activity · Profile · Passport · More.
 * Everything else (consent, protection, risk, connected accounts, settings,
 * help, notifications) is reached from Home or More and keeps its deep link.
 * Each tab gates its own content, so the tab bar is always available.
 */
import { Redirect, Tabs } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

import { describeError } from '../../src/api/errors';
import { useAuth } from '../../src/auth/AuthProvider';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { Icon } from '../../src/components/ui/Icon';
import type { FeatherIconName } from '../../src/constants/icons';
import { useTheme } from '../../src/theme';

const VISIBLE: { name: string; title: string; icon: FeatherIconName }[] = [
  { name: 'index', title: 'Home', icon: 'home' },
  { name: 'activity', title: 'Activity', icon: 'activity' },
  { name: 'profile', title: 'Profile', icon: 'user' },
  { name: 'passport', title: 'Passport', icon: 'shield' },
  { name: 'more', title: 'More', icon: 'more-horizontal' },
];
const HIDDEN = ['consent', 'protection', 'risk'];

export default function TabsLayout() {
  const { theme } = useTheme();
  const auth = useAuth();

  if (auth.status === 'loading') {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }
  if (auth.status === 'error') {
    // Offline or the service is down: say so and let the customer retry.
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ErrorState
          title="Can't reach TAMVA"
          message={auth.message ?? describeError(null)}
          onRetry={auth.retry}
          retryLabel="Try again"
        />
      </View>
    );
  }
  if (auth.status !== 'authenticated') return <Redirect href="/(auth)/sign-in" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.textTertiary,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.border,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        tabBarLabelStyle: { ...theme.typography.captionMedium, fontSize: 11, marginTop: 2 },
      }}
    >
      {VISIBLE.map(({ name, title, icon }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarLabel: title,
            tabBarAccessibilityLabel: title,
            tabBarIcon: ({ color }) => <Icon name={icon} size={20} color={color} />,
          }}
        />
      ))}
      {HIDDEN.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null }} />
      ))}
    </Tabs>
  );
}
