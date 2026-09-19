/**
 * TAMVA Account Registration Screen (Phase 9C-1)
 *
 * Polished, accessible registration form allowing users to create an account
 * with full name, email, password, confirm password, and consent acknowledgement.
 *
 * Strictly adheres to Phase 9C-1 constraints:
 * - Real frontend registration UX without mock backend claims or fake auth tokens
 * - Clean initial empty form (no premature error states)
 * - User-friendly validation on interaction/blur and submission
 * - Visually minimal input styling (no icon clutter)
 * - Compact consent checkbox with non-deceptive Terms & Privacy links
 * - Polished confirmation modal ("Account details ready")
 * - Strictly isolated __DEV__ testing controls (no bypass)
 */

import React, { useState } from 'react';
import { DEMO_MODE } from '../../src/config/env';
import { register } from '../../src/api/endpoints';
import { ApiError, describeError } from '../../src/api/errors';
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
import { Modal } from '../../src/components/ui/Modal';
import { Chip } from '../../src/components/ui/Chip';
import { Icon } from '../../src/components/ui/Icon';

function SignUpScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const haptics = useHaptics();

  // Form values
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Field touched tracking (prevents premature errors on untouched fields)
  const [nameTouched, setNameTouched] = useState(false);
  const [emailTouched, setEmailTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [termsTouched, setTermsTouched] = useState(false);

  // Error messages
  const [fullNameError, setFullNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [termsError, setTermsError] = useState('');

  // Screen submission and confirmation states
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  // Validation functions
  const validateFullName = (val: string): boolean => {
    const trimmed = val.trim();
    if (!trimmed || trimmed.length < 2) {
      setFullNameError('Enter your full name.');
      return false;
    }
    setFullNameError('');
    return true;
  };

  const validateEmail = (val: string): boolean => {
    const trimmed = val.trim().toLowerCase();
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
    if (!val || val.length < 8) {
      setPasswordError('Password must be at least 8 characters.');
      return false;
    }
    setPasswordError('');
    return true;
  };

  const validateConfirmPassword = (val: string, targetPassword = password): boolean => {
    if (!val || val !== targetPassword) {
      setConfirmPasswordError('Passwords do not match.');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  const validateConsent = (agreed: boolean): boolean => {
    if (!agreed) {
      setTermsError('Please accept the Terms and Privacy Policy to continue.');
      return false;
    }
    setTermsError('');
    return true;
  };

  // Form completeness check for disabled primary action state
  const isFormIncomplete =
    !fullName.trim() ||
    !email.trim() ||
    !password ||
    !confirmPassword;

  const isButtonDisabled = isFormIncomplete || !agreedToTerms || isLoading;

  const handleCreateAccount = () => {
    haptics.selection();

    // Mark all fields touched on submission attempt
    setNameTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);
    setTermsTouched(true);

    const isNameValid = validateFullName(fullName);
    const isEmailValid = validateEmail(email);
    const isPassValid = validatePassword(password);
    const isConfirmValid = validateConfirmPassword(confirmPassword, password);
    const isConsentValid = validateConsent(agreedToTerms);

    if (!isNameValid || !isEmailValid || !isPassValid || !isConfirmValid || !isConsentValid) {
      haptics.warning();
      return;
    }

    setIsLoading(true);

    const [first, ...rest] = fullName.trim().split(/\s+/);
    void register({ email: email.trim(), password, first_name: first, last_name: rest.join(' ') })
      .then(() => {
        setShowConfirmation(true);
        haptics.success();
      })
      .catch((error: unknown) => {
        haptics.error();
        const details = error instanceof ApiError ? (error.details as Record<string, string[]> | null) : null;
        if (details?.password?.[0]) setPasswordError(details.password[0]);
        else setEmailError(error instanceof ApiError && error.status === 400 ? "We couldn't create an account with these details." : describeError(error));
      })
      .finally(() => setIsLoading(false));
  };

  const handleToggleConsent = () => {
    haptics.selection();
    const nextVal = !agreedToTerms;
    setAgreedToTerms(nextVal);
    setTermsTouched(true);
    if (nextVal) {
      setTermsError('');
    }
  };

  const handleSignInNav = () => {
    haptics.selection();
    router.push('/(auth)/sign-in');
  };

  const handleModalContinue = () => {
    haptics.selection();
    setShowConfirmation(false);
    router.replace('/(auth)/sign-in');
  };

  const handleModalBackToSignIn = () => {
    haptics.selection();
    setShowConfirmation(false);
    router.replace('/(auth)/sign-in');
  };

  // Dev QA testing handlers (Correction 6: only useful controls, no bypass)
  const handleDevFillValid = () => {
    setFullName('Kofi Mensah');
    setEmail('kofi.mensah@example.com');
    setPassword('SecurePassword123');
    setConfirmPassword('SecurePassword123');
    setAgreedToTerms(true);
    setFullNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setTermsError('');
    setNameTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);
    setTermsTouched(true);
  };

  const handleDevFillMismatch = () => {
    setFullName('Kofi Mensah');
    setEmail('kofi.mensah@example.com');
    setPassword('SecurePassword123');
    setConfirmPassword('DifferentPassword456');
    setAgreedToTerms(true);
    setFullNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('Passwords do not match.');
    setTermsError('');
    setNameTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);
    setTermsTouched(true);
  };

  const handleDevConsentUnchecked = () => {
    setFullName('Kofi Mensah');
    setEmail('kofi.mensah@example.com');
    setPassword('SecurePassword123');
    setConfirmPassword('SecurePassword123');
    setAgreedToTerms(false);
    setFullNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setTermsError('Please accept the Terms and Privacy Policy to continue.');
    setNameTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);
    setTermsTouched(true);
  };

  const handleDevTriggerAllErrors = () => {
    setFullName('');
    setEmail('invalid-email-address');
    setPassword('short');
    setConfirmPassword('different');
    setAgreedToTerms(false);
    setFullNameError('Enter your full name.');
    setEmailError('Enter a valid email address.');
    setPasswordError('Password must be at least 8 characters.');
    setConfirmPasswordError('Passwords do not match.');
    setTermsError('Please accept the Terms and Privacy Policy to continue.');
    setNameTouched(true);
    setEmailTouched(true);
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);
    setTermsTouched(true);
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
              Create your TAMVA account
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
              Set up your account and start building your financial profile with your consent.
            </Text>
          </View>

          {/* Registration Form (Visually Minimal: No icon clutter) */}
          <View style={styles.form}>
            {/* Field 1: Full name */}
            <Input
              label="Full name"
              placeholder="Enter your full name"
              value={fullName}
              onChangeText={(text) => {
                setFullName(text);
                if (nameTouched) validateFullName(text);
              }}
              onBlur={() => {
                setNameTouched(true);
                validateFullName(fullName);
              }}
              autoCapitalize="words"
              autoCorrect={false}
              errorMessage={fullNameError}
            />

            {/* Field 2: Email address */}
            <Input
              label="Email address"
              placeholder="you@example.com"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailTouched) validateEmail(text);
              }}
              onBlur={() => {
                setEmailTouched(true);
                validateEmail(email);
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              errorMessage={emailError}
            />

            {/* Field 3: Password */}
            <Input
              label="Password"
              placeholder="Create a password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordTouched) validatePassword(text);
                if (confirmPasswordTouched && confirmPassword) {
                  validateConfirmPassword(confirmPassword, text);
                }
              }}
              onBlur={() => {
                setPasswordTouched(true);
                validatePassword(password);
              }}
              isPassword
              helperText="Use at least 8 characters."
              errorMessage={passwordError}
            />

            {/* Field 4: Confirm password */}
            <Input
              label="Confirm password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (confirmPasswordTouched) validateConfirmPassword(text, password);
              }}
              onBlur={() => {
                setConfirmPasswordTouched(true);
                validateConfirmPassword(confirmPassword, password);
              }}
              isPassword
              errorMessage={confirmPasswordError}
            />

            {/* Compact Consent / Terms Acknowledgement */}
            <View style={styles.consentContainer}>
              <Pressable
                onPress={handleToggleConsent}
                style={styles.checkboxRow}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agreedToTerms }}
                accessibilityLabel="Agree to TAMVA's Terms and acknowledge the Privacy Policy"
              >
                <View
                  style={[
                    styles.checkbox,
                    {
                      borderColor: termsError
                        ? theme.colors.danger
                        : agreedToTerms
                        ? theme.colors.primary
                        : theme.colors.borderStrong,
                      backgroundColor: agreedToTerms
                        ? theme.colors.primary
                        : theme.colors.surface,
                    },
                  ]}
                >
                  {agreedToTerms && (
                    <Icon name="check" size={13} color="#FFFFFF" />
                  )}
                </View>

                <Text
                  style={[
                    theme.typography.caption,
                    {
                      color: theme.colors.textSecondary,
                      fontSize: 13,
                      lineHeight: 19,
                      flex: 1,
                    },
                  ]}
                >
                  By creating an account, you agree to TAMVA&apos;s{' '}
                  <Text
                    style={[
                      styles.legalLink,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Terms
                  </Text>{' '}
                  and acknowledge the{' '}
                  <Text
                    style={[
                      styles.legalLink,
                      { color: theme.colors.primary },
                    ]}
                  >
                    Privacy Policy
                  </Text>
                  .
                </Text>
              </Pressable>

              {Boolean(termsError) && (
                <Text
                  style={[
                    theme.typography.caption,
                    {
                      color: theme.colors.danger,
                      fontSize: 12,
                      marginTop: 4,
                      marginLeft: 32,
                    },
                  ]}
                >
                  {termsError}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Bottom Actions Section */}
        <View style={styles.bottomSection}>
          <Button
            label={isLoading ? 'Creating account...' : 'Create account'}
            variant="primary"
            size="lg"
            fullWidth
            loading={isLoading}
            disabled={isButtonDisabled}
            onPress={handleCreateAccount}
            style={styles.actionButton}
          />

          <View style={styles.signInPromptRow}>
            <Text
              style={[
                theme.typography.body,
                { color: theme.colors.textSecondary, fontSize: 14 },
              ]}
            >
              Already have an account?{' '}
            </Text>
            <Pressable
              onPress={handleSignInNav}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Sign in"
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
                Sign in
              </Text>
            </Pressable>
          </View>

          {/* Development-only QA controls (Strictly isolated to __DEV__) */}
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
                  label="Fill Valid Form"
                  selected={false}
                  onPress={handleDevFillValid}
                  style={styles.devChip}
                />
                <Chip
                  label="Fill Password Mismatch"
                  selected={false}
                  onPress={handleDevFillMismatch}
                  style={styles.devChip}
                />
                <Chip
                  label="Consent Unchecked"
                  selected={false}
                  onPress={handleDevConsentUnchecked}
                  style={styles.devChip}
                />
                <Chip
                  label="Trigger All Errors"
                  selected={false}
                  onPress={handleDevTriggerAllErrors}
                  style={styles.devChip}
                />
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Confirmation Modal (Correction 4: Real product copy, no developer/phase jargon) */}
      <Modal
        visible={showConfirmation}
        onClose={() => setShowConfirmation(false)}
        title="Account created"
        description="Your TAMVA account is ready. Sign in to continue. Email verification is not required yet."
        primaryAction={{
          label: 'Continue',
          onPress: handleModalContinue,
        }}
        secondaryAction={{
          label: 'Back to sign in',
          onPress: handleModalBackToSignIn,
        }}
      />
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
  consentContainer: {
    marginTop: 4,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    minHeight: 36,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  legalLink: {
    fontWeight: '600',
    textDecorationLine: 'underline',
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
  signInPromptRow: {
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


export default SignUpScreen;
