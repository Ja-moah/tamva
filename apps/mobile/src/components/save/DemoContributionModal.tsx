/**
 * TAMVA DemoContributionModal Component
 *
 * Clearly marked development/QA modal to demonstrate future progress updates:
 * - Allows testing adding mock funds (e.g. GH₵500)
 * - Prominent disclaimer: "Demo only — no real money was moved."
 * - Updates plan progress in local session memory
 * - Clear confirmation feedback
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Icon } from '../ui/Icon';

export interface DemoContributionModalProps {
  visible: boolean;
  goalName: string;
  onConfirm: (amount: number) => void;
  onClose: () => void;
}

const DEMO_CHIPS = [100, 250, 500, 1000];

export const DemoContributionModal: React.FC<DemoContributionModalProps> = ({
  visible,
  goalName,
  onConfirm,
  onClose,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  const [amountStr, setAmountStr] = useState('500');
  const [recordedSuccess, setRecordedSuccess] = useState<number | null>(null);

  const handleChip = (val: number) => {
    haptics.selection();
    setAmountStr(val.toString());
  };

  const handleApply = () => {
    const num = parseFloat(amountStr.replace(/,/g, ''));
    if (isNaN(num) || num <= 0) {
      haptics.warning();
      return;
    }

    haptics.success();
    setRecordedSuccess(num);
    onConfirm(num);
  };

  const handleDone = () => {
    setRecordedSuccess(null);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={handleDone}
      title="Demo Contribution"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {recordedSuccess !== null ? (
          /* Confirmation State */
          <View style={styles.successState}>
            <View
              style={[
                styles.successIconCircle,
                { backgroundColor: theme.colors.primaryLight },
              ]}
            >
              <Icon name="check-circle" size={40} color={theme.colors.primary} />
            </View>

            <Text
              style={[
                theme.typography.subheading,
                { color: theme.colors.textPrimary, marginTop: 12, textAlign: 'center' },
              ]}
            >
              Demo contribution recorded
            </Text>

            <Text
              style={[
                theme.typography.bodyMedium,
                { color: theme.colors.textSecondary, marginTop: 4, textAlign: 'center' },
              ]}
            >
              GH₵{recordedSuccess.toLocaleString('en-US', { minimumFractionDigits: 2 })} added to {goalName}.
            </Text>

            <View
              style={[
                styles.disclaimerBanner,
                { backgroundColor: theme.colors.surfaceElevated, borderColor: theme.colors.border },
              ]}
            >
              <Icon name="info" size={16} color={theme.colors.primary} />
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, marginLeft: 8, flex: 1 },
                ]}
              >
                Demo only — no real money was moved.
              </Text>
            </View>

            <Button
              label="Close"
              variant="primary"
              onPress={handleDone}
              fullWidth={true}
              style={{ marginTop: 20 }}
            />
          </View>
        ) : (
          /* Input State */
          <View>
            <View
              style={[
                styles.disclaimerBanner,
                {
                  backgroundColor: theme.colors.surfaceElevated,
                  borderColor: theme.colors.border,
                  marginBottom: 16,
                },
              ]}
            >
              <Icon name="info" size={16} color={theme.colors.primary} />
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, marginLeft: 8, flex: 1 },
                ]}
              >
                Demo only — no real money was moved. Test local progress updates.
              </Text>
            </View>

            <Text
              style={[
                theme.typography.caption,
                styles.fieldLabel,
                { color: theme.colors.textSecondary },
              ]}
            >
              Contribution Amount (GH₵)
            </Text>

            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.currencyLabel,
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
                placeholder="500"
                placeholderTextColor={theme.colors.textTertiary}
                keyboardType="numeric"
                value={amountStr}
                onChangeText={setAmountStr}
              />
            </View>

            {/* Quick Chips */}
            <View style={styles.chipsRow}>
              {DEMO_CHIPS.map((chip) => (
                <Chip
                  key={chip}
                  label={`GH₵${chip}`}
                  selected={amountStr === chip.toString()}
                  onPress={() => handleChip(chip)}
                />
              ))}
            </View>

            {/* Submit CTA */}
            <View style={styles.actions}>
              <Button
                label="Record Demo Contribution"
                variant="primary"
                onPress={handleApply}
                fullWidth={true}
              />
              <Button
                label="Cancel"
                variant="tertiary"
                onPress={handleDone}
                fullWidth={true}
                style={{ marginTop: 8 }}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 4,
    paddingBottom: 20,
  },
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  fieldLabel: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    marginBottom: 20,
  },
  actions: {
    marginTop: 8,
  },
  successState: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
