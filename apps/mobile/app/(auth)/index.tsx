/**
 * TAMVA Authentication Welcome Screen (Phase 9B)
 *
 * Primary calm brand entry screen connecting Phase 9A Onboarding to product entry.
 * Follows TAMVA design principles:
 * - Visually restrained, minimal, and lighter than Home
 * - Neutral financial intelligence motif (connected data points / network) — NO shield glyph
 * - Clear hierarchy: Brand moment -> Headline -> Supporting copy -> CTAs -> Consent statement
 * - Dev QA controls strictly isolated behind __DEV__
 */

import React from 'react';
import { DEMO_MODE } from '../../src/config/env';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { useHaptics } from '../../src/hooks/useHaptics';
import { useOnboarding } from '../../src/hooks/useOnboarding';
import { Button } from '../../src/components/ui/Button';
import { Chip } from '../../src/components/ui/Chip';
import { Icon } from '../../src/components/ui/Icon';

export default function AuthWelcomeScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  const { resetOnboarding } = useOnboarding();

  const handleSignIn = () => {
    haptics.selection();
    router.push('/(auth)/sign-in');
  };

  const handleSignUp = () => {
    haptics.selection();
    router.push('/(auth)/sign-up');
  };

  const handleDevResetOnboarding = async () => {
    haptics.mediumImpact();
    await resetOnboarding();
    router.replace('/onboarding');
  };

  const handleDevBypassToTabs = () => {
    haptics.lightImpact();
    router.replace('/(tabs)');
  };

  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: theme.colors.background,
          paddingTop: Math.max(insets.top, 24),
          paddingBottom: Math.max(insets.bottom, 24),
        },
      ]}
    >
      {/* 1. Brand Moment: Restrained Financial Intelligence Motif (No Shield) */}
      <View style={styles.brandContainer}>
        <View
          style={[
            styles.outerRing,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.innerRing,
              {
                backgroundColor: theme.colors.primaryLight,
                borderColor: theme.colors.primaryMedium,
              },
            ]}
          >
            <Icon name="share-2" size={24} color={theme.colors.primary} />
          </View>
        </View>

        <Text
          style={[
            theme.typography.display,
            {
              color: theme.colors.textPrimary,
              fontWeight: '800',
              fontSize: 28,
              letterSpacing: 2,
              marginTop: 18,
            },
          ]}
        >
          TAMVA
        </Text>
        <Text
          style={[
            theme.typography.captionMedium,
            {
              color: theme.colors.textTertiary,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: 1.5,
              marginTop: 6,
            },
          ]}
        >
          Financial Intelligence & Trust
        </Text>
      </View>

      {/* 2. Welcome Messaging: Hierarchy & Restraint */}
      <View style={styles.contentContainer}>
        <Text
          style={[
            theme.typography.heading,
            {
              color: theme.colors.textPrimary,
              fontSize: 24,
              fontWeight: '700',
              textAlign: 'center',
              lineHeight: 32,
            },
          ]}
        >
          Financial intelligence, built on trust.
        </Text>
        <Text
          style={[
            theme.typography.body,
            {
              color: theme.colors.textSecondary,
              fontSize: 14,
              lineHeight: 22,
              textAlign: 'center',
              marginTop: 10,
              maxWidth: 320,
            },
          ]}
        >
          Connect your financial picture, understand your position, and make more informed financial decisions.
        </Text>
      </View>

      {/* 3. Actions Block & Consent Statement */}
      <View style={styles.actionsContainer}>
        <Button
          label="Sign in"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleSignIn}
          style={styles.actionButton}
        />
        <Button
          label="Create account"
          variant="secondary"
          size="lg"
          fullWidth
          onPress={handleSignUp}
          style={styles.actionButton}
        />

        {/* Understated Consent Notice */}
        <Text
          style={[
            theme.typography.caption,
            {
              color: theme.colors.textTertiary,
              fontSize: 12,
              textAlign: 'center',
              marginTop: 6,
              paddingHorizontal: 12,
            },
          ]}
        >
          Your financial data is connected only with your consent.
        </Text>

        {/* 4. Development QA dock (Strictly isolated to __DEV__) */}
        {DEMO_MODE && (
          <View style={styles.devDock}>
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.textTertiary, fontSize: 10, marginBottom: 6 },
              ]}
            >
              DEV QA CONTROLS
            </Text>
            <View style={styles.devChipsRow}>
              <Chip
                label="Reset Onboarding"
                selected={false}
                onPress={handleDevResetOnboarding}
                style={styles.devChip}
              />
              <Chip
                label="Enter Dashboard (Bypass)"
                selected={false}
                onPress={handleDevBypassToTabs}
                style={styles.devChip}
              />
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  brandContainer: {
    alignItems: 'center',
    marginTop: 48,
  },
  outerRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  actionsContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  actionButton: {
    minHeight: 52,
    width: '100%',
  },
  devDock: {
    marginTop: 14,
    alignItems: 'center',
    width: '100%',
  },
  devChipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  devChip: {
    minHeight: 28,
    paddingVertical: 2,
    paddingHorizontal: 8,
  },
});
