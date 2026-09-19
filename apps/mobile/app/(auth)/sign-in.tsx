/**
 * TAMVA Sign In Screen (Phase 9B)
 *
 * Secure, minimal, and accessible authentication screen.
 * Features:
 * - Email address input with format validation
 * - Password input with visibility toggle and validation
 * - Human, respectful error messaging ("Those details don't match. Please check your email and password and try again.")
 * - Smooth loading state and keyboard-safe scroll view
 * - Accessible back button and forgot-password link
 * - Dev QA controls strictly isolated to __DEV__
 */

import React, { useState } from 'react';
import { DEMO_MODE } from '../../src/config/env';
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
import { useAuth } from '../../src/auth/AuthProvider';

export default function SignInScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();
  const auth = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [authError, setAuthError] = useState(false);
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

  const validatePassword = (val: string): boolean => {
    if (!val) {
      setPasswordError('Enter your password.');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const handleSignIn = async () => {
    haptics.selection();
    setAuthError(false);

    const isEmailValid = validateEmail(email);
    const isPassValid = validatePassword(password);

    if (!isEmailValid || !isPassValid) {
      haptics.warning();
      return;
    }

    setIsLoading(true);
    const signedIn = await auth.signIn(email.trim(), password);
    setIsLoading(false);
    setAuthError(!signedIn);
    if (signedIn) {
      haptics.success();
      router.replace('/(tabs)');
    } else {
      haptics.error();
    }
  };

  const handleForgotPassword = () => {
    haptics.selection();
    router.push('/(auth)/forgot-password');
  };

  const handleSignUpNav = () => {
    haptics.selection();
    router.push('/(auth)/sign-up');
  };

  // Dev QA helper functions
  const handleDevFillDemo = () => {
    setEmail('kofi.mensah@example.com');
    setPassword('Demopassword123');
    setEmailError('');
    setPasswordError('');
    setAuthError(false);
  };

  const handleDevTriggerAuthError = () => {
    setEmail('error@example.com');
    setPassword('wrongpassword');
    setAuthError(true);
  };

  const handleDevBypass = () => {
    router.replace('/(tabs)');
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
              Welcome back
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
              Sign in to continue to your TAMVA financial profile.
            </Text>
          </View>

          {/* Human Error Banner (Correction 5) */}
          {authError && (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: theme.colors.dangerLight,
                  borderColor: theme.colors.danger,
                },
              ]}
            >
              <Icon name="alert-circle" size={18} color={theme.colors.danger} />
              <Text
                style={[
                  theme.typography.captionMedium,
                  {
                    color: theme.colors.dangerText,
                    fontSize: 13,
                    lineHeight: 18,
                    flex: 1,
                  },
                ]}
              >
                {auth.message ?? "Those details don't match. Please check your email and password and try again."}
              </Text>
            </View>
          )}

          {/* Sign In Form */}
          <View style={styles.form}>
            <Input
              label="Email address"
              placeholder="name@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) setEmailError('');
                if (authError) setAuthError(false);
              }}
              onBlur={() => {
                if (email.length > 0) validateEmail(email);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              errorMessage={emailError}
              leftIcon="mail"
              containerStyle={styles.inputContainer}
            />

            <View style={styles.passwordContainer}>
              <Input
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (passwordError) setPasswordError('');
                  if (authError) setAuthError(false);
                }}
                onBlur={() => {
                  if (password.length > 0) validatePassword(password);
                }}
                isPassword
                errorMessage={passwordError}
                leftIcon="lock"
              />

              <Pressable
                onPress={handleForgotPassword}
                hitSlop={{ top: 8, bottom: 8, left: 12, right: 12 }}
                style={styles.forgotPasswordPressable}
                accessibilityRole="button"
                accessibilityLabel="Forgot password?"
              >
                <Text
                  style={[
                    theme.typography.captionMedium,
                    {
                      color: theme.colors.primary,
                      fontSize: 13,
                      fontWeight: '600',
                    },
                  ]}
                >
                  Forgot password?
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Bottom Actions Section */}
        <View style={styles.bottomSection}>
          <Button
            label={isLoading ? 'Signing in...' : 'Sign in'}
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={isLoading}
            onPress={handleSignIn}
            style={styles.submitButton}
          />

          <View style={styles.signUpPromptRow}>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary, fontSize: 14 },
              ]}
            >
              Don&apos;t have an account?{' '}
            </Text>
            <Pressable
              onPress={handleSignUpNav}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Create account"
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
                Create account
              </Text>
            </Pressable>
          </View>

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
                  label="Trigger Error"
                  selected={false}
                  onPress={handleDevTriggerAuthError}
                  style={styles.devChip}
                />
                <Chip
                  label="Bypass"
                  selected={false}
                  onPress={handleDevBypass}
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 0,
  },
  passwordContainer: {
    gap: 6,
  },
  forgotPasswordPressable: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    minHeight: 36,
    justifyContent: 'center',
  },
  bottomSection: {
    width: '100%',
    alignItems: 'center',
    marginTop: 32,
    gap: 16,
  },
  submitButton: {
    minHeight: 52,
    width: '100%',
  },
  signUpPromptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
