/**
 * TAMVA Haptics Hook
 *
 * Provides subtle tactile feedback for micro-interactions.
 * Safely handles platform differences and unsupported environments.
 */

import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export function useHaptics() {
  const lightImpact = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Gracefully ignore on unsupported devices
    }
  }, []);

  const mediumImpact = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      // Gracefully ignore
    }
  }, []);

  const selection = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.selectionAsync();
    } catch {
      // Gracefully ignore
    }
  }, []);

  const success = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Gracefully ignore
    }
  }, []);

  const warning = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    } catch {
      // Gracefully ignore
    }
  }, []);

  const error = useCallback(async () => {
    if (Platform.OS === 'web') return;
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch {
      // Gracefully ignore
    }
  }, []);

  return {
    lightImpact,
    mediumImpact,
    selection,
    success,
    warning,
    error,
  };
}
