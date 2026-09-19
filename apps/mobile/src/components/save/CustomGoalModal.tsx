/**
 * TAMVA CustomGoalModal Component
 *
 * Lightweight bottom sheet modal for creating a custom savings goal:
 * - Goal name input (required)
 * - Target amount input (required, > 0)
 * - Optional target date selection
 * - Quick amount suggestion chips
 * - Immediate inline validation
 */

import React, { startTransition, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
} from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import {
  QUICK_TARGET_AMOUNTS,
  TARGET_DATE_PRESETS,
  getPresetTargetDate,
  formatTargetDate,
} from '../../demo/data/mockSaveData';

export interface CustomGoalData {
  name: string;
  targetAmount: number;
  targetDate?: string;
}

export interface CustomGoalModalProps {
  visible: boolean;
  onSave: (goal: CustomGoalData) => void;
  onClose: () => void;
}

export const CustomGoalModal: React.FC<CustomGoalModalProps> = ({
  visible,
  onSave,
  onClose,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  const [name, setName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [targetDate, setTargetDate] = useState<string | undefined>(undefined);

  const [nameError, setNameError] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      startTransition(() => {
        setName('');
        setAmountStr('');
        setSelectedPresetId(null);
        setTargetDate(undefined);
        setNameError(null);
        setAmountError(null);
      });
    }
  }, [visible]);

  const handleQuickAmount = (val: number) => {
    haptics.selection();
    setAmountStr(val.toString());
    setAmountError(null);
  };

  const handlePresetDate = (presetId: string, monthsAhead: number) => {
    haptics.selection();
    if (selectedPresetId === presetId) {
      setSelectedPresetId(null);
      setTargetDate(undefined);
    } else {
      setSelectedPresetId(presetId);
      setTargetDate(getPresetTargetDate(monthsAhead));
    }
  };

  const handleSave = () => {
    let isValid = true;

    if (!name.trim()) {
      setNameError('Goal name is required');
      isValid = false;
    } else {
      setNameError(null);
    }

    const parsedAmount = parseFloat(amountStr.replace(/,/g, ''));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setAmountError('Target amount must be greater than GH₵0');
      isValid = false;
    } else if (parsedAmount > 1000000) {
      setAmountError('Target amount cannot exceed GH₵1,000,000');
      isValid = false;
    } else {
      setAmountError(null);
    }

    if (!isValid) {
      haptics.warning();
      return;
    }

    haptics.success();
    onSave({
      name: name.trim(),
      targetAmount: parsedAmount,
      targetDate,
    });
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Create Custom Goal"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, marginBottom: 16 },
          ]}
        >
          Define your personalized savings goal and target amount.
        </Text>

        {/* 1. GOAL NAME */}
        <View style={styles.inputGroup}>
          <Text
            style={[
              theme.typography.caption,
              styles.inputLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Goal Name *
          </Text>
          <TextInput
            style={[
              styles.textInput,
              {
                backgroundColor: theme.colors.surface,
                borderColor: nameError ? theme.colors.danger : theme.colors.border,
                color: theme.colors.textPrimary,
              },
            ]}
            placeholder="e.g. New Laptop, Home Renovation"
            placeholderTextColor={theme.colors.textTertiary}
            value={name}
            onChangeText={(text) => {
              setName(text);
              if (nameError) setNameError(null);
            }}
            maxLength={40}
          />
          {nameError && (
            <Text style={[theme.typography.caption, { color: theme.colors.danger, marginTop: 4 }]}>
              {nameError}
            </Text>
          )}
        </View>

        {/* 2. TARGET AMOUNT */}
        <View style={styles.inputGroup}>
          <Text
            style={[
              theme.typography.caption,
              styles.inputLabel,
              { color: theme.colors.textSecondary },
            ]}
          >
            Target Amount (GH₵) *
          </Text>
          <View
            style={[
              styles.amountInputContainer,
              {
                backgroundColor: theme.colors.surface,
                borderColor: amountError ? theme.colors.danger : theme.colors.border,
              },
            ]}
          >
            <Text
              style={[
                theme.typography.bodyMedium,
                { color: theme.colors.textTertiary, marginRight: 8, fontWeight: '600' },
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
                if (amountError) setAmountError(null);
              }}
            />
          </View>
          {amountError && (
            <Text style={[theme.typography.caption, { color: theme.colors.danger, marginTop: 4 }]}>
              {amountError}
            </Text>
          )}

          {/* Quick Amount Chips */}
          <View style={styles.quickChipsContainer}>
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

        {/* 3. OPTIONAL TARGET DATE */}
        <View style={styles.inputGroup}>
          <View style={styles.dateLabelRow}>
            <Text
              style={[
                theme.typography.caption,
                styles.inputLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Target Date (Optional)
            </Text>
            {targetDate && (
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.primary, fontWeight: '600' },
                ]}
              >
                {formatTargetDate(targetDate)}
              </Text>
            )}
          </View>

          <View style={styles.datePresetsRow}>
            {TARGET_DATE_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <Pressable
                  key={preset.id}
                  onPress={() => handlePresetDate(preset.id, preset.monthsAhead)}
                  style={[
                    styles.dateChip,
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
                      theme.typography.caption,
                      {
                        color: isSelected
                          ? theme.colors.primary
                          : theme.colors.textSecondary,
                        fontWeight: isSelected ? '600' : '400',
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

        {/* ACTION BUTTONS */}
        <View style={styles.actionButtons}>
          <Button
            label="Create Goal"
            variant="primary"
            onPress={handleSave}
            fullWidth={true}
          />
          <Button
            label="Cancel"
            variant="tertiary"
            onPress={onClose}
            fullWidth={true}
            style={{ marginTop: 8 }}
          />
        </View>
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 4,
    paddingBottom: 24,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  textInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  quickChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  dateLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  datePresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  actionButtons: {
    marginTop: 12,
  },
});
