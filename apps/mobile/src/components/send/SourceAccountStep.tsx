/**
 * TAMVA SourceAccountStep Component (Screen 1)
 *
 * Funding source selection screen.
 * Displays user's connected accounts with clear representation of eligibility.
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { FundingAccount } from '../../types/transfer';
import { ScreenHeader } from '../ui/ScreenHeader';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { BrandLogo } from '../ui/BrandLogo';
import { MoneyDisplay } from '../financial/MoneyDisplay';
import { MOCK_CUSTOMER_NAME } from '../../demo/data/mockTransferData';

export interface SourceAccountStepProps {
  accounts: FundingAccount[];
  selectedAccountId: string | null;
  onSelectAccount: (account: FundingAccount) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const SourceAccountStep: React.FC<SourceAccountStepProps> = ({
  accounts,
  selectedAccountId,
  onSelectAccount,
  onContinue,
  onBack,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const handleAccountPress = (account: FundingAccount) => {
    if (!account.isEligible) {
      haptics.warning();
      return;
    }
    haptics.selection();
    onSelectAccount(account);
  };

  const selectedAccount = accounts.find((acc) => acc.id === selectedAccountId);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 1. SCREEN HEADER */}
      <ScreenHeader
        title="Send money"
        subtitle="Select funding account"
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
              Sender Account
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
          <Badge label="Verified" tone="success" size="sm" />
        </View>

        {/* Section Label */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              theme.typography.subheading,
              { color: theme.colors.textPrimary, fontSize: 16, fontWeight: '600' },
            ]}
          >
            Connected Funding Sources
          </Text>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textTertiary },
            ]}
          >
            {accounts.filter((a) => a.isEligible).length} available
          </Text>
        </View>

        {/* Account Cards */}
        {accounts.map((account) => {
          const isSelected = account.id === selectedAccountId;
          const isEligible = account.isEligible;

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
              accessibilityLabel={`${account.institutionName} ${account.accountType}, balance ${account.balance} Cedis${
                !isEligible ? ', Ineligible for transfer' : ''
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

                  {/* Account Name & Type */}
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
                      {!isEligible && (
                        <Badge label="Ineligible" tone="neutral" size="sm" />
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

                  {/* Radio / Selection Indicator */}
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
                        name="lock"
                        size={16}
                        color={theme.colors.textTertiary}
                      />
                    )}
                  </View>
                </View>

                {/* Balance Row */}
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
                    Available balance:
                  </Text>
                  <MoneyDisplay
                    amount={account.balance}
                    currency={account.currency}
                    size="sm"
                  />
                </View>

                {/* Ineligible Explanation */}
                {!isEligible && Boolean(account.ineligibilityReason) && (
                  <View
                    style={[
                      styles.ineligibleNote,
                      { backgroundColor: theme.colors.backgroundAlt },
                    ]}
                  >
                    <Icon
                      name="info"
                      size={13}
                      color={theme.colors.textTertiary}
                    />
                    <Text
                      style={[
                        theme.typography.caption,
                        {
                          color: theme.colors.textSecondary,
                          fontSize: 11,
                          marginLeft: 6,
                          flex: 1,
                        },
                      ]}
                    >
                      {account.ineligibilityReason}
                    </Text>
                  </View>
                )}
              </Card>
            </Pressable>
          );
        })}
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
          accessibilityHint="Continues to recipient selection"
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
  ineligibleNote: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginTop: 8,
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
