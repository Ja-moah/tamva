/**
 * TAMVA Motion & Animation Tokens
 *
 * Prepared for consistent transitions, feedback, and animations.
 * Calibrated for a calm, premium, responsive financial app experience.
 */

export const Motion = {
  // Durations in milliseconds
  duration: {
    instant: 0,
    fast: 150,     // Touch feedback, icon state changes, micro-interactions
    normal: 250,   // Dropdowns, toggles, chips, accordion transitions
    slow: 400,     // Bottom sheets, page transitions, modal appearances
    deliberate: 600, // Progress bars, score meters, metric reveals
  },

  // Easing curves (compatible with React Native Animated / Reanimated)
  easing: {
    standard: [0.2, 0.0, 0, 1.0] as const,     // Ease-out, responsive
    accelerate: [0.3, 0.0, 0.8, 0.15] as const, // Exit transitions
    decelerate: [0.05, 0.7, 0.1, 1.0] as const, // Entrance transitions
    spring: {
      damping: 20,
      mass: 1,
      stiffness: 180,
    },
    gentleSpring: {
      damping: 28,
      mass: 1,
      stiffness: 120,
    },
    bouncySpring: {
      damping: 14,
      mass: 0.8,
      stiffness: 220,
    },
  },

  // Interactive scale feedback
  scale: {
    pressedButton: 0.97,
    pressedCard: 0.985,
    pressedChip: 0.95,
  },
} as const;

export type MotionDuration = keyof typeof Motion.duration;
