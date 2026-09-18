/**
 * TAMVA AccountTrustIntro Component
 *
 * Restrained, factual card communicating TAMVA's data consent architecture:
 * "These are the institutions connected to TAMVA and the permissions currently granted."
 * - Read-only access (no transaction execution or fund movement)
 * - User-controlled revocability (disconnect or change scopes anytime)
 * - Direct provider authentication (no credential storage)
 *
 * Avoids unsupported claims, establishing calm, verifiable trust.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from '../ui/Icon';
import { useHaptics } from '../../hooks/useHaptics';

export interface AccountTrustIntroProps {
  collapsible?: boolean;
}

export const AccountTrustIntro: React.FC<AccountTrustIntroProps> = ({
  collapsible = true,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = () => {
    haptics.selection();
    setIsExpanded((prev) => !prev);
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
        },
      ]}
    >
      {/* Header Row */}
      <Pressable
        onPress={collapsible ? toggleExpand : undefined}
        style={styles.headerRow}
        accessibilityRole={collapsible ? 'button' : 'none'}
        accessibilityLabel="Consent and data protection details"
        accessibilityHint={collapsible ? 'Double tap to expand or collapse data sharing details' : undefined}
        accessibilityState={collapsible ? { expanded: isExpanded } : undefined}
      >
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: theme.colors.primaryLight,
                borderColor: theme.colors.primaryMedium,
              },
            ]}
          >
            <Icon name="shield" size={16} color={theme.colors.primary} />
          </View>
          <View style={styles.headerTextColumn}>
            <Text
              style={[
                theme.typography.bodyMedium,
                { color: theme.colors.textPrimary, fontWeight: '600' },
              ]}
              numberOfLines={1}
            >
              Data Sharing & Permissions
            </Text>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, marginTop: 2, lineHeight: 16 },
              ]}
              numberOfLines={2}
            >
              These are the institutions connected to TAMVA and the permissions currently granted.
            </Text>
          </View>
        </View>

        {collapsible && (
          <View style={styles.expandButton}>
            <Icon
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={18}
              color={theme.colors.textTertiary}
            />
          </View>
        )}
      </Pressable>

      {/* Trust Pillars (Expanded) */}
      {(!collapsible || isExpanded) && (
        <View
          style={[
            styles.pillarsContainer,
            {
              borderTopColor: theme.colors.border,
              backgroundColor: theme.colors.surfaceElevated,
            },
          ]}
        >
          <View style={styles.pillarItem}>
            <View style={styles.bulletDotWrapper}>
              <View
                style={[
                  styles.bulletDot,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
            </View>
            <View style={styles.pillarContent}>
              <Text
                style={[
                  theme.typography.captionMedium,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Read-only access
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, marginTop: 2, lineHeight: 16 },
                ]}
              >
                TAMVA can never move funds, execute transfers, or alter your accounts.
              </Text>
            </View>
          </View>

          <View style={styles.pillarItem}>
            <View style={styles.bulletDotWrapper}>
              <View
                style={[
                  styles.bulletDot,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
            </View>
            <View style={styles.pillarContent}>
              <Text
                style={[
                  theme.typography.captionMedium,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Revocable anytime
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, marginTop: 2, lineHeight: 16 },
                ]}
              >
                Disconnect any institution or modify specific permission scopes at any moment.
              </Text>
            </View>
          </View>

          <View style={styles.pillarItem}>
            <View style={styles.bulletDotWrapper}>
              <View
                style={[
                  styles.bulletDot,
                  { backgroundColor: theme.colors.primary },
                ]}
              />
            </View>
            <View style={styles.pillarContent}>
              <Text
                style={[
                  theme.typography.captionMedium,
                  { color: theme.colors.textPrimary },
                ]}
              >
                Direct provider authentication
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, marginTop: 2, lineHeight: 16 },
                ]}
              >
                Credentials are authenticated directly through your financial institution.
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  headerTextColumn: {
    flex: 1,
    marginRight: 8,
  },
  expandButton: {
    paddingLeft: 4,
    flexShrink: 0,
  },
  pillarsContainer: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 14,
    gap: 12,
  },
  pillarItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  bulletDotWrapper: {
    paddingTop: 5,
    marginRight: 10,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  pillarContent: {
    flex: 1,
  },
});
