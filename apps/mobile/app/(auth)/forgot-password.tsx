/**
 * TAMVA Forgot Password Screen (Phase 9B UX Shell)
 *
 * Provides a calm, transparent recovery flow adhering to TAMVA principles:
 * - Clear guidance and email validation
 * - Transparent feedback state (does not pretend an email was sent via mock backend)
 * - Accessible back button and keyboard handling
 * - Dev QA controls strictly isolated to __DEV__
 */

import React, { useState } from 'react';
import { DEMO_MODE } from '../../src/config/env';
import { requestRecovery } from '../../src/api/endpoints';
import { describeError } from '../../src/api/errors';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../src/theme';
import { useHaptics } from '../../src/hooks/useHaptics';
import { Input } from '../../src/components/ui/Input';
import { Button } from '../../src/components/ui/Button';
import { IconButton } from '../../src/components/ui/IconButton';
import { Chip } from '../../src/components/ui/Chip';
import { Icon } from '../../src/components/ui/Icon';

function ForgotPasswordScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed) {
      setEmailError('Enter a valid email address.');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      setEmailError('Enter a valid email address.');
      return false;
    }
    setEmailError('');
    return true;
  };

  const handleContinue = () => {
    haptics.selection();
    if (!validateEmail(email)) {
      haptics.warning();
      return;
    }

    setIsLoading(true);
    // The response is identical whether or not the address is registered.
    requestRecovery(email.trim())
      .then(() => {
        setIsSubmitted(true);
        haptics.success();
      })
      .catch((error: unknown) => {
        haptics.error();
        setEmailError(describeError(error));
      })
      .finally(() => setIsLoading(false));
  };

  const handleBackToSignIn = () => {
    haptics.selection();
    router.replace('/(auth)/sign-in');
  };

  const handleResetForm = () => {
    haptics.selection();
    setIsSubmitted(false);
  };

  // Dev QA helper functions
  const handleDevFillDemo = () => {
    setEmail('kofi.mensah@example.com');
    setEmailError('');
  };

  const handleDevToggleSubmitted = () => {
    setIsSubmitted((prev) => !prev);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.keyboardView, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 16),
            paddingBottom: Math.max(insets.bottom, 24),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topSection}>
          {/* Back Navigation */}
          <View style={styles.backRow}>
            <IconButton
              icon="chevron-left"
              variant="subtle"
              size="md"
              onPress={() => router.back()}
              accessibilityLabel="Go back"
            />
          </View>

          {!isSubmitted ? (
            <>
              {/* Screen Header */}
              <View style={styles.header}>
                <Text
                  style={[
                    theme.typography.headingLg,
                    {
                      color: theme.colors.textPrimary,
                      fontSize: 28,
                      fontWeight: '700',
                      letterSpacing: -0.5,
                    },
                  ]}
                >
                  Reset your password
                </Text>
                <Text
                  style={[
                    theme.typography.body,
                    {
                      color: theme.colors.textSecondary,
                      fontSize: 15,
                      lineHeight: 22,
                      marginTop: 8,
                    },
                  ]}
                >
                  Enter the email address linked to your TAMVA account and we&apos;ll help you reset your password.
                </Text>
              </View>

              {/* Form */}
              <View style={styles.form}>
                <Input
                  label="Email address"
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (emailError) setEmailError('');
                  }}
                  onBlur={() => {
                    if (email.length > 0) validateEmail(email);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  errorMessage={emailError}
                  leftIcon="mail"
                />
              </View>
            </>
          ) : (
            /* Transparent Presentation Feedback (Correction 6) */
            <View style={styles.confirmationContainer}>
              <View
                style={[
                  styles.confirmationCard,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: theme.colors.primaryLight,
                      borderColor: theme.colors.primaryMedium,
                    },
                  ]}
                >
                  <Icon name="info" size={24} color={theme.colors.primary} />
                </View>

                <Text
                  style={[
                    theme.typography.subheading,
                    {
                      color: theme.colors.textPrimary,
                      fontSize: 20,
                      fontWeight: '700',
                      textAlign: 'center',
                      marginTop: 16,
                    },
                  ]}
                >
                  Instructions requested
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
                    },
                  ]}
                >
                  If an account exists for <Text style={{ color: theme.colors.textPrimary, fontWeight: '600' }}>{email}</Text>, password reset instructions will be provided.
                </Text>

                <View
                  style={[
                    styles.privacyNote,
                    {
                      backgroundColor: theme.colors.backgroundAlt,
                      borderColor: theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      theme.typography.caption,
                      {
                        color: theme.colors.textTertiary,
                        fontSize: 12,
                        lineHeight: 18,
                        textAlign: 'center',
                      },
                    ]}
                  >
                    For your privacy and security, TAMVA does not confirm whether an account exists for this address.
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Bottom Actions Section */}
        <View style={styles.bottomSection}>
          {!isSubmitted ? (
            <>
              <Button
                label={isLoading ? 'Continuing...' : 'Continue'}
                variant="primary"
                size="lg"
                fullWidth
                loading={isLoading}
                disabled={isLoading}
                onPress={handleContinue}
                style={styles.actionButton}
              />

              <Pressable
                onPress={handleBackToSignIn}
                hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Back to sign in"
              >
                <Text
                  style={[
                    theme.typography.bodyMedium,
                    {
                      color: theme.colors.primary,
                      fontSize: 14,
                      fontWeight: '600',
                    },
                  ]}
                >
                  Back to sign in
                </Text>
              </Pressable>
            </>
          ) : (
            <>
              <Button
                label="Back to sign in"
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleBackToSignIn}
                style={styles.actionButton}
              />

              <Pressable
                onPress={handleResetForm}
                hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
                accessibilityRole="button"
                accessibilityLabel="Try another email"
              >
                <Text
                  style={[
                    theme.typography.bodyMedium,
                    {
                      color: theme.colors.textSecondary,
                      fontSize: 14,
                      fontWeight: '500',
                    },
                  ]}
                >
                  Try another email
                </Text>
              </Pressable>
            </>
          )}

          {/* Development-only QA controls */}
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
                  label="Fill Demo"
                  selected={false}
                  onPress={handleDevFillDemo}
                  style={styles.devChip}
                />
                <Chip
                  label="Toggle State"
                  selected={isSubmitted}
                  onPress={handleDevToggleSubmitted}
                  style={styles.devChip}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  topSection: {
    width: '100%',
  },
  backRow: {
    marginBottom: 16,
    marginLeft: -8,
  },
  header: {
    marginBottom: 24,
  },
  form: {
    gap: 16,
  },
  confirmationContainer: {
    marginTop: 8,
  },
  confirmationCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  privacyNote: {
    marginTop: 20,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    width: '100%',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 32,
    gap: 16,
  },
  actionButton: {
    minHeight: 52,
    width: '100%',
  },
  devDock: {
    marginTop: 12,
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


export default ForgotPasswordScreen;
