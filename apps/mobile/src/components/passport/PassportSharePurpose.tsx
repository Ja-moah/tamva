/**
 * TAMVA PassportSharePurpose Component
 *
 * Step 1 of the Share Financial Passport flow.
 * Lets the user select why they are preparing this share.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { Icon } from '../ui/Icon';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PassportSharePurposeId } from '../../types/passport';
import { PASSPORT_SHARE_PURPOSES } from '../../demo/data/mockPassportData';

export interface PassportSharePurposeProps {
  selectedPurposeId: PassportSharePurposeId;
  onSelectPurpose: (id: PassportSharePurposeId) => void;
  customNote: string;
  onChangeCustomNote: (text: string) => void;
  onContinue: () => void;
}

export const PassportSharePurpose: React.FC<PassportSharePurposeProps> = ({
  selectedPurposeId,
  onSelectPurpose,
  customNote,
  onChangeCustomNote,
  onContinue,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  const handleSelect = (id: PassportSharePurposeId) => {
    haptics.selection();
    onSelectPurpose(id);
  };

  return (
    <View style={styles.container}>
      <Text
        style={[
          theme.typography.caption,
          { color: theme.colors.textSecondary, marginBottom: 16, lineHeight: 18 },
        ]}
      >
        Select the primary reason for preparing this Passport share. Only data
        relevant to your chosen purpose should be authorized.
      </Text>

      {/* Purpose Selection List */}
      <View style={styles.list}>
        {PASSPORT_SHARE_PURPOSES.map((purpose) => {
          const isSelected = selectedPurposeId === purpose.id;

          return (
            <Pressable
              key={purpose.id}
              onPress={() => handleSelect(purpose.id)}
              style={({ pressed }) => [
                styles.rowItem,
                {
                  backgroundColor: isSelected
                    ? theme.colors.primaryLight
                    : theme.colors.surface,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.border,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${purpose.label}: ${purpose.description}`}
            >
              <View
                style={[
                  styles.iconBox,
                  {
                    backgroundColor: isSelected
                      ? theme.colors.surface
                      : theme.colors.backgroundAlt,
                  },
                ]}
              >
                <Icon
                  name={purpose.icon}
                  size={16}
                  color={
                    isSelected ? theme.colors.primary : theme.colors.textPrimary
                  }
                />
              </View>

              <View style={styles.textContainer}>
                <Text
                  style={[
                    theme.typography.bodyMedium,
                    {
                      color: theme.colors.textPrimary,
                      fontWeight: isSelected ? '600' : '500',
                      fontSize: 14,
                    },
                  ]}
                >
                  {purpose.label}
                </Text>
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textSecondary, marginTop: 2 },
                  ]}
                >
                  {purpose.description}
                </Text>
              </View>

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
                  <View style={styles.radioInnerDot} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Custom Note input if 'other' purpose is selected */}
      {selectedPurposeId === 'other' && (
        <View style={styles.customNoteWrapper}>
          <Input
            label="Custom Purpose Description"
            placeholder="e.g. Visa application or private agreement"
            value={customNote}
            onChangeText={onChangeCustomNote}
            helperText="Optional context to help identify this share."
            maxLength={80}
          />
        </View>
      )}

      {/* Disclaimers & Continue Action */}
      <View style={styles.footer}>
        <View
          style={[
            styles.noticeBox,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Icon
            name="info"
            size={13}
            color={theme.colors.textTertiary}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, fontSize: 11, flex: 1 },
            ]}
          >
            TAMVA provides consented data presentation and does not guarantee
            third-party verification outcomes.
          </Text>
        </View>

        <Button
          label="Continue to Information"
          onPress={onContinue}
          variant="primary"
          size="lg"
          rightIcon="arrow-right"
          fullWidth
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 24,
  },
  list: {
    width: '100%',
    gap: 8,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 60,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  customNoteWrapper: {
    marginTop: 12,
  },
  footer: {
    marginTop: 16,
    width: '100%',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
});
