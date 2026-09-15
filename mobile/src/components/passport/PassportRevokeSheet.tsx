/**
 * TAMVA PassportRevokeSheet Component
 *
 * Invalidation confirmation BottomSheet for active Passport shares.
 * Transparently communicates that the share identifier and presentation QR
 * will become immediately invalid upon revocation.
 */

import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../theme';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { PassportShareRecord } from '../../types/passport';

export interface PassportRevokeSheetProps {
  visible: boolean;
  onClose: () => void;
  share: PassportShareRecord | null;
  onConfirmRevoke: () => void;
  isRevoking?: boolean;
}

export const PassportRevokeSheet: React.FC<PassportRevokeSheetProps> = ({
  visible,
  onClose,
  share,
  onConfirmRevoke,
  isRevoking = false,
}) => {
  const { theme } = useTheme();

  if (!share) return null;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Revoke Share Access"
      subtitle="Invalidate active credential"
      maxHeight="70%"
    >
      <View style={styles.container}>
        {/* Warning Icon Box */}
        <View style={styles.topIconWrapper}>
          <View
            style={[
              styles.warningCircle,
              { backgroundColor: theme.colors.dangerLight },
            ]}
          >
            <Icon name="slash" size={26} color={theme.colors.danger} />
          </View>

          <Text
            style={[
              theme.typography.heading,
              { color: theme.colors.textPrimary, marginTop: 12 },
            ]}
          >
            Revoke This Passport Share?
          </Text>

          <Text
            style={[
              theme.typography.caption,
              {
                color: theme.colors.textSecondary,
                textAlign: 'center',
                marginTop: 6,
                lineHeight: 18,
              },
            ]}
          >
            Revoking this share will immediately invalidate this Passport share
            record and its associated QR code. Counterparties will no longer be
            able to view your shared standing indicators.
          </Text>
        </View>

        {/* Share Record Summary */}
        <View
          style={[
            styles.detailsCard,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <View style={styles.detailRow}>
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.textTertiary, fontSize: 11 },
              ]}
            >
              SHARE ID
            </Text>
            <Text
              style={[
                theme.typography.captionMedium,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                  fontSize: 12,
                },
              ]}
            >
              {share.id}
            </Text>
          </View>

          <View
            style={[styles.divider, { backgroundColor: theme.colors.border }]}
          />

          <View style={styles.detailRow}>
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.textTertiary, fontSize: 11 },
              ]}
            >
              PURPOSE
            </Text>
            <Text
              style={[
                theme.typography.bodyMedium,
                { color: theme.colors.textPrimary, fontSize: 13, fontWeight: '500' },
              ]}
            >
              {share.purposeLabel}
            </Text>
          </View>

          <View
            style={[styles.divider, { backgroundColor: theme.colors.border }]}
          />

          <View style={styles.detailRow}>
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.textTertiary, fontSize: 11 },
              ]}
            >
              CURRENT STATUS
            </Text>
            <Badge label="Active" tone="success" size="sm" />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            label={isRevoking ? 'Revoking Access...' : 'Revoke Access'}
            onPress={onConfirmRevoke}
            variant="destructive"
            size="lg"
            loading={isRevoking}
            disabled={isRevoking}
            leftIcon="slash"
            fullWidth
          />
          <View style={{ height: 10 }} />
          <Button
            label="Keep Active"
            onPress={onClose}
            variant="secondary"
            size="lg"
            disabled={isRevoking}
            fullWidth
          />
        </View>
      </View>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 32,
    alignItems: 'center',
  },
  topIconWrapper: {
    alignItems: 'center',
    marginBottom: 16,
    width: '100%',
  },
  warningCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsCard: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 3,
  },
  divider: {
    height: 1,
    marginVertical: 6,
  },
  actionsContainer: {
    width: '100%',
  },
});
