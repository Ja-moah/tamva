import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DEMO_MODE } from '../../config/env';
import { useTheme } from '../../theme';

/** Persistent notice while demo mode is on, so sample data can never pass for real data. */
export const DemoBanner: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  if (!DEMO_MODE) return null;
  return (
    <View
      accessibilityRole="alert"
      style={[styles.bar, { paddingTop: Math.max(insets.top, 4), backgroundColor: theme.colors.warningLight }]}
    >
      <Text style={[theme.typography.captionMedium, { color: theme.colors.warningText }]}>
        DEMO DATA — sample figures, not your real accounts
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({ bar: { alignItems: 'center', paddingBottom: 4 } });
