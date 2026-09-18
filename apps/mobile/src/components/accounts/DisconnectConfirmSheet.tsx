/**
 * TAMVA DisconnectConfirmSheet Component
 *
 * Destructive confirmation bottom sheet for revoking consent:
 * - Prompts user before disconnecting an institution
 * - Honest, factual explanation of data retention policy without invented periods
 * - Clear distinction between primary destructive action and cancel
 * - Tactile warning haptics
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { ConnectedAccount } from '../../types/accounts';
import { useHaptics } from '../../hooks/useHaptics';

export interface DisconnectConfirmSheetProps {
  account: ConnectedAccount | null;
  visible: boolean;
  onClose: () => void;
  onConfirmDisconnect: (accountId: string) => void;
}

export const DisconnectConfirmSheet: React.FC<DisconnectConfirmSheetProps> = ({
  account,
  visible,
  onClose,
  onConfirmDisconnect,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  if (!account) return null;

  const handleDisconnect = () => {
    haptics.warning();
    setIsDisconnecting(true);

    onConfirmDisconnect(account.id);

    setTimeout(() => {
      setIsDisconnecting(false);
      onClose();
    }, 400);
  };

  const handleCancel = () => {
    haptics.lightImpact();
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Revoke Consent"
      maxHeight="60%"
    >
      <View style={styles.container}>
        {/* Warning Icon Avatar */}
        <View style={styles.heroSection}>
          <View
            style={[
              styles.warningCircle,
              {
                backgroundColor: theme.colors.dangerLight,
                borderColor: theme.colors.dangerMedium,
              },
            ]}
          >
            <Icon name="alert-triangle" size={28} color={theme.colors.danger} />
          </View>

          <Text
            style={[
              theme.typography.subheading,
              { color: theme.colors.textPrimary, marginTop: 14, textAlign: 'center' },
            ]}
          >
            Disconnect {account.institutionName}?
          </Text>

          <Text
            style={[
              theme.typography.caption,
              {
                color: theme.colors.textSecondary,
                marginTop: 8,
                textAlign: 'center',
                lineHeight: 20,
              },
            ]}
          >
            TAMVA will stop accessing this account. Previously synchronized financial data may remain available according to TAMVA&apos;s data retention policy.
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            label="Disconnect"
            onPress={handleDisconnect}
            loading={isDisconnecting}
            disabled={isDisconnecting}
            variant="destructive"
            leftIcon="slash"
            fullWidth
          />
          <View style={{ height: 8 }} />
          <Button
            label="Cancel"
            onPress={handleCancel}
            disabled={isDisconnecting}
            variant="secondary"
            fullWidth
          />
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  warningCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsContainer: {
    marginTop: 20,
  },
});
