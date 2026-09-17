/**
 * TAMVA OnboardingVisualThree Component
 *
 * Screen 3 Visual: "Build financial trust."
 * Sophisticated representation of a customer-controlled Financial Passport.
 * Emphasizes privacy, user-governed access, and consent-based sharing.
 * Strictly avoids any claims of government verification or official credit certification.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Badge } from '../ui/Badge';
import { Icon } from '../ui/Icon';

export const OnboardingVisualThree: React.FC = () => {
  const { theme } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.xl,
        },
      ]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="Illustration of TAMVA Financial Passport credential highlighting consent-controlled sharing and user privacy."
    >
      {/* Credential Card */}
      <View
        style={[
          styles.credentialCard,
          {
            backgroundColor: theme.colors.backgroundAlt,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        {/* Top Header: Title & Factual Status Badge (Correction 2) */}
        <View style={styles.headerRow}>
          <View style={styles.titleWithIcon}>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
            >
              <Icon name="shield" size={14} color={theme.colors.primary} />
            </View>
            <Text
              style={[
                theme.typography.label,
                { color: theme.colors.textPrimary, fontWeight: '700', fontSize: 13 },
              ]}
            >
              Financial Passport
            </Text>
          </View>
          <Badge label="Consent controlled" tone="neutral" size="sm" />
        </View>

        {/* Center Section: Trust Status & Context (Correction 2) */}
        <View
          style={[
            styles.statusSection,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.md,
            },
          ]}
        >
          <View style={styles.statusRow}>
            <Icon name="check-circle" size={14} color={theme.colors.success} />
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.success, fontSize: 11, fontWeight: '700' },
              ]}
            >
              Shared with your consent
            </Text>
          </View>
          <Text
            style={[
              theme.typography.body,
              {
                color: theme.colors.textSecondary,
                fontSize: 12,
                lineHeight: 18,
                marginTop: 6,
              },
            ]}
          >
            Provides consolidated financial context for reviews under your explicit permission.
          </Text>
        </View>

        {/* Controlled Sharing Principle Note */}
        <View style={styles.privacyRow}>
          <Icon
            name="lock"
            size={13}
            color={theme.colors.textTertiary}
            style={styles.lockIcon}
          />
          <Text
            style={[
              theme.typography.caption,
              {
                color: theme.colors.textSecondary,
                fontSize: 11,
                lineHeight: 16,
                flex: 1,
              },
            ]}
          >
            You choose who sees your data, what they see, and for how long.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 270,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  credentialCard: {
    width: '100%',
    borderWidth: 1,
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusSection: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 2,
  },
  lockIcon: {
    marginTop: 1,
  },
});
