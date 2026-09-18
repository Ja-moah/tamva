/**
 * TAMVA Theme Types
 */

import { Colors, Spacing, Radius, Elevation, ZIndex, Opacity } from '../constants/tokens';
import { TypeScale, FontFamily } from '../constants/typography';
import { Motion } from '../constants/motion';

export type ThemeColors = {
  // Backgrounds
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceElevated: string;
  surfaceInverse: string;

  // Primary brand (Teal-Green)
  primary: string;
  primaryLight: string;
  primaryMedium: string;
  primaryDark: string;
  primaryText: string;

  // Text hierarchy
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textDisabled: string;
  textInverse: string;
  textLink: string;

  // Borders & Dividers
  border: string;
  borderStrong: string;
  borderFocus: string;

  // Semantics
  success: string;
  successLight: string;
  successMedium: string;
  successDark: string;
  successText: string;

  warning: string;
  warningLight: string;
  warningMedium: string;
  warningDark: string;
  warningText: string;

  danger: string;
  dangerLight: string;
  dangerMedium: string;
  dangerDark: string;
  dangerText: string;

  info: string;
  infoLight: string;
  infoMedium: string;
  infoDark: string;
  infoText: string;

  // Financial Semantics
  income: string;
  outflow: string;
  neutral: string;

  // Overlays
  overlay: string;
  overlayLight: string;

  transparent: string;
};

export type Theme = {
  isDark: boolean;
  colors: ThemeColors;
  spacing: typeof Spacing;
  radius: typeof Radius;
  elevation: typeof Elevation;
  typography: typeof TypeScale;
  fontFamily: typeof FontFamily;
  motion: typeof Motion;
  zIndex: typeof ZIndex;
  opacity: typeof Opacity;
};

export type ThemeMode = 'light' | 'dark' | 'system';
