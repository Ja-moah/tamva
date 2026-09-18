/**
 * TAMVA StatusIndicator Component
 *
 * Visual indicator for account connections, sync freshness, and data permissions.
 */

import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { ConnectionStatus } from '../../types/financial';
import { Icon } from '../ui/Icon';
import { FeatherIconName } from '../../constants/icons';

export interface StatusIndicatorProps {
  status: ConnectionStatus;
  variant?: 'dot' | 'pill' | 'detailed';
  customLabel?: string;
  style?: ViewStyle;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  variant = 'pill',
  customLabel,
  style,
}) => {
  const { theme } = useTheme();

  const getStatusMeta = (): {
    color: string;
    bgColor: string;
    borderColor: string;
    icon: FeatherIconName;
    label: string;
  } => {
    switch (status) {
      case 'connected':
        return {
          color: theme.colors.success,
          bgColor: theme.colors.successLight,
          borderColor: theme.colors.successMedium,
          icon: 'check-circle',
          label: 'Connected',
        };
      case 'syncing':
        return {
          color: theme.colors.info,
          bgColor: theme.colors.infoLight,
          borderColor: theme.colors.infoMedium,
          icon: 'refresh-cw',
          label: 'Syncing',
        };
      case 'attention_required':
        return {
          color: theme.colors.warning,
          bgColor: theme.colors.warningLight,
          borderColor: theme.colors.warningMedium,
          icon: 'alert-triangle',
          label: 'Action Needed',
        };
      case 'disconnected':
        return {
          color: theme.colors.textTertiary,
          bgColor: theme.colors.backgroundAlt,
          borderColor: theme.colors.border,
          icon: 'x-circle',
          label: 'Disconnected',
        };
      case 'revoked':
        return {
          color: theme.colors.danger,
          bgColor: theme.colors.dangerLight,
          borderColor: theme.colors.dangerMedium,
          icon: 'lock',
          label: 'Consent Revoked',
        };
    }
  };

  const meta = getStatusMeta();
  const label = customLabel || meta.label;

  if (variant === 'dot') {
    return (
      <View
        style={[
          styles.dot,
          { backgroundColor: meta.color },
          style,
        ]}
        accessibilityRole="text"
        accessibilityLabel={`Status: ${label}`}
      />
    );
  }

  if (variant === 'detailed') {
    return (
      <View
        style={[
          styles.detailedContainer,
          {
            backgroundColor: meta.bgColor,
            borderColor: meta.borderColor,
            borderRadius: theme.radius.md,
          },
          style,
        ]}
      >
        <Icon name={meta.icon} size={16} color={meta.color} style={styles.detailedIcon} />
        <Text
          style={[
            theme.typography.label,
            { color: meta.color },
          ]}
        >
          {label}
        </Text>
      </View>
    );
  }

  // Default 'pill' variant
  return (
    <View
      style={[
        styles.pillContainer,
        {
          backgroundColor: meta.bgColor,
          borderColor: meta.borderColor,
          borderRadius: theme.radius.full,
        },
        style,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${label}`}
    >
      <View style={[styles.pillDot, { backgroundColor: meta.color }]} />
      <Text
        style={[
          theme.typography.captionMedium,
          { color: meta.color, fontSize: 11 },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  pillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  detailedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  detailedIcon: {
    marginRight: 8,
  },
});
