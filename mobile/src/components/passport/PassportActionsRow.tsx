/**
 * TAMVA PassportActionsRow Component
 *
 * Action presenter for the Financial Passport:
 * Features a prominent "Share Financial Passport" primary action
 * alongside an optional "Manage" secondary button.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from '../ui/Button';

export interface PassportActionsRowProps {
  onSharePress: () => void;
  onManagePress?: () => void;
  disabled?: boolean;
}

export const PassportActionsRow: React.FC<PassportActionsRowProps> = ({
  onSharePress,
  onManagePress,
  disabled = false,
}) => {
  return (
    <View style={styles.container}>
      <Button
        label="Share Financial Passport"
        onPress={onSharePress}
        variant="primary"
        size="lg"
        leftIcon="share-2"
        fullWidth
        disabled={disabled}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
});
