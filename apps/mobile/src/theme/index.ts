/**
 * TAMVA Theme System
 *
 * Provides complete light and dark theme configurations adhering to
 * TAMVA's calm, trustworthy, and minimal aesthetic.
 */

import { roles } from '@tamva/brand';
import { Colors, Spacing, Radius, Elevation, ZIndex, Opacity } from '../constants/tokens';
import { TypeScale, FontFamily } from '../constants/typography';
import { Motion } from '../constants/motion';
import { Theme, ThemeColors } from '../types/theme';

export const lightColors: ThemeColors = { ...Colors };

export const darkColors: ThemeColors = {
  // Backgrounds
  background: '#0D1117',
  backgroundAlt: '#161B22',
  surface: '#1A202C',
  surfaceElevated: '#242C3D',
  surfaceInverse: '#F7F8FA',

  // Primary brand (Calibrated for dark mode contrast)
  primary: roles.dark.primary,
  primaryLight: '#0D3328',
  primaryMedium: '#144D3D',
  primaryDark: '#1A7F64',
  primaryText: '#FFFFFF',

  // Text
  textPrimary: '#F0F3F6',
  textSecondary: '#9AA3B0',
  textTertiary: '#667085',
  textDisabled: '#475467',
  textInverse: '#111827',
  textLink: roles.dark.primaryHover,

  // Borders
  border: '#2A3444',
  borderStrong: '#3B485E',
  borderFocus: '#20A880',

  // Semantics
  success: '#32D583',
  successLight: '#053321',
  successMedium: '#084C32',
  successDark: '#12B76A',
  successText: '#32D583',

  warning: '#FDB022',
  warningLight: '#3E2404',
  warningMedium: '#593406',
  warningDark: '#F79009',
  warningText: '#FDB022',

  danger: '#F97066',
  dangerLight: '#3E0C09',
  dangerMedium: '#5C1410',
  dangerDark: '#F04438',
  dangerText: '#F97066',

  info: '#53B1FD',
  infoLight: '#0B2A4A',
  infoMedium: '#104173',
  infoDark: '#2E90FA',
  infoText: '#53B1FD',

  // Financial Semantics
  income: '#32D583',
  outflow: '#F97066',
  neutral: '#9AA3B0',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.75)',
  overlayLight: 'rgba(255, 255, 255, 0.05)',

  transparent: 'transparent',
};

export const lightTheme: Theme = {
  isDark: false,
  colors: lightColors,
  spacing: Spacing,
  radius: Radius,
  elevation: Elevation,
  typography: TypeScale,
  fontFamily: FontFamily,
  motion: Motion,
  zIndex: ZIndex,
  opacity: Opacity,
};

export const darkTheme: Theme = {
  isDark: true,
  colors: darkColors,
  spacing: Spacing,
  radius: Radius,
  elevation: {
    ...Elevation,
    // Dark mode shadows use dark elevation styling
    xs: { ...Elevation.xs, shadowColor: '#000000', shadowOpacity: 0.25 },
    sm: { ...Elevation.sm, shadowColor: '#000000', shadowOpacity: 0.35 },
    md: { ...Elevation.md, shadowColor: '#000000', shadowOpacity: 0.45 },
    lg: { ...Elevation.lg, shadowColor: '#000000', shadowOpacity: 0.55 },
    xl: { ...Elevation.xl, shadowColor: '#000000', shadowOpacity: 0.65 },
  },
  typography: TypeScale,
  fontFamily: FontFamily,
  motion: Motion,
  zIndex: ZIndex,
  opacity: Opacity,
};

export * from './ThemeContext';
