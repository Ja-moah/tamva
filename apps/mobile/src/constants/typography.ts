/**
 * TAMVA Typography System
 *
 * Built on Plus Jakarta Sans.
 * Defines all type scales, weights, and line heights used across the app.
 */

import { Platform } from 'react-native';

// ─────────────────────────────────────────────────────────────
// Font Family
// ─────────────────────────────────────────────────────────────

export const FontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semiBold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extraBold: 'PlusJakartaSans_800ExtraBold',
} as const;

// System fallbacks for before fonts load
export const FontFamilyFallback = {
  regular: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  medium: Platform.select({ ios: 'System', android: 'sans-serif-medium', default: 'System' }),
  semiBold: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  bold: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
  extraBold: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }),
} as const;

// ─────────────────────────────────────────────────────────────
// Type Scale
// ─────────────────────────────────────────────────────────────

export const TypeScale = {
  // Display — large hero text
  display: {
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -1,
    fontFamily: FontFamily.extraBold,
    fontWeight: '800' as const,
  },

  // Large heading — section hero
  headingLg: {
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
    fontFamily: FontFamily.bold,
    fontWeight: '700' as const,
  },

  // Heading — screen titles, cards
  heading: {
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.25,
    fontFamily: FontFamily.bold,
    fontWeight: '700' as const,
  },

  // Subheading — subsection titles
  subheading: {
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: -0.1,
    fontFamily: FontFamily.semiBold,
    fontWeight: '600' as const,
  },

  // Body — default reading text
  body: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    fontFamily: FontFamily.regular,
    fontWeight: '400' as const,
  },

  // Body medium — slightly emphasized body
  bodyMedium: {
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0,
    fontFamily: FontFamily.medium,
    fontWeight: '500' as const,
  },

  // Body small — supporting info
  bodySm: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    fontFamily: FontFamily.regular,
    fontWeight: '400' as const,
  },

  // Body small medium
  bodySmMedium: {
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
    fontFamily: FontFamily.medium,
    fontWeight: '500' as const,
  },

  // Caption — timestamps, helper text
  caption: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
    fontFamily: FontFamily.regular,
    fontWeight: '400' as const,
  },

  // Caption medium
  captionMedium: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
    fontFamily: FontFamily.medium,
    fontWeight: '500' as const,
  },

  // Label — form labels, pill text
  label: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.05,
    fontFamily: FontFamily.semiBold,
    fontWeight: '600' as const,
  },

  // Button — CTA text
  button: {
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: 0,
    fontFamily: FontFamily.semiBold,
    fontWeight: '600' as const,
  },

  // Button small — compact buttons
  buttonSm: {
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
    fontFamily: FontFamily.semiBold,
    fontWeight: '600' as const,
  },

  // Numeric large — primary financial amount
  numericLg: {
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
    fontFamily: FontFamily.bold,
    fontWeight: '700' as const,
    fontVariant: ['tabular-nums'] as any,
  },

  // Numeric — standard financial amounts
  numeric: {
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.25,
    fontFamily: FontFamily.semiBold,
    fontWeight: '600' as const,
    fontVariant: ['tabular-nums'] as any,
  },

  // Numeric small — list amounts
  numericSm: {
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0,
    fontFamily: FontFamily.semiBold,
    fontWeight: '600' as const,
    fontVariant: ['tabular-nums'] as any,
  },

  // Overline — all-caps section label
  overline: {
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    fontFamily: FontFamily.semiBold,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
} as const;

export type TypeScaleKey = keyof typeof TypeScale;
export type FontFamilyKey = keyof typeof FontFamily;
