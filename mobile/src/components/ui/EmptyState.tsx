/**
 * TAMVA EmptyState Component
 *
 * Restrained, informative empty view with primary and secondary call-to-actions.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { FeatherIconName } from '../../constants/icons';
import { Icon } from './Icon';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: FeatherIconName;
  title: string;
  description: string;
  actionLabel?: string;
  onActionPress?: () => void;
  secondaryActionLabel?: string;
  onSecondaryActionPress?: () => void;
  style?: ViewStyle;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'info',
  title,
  description,
  actionLabel,
  onActionPress,
  secondaryActionLabel,
  onSecondaryActionPress,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: theme.colors.primaryLight,
            borderColor: theme.colors.primaryMedium,
          },
        ]}
      >
        <Icon
          name={icon}
          size={32}
          color={theme.colors.primary}
        />
      </View>

      <Text
        style={[
          styles.title,
          theme.typography.subheading,
          { color: theme.colors.textPrimary },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.description,
          theme.typography.bodySm,
          { color: theme.colors.textSecondary },
        ]}
      >
        {description}
      </Text>

      {actionLabel && onActionPress && (
        <View style={styles.actionContainer}>
          <Button
            label={actionLabel}
            onPress={onActionPress}
            variant="primary"
            size="md"
          />
        </View>
      )}

      {secondaryActionLabel && onSecondaryActionPress && (
        <View style={styles.secondaryActionContainer}>
          <Button
            label={secondaryActionLabel}
            onPress={onSecondaryActionPress}
            variant="tertiary"
            size="sm"
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
    width: '100%',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
    marginBottom: 20,
  },
  actionContainer: {
    minWidth: 180,
    marginTop: 4,
  },
  secondaryActionContainer: {
    marginTop: 8,
  },
});
