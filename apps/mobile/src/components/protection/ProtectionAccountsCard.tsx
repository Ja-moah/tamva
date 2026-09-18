/**
 * TAMVA ProtectionAccountsCard Component
 *
 * Displays connected account statistics relevant to protection:
 * - Total accounts
 * - Connected count
 * - Attention required count
 * - Disconnected count
 * - Ultra-compact account rows (institution name, masked identifier, status, chevron)
 * - Action affordance: "Review connected accounts →" linking to Consent tab
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { BrandLogo } from '../ui/BrandLogo';
import { Badge } from '../ui/Badge';
import {
  ProtectionAccountSummary,
  ProtectionAccountDetail,
} from '../../types/protection';

export interface ProtectionAccountsCardProps {
  accounts: ProtectionAccountSummary;
  accountsList?: ProtectionAccountDetail[];
  onSelectAccount?: (account: ProtectionAccountDetail) => void;
  onReviewAccounts?: () => void;
}

export const ProtectionAccountsCard: React.FC<ProtectionAccountsCardProps> = ({
  accounts,
  accountsList,
  onSelectAccount,
  onReviewAccounts,
}) => {
  const { theme } = useTheme();
  const router = useRouter();
  const haptics = useHaptics();

  const handlePressReview = () => {
    haptics.selection();
    if (onReviewAccounts) {
      onReviewAccounts();
    } else {
      router.push('/(tabs)/consent');
    }
  };

  const handleAccountPress = (account: ProtectionAccountDetail) => {
    haptics.selection();
    if (onSelectAccount) {
      onSelectAccount(account);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeaderRow}>
        <Text
          style={[
            theme.typography.subheading,
            { color: theme.colors.textPrimary },
          ]}
        >
          Connected accounts
        </Text>
        <Text
          style={[
            theme.typography.captionMedium,
            { color: theme.colors.textSecondary },
          ]}
        >
          {accounts.total} total
        </Text>
      </View>

      <Card variant="standard" padding="none" style={styles.card}>
        <View style={styles.cardContent}>
          {/* Metrics Trio */}
          <View style={styles.trioRow}>
            <View style={styles.trioCol}>
              <Text
                style={[
                  theme.typography.subheading,
                  { color: theme.colors.textPrimary, fontSize: 18 },
                ]}
              >
                {accounts.connected}
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, marginTop: 2 },
                ]}
              >
                Connected
              </Text>
            </View>

            <View style={[styles.trioDivider, { backgroundColor: theme.colors.border }]} />

            <View style={styles.trioCol}>
              <Text
                style={[
                  theme.typography.subheading,
                  {
                    color:
                      accounts.attentionRequired > 0
                        ? theme.colors.warning
                        : theme.colors.textPrimary,
                    fontSize: 18,
                  },
                ]}
              >
                {accounts.attentionRequired}
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, marginTop: 2 },
                ]}
              >
                Attention
              </Text>
            </View>

            <View style={[styles.trioDivider, { backgroundColor: theme.colors.border }]} />

            <View style={styles.trioCol}>
              <Text
                style={[
                  theme.typography.subheading,
                  {
                    color:
                      accounts.disconnected > 0
                        ? theme.colors.danger
                        : theme.colors.textPrimary,
                    fontSize: 18,
                  },
                ]}
              >
                {accounts.disconnected}
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, marginTop: 2 },
                ]}
              >
                Disconnected
              </Text>
            </View>
          </View>

          {/* Compact Account Rows (Max 4 rows, restrained spacing) */}
          {accountsList && accountsList.length > 0 && (
            <View style={[styles.compactListContainer, { borderTopColor: theme.colors.border }]}>
              {accountsList.slice(0, 4).map((acc, index) => {
                const isLast = index === Math.min(accountsList.length, 4) - 1;
                    const badgeLabel =
                      acc.connectionStatus === 'connected'
                        ? 'Connected'
                        : acc.connectionStatus === 'attention'
                        ? 'Attention'
                        : 'Disconnected';
                    const badgeTone: 'success' | 'warning' | 'danger' =
                      acc.connectionStatus === 'connected'
                        ? 'success'
                        : acc.connectionStatus === 'attention'
                        ? 'warning'
                        : 'danger';

                    return (
                      <Pressable
                        key={acc.id}
                        onPress={() => handleAccountPress(acc)}
                        style={({ pressed }) => [
                          styles.compactAccountRow,
                          !isLast && {
                            borderBottomWidth: StyleSheet.hairlineWidth,
                            borderBottomColor: theme.colors.border,
                          },
                          {
                            backgroundColor: pressed
                              ? theme.colors.backgroundAlt
                              : 'transparent',
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`${acc.institutionName} ${acc.maskedIdentifier}, ${badgeLabel}`}
                      >
                        <View style={styles.compactAccountTextCol}>
                          <BrandLogo
                            name={acc.institutionName}
                            containerSize={24}
                            size={16}
                            isDisconnected={acc.connectionStatus === 'disconnected'}
                            fallbackIcon="credit-card"
                            style={{ marginRight: 8 }}
                          />
                          <Text
                            style={[
                              theme.typography.bodySmMedium,
                              { color: theme.colors.textPrimary },
                            ]}
                            numberOfLines={1}
                          >
                            {acc.institutionName}
                          </Text>
                          <Text
                            style={[
                              theme.typography.caption,
                              { color: theme.colors.textSecondary, marginLeft: 6 },
                            ]}
                          >
                            {acc.maskedIdentifier}
                          </Text>
                        </View>

                        <View style={styles.compactStatusRow}>
                          <Badge
                            label={badgeLabel}
                            tone={badgeTone}
                            size="sm"
                            showDot
                          />
                          <Icon
                            name="chevron-right"
                            size={13}
                            color={theme.colors.textTertiary}
                            style={{ marginLeft: 6 }}
                          />
                        </View>
                      </Pressable>
                    );
                  })}
            </View>
          )}

          {/* Action Link to Connected Accounts / Consent */}
          <Pressable
            onPress={handlePressReview}
            style={({ pressed }) => [
              styles.actionRow,
              {
                borderTopColor: theme.colors.border,
                backgroundColor: pressed ? theme.colors.backgroundAlt : 'transparent',
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Review connected accounts"
          >
            <Text
              style={[
                theme.typography.buttonSm,
                { color: theme.colors.primary, fontWeight: '600' },
              ]}
            >
              Review connected accounts
            </Text>
            <Icon
              name="arrow-right"
              size={14}
              color={theme.colors.primary}
            />
          </Pressable>
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    paddingTop: 16,
  },
  trioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  trioCol: {
    alignItems: 'center',
    flex: 1,
  },
  trioDivider: {
    width: StyleSheet.hairlineWidth,
    height: 28,
  },
  compactListContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  compactAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 16,
    minHeight: 44,
  },
  compactAccountTextCol: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  compactStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
