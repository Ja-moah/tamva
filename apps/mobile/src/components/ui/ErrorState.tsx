/**
 * TAMVA ErrorState Component
 *
 * Friendly error presentation with retry capability and expandable technical details.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from './Icon';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message: string;
  errorCode?: string;
  errorDetails?: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  errorCode,
  errorDetails,
  onRetry,
  retryLabel = 'Try again',
  style,
}) => {
  const { theme } = useTheme();
  const [showDetails, setShowDetails] = useState(false);

  return (
    <View style={[styles.container, style]}>
      <View
        style={[
          styles.iconCircle,
          {
            backgroundColor: theme.colors.dangerLight,
            borderColor: theme.colors.dangerMedium,
          },
        ]}
      >
        <Icon
          name="alert-triangle"
          size={32}
          color={theme.colors.danger}
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
          styles.message,
          theme.typography.bodySm,
          { color: theme.colors.textSecondary },
        ]}
      >
        {message}
      </Text>

      {errorCode && (
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textTertiary, marginBottom: 16 },
          ]}
        >
          Reference: {errorCode}
        </Text>
      )}

      {onRetry && (
        <View style={styles.actionContainer}>
          <Button
            label={retryLabel}
            onPress={onRetry}
            variant="secondary"
            size="md"
            leftIcon="refresh-cw"
          />
        </View>
      )}

      {errorDetails && (
        <View style={styles.detailsContainer}>
          <Pressable
            onPress={() => setShowDetails((prev) => !prev)}
            style={styles.detailsToggle}
          >
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textTertiary, textDecorationLine: 'underline' },
              ]}
            >
              {showDetails ? 'Hide technical details' : 'View technical details'}
            </Text>
          </Pressable>

          {showDetails && (
            <View
              style={[
                styles.detailsBox,
                {
                  backgroundColor: theme.colors.backgroundAlt,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, fontFamily: 'monospace' },
                ]}
              >
                {errorDetails}
              </Text>
            </View>
          )}
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
  message: {
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
    marginBottom: 16,
  },
  actionContainer: {
    minWidth: 160,
    marginTop: 8,
  },
  detailsContainer: {
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  detailsToggle: {
    padding: 8,
  },
  detailsBox: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    width: '100%',
  },
});
