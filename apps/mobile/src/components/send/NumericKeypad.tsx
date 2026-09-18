/**
 * TAMVA NumericKeypad Component
 *
 * Executive-grade on-screen keypad for financial amount and PIN entry.
 * Provides tactile feedback, responsive touch areas, and consistent styling.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { Icon } from '../ui/Icon';

export interface NumericKeypadProps {
  onKeyPress: (key: string) => void;
  onDelete: () => void;
  mode?: 'amount' | 'pin';
  disabled?: boolean;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  onKeyPress,
  onDelete,
  mode = 'amount',
  disabled = false,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  const handlePress = (key: string) => {
    if (disabled) return;
    haptics.selection();
    onKeyPress(key);
  };

  const handleDelete = () => {
    if (disabled) return;
    haptics.selection();
    onDelete();
  };

  const rows = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    [mode === 'amount' ? '.' : '', '0', 'backspace'],
  ];

  return (
    <View style={styles.container}>
      {rows.map((row, rowIndex) => (
        <View key={`row-${rowIndex}`} style={styles.row}>
          {row.map((key, colIndex) => {
            if (key === '') {
              return <View key={`empty-${colIndex}`} style={styles.emptyKey} />;
            }

            if (key === 'backspace') {
              return (
                <Pressable
                  key="backspace"
                  onPress={handleDelete}
                  disabled={disabled}
                  accessibilityLabel="Delete last digit"
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.key,
                    {
                      backgroundColor: pressed
                        ? theme.colors.backgroundAlt
                        : 'transparent',
                    },
                  ]}
                >
                  <Icon
                    name="arrow-left"
                    size={22}
                    color={disabled ? theme.colors.textTertiary : theme.colors.textPrimary}
                  />
                </Pressable>
              );
            }

            return (
              <Pressable
                key={key}
                onPress={() => handlePress(key)}
                disabled={disabled}
                accessibilityLabel={key === '.' ? 'Decimal point' : `Number ${key}`}
                accessibilityRole="button"
                style={({ pressed }) => [
                  styles.key,
                  {
                    backgroundColor: pressed
                      ? theme.colors.backgroundAlt
                      : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.keyText,
                    {
                      color: disabled
                        ? theme.colors.textTertiary
                        : theme.colors.textPrimary,
                    },
                  ]}
                >
                  {key}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  key: {
    flex: 1,
    height: 54,
    marginHorizontal: 8,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyKey: {
    flex: 1,
    height: 54,
    marginHorizontal: 8,
  },
  keyText: {
    fontSize: 24,
    fontWeight: '600',
    fontFamily: 'PlusJakartaSans_600SemiBold',
  },
});
