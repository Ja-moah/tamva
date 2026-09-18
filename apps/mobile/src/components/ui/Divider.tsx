/**
 * TAMVA Divider Component
 *
 * Subtle or strong separator for lists, cards, and sections.
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'subtle' | 'strong';
  inset?: number;
  style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  variant = 'subtle',
  inset = 0,
  style,
}) => {
  const { theme } = useTheme();

  const color = variant === 'strong' ? theme.colors.borderStrong : theme.colors.border;
  const isHorizontal = orientation === 'horizontal';

  return (
    <View
      style={[
        isHorizontal
          ? {
              height: StyleSheet.hairlineWidth,
              backgroundColor: color,
              marginLeft: inset,
              width: inset ? `calc(100% - ${inset}px)` as any : '100%',
            }
          : {
              width: StyleSheet.hairlineWidth,
              backgroundColor: color,
              marginTop: inset,
              height: '100%',
            },
        style,
      ]}
    />
  );
};
