/**
 * TAMVA Toast Feedback System
 *
 * Provides non-blocking notifications with slide entrance and auto-dismiss.
 */

import React, { createContext, useContext, useState, useRef, useCallback, ReactNode } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { FeatherIconName } from '../../constants/icons';
import { Icon } from './Icon';

export type ToastType = 'success' | 'warning' | 'danger' | 'info';

export interface ToastOptions {
  type?: ToastType;
  title: string;
  message?: string;
  duration?: number; // ms
}

interface ToastContextValue {
  showToast: (options: ToastOptions) => void;
  hideToast: () => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [currentToast, setCurrentToast] = useState<ToastOptions | null>(null);
  const slideAnim = useState(() => new Animated.Value(-100))[0];
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hideToast = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    Animated.timing(slideAnim, {
      toValue: -120,
      duration: theme.motion.duration.fast,
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setCurrentToast(null);
    });
  }, [slideAnim, theme]);

  const showToast = useCallback(
    ({ type = 'info', title, message, duration = 3500 }: ToastOptions) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      setCurrentToast({ type, title, message, duration });

      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: Platform.OS !== 'web',
        damping: 18,
        stiffness: 160,
      }).start();

      timerRef.current = setTimeout(() => {
        hideToast();
      }, duration);
    },
    [slideAnim, hideToast]
  );

  const getToastStyles = (type: ToastType = 'info'): {
    backgroundColor: string;
    borderColor: string;
    icon: FeatherIconName;
    iconColor: string;
  } => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.successMedium,
          icon: 'check-circle',
          iconColor: theme.colors.success,
        };
      case 'warning':
        return {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.warningMedium,
          icon: 'alert-triangle',
          iconColor: theme.colors.warning,
        };
      case 'danger':
        return {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.dangerMedium,
          icon: 'alert-circle',
          iconColor: theme.colors.danger,
        };
      case 'info':
        return {
          backgroundColor: theme.colors.surfaceElevated,
          borderColor: theme.colors.infoMedium,
          icon: 'info',
          iconColor: theme.colors.info,
        };
    }
  };

  const currentStyles = currentToast ? getToastStyles(currentToast.type) : null;

  return (
    <ToastContext.Provider value={{ showToast, hideToast }}>
      {children}
      {currentToast && currentStyles && (
        <Animated.View
          style={[
            styles.toastWrapper,
            {
              top: insets.top + 8,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View
            style={[
              styles.toastContainer,
              {
                backgroundColor: currentStyles.backgroundColor,
                borderColor: currentStyles.borderColor,
                borderRadius: theme.radius.lg,
                ...theme.elevation.md,
              },
            ]}
          >
            <View style={styles.iconWrapper}>
              <Icon
                name={currentStyles.icon}
                size={20}
                color={currentStyles.iconColor}
              />
            </View>

            <View style={styles.textWrapper}>
              <Text
                style={[
                  theme.typography.buttonSm,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {currentToast.title}
              </Text>
              {currentToast.message && (
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textSecondary, marginTop: 2 },
                  ]}
                >
                  {currentToast.message}
                </Text>
              )}
            </View>

            <Pressable
              onPress={hideToast}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.closeButton}
            >
              <Icon name="x" size={16} color={theme.colors.textTertiary} />
            </Pressable>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toastContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
  },
  iconWrapper: {
    marginRight: 12,
  },
  textWrapper: {
    flex: 1,
  },
  closeButton: {
    padding: 4,
    marginLeft: 8,
  },
});
