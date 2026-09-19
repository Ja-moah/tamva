/**
 * TAMVA ConsentDurationSelector Component
 *
 * Clean selector for access duration authorization:
 * - 30 Days (1 month)
 * - 90 Days (Recommended default)
 * - 1 Year (Annual authorization)
 * - Until Revoked (Until user explicitly disconnects)
 *
 * Full accessibility radio roles and tactile haptic feedback.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { ConsentDuration } from '../../types/accounts';
import { CONSENT_DURATION_OPTIONS } from '../../demo/data/mockConnectedAccountsData';
import { Icon } from '../ui/Icon';
import { useHaptics } from '../../hooks/useHaptics';

export interface ConsentDurationSelectorProps {
  selectedDuration: ConsentDuration;
  onSelectDuration: (duration: ConsentDuration) => void;
  style?: ViewStyle;
}

export const ConsentDurationSelector: React.FC<ConsentDurationSelectorProps> = ({
  selectedDuration,
  onSelectDuration,
  style,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  const handleSelect = (id: ConsentDuration) => {
    haptics.selection();
    onSelectDuration(id);
  };

  return (
    <View style={[styles.container, style]}>
      <View style={styles.grid}>
        {CONSENT_DURATION_OPTIONS.map((option) => {
          const isSelected = selectedDuration === option.id;

          return (
            <Pressable
              key={option.id}
              onPress={() => handleSelect(option.id)}
              style={({ pressed }) => [
                styles.optionCard,
                {
                  backgroundColor: isSelected
                    ? theme.colors.primaryLight
                    : theme.colors.surface,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.border,
                  borderRadius: theme.radius.md,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              accessibilityRole="radio"
              accessibilityLabel={`${option.label}, ${option.helperText}`}
              accessibilityState={{ selected: isSelected }}
            >
              <View style={styles.cardHeader}>
                <Text
                  style={[
                    theme.typography.bodyMedium,
                    {
                      color: isSelected
                        ? theme.colors.primary
                        : theme.colors.textPrimary,
                      fontWeight: isSelected ? '600' : '500',
                    },
                  ]}
                >
                  {option.label}
                </Text>
                {isSelected && (
                  <Icon name="check" size={14} color={theme.colors.primary} />
                )}
              </View>

              <Text
                style={[
                  theme.typography.caption,
                  {
                    color: isSelected
                      ? theme.colors.primary
                      : theme.colors.textSecondary,
                    marginTop: 2,
                    fontSize: 11,
                  },
                ]}
              >
                {option.helperText}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionCard: {
    flexBasis: '48%',
    flexGrow: 1,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
