/**
 * TAMVA Modal Component
 *
 * Accessible dialog component with backdrop blur/dim, scale entrance,
 * and structured action slots.
 */

import React, { useEffect, useState } from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Platform,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from './Icon';
import { Button } from './Button';

export interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  primaryAction?: {
    label: string;
    onPress: () => void;
    variant?: 'primary' | 'destructive';
    loading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onPress: () => void;
  };
  dismissOnBackdropPress?: boolean;
  style?: ViewStyle;
}

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  description,
  children,
  primaryAction,
  secondaryAction,
  dismissOnBackdropPress = true,
  style,
}) => {
  const { theme } = useTheme();
  const fadeAnim = useState(() => new Animated.Value(0))[0];
  const scaleAnim = useState(() => new Animated.Value(0.95))[0];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: theme.motion.duration.fast,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: Platform.OS !== 'web',
          damping: 20,
          stiffness: 200,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.95);
    }
  }, [visible, fadeAnim, scaleAnim, theme]);

  return (
    <RNModal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Animated.View
        style={[
          styles.backdrop,
          {
            backgroundColor: theme.colors.overlay,
            opacity: fadeAnim,
          },
        ]}
      >
        <Pressable
          style={styles.backdropPressable}
          onPress={dismissOnBackdropPress ? onClose : undefined}
          accessibilityRole="button"
          accessibilityLabel="Close dialog"
        />

        <Animated.View
          style={[
            styles.dialog,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.xl,
              transform: [{ scale: scaleAnim }],
              ...theme.elevation.xl,
            },
            style,
          ]}
          accessibilityRole="alert"
        >
          {/* Header */}
          <View style={styles.header}>
            {title ? (
              <Text
                style={[
                  styles.title,
                  theme.typography.subheading,
                  { color: theme.colors.textPrimary },
                ]}
              >
                {title}
              </Text>
            ) : <View />}

            <Pressable
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Icon name="x" size={18} color={theme.colors.textSecondary} />
            </Pressable>
          </View>

          {description && (
            <Text
              style={[
                styles.description,
                theme.typography.bodySm,
                { color: theme.colors.textSecondary },
              ]}
            >
              {description}
            </Text>
          )}

          {/* Body Content */}
          {children && <View style={styles.body}>{children}</View>}

          {/* Actions */}
          {(primaryAction || secondaryAction) && (
            <View style={styles.actions}>
              {secondaryAction && (
                <View style={styles.actionBtn}>
                  <Button
                    label={secondaryAction.label}
                    onPress={secondaryAction.onPress}
                    variant="secondary"
                    size="md"
                    fullWidth
                  />
                </View>
              )}
              {primaryAction && (
                <View style={styles.actionBtn}>
                  <Button
                    label={primaryAction.label}
                    onPress={primaryAction.onPress}
                    variant={primaryAction.variant || 'primary'}
                    loading={primaryAction.loading}
                    size="md"
                    fullWidth
                  />
                </View>
              )}
            </View>
          )}
        </Animated.View>
      </Animated.View>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdropPressable: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    padding: 20,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    marginRight: 12,
  },
  closeBtn: {
    padding: 4,
  },
  description: {
    marginBottom: 16,
    lineHeight: 20,
  },
  body: {
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionBtn: {
    flex: 1,
  },
});
