/**
 * TAMVA SavingsTargetStep Component (Step 2)
 *
 * Target configuration screen:
 * - Displays selected goal name and icon
 * - "How much do you want to save?"
 * - Editable target amount with currency prefix
 * - Quick suggestion chips: GH₵500, GH₵1,000, GH₵2,500, GH₵5,000, GH₵10,000
 * - Optional target date selection (presets or open-ended)
 * - Validation preventing zero or negative amounts
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { FeatherIconName } from '../../constants/icons';
import { ScreenHeader } from '../ui/ScreenHeader';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Icon } from '../ui/Icon';
import {
  QUICK_TARGET_AMOUNTS,
  TARGET_DATE_PRESETS,
  getPresetTargetDate,
  formatTargetDate,
} from '../../demo/data/mockSaveData';

export interface SavingsTargetStepProps {
  goalName: string;
  goalDescription: string;
  goalIcon: FeatherIconName;
  initialAmount: number;
  initialTargetDate?: string;
  onContinue: (amount: number, targetDate?: string) => void;
  onBack: () => void;
}

export const SavingsTargetStep: React.FC<SavingsTargetStepProps> = ({
  goalName,
  goalDescription,
  goalIcon,
  initialAmount,
  initialTargetDate,
  onContinue,
  onBack,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const haptics = useHaptics();

  const [amountStr, setAmountStr] = useState(
    initialAmount > 0 ? initialAmount.toString() : ''
  );
  const [targetDate, setTargetDate] = useState<string | undefined>(
    initialTargetDate
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleQuickAmount = (val: number) => {
    haptics.selection();
    setAmountStr(val.toString());
    if (errorMessage) setErrorMessage(null);
  };

  const handlePresetDate = (monthsAhead: number) => {
    haptics.selection();
    const newDate = getPresetTargetDate(monthsAhead);
    if (targetDate && formatTargetDate(targetDate) === formatTargetDate(newDate)) {
      setTargetDate(undefined); // Toggle off
    } else {
      setTargetDate(newDate);
    }
  };

  const handleContinue = () => {
    const num = parseFloat(amountStr.replace(/,/g, ''));
    if (isNaN(num) || num <= 0) {
      setErrorMessage('Please enter a target amount greater than GH₵0');
      haptics.warning();
      return;
    }
    if (num > 1000000) {
      setErrorMessage('Target amount cannot exceed GH₵1,000,000');
      haptics.warning();
      return;
    }

    haptics.selection();
    onContinue(num, targetDate);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* 1. SCREEN HEADER */}
      <ScreenHeader
        title="Set Target"
        subtitle={goalName}
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
        keyboardShouldPersistTaps="handled"
      >
        {/* Goal Badge Banner */}
        <View
          style={[
            styles.goalBanner,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View
            style={[
              styles.goalIconCircle,
              { backgroundColor: theme.colors.primaryLight },
            ]}
          >
            <Icon name={goalIcon} size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.goalInfo}>
            <Text
              style={[
                theme.typography.bodyMedium,
                { color: theme.colors.textPrimary, fontWeight: '700' },
              ]}
            >
              {goalName}
            </Text>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, marginTop: 2 },
              ]}
            >
              {goalDescription}
            </Text>
          </View>
        </View>

        {/* Amount Input Section */}
        <View style={styles.section}>
          <Text
            style={[
              theme.typography.heading,
              { color: theme.colors.textPrimary, marginBottom: 4 },
            ]}
          >
            How much do you want to save?
          </Text>
          <Text
            style={[
              theme.typography.bodySm,
              { color: theme.colors.textSecondary, marginBottom: 16 },
            ]}
          >
            Enter your total savings target in Ghanaian Cedis (GH₵).
          </Text>

          <View
            style={[
              styles.amountContainer,
              {
                backgroundColor: theme.colors.surface,
                borderColor: errorMessage ? theme.colors.danger : theme.colors.border,
              },
            ]}
          >
            <Text
              style={[
                styles.currencyPrefix,
                { color: theme.colors.textTertiary },
              ]}
            >
              GH₵
            </Text>
            <TextInput
              style={[
                styles.amountInput,
                { color: theme.colors.textPrimary },
              ]}
              placeholder="0.00"
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="numeric"
              value={amountStr}
              onChangeText={(text) => {
                setAmountStr(text);
                if (errorMessage) setErrorMessage(null);
              }}
              autoFocus={amountStr === ''}
            />
          </View>

          {errorMessage && (
            <Text style={[theme.typography.caption, { color: theme.colors.danger, marginTop: 6 }]}>
              {errorMessage}
            </Text>
          )}

          {/* Quick Amount Suggestion Chips */}
          <View style={styles.quickChipsWrapper}>
            <Text
              style={[
                theme.typography.caption,
                styles.quickChipLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Quick suggestions:
            </Text>
            <View style={styles.chipsRow}>
              {QUICK_TARGET_AMOUNTS.map((val) => (
                <Chip
                  key={val}
                  label={`GH₵${val >= 1000 ? `${val / 1000}k` : val}`}
                  selected={amountStr === val.toString()}
                  onPress={() => handleQuickAmount(val)}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Target Date Section */}
        <View style={styles.section}>
          <View style={styles.dateHeaderRow}>
            <View>
              <Text
                style={[
                  theme.typography.bodyMedium,
                  { color: theme.colors.textPrimary, fontWeight: '600' },
                ]}
              >
                Target timeframe (optional)
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, marginTop: 2 },
                ]}
              >
                Select when you want to achieve this goal.
              </Text>
            </View>
            {targetDate && (
              <View
                style={[
                  styles.selectedDateBadge,
                  { backgroundColor: theme.colors.primaryLight },
                ]}
              >
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.primary, fontWeight: '700' },
                  ]}
                >
                  {formatTargetDate(targetDate)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.datePresetsGrid}>
            {TARGET_DATE_PRESETS.map((preset) => {
              const dateForPreset = getPresetTargetDate(preset.monthsAhead);
              const isSelected =
                targetDate && formatTargetDate(targetDate) === formatTargetDate(dateForPreset);

              return (
                <Pressable
                  key={preset.id}
                  onPress={() => handlePresetDate(preset.monthsAhead)}
                  style={[
                    styles.datePresetCard,
                    {
                      backgroundColor: isSelected
                        ? theme.colors.primaryLight
                        : theme.colors.surface,
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      theme.typography.bodySm,
                      {
                        color: isSelected
                          ? theme.colors.primary
                          : theme.colors.textPrimary,
                        fontWeight: isSelected ? '600' : '500',
                      },
                    ]}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
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
          label="Continue to Plan"
          variant="primary"
          onPress={handleContinue}
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
  goalBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  goalIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  goalInfo: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 60,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  currencyPrefix: {
    fontSize: 20,
    fontWeight: '700',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: '700',
  },
  quickChipsWrapper: {
    marginTop: 12,
  },
  quickChipLabel: {
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectedDateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  datePresetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  datePresetCard: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
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
