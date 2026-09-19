/**
 * TAMVA ReceivingAccountStep Component (Step 1 & 2)
 *
 * Account selection screen for receiving money:
 * - Clear explanation that money will be received into user's connected account
 * - Highlighting of eligible active accounts
 * - Clear representation of disconnected accounts with explanation
 * - Safe empty state if no accounts are connected
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { ReceivingAccount } from '../../types/receive';
import { ScreenHeader } from '../ui/ScreenHeader';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { BrandLogo } from '../ui/BrandLogo';
import { MoneyDisplay } from '../financial/MoneyDisplay';
import { MOCK_CUSTOMER_NAME } from '../../demo/data/mockReceiveData';

export interface ReceivingAccountStepProps {
  accounts: ReceivingAccount[];
  selectedAccountId: string | null;
  onSelectAccount: (account: ReceivingAccount) => void;
  onContinue: () => void;
  onManageConnectedAccounts: () => void;
  onBack: () => void;
}

export const ReceivingAccountStep: React.FC<ReceivingAccountStepProps> = ({
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

  const handleAccountPress = (account: ReceivingAccount) => {
    if (!account.isEligible) {
      haptics.warning();
      return;
    }
    haptics.selection();
    onSelectAccount(account);
  };

  const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId);
  const eligibleAccounts = accounts.filter((a) => a.isEligible);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 1. SCREEN HEADER */}
      <ScreenHeader
        title="Receive Money"
        subtitle="Receive money into one of your connected accounts"
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
        {/* Customer Context Card */}
        <View
          style={[
            styles.customerBanner,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.avatarContainer,
              { backgroundColor: theme.colors.primaryLight },
            ]}
          >
            <Icon name="user" size={18} color={theme.colors.primary} />
          </View>
          <View style={styles.customerInfo}>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textTertiary, textTransform: 'uppercase' },
              ]}
            >
              Beneficiary
            </Text>
            <Text
              style={[
                theme.typography.bodyMedium,
                { color: theme.colors.textPrimary, fontWeight: '600' },
              ]}
            >
              {MOCK_CUSTOMER_NAME}
            </Text>
          </View>
          <Badge label="Verified Account" tone="success" size="sm" />
        </View>

        {/* Section Header */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              theme.typography.subheading,
              { color: theme.colors.textPrimary, fontSize: 16, fontWeight: '600' },
            ]}
          >
            Choose Receiving Account
          </Text>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textTertiary },
            ]}
          >
            {eligibleAccounts.length} eligible
          </Text>
        </View>

        {/* Empty State if no eligible accounts */}
        {accounts.length === 0 ? (
          <Card variant="outlined" style={styles.emptyCard}>
            <Icon name="alert-circle" size={32} color={theme.colors.textTertiary} />
            <Text
              style={[
                theme.typography.heading,
                { color: theme.colors.textPrimary, marginTop: 12, textAlign: 'center' },
              ]}
            >
              No eligible accounts
            </Text>
            <Text
              style={[
                theme.typography.bodyMedium,
                {
                  color: theme.colors.textSecondary,
                  textAlign: 'center',
                  marginTop: 6,
                  marginBottom: 16,
                },
              ]}
            >
              No connected account is currently available to receive money.
            </Text>
            <Button
              label="Connected Accounts"
              variant="secondary"
              size="md"
              onPress={onManageConnectedAccounts}
            />
          </Card>
        ) : (
          accounts.map((account) => {
            const isSelected = account.id === selectedAccountId;
            const isEligible = account.isEligible;
            const isDisconnected = account.status === 'disconnected';

            return (
              <Pressable
                key={account.id}
                onPress={() => handleAccountPress(account)}
                disabled={!isEligible}
                style={({ pressed }) => [
                  styles.accountCardWrapper,
                  { opacity: !isEligible ? 0.65 : pressed ? 0.95 : 1 },
                ]}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected, disabled: !isEligible }}
                accessibilityLabel={`${account.institutionName} ${account.accountType}, ${
                  isDisconnected ? 'Disconnected' : `balance ${account.balance} Cedis`
                }`}
              >
                <Card
                  variant={isSelected ? 'elevated' : 'outlined'}
                  style={
                    isSelected
                      ? {
                          ...styles.accountCard,
                          borderColor: theme.colors.primary,
                          borderWidth: 2,
                          backgroundColor: theme.colors.surface,
                        }
                      : styles.accountCard
                  }
                >
                  <View style={styles.accountRow}>
                    {/* Brand Logo */}
                    <BrandLogo
                      name={account.institutionName}
                      containerSize={44}
                      shape="rounded"
                      fallbackIcon={account.icon || 'credit-card'}
                      fallbackBg={theme.colors.backgroundAlt}
                      fallbackIconColor={theme.colors.textPrimary}
                    />

                    {/* Account Details */}
                    <View style={styles.accountDetails}>
                      <View style={styles.accountTitleRow}>
                        <Text
                          style={[
                            theme.typography.bodyMedium,
                            {
                              color: isEligible
                                ? theme.colors.textPrimary
                                : theme.colors.textSecondary,
                              fontWeight: '600',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {account.institutionName}
                        </Text>
                        {isDisconnected && (
                          <Badge label="Disconnected" tone="warning" size="sm" />
                        )}
                      </View>

                      <Text
                        style={[
                          theme.typography.caption,
                          { color: theme.colors.textTertiary, marginTop: 2 },
                        ]}
                        numberOfLines={1}
                      >
                        {account.accountType} • {account.maskedIdentifier}
                      </Text>
                    </View>

                    {/* Selection Indicator */}
                    <View style={styles.rightActionColumn}>
                      {isEligible ? (
                        <View
                          style={[
                            styles.radioCircle,
                            {
                              borderColor: isSelected
                                ? theme.colors.primary
                                : theme.colors.border,
                              backgroundColor: isSelected
                                ? theme.colors.primary
                                : 'transparent',
                            },
                          ]}
                        >
                          {isSelected && (
                            <Icon name="check" size={14} color="#FFFFFF" />
                          )}
                        </View>
                      ) : (
                        <Icon
                          name="alert-circle"
                          size={16}
                          color={theme.colors.warning}
                        />
                      )}
                    </View>
                  </View>

                  {/* Balance / Status Row */}
                  {isEligible ? (
                    <View
                      style={[
                        styles.balanceRow,
                        { borderTopColor: theme.colors.border },
                      ]}
                    >
                      <Text
                        style={[
                          theme.typography.caption,
                          { color: theme.colors.textTertiary },
                        ]}
                      >
                        Current balance:
                      </Text>
                      <MoneyDisplay
                        amount={account.balance}
                        currency={account.currency}
                        size="sm"
                      />
                    </View>
                  ) : (
                    <View
                      style={[
                        styles.disconnectedNote,
                        { backgroundColor: theme.colors.backgroundAlt },
                      ]}
                    >
                      <Text
                        style={[
                          theme.typography.caption,
                          { color: theme.colors.textSecondary, flex: 1 },
                        ]}
                      >
                        {account.statusReason ||
                          'Account is currently unavailable for receiving funds.'}
                      </Text>
                      <Pressable
                        onPress={onManageConnectedAccounts}
                        style={styles.reconnectButton}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text
                          style={[
                            theme.typography.captionMedium,
                            { color: theme.colors.primary, fontWeight: '600' },
                          ]}
                        >
                          Reconnect
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </Card>
              </Pressable>
            );
          })
        )}
      </ScrollView>

      {/* 3. FIXED BOTTOM BAR */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.colors.surface,
            borderTopColor: theme.colors.border,
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <Button
          label="Continue"
          variant="primary"
          size="lg"
          fullWidth={true}
          disabled={!selectedAccount}
          rightIcon="arrow-right"
          onPress={onContinue}
          accessibilityHint="Proceeds to your receiving details"
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
  customerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  emptyCard: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountCardWrapper: {
    marginBottom: 12,
  },
  accountCard: {
    padding: 16,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accountDetails: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  accountTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rightActionColumn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
  },
  radioCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  disconnectedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  reconnectButton: {
    marginLeft: 8,
    paddingVertical: 2,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
