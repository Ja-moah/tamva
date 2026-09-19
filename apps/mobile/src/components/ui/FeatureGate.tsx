/**
 * Decides whether a screen shows real data, a partial view, its bundled demo
 * design, or an honest unavailable state.
 *
 * - `wired` says whether the app has real-data code for this screen.
 * - `capability` is what the backend reports for the customer surface.
 * - Demo mode (explicit, bannered, off by default) shows the sample design.
 */
import { useRouter } from 'expo-router';
import React from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';

import { DEMO_MODE } from '../../config/env';
import { resolveAvailability, useCapabilityState } from '../../features/capabilities';
import { useTheme } from '../../theme';
import { ScreenHeader } from './ScreenHeader';
import { UnavailableState } from './UnavailableState';

export interface FeatureGateProps {
  capability: string;
  wired: boolean;
  title: string;
  description: string;
  detail?: string;
  /** Show a back button in the header (for pushed screens). */
  showBack?: boolean;
  children: React.ReactNode;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  capability,
  wired,
  title,
  description,
  detail,
  showBack = false,
  children,
}) => {
  const { theme } = useTheme();
  const router = useRouter();
  const { state, isLoading } = useCapabilityState(capability);

  if (DEMO_MODE) return <>{children}</>;

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.colors.primary} />
      </View>
    );
  }

  if (resolveAvailability(state, wired) === 'unavailable') {
    return (
      <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
        <ScreenHeader title={title} showBack={showBack} />
        <ScrollView contentContainerStyle={styles.scroll}>
          <UnavailableState
            title={title}
            description={description}
            detail={detail}
            actionLabel="Go to Home"
            onActionPress={() => router.replace('/(tabs)')}
          />
        </ScrollView>
      </View>
    );
  }
  return <>{children}</>;
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flexGrow: 1, justifyContent: 'center' },
});
