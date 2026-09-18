/**
 * TAMVA ActivityFilterSheet Component
 *
 * Secondary filtering bottom sheet for granular transaction queries:
 * - Status filter: All, Completed, Pending, Failed
 * - Institution/Account filter: All Accounts, GCB Bank, Stanbic, MTN MoMo, CalBank, etc.
 *
 * Employs staged filter state so closing or dismissing without tapping
 * "Apply Filters" leaves active filters untouched.
 */

import React, { startTransition, useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { ActivitySecondaryFilters } from '../../types/activity';
import { TransactionStatus } from '../../types/financial';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

export interface ActivityFilterSheetProps {
  visible: boolean;
  onClose: () => void;
  appliedFilters: ActivitySecondaryFilters;
  onApply: (filters: ActivitySecondaryFilters) => void;
  availableAccounts: string[];
  availableStatuses: (TransactionStatus | 'all')[];
}

export const ActivityFilterSheet: React.FC<ActivityFilterSheetProps> = ({
  visible,
  onClose,
  appliedFilters,
  onApply,
  availableAccounts,
  availableStatuses,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  // Staged local state: initialized from appliedFilters when sheet opens
  const [stagedStatus, setStagedStatus] = useState<TransactionStatus | 'all'>(
    appliedFilters.status
  );
  const [stagedAccount, setStagedAccount] = useState<string | 'all'>(
    appliedFilters.account
  );

  // Sync staged state whenever the sheet opens
  useEffect(() => {
    if (visible) {
      startTransition(() => {
        setStagedStatus(appliedFilters.status);
        setStagedAccount(appliedFilters.account);
      });
    }
  }, [visible, appliedFilters]);

  const handleSelectStatus = (status: TransactionStatus | 'all') => {
    haptics.selection();
    setStagedStatus(status);
  };

  const handleSelectAccount = (account: string | 'all') => {
    haptics.selection();
    setStagedAccount(account);
  };

  const handleClear = () => {
    haptics.lightImpact();
    setStagedStatus('all');
    setStagedAccount('all');
  };

  const handleApply = () => {
    haptics.selection();
    onApply({
      status: stagedStatus,
      account: stagedAccount,
    });
    onClose();
  };

  const isStagedDirty =
    stagedStatus !== appliedFilters.status || stagedAccount !== appliedFilters.account;
  const hasAnyStagedFilter = stagedStatus !== 'all' || stagedAccount !== 'all';

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Filter Activity"
      subtitle="Refine by transaction status and connected account"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Section 1: Transaction Status */}
        <View style={styles.section}>
          <Text
            style={[
              theme.typography.captionMedium,
              {
                color: theme.colors.textSecondary,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                fontSize: 11,
                marginBottom: 10,
              },
            ]}
          >
            Transaction Status
          </Text>

          <View style={styles.chipRow}>
            {availableStatuses.map((status) => {
              const isSelected = stagedStatus === status;
              const label =
                status === 'all'
                  ? 'All Statuses'
                  : status.charAt(0).toUpperCase() + status.slice(1);

              return (
                <Pressable
                  key={status}
                  onPress={() => handleSelectStatus(status)}
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.surface,
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.border,
                      borderRadius: theme.radius.full,
                    },
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Status: ${label}`}
                >
                  <Text
                    style={[
                      theme.typography.bodySmMedium,
                      {
                        color: isSelected
                          ? theme.colors.primaryText
                          : theme.colors.textPrimary,
                        fontSize: 13,
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Section 2: Institution Account */}
        <View style={styles.section}>
          <Text
            style={[
              theme.typography.captionMedium,
              {
                color: theme.colors.textSecondary,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                fontSize: 11,
                marginBottom: 10,
              },
            ]}
          >
            Institution / Account
          </Text>

          <View style={styles.accountsList}>
            {/* "All Accounts" option */}
            <Pressable
              onPress={() => handleSelectAccount('all')}
              style={[
                styles.accountRow,
                {
                  backgroundColor:
                    stagedAccount === 'all'
                      ? theme.colors.primaryLight
                      : theme.colors.surface,
                  borderColor:
                    stagedAccount === 'all'
                      ? theme.colors.primary
                      : theme.colors.border,
                  borderRadius: theme.radius.md,
                },
              ]}
              accessibilityRole="checkbox"
              accessibilityState={{ selected: stagedAccount === 'all' }}
              accessibilityLabel="All Accounts"
            >
              <View style={styles.accountRowLeft}>
                <View
                  style={[
                    styles.accountIconCircle,
                    { backgroundColor: theme.colors.backgroundAlt },
                  ]}
                >
                  <Icon name="grid" size={16} color={theme.colors.textSecondary} />
                </View>
                <Text
                  style={[
                    theme.typography.bodySmMedium,
                    { color: theme.colors.textPrimary, marginLeft: 12 },
                  ]}
                >
                  All Connected Accounts
                </Text>
              </View>

              {stagedAccount === 'all' && (
                <Icon name="check" size={18} color={theme.colors.primary} />
              )}
            </Pressable>

            {/* Dynamic list of accounts from mock data */}
            {availableAccounts.map((account) => {
              const isSelected = stagedAccount === account;

              return (
                <Pressable
                  key={account}
                  onPress={() => handleSelectAccount(account)}
                  style={[
                    styles.accountRow,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.primaryLight
                        : theme.colors.surface,
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.border,
                      borderRadius: theme.radius.md,
                    },
                  ]}
                  accessibilityRole="checkbox"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={`Account: ${account}`}
                >
                  <View style={styles.accountRowLeft}>
                    <View
                      style={[
                        styles.accountIconCircle,
                        { backgroundColor: theme.colors.backgroundAlt },
                      ]}
                    >
                      <Icon
                        name={
                          account.includes('MoMo')
                            ? 'smartphone'
                            : account.includes('Vault')
                            ? 'shield'
                            : 'credit-card'
                        }
                        size={16}
                        color={theme.colors.textSecondary}
                      />
                    </View>
                    <Text
                      style={[
                        theme.typography.bodySmMedium,
                        { color: theme.colors.textPrimary, marginLeft: 12 },
                      ]}
                    >
                      {account}
                    </Text>
                  </View>

                  {isSelected && (
                    <Icon name="check" size={18} color={theme.colors.primary} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <Button
              label="Reset"
              variant="tertiary"
              size="md"
              disabled={!hasAnyStagedFilter}
              onPress={handleClear}
            />
          </View>

          <View style={{ flex: 2 }}>
            <Button
              label={
                isStagedDirty
                  ? 'Apply Filters'
                  : hasAnyStagedFilter
                  ? 'Keep Filters'
                  : 'Apply'
              }
              variant="primary"
              size="md"
              onPress={handleApply}
            />
          </View>
        </View>
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 20,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    minHeight: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountsList: {
    gap: 8,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    minHeight: 48,
  },
  accountRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  accountIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
  },
});
