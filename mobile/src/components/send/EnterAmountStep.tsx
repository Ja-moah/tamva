/**
 * TAMVA EnterAmountStep Component (Screen 3)
 *
 * Polished amount-entry experience featuring:
 * - Selected recipient & source account summary
 * - Live available balance reference
 * - Focal large currency input
 * - Quick amount suggestion chips (GH₵50, GH₵100, GH₵250, GH₵500, Max)
 * - Insufficient balance inline detection and guidance
 * - Optional note/reference field
 * - Tactile NumericKeypad integration
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { FundingAccount, TransferRecipient } from '../../types/transfer';
import { ScreenHeader } from '../ui/ScreenHeader';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Icon } from '../ui/Icon';
import { BrandLogo } from '../ui/BrandLogo';
import { MoneyDisplay } from '../financial/MoneyDisplay';
import { NumericKeypad } from './NumericKeypad';

export interface EnterAmountStepProps {
  sourceAccount: FundingAccount;
  recipient: TransferRecipient;
  initialAmount: number;
  initialNote: string;
  onContinue: (amount: number, note: string) => void;
  onBack: () => void;
}

export const EnterAmountStep: React.FC<EnterAmountStepProps> = ({
  sourceAccount,
  recipient,
  initialAmount,
  initialNote,
  onContinue,
  onBack,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  // Keep amount as raw string for clean keypad manipulation
  const [amountStr, setAmountStr] = useState(
    initialAmount > 0 ? initialAmount.toString() : ''
  );
  const [note, setNote] = useState(initialNote);

  const numericAmount = parseFloat(amountStr) || 0;
  const isInsufficient = numericAmount > sourceAccount.balance;
  const isValidAmount = numericAmount > 0 && !isInsufficient;

  // Keypad handlers
  const handleKeyPress = (key: string) => {
    if (key === '.') {
      if (amountStr.includes('.')) return;
      if (amountStr === '') {
        setAmountStr('0.');
        return;
      }
      setAmountStr((prev) => prev + '.');
      return;
    }

    // Limit decimal precision to 2 decimal places
    if (amountStr.includes('.')) {
      const parts = amountStr.split('.');
      if (parts[1] && parts[1].length >= 2) return;
    }

    // Prevent excessive leading zeros
    if (amountStr === '0') {
      setAmountStr(key);
      return;
    }

    // Prevent unrealistic amounts (> 100,000)
    if (amountStr.length >= 7) return;

    setAmountStr((prev) => prev + key);
  };

  const handleDelete = () => {
    setAmountStr((prev) => prev.slice(0, -1));
  };

  const handleQuickAmount = (val: number) => {
    haptics.selection();
    setAmountStr(val.toString());
  };

  const handleMaxAmount = () => {
    haptics.selection();
    setAmountStr(sourceAccount.balance.toString());
  };

  const handleProceed = () => {
    if (!isValidAmount) {
      haptics.warning();
      return;
    }
    haptics.selection();
    onContinue(numericAmount, note.trim());
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      {/* 1. SCREEN HEADER */}
      <ScreenHeader
        title="How much?"
        subtitle="Enter transfer amount"
        showBack={true}
        onBackPress={onBack}
        borderBottom={true}
      />

      {/* 2. SCROLLABLE MAIN CONTENT */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 16 },
        ]}
      >
        {/* Recipient & Account Context Strip */}
        <View
          style={[
            styles.contextStrip,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.contextItem}>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textTertiary, textTransform: 'uppercase' },
              ]}
            >
              Sending To
            </Text>
            <View style={styles.contextRow}>
              <BrandLogo
                name={recipient.institutionName}
                containerSize={24}
                shape="circle"
                fallbackIcon="user"
                fallbackBg={theme.colors.backgroundAlt}
              />
              <Text
                style={[
                  theme.typography.bodyMedium,
                  { color: theme.colors.textPrimary, fontWeight: '600', marginLeft: 6 },
                ]}
                numberOfLines={1}
              >
                {recipient.name}
              </Text>
            </View>
          </View>

          <View style={styles.contextDivider} />

          <View style={styles.contextItem}>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textTertiary, textTransform: 'uppercase' },
              ]}
            >
              From Account
            </Text>
            <Text
              style={[
                theme.typography.bodyMedium,
                { color: theme.colors.textPrimary, fontWeight: '600', marginTop: 2 },
              ]}
              numberOfLines={1}
            >
              {sourceAccount.institutionName} {sourceAccount.maskedIdentifier}
            </Text>
          </View>
        </View>

        {/* Available Balance Indicator */}
        <View style={styles.availableBalanceRow}>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textTertiary },
            ]}
          >
            Available balance:{' '}
          </Text>
          <MoneyDisplay
            amount={sourceAccount.balance}
            currency={sourceAccount.currency}
            size="sm"
          />
        </View>

        {/* FOCAL AMOUNT DISPLAY */}
        <View style={styles.amountDisplayContainer}>
          <Text
            style={[
              styles.currencySymbol,
              { color: theme.colors.textSecondary },
            ]}
          >
            GH₵
          </Text>
          <Text
            style={[
              styles.amountText,
              {
                color: isInsufficient
                  ? theme.colors.danger
                  : amountStr
                  ? theme.colors.textPrimary
                  : theme.colors.textTertiary,
              },
            ]}
            numberOfLines={1}
            adjustsFontSizeToFit={true}
          >
            {amountStr ? amountStr : '0.00'}
          </Text>
        </View>

        {/* Insufficient Funds Warning */}
        {isInsufficient && (
          <View
            style={[
              styles.insufficientBanner,
              { backgroundColor: theme.colors.dangerLight },
            ]}
          >
            <Icon name="alert-circle" size={14} color={theme.colors.danger} />
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.danger, marginLeft: 6 },
              ]}
            >
              Amount exceeds available balance of GH₵
              {sourceAccount.balance.toLocaleString('en-US', {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
        )}

        {/* Quick Amount Suggestion Chips */}
        <View style={styles.quickChipsRow}>
          {[50, 100, 250, 500].map((val) => (
            <Chip
              key={`chip-${val}`}
              label={`GH₵${val}`}
              selected={numericAmount === val}
              onPress={() => handleQuickAmount(val)}
            />
          ))}
          <Chip
            label="Max"
            selected={numericAmount === sourceAccount.balance}
            onPress={handleMaxAmount}
          />
        </View>

        {/* Transfer Note / Purpose Input */}
        <View style={styles.noteInputContainer}>
          <View
            style={[
              styles.noteInputWrapper,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <Icon
              name="edit"
              size={16}
              color={theme.colors.textTertiary}
            />
            <TextInput
              placeholder="What's this for? (e.g. Rent, Groceries)"
              placeholderTextColor={theme.colors.textTertiary}
              value={note}
              onChangeText={setNote}
              maxLength={40}
              style={[styles.noteTextInput, { color: theme.colors.textPrimary }]}
            />
            {Boolean(note) && (
              <Pressable
                onPress={() => setNote('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Icon name="x" size={14} color={theme.colors.textTertiary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Numeric Keypad */}
        <View style={styles.keypadWrapper}>
          <NumericKeypad
            onKeyPress={handleKeyPress}
            onDelete={handleDelete}
            mode="amount"
          />
        </View>

        {/* Continue Button */}
        <View style={styles.ctaWrapper}>
          <Button
            label="Continue"
            variant="primary"
            size="lg"
            fullWidth={true}
            disabled={!isValidAmount}
            rightIcon="arrow-right"
            onPress={handleProceed}
            accessibilityHint="Continues to review screen"
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  contextStrip: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  contextItem: {
    flex: 1,
  },
  contextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  contextDivider: {
    width: 1,
    backgroundColor: '#E5E9EF',
    marginHorizontal: 12,
  },
  availableBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6,
  },
  amountDisplayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    paddingHorizontal: 12,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    marginRight: 6,
  },
  amountText: {
    fontSize: 44,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
    letterSpacing: -1,
  },
  insufficientBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 10,
  },
  quickChipsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
    flexWrap: 'wrap',
  },
  noteInputContainer: {
    marginBottom: 8,
  },
  noteInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
  },
  noteTextInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  keypadWrapper: {
    marginVertical: 6,
  },
  ctaWrapper: {
    marginTop: 8,
  },
});
