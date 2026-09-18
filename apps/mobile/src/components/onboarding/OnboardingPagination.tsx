/**
 * TAMVA OnboardingPagination Component
 *
 * Subtle 3-position pagination indicator for onboarding flow.
 * Uses primary semantic accent for active position. Restrained and accessible.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';

export interface OnboardingPaginationProps {
  currentIndex: number;
  total?: number;
}

export const OnboardingPagination: React.FC<OnboardingPaginationProps> = ({
  currentIndex,
  total = 3,
}) => {
  const { theme } = useTheme();

  return (
    <View
      style={styles.container}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${currentIndex + 1} of ${total}`}
    >
      {Array.from({ length: total }).map((_, index) => {
        const isActive = index === currentIndex;
        return (
          <View
            key={index}
            style={[
              styles.dot,
              isActive
                ? [
                    styles.activeDot,
                    { backgroundColor: theme.colors.primary },
                  ]
                : [
                    styles.inactiveDot,
                    { backgroundColor: theme.colors.border },
                  ],
            ]}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 16,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 22,
  },
  inactiveDot: {
    width: 6,
  },
});
