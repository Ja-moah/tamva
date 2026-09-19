/**
 * TAMVA colour system: the one source of truth for every client.
 *
 * Roles (not hues) are what clients depend on:
 *   primary   deep teal / dark green   — the TAMVA identity, everywhere
 *   secondary emerald / mint           — trust, success, positive emphasis
 *   accent    restrained gold          — institutional accent only; never a second primary
 *   info      blue        warning amber        danger red        success green
 *   neutral   white and soft grey surfaces, dark text
 *
 * Admin maps these onto CSS variables and Mobile onto its React Native theme.
 * A test in each client fails if its mapped values drift from this file.
 */

export const teal = {
  50: "#E8F5F1",
  100: "#C3E5DA",
  200: "#9AD4C1",
  300: "#6DC3A8",
  400: "#40B28F",
  500: "#1A9F78",
  600: "#1A7F64", // TAMVA primary (light surfaces)
  700: "#146350",
  800: "#0E473A",
  900: "#072B23",
} as const;

export const emerald = {
  50: "#ECFDF5",
  100: "#D1FAE5",
  300: "#6EE7B7", // mint
  500: "#10B981",
  600: "#059669", // secondary / trust
  700: "#047857",
  800: "#065F46",
} as const;

export const gold = {
  50: "#FFF8E1",
  500: "#C68A00", // institutional accent
  700: "#7A5200",
} as const;

export const neutral = {
  0: "#FFFFFF",
  50: "#F7F8FA",
  100: "#EEF0F4",
  200: "#E5E9EF",
  300: "#CED4DE",
  400: "#9AA3B0",
  500: "#667085",
  600: "#475467",
  700: "#344054",
  800: "#1D2939",
  900: "#111827",
} as const;

export const green = { 50: "#ECFDF5", 100: "#D1FAE5", 500: "#12B76A", 600: "#059652", 700: "#027A48" } as const;
export const amber = { 50: "#FFFBEB", 100: "#FEF3C7", 500: "#F79009", 600: "#DC6803", 700: "#B54708" } as const;
export const red = { 50: "#FEF3F2", 100: "#FEE4E2", 500: "#F04438", 600: "#D92D20", 700: "#B42318" } as const;
export const blue = { 50: "#EFF8FF", 100: "#DBEAFE", 500: "#2E90FA", 600: "#1570EF", 700: "#175CD3" } as const;

/** Roles per theme. Dark values are calibrated for contrast on dark surfaces. */
export const roles = {
  light: {
    primary: teal[600],
    primaryHover: teal[700],
    primaryOn: neutral[0],
    secondary: emerald[600],
    accent: gold[500],
    info: blue[600],
    warning: amber[600],
    danger: red[600],
    success: green[600],
  },
  dark: {
    primary: "#20A880",
    primaryHover: "#2DC298",
    primaryOn: teal[900],
    secondary: emerald[500],
    accent: gold[500],
    info: blue[500],
    warning: amber[500],
    danger: red[500],
    success: green[500],
  },
} as const;

/** Flat names used by the mobile theme (teal600, neutral50, amber700, …). */
export const flatPalette = (() => {
  const out: Record<string, string> = {};
  const families = { teal, emerald, gold, neutral, green, amber, red, blue } as const;
  for (const [family, scale] of Object.entries(families)) {
    for (const [step, value] of Object.entries(scale)) out[`${family}${step}`] = value;
  }
  return out;
})();
