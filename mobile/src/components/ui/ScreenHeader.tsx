/**
 * TAMVA ScreenHeader Component
 *
 * Production header supporting back navigation, title hierarchy,
 * action icons, and automatic safe area integration.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme';
import { FeatherIconName } from '../../constants/icons';
import { IconButton } from './IconButton';

export interface ScreenHeaderProps {
  title?: string;
  subtitle?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  rightIcon?: FeatherIconName;
  onRightIconPress?: () => void;
  rightIconAccessibilityLabel?: string;
  borderBottom?: boolean;
  style?: ViewStyle;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  showBack = false,
  onBackPress,
  leftElement,
  rightElement,
  rightIcon,
  onRightIconPress,
  rightIconAccessibilityLabel = 'Header action',
  borderBottom = false,
  style,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 12),
          backgroundColor: theme.colors.background,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: borderBottom ? 1 : 0,
        },
        style,
      ]}
    >
      <View style={styles.contentRow}>
        {/* Left Section */}
        <View style={styles.leftSection}>
          {showBack ? (
            <IconButton
              icon="chevron-left"
              onPress={handleBack}
              variant="subtle"
              size="md"
              accessibilityLabel="Go back"
            />
          ) : (
            leftElement
          )}
        </View>

        {/* Center / Title Section */}
        <View style={styles.centerSection}>
          {title && (
            <Text
              style={[
                theme.typography.subheading,
                { color: theme.colors.textPrimary, textAlign: 'center' },
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, textAlign: 'center', marginTop: 1 },
              ]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        {/* Right Section */}
        <View style={styles.rightSection}>
          {rightElement ? (
            rightElement
          ) : rightIcon && onRightIconPress ? (
            <IconButton
              icon={rightIcon}
              onPress={onRightIconPress}
              variant="subtle"
              size="md"
              accessibilityLabel={rightIconAccessibilityLabel}
            />
          ) : (
            <View style={{ width: 44 }} />
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
    paddingBottom: 10,
    zIndex: 100,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  leftSection: {
    minWidth: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
    flexShrink: 0,
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    minWidth: 0,
  },
  rightSection: {
    minWidth: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
