import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useCapabilities } from '../../features/capabilities';
import { useNotifications } from '../../context/NotificationsContext';
import { useTheme } from '../../theme';
import { Card } from '../ui/Card';
import { ListRow } from '../ui/ListRow';
import { ScreenHeader } from '../ui/ScreenHeader';
import { SectionHeader } from '../ui/SectionHeader';

/**
 * The one canonical home for everything that is not a primary tab.
 * Each row says honestly whether the backend can serve it today.
 */
export function MoreScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const { data: capabilities } = useCapabilities();
  const { unreadCount } = useNotifications();

  const status = (code: string) => {
    const state = capabilities?.[code];
    if (state === 'AVAILABLE') return undefined;
    if (state === 'PARTIAL') return { label: 'Partial', tone: 'warning' as const };
    return { label: 'Not available yet', tone: 'neutral' as const };
  };

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title="More" subtitle="Your data, sharing and settings" />
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader title="Your data" />
        <Card padding="none">
          <ListRow
            title="Connected accounts"
            subtitle="Accounts and providers you have linked"
            leftIcon="link"
            badge={status('customer_connections')}
            showChevron
            onPress={() => router.push('/accounts')}
          />
          <ListRow
            title="Consent & data sharing"
            subtitle="Who can use your data, and why"
            leftIcon="lock"
            badge={status('customer_consent')}
            showChevron
            onPress={() => router.push('/(tabs)/consent')}
          />
          <ListRow
            title="Protection"
            subtitle="Signals about your accounts and devices"
            leftIcon="shield"
            badge={status('customer_protection')}
            showChevron
            onPress={() => router.push('/(tabs)/protection')}
            showDivider={false}
          />
        </Card>

        <SectionHeader title="App" />
        <Card padding="none">
          <ListRow
            title="Notifications"
            subtitle={unreadCount > 0 ? `${unreadCount} unread` : 'Alerts about your data'}
            leftIcon="bell"
            showChevron
            onPress={() => router.push('/notifications')}
          />
          <ListRow
            title="Settings"
            subtitle="Notification preferences, privacy, account"
            leftIcon="settings"
            showChevron
            onPress={() => router.push('/settings')}
          />
          <ListRow
            title="Help"
            subtitle="What TAMVA is, and what it is not"
            leftIcon="help-circle"
            showChevron
            onPress={() => router.push('/help')}
            showDivider={false}
          />
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 16, gap: 8, paddingBottom: 48 },
});
