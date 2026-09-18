/**
 * TAMVA RequestAmountModal Component
 *
 * Lightweight bottom sheet for optional amount & note request:
 * - Quick amount suggestion chips
 * - Decimal amount input
 * - Purpose note input
 * - Clean save and clear actions
 */

import React, { startTransition, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { Icon } from '../ui/Icon';

export interface RequestAmountModalProps {
  visible: boolean;
  initialAmount?: number;
  initialNote?: string;
  onSave: (amount?: number, note?: string) => void;
  onClear: () => void;
  onClose: () => void;
}

export const RequestAmountModal: React.FC<RequestAmountModalProps> = ({
  visible,
  initialAmount,
  initialNote,
  onSave,
  onClear,
  onClose,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  const [amountStr, setAmountStr] = useState(
    initialAmount ? initialAmount.toString() : ''
  );
  const [note, setNote] = useState(initialNote || '');

  useEffect(() => {
    if (visible) {
      startTransition(() => {
        setAmountStr(initialAmount ? initialAmount.toString() : '');
        setNote(initialNote || '');
      });
    }
  }, [visible, initialAmount, initialNote]);

  const handleQuickChip = (val: number) => {
    haptics.selection();
    setAmountStr(val.toString());
  };

  const handleSave = () => {
    haptics.selection();
    const num = parseFloat(amountStr);
    if (num && num > 0) {
      onSave(num, note.trim() || undefined);
    } else {
      onClear();
    }
    onClose();
  };

  const handleClear = () => {
    haptics.selection();
    setAmountStr('');
    setNote('');
    onClear();
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Request a specific amount"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, marginBottom: 12 },
          ]}
        >
          Add an optional amount and purpose note to your receiving details.
        </Text>

        {/* Amount Input */}
        <View
          style={[
            styles.inputWrapper,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Text
            style={[
              theme.typography.bodyMedium,
              { color: theme.colors.textSecondary, fontWeight: '600' },
            ]}
          >
            GH₵
          </Text>
          <TextInput
            placeholder="0.00"
            placeholderTextColor={theme.colors.textTertiary}
            value={amountStr}
            onChangeText={setAmountStr}
            keyboardType="decimal-pad"
            style={[styles.amountInput, { color: theme.colors.textPrimary }]}
          />
        </View>

        {/* Quick Amount Suggestion Chips */}
        <View style={styles.chipsRow}>
          {[50, 100, 250, 500, 1000].map((val) => (
            <Chip
              key={`quick-${val}`}
              label={`GH₵${val}`}
              selected={amountStr === val.toString()}
              onPress={() => handleQuickChip(val)}
            />
          ))}
        </View>

        {/* Note / Purpose Input */}
        <View
          style={[
            styles.noteWrapper,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderColor: theme.colors.border,
              marginTop: 14,
            },
          ]}
        >
          <Icon name="edit" size={16} color={theme.colors.textTertiary} />
          <TextInput
            placeholder="What is this for? (e.g. School fees, Lunch)"
            placeholderTextColor={theme.colors.textTertiary}
            value={note}
            onChangeText={setNote}
            maxLength={40}
            style={[styles.noteInput, { color: theme.colors.textPrimary }]}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            label="Save Request"
            variant="primary"
            size="lg"
            fullWidth={true}
            onPress={handleSave}
          />

          {Boolean(initialAmount) && (
            <View style={{ marginTop: 8 }}>
              <Button
                label="Remove Amount Request"
                variant="tertiary"
                size="md"
                fullWidth={true}
                onPress={handleClear}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 52,
  },
  amountInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'PlusJakartaSans_700Bold',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  noteWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 48,
  },
  noteInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans_500Medium',
  },
  actionButtons: {
    marginTop: 20,
  },
});
