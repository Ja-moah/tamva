/**
 * TAMVA Icon Component
 *
 * Renders consistent vector icons from the Feather glyph family.
 */

import React from 'react';
import { Feather } from '@expo/vector-icons';
import { StyleProp, TextStyle, ColorValue } from 'react-native';
import { useTheme } from '../../theme';
import { FeatherIconName } from '../../constants/icons';

export interface IconProps {
  name: FeatherIconName;
  size?: number;
  color?: ColorValue | string;
  style?: StyleProp<TextStyle>;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 20,
  color,
  style,
}) => {
  const { theme } = useTheme();
  const iconColor = color || theme.colors.textPrimary;

  return (
    <Feather
      name={name}
      size={size}
      color={iconColor}
      style={style}
    />
  );
};
