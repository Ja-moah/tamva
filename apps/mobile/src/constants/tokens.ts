/**
 * TAMVA Design Tokens
 *
 * The single source of truth for all visual primitives.
 * Every component must reference these tokens — never hardcode values.
 */

// ─────────────────────────────────────────────────────────────
// Color Palette (Primitive)
// ─────────────────────────────────────────────────────────────

const palette = {
  // Teal-Green family (TAMVA Primary)
  teal50: '#E8F5F1',
  teal100: '#C3E5DA',
  teal200: '#9AD4C1',
  teal300: '#6DC3A8',
  teal400: '#40B28F',
  teal500: '#1A9F78',
  teal600: '#1A7F64', // Primary brand
  teal700: '#146350',
  teal800: '#0E473A',
  teal900: '#072B23',

  // Neutral family
  neutral0: '#FFFFFF',
  neutral50: '#F7F8FA',
  neutral100: '#EEF0F4',
  neutral200: '#E5E9EF',
  neutral300: '#CED4DE',
  neutral400: '#9AA3B0',
  neutral500: '#667085',
  neutral600: '#475467',
  neutral700: '#344054',
  neutral800: '#1D2939',
  neutral900: '#111827',

  // Semantic families
  green50: '#ECFDF5',
  green100: '#D1FAE5',
  green500: '#12B76A',
  green600: '#059652',
  green700: '#027A48',

  amber50: '#FFFBEB',
  amber100: '#FEF3C7',
  amber500: '#F79009',
  amber600: '#DC6803',
  amber700: '#B54708',

  red50: '#FEF3F2',
  red100: '#FEE4E2',
  red500: '#F04438',
  red600: '#D92D20',
  red700: '#B42318',

  blue50: '#EFF8FF',
  blue100: '#DBEAFE',
  blue500: '#2E90FA',
  blue600: '#1570EF',
  blue700: '#175CD3',
} as const;

// ─────────────────────────────────────────────────────────────
// Semantic Colors (Light Theme)
// ─────────────────────────────────────────────────────────────

export const Colors = {
  // Backgrounds
  background: palette.neutral50,
  backgroundAlt: palette.neutral100,
  surface: palette.neutral0,
  surfaceElevated: palette.neutral0,
  surfaceInverse: palette.neutral900,

  // Primary (brand)
  primary: palette.teal600,
  primaryLight: palette.teal50,
  primaryMedium: palette.teal100,
  primaryDark: palette.teal700,
  primaryText: palette.neutral0,

  // Text
  textPrimary: palette.neutral900,
  textSecondary: palette.neutral500,
  textTertiary: palette.neutral400,
  textDisabled: palette.neutral300,
  textInverse: palette.neutral0,
  textLink: palette.teal600,

  // Border / Dividers
  border: palette.neutral200,
  borderStrong: palette.neutral300,
  borderFocus: palette.teal600,

  // Semantic: Success
  success: palette.green500,
  successLight: palette.green50,
  successMedium: palette.green100,
  successDark: palette.green700,
  successText: palette.green700,

  // Semantic: Warning
  warning: palette.amber500,
  warningLight: palette.amber50,
  warningMedium: palette.amber100,
  warningDark: palette.amber700,
  warningText: palette.amber700,

  // Semantic: Danger
  danger: palette.red500,
  dangerLight: palette.red50,
  dangerMedium: palette.red100,
  dangerDark: palette.red700,
  dangerText: palette.red700,

  // Semantic: Info
  info: palette.blue500,
  infoLight: palette.blue50,
  infoMedium: palette.blue100,
  infoDark: palette.blue700,
  infoText: palette.blue700,

  // Financial specific
  income: palette.green500,
  outflow: palette.red500,
  neutral: palette.neutral500,

  // Overlay
  overlay: 'rgba(17, 24, 39, 0.48)',
  overlayLight: 'rgba(17, 24, 39, 0.08)',

  // Transparent
  transparent: 'transparent',
} as const;

// ─────────────────────────────────────────────────────────────
// Spacing Scale
// ─────────────────────────────────────────────────────────────

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
} as const;

// ─────────────────────────────────────────────────────────────
// Border Radius
// ─────────────────────────────────────────────────────────────

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
} as const;

// ─────────────────────────────────────────────────────────────
// Elevation / Shadow (iOS + Android)
// ─────────────────────────────────────────────────────────────

export interface ElevationLevel {
  shadowColor: string;
  shadowOffset: { width: number; height: number };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export const Elevation: Record<'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl', ElevationLevel> = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: palette.neutral900,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: palette.neutral900,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: palette.neutral900,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: palette.neutral900,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 8,
  },
  xl: {
    shadowColor: palette.neutral900,
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 12,
  },
};

// ─────────────────────────────────────────────────────────────
// Z-Index
// ─────────────────────────────────────────────────────────────

export const ZIndex = {
  base: 0,
  card: 10,
  header: 100,
  modal: 200,
  toast: 300,
  tooltip: 400,
} as const;

// ─────────────────────────────────────────────────────────────
// Opacity
// ─────────────────────────────────────────────────────────────

export const Opacity = {
  disabled: 0.4,
  subtle: 0.64,
  medium: 0.80,
} as const;
