/**
 * TAMVA Main Tabs Navigation Shell
 *
 * Provides the core tab bar structure for future feature modules.
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useTheme } from '../../src/theme';
import { Icon } from '../../src/components/ui/Icon';

export default function TabsLayout() {
  const { theme } = useTheme();

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
        tabBarLabelStyle: {
          ...theme.typography.captionMedium,
          fontSize: 11,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="passport"
        options={{
          title: 'Passport',
          tabBarLabel: 'Passport',
          tabBarIcon: ({ color, size }) => (
            <Icon name="shield" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarLabel: 'Activity',
          tabBarIcon: ({ color, size }) => (
            <Icon name="activity" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="consent"
        options={{
          title: 'Consent',
          tabBarLabel: 'Consent',
          tabBarIcon: ({ color, size }) => (
            <Icon name="lock" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Icon name="user" size={20} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="protection"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="risk"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
