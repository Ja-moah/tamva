/**
 * TAMVA FundingAccountStep Component (Step 4)
 *
 * Source account selection for future savings contributions:
 * - Clear notice: account would be used for future contributions; no money moved
 * - Selectable eligible connected accounts (GCB, Stanbic, MTN, CalBank)
 * - Disconnected account handling with link to Connected Accounts (Telecel Cash)
 * - Empty state handling when no accounts are eligible
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { SavingsFundingAccount } from '../../types/save';
import { ScreenHeader } from '../ui/ScreenHeader';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { MoneyDisplay } from '../financial/MoneyDisplay';

export interface FundingAccountStepProps {
  accounts: SavingsFundingAccount[];
  selectedAccountId: string | null;
  onSelectAccount: (account: SavingsFundingAccount) => void;
  onContinue: () => void;
  onManageConnectedAccounts: () => void;
  onBack: () => void;
}

export const FundingAccountStep: React.FC<FundingAccountStepProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
  onContinue,
  onManageConnectedAccounts,
  onBack,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const handleAccountPress = (account: SavingsFundingAccount) => {
    if (!account.isEligible) {
      haptics.warning();
      return;
    }
    haptics.selection();
    onSelectAccount(account);
  };

  const eligibleAccounts = accounts.filter((a) => a.isEligible);
  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 1. SCREEN HEADER */}
      <ScreenHeader
        title="Funding Account"
        subtitle="Choose where future contributions would come from"
        showBack={true}
        onBackPress={onBack}
        borderBottom={true}
      />

      {/* 2. SCROLLABLE CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 80 },
        ]}
      >
        {/* Informational Transparency Card */}
        <View
          style={[
            styles.noticeCard,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.noticeHeader}>
            <Icon name="shield" size={16} color={theme.colors.primary} />
            <Text
              style={[
                theme.typography.caption,
                styles.noticeTitle,
                { color: theme.colors.textPrimary },
              ]}
            >
              Future Contributions Only
            </Text>
          </View>
          <Text
            style={[
              theme.typography.bodySm,
              { color: theme.colors.textSecondary, marginTop: 4 },
            ]}
          >
            This account would be used for future contributions. No money has
            been moved yet.
          </Text>
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              theme.typography.subheading,
              { color: theme.colors.textPrimary },
            ]}
          >
            Select source account
          </Text>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, marginTop: 2 },
            ]}
          >
            Choose a verified account with sufficient balance to support your plan.
          </Text>
        </View>

        {/* Empty State if no eligible accounts */}
        {eligibleAccounts.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Icon name="alert-circle" size={32} color={theme.colors.warning} />
            <Text
              style={[
                theme.typography.bodyMedium,
                {
                  color: theme.colors.textPrimary,
                  fontWeight: '600',
                  marginTop: 12,
                  textAlign: 'center',
                },
              ]}
            >
              No eligible funding accounts
            </Text>
            <Text
              style={[
                theme.typography.bodySm,
                {
                  color: theme.colors.textSecondary,
                  marginTop: 6,
                  textAlign: 'center',
                  marginBottom: 16,
                },
              ]}
            >
              No connected account is currently available for future contributions.
            </Text>
            <Button
              label="Manage Connected Accounts"
              variant="secondary"
              onPress={onManageConnectedAccounts}
              size="sm"
            />
          </View>
        ) : (
          <View style={styles.accountsList}>
            {accounts.map((account) => {
              const isSelected = selectedAccountId === account.id;
              const isEligible = account.isEligible;

              return (
                <Card
                  key={account.id}
                  variant="standard"
                  onPress={() => handleAccountPress(account)}
                  style={{
                    ...styles.accountCard,
                    backgroundColor: isSelected
                      ? theme.colors.primaryLight
                      : theme.colors.surface,
                    borderColor: isSelected
                      ? theme.colors.primary
                      : theme.colors.border,
                    opacity: isEligible ? 1 : 0.65,
                  }}
                  accessibilityLabel={`${account.institutionName}, ${account.accountType}, balance GH₵${account.balance}`}
                >
                  <View style={styles.accountRow}>
                    {/* Institution Icon */}
                    <View
                      style={[
                        styles.bankIconContainer,
                        {
                          backgroundColor: isSelected
                            ? theme.colors.primary
                            : theme.colors.surfaceElevated,
                        },
                      ]}
                    >
                      <Icon
                        name={account.icon || 'credit-card'}
                        size={20}
                        color={isSelected ? '#FFFFFF' : theme.colors.textSecondary}
                      />
                    </View>

                    {/* Account Info */}
                    <View style={styles.accountDetails}>
                      <View style={styles.accountNameRow}>
                        <Text
                          style={[
                            theme.typography.bodyMedium,
                            {
                              color: isSelected
                                ? theme.colors.primary
                                : theme.colors.textPrimary,
                              fontWeight: '600',
                            },
                          ]}
                        >
                          {account.institutionName}
                        </Text>
                        {!isEligible && (
                          <Badge
                            label="Disconnected"
                            tone="warning"
                            size="sm"
                          />
                        )}
                      </View>

                      <Text
                        style={[
                          theme.typography.caption,
                          { color: theme.colors.textSecondary, marginTop: 2 },
                        ]}
                      >
                        {account.accountType} • {account.maskedIdentifier}
                      </Text>

                      {isEligible ? (
                        <View style={styles.balanceRow}>
                          <Text
                            style={[
                              theme.typography.caption,
                              { color: theme.colors.textTertiary, marginRight: 6 },
                            ]}
                          >
                            Balance:
                          </Text>
                          <MoneyDisplay
                            amount={account.balance}
                            currency={account.currency}
                            size="sm"
                          />
                        </View>
                      ) : (
                        <View style={styles.disconnectedActions}>
                          <Text
                            style={[
                              theme.typography.caption,
                              { color: theme.colors.warning, marginTop: 4 },
                            ]}
                          >
                            {account.statusReason || 'Account connection needs renewal.'}
                          </Text>
                          <Pressable
                            onPress={onManageConnectedAccounts}
                            style={styles.reconnectLink}
                            accessibilityRole="button"
                            accessibilityLabel="Reconnect account in Connected Accounts"
                          >
                            <Text
                              style={[
                                theme.typography.caption,
                                { color: theme.colors.primary, fontWeight: '600' },
                              ]}
                            >
                              Reconnect in Connected Accounts →
                            </Text>
                          </Pressable>
                        </View>
                      )}
                    </View>

                    {/* Radio Indicator for eligible accounts */}
                    {isEligible && (
                      <View
                        style={[
                          styles.radioCircle,
                          {
                            borderColor: isSelected
                              ? theme.colors.primary
                              : theme.colors.borderStrong,
                          },
                        ]}
                      >
                        {isSelected && (
                          <View
                            style={[
                              styles.radioDot,
                              { backgroundColor: theme.colors.primary },
                            ]}
                          />
                        )}
                      </View>
                    )}
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* 3. FIXED BOTTOM CONTINUE BUTTON */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.border,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <Button
          label="Review Savings Plan"
          variant="primary"
          onPress={onContinue}
          disabled={!selectedAccount || !selectedAccount.isEligible}
          fullWidth={true}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  noticeCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noticeTitle: {
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sectionHeader: {
    marginBottom: 14,
  },
  accountsList: {
    gap: 10,
  },
  accountCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accountDetails: {
    flex: 1,
    paddingRight: 8,
  },
  accountNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingRight: 6,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  disconnectedActions: {
    marginTop: 4,
  },
  reconnectLink: {
    marginTop: 6,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
