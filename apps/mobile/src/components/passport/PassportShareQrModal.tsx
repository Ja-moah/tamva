/**
 * TAMVA PassportShareQrModal Component
 *
 * Dedicated modal presenting the Demo Passport QR representation:
 * - Geometric native visual QR grid with corner finder marks and TAMVA brand emblem
 * - Clear "DEMO PASSPORT QR" labelling
 * - Immediate visual invalidation if share is revoked or expired
 * - Share ID, purpose context, and validity window
 * - Factual non-bureau, non-government verification disclosure
 * - Simulated copy demo link action with tactile haptic feedback
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { BottomSheet } from '../ui/BottomSheet';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { PassportShareRecord } from '../../types/passport';
import { getShareStatusInfo } from '../../utils/shareUtils';

export interface PassportShareQrModalProps {
  visible: boolean;
  onClose: () => void;
  share: PassportShareRecord | null;
}

export const PassportShareQrModal: React.FC<PassportShareQrModalProps> = ({
  visible,
  onClose,
  share,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const [copied, setCopied] = useState(false);

  if (!share) return null;

  const statusInfo = getShareStatusInfo(share);
  const isInactive = statusInfo.isRevoked || statusInfo.isExpired;

  const handleCopyLink = () => {
    if (isInactive) return;
    haptics.selection();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Passport QR Representation"
      subtitle={`Share ID: ${share.id}`}
      maxHeight="86%"
    >
      <View style={styles.container}>
        {/* Status and Purpose Badge */}
        <View style={styles.topInfoRow}>
          <Badge
            label={statusInfo.statusLabel}
            tone={statusInfo.badgeTone}
            size="sm"
          />
          <Text
            style={[
              theme.typography.captionMedium,
              { color: theme.colors.textSecondary, marginLeft: 8, fontSize: 12 },
            ]}
            numberOfLines={1}
          >
            {share.purposeLabel}
          </Text>
        </View>

        {/* Polished Visual QR Code Card */}
        <View
          style={[
            styles.qrCard,
            {
              backgroundColor: isInactive ? '#F9FAFB' : '#FFFFFF',
              borderColor: isInactive ? theme.colors.borderStrong : theme.colors.border,
            },
          ]}
        >
          {/* Visual QR Representation */}
          <View
            style={[
              styles.qrGridContainer,
              { opacity: isInactive ? 0.28 : 1 },
            ]}
          >
            {/* Top-Left Finder Pattern */}
            <View style={[styles.finderOuter, { top: 0, left: 0 }]}>
              <View style={styles.finderInner} />
            </View>

            {/* Top-Right Finder Pattern */}
            <View style={[styles.finderOuter, { top: 0, right: 0 }]}>
              <View style={styles.finderInner} />
            </View>

            {/* Bottom-Left Finder Pattern */}
            <View style={[styles.finderOuter, { bottom: 0, left: 0 }]}>
              <View style={styles.finderInner} />
            </View>

            {/* Simulated Data Blocks */}
            <View style={styles.simulatedDataBlocks}>
              <View style={[styles.dotGroup, { top: 12, left: 62 }]} />
              <View style={[styles.dotGroup, { top: 28, left: 74 }]} />
              <View style={[styles.dotGroup, { top: 62, left: 14 }]} />
              <View style={[styles.dotGroup, { top: 76, left: 28 }]} />
              <View style={[styles.dotGroup, { top: 62, right: 14 }]} />
              <View style={[styles.dotGroup, { top: 76, right: 28 }]} />
              <View style={[styles.dotGroup, { bottom: 14, right: 14 }]} />
              <View style={[styles.dotGroup, { bottom: 28, right: 28 }]} />
              <View style={[styles.dotGroup, { bottom: 20, left: 68 }]} />
              <View style={[styles.dotGroup, { bottom: 34, left: 80 }]} />
            </View>

            {/* Central TAMVA Emblem */}
            <View
              style={[
                styles.qrCenterBadge,
                {
                  backgroundColor: isInactive
                    ? theme.colors.textDisabled
                    : theme.colors.primary,
                },
              ]}
            >
              <Icon
                name={isInactive ? 'slash' : 'shield'}
                size={18}
                color="#FFFFFF"
              />
            </View>
          </View>

          {/* Demo Indicator Label / Status Banner */}
          <View
            style={[
              styles.demoLabelBox,
              isInactive && {
                backgroundColor: statusInfo.isRevoked ? '#FEE4E2' : '#FEF3C7',
              },
            ]}
          >
            <Text
              style={[
                styles.demoLabelText,
                isInactive && {
                  color: statusInfo.isRevoked ? '#B42318' : '#B54708',
                },
              ]}
            >
              {statusInfo.isRevoked
                ? 'REVOKED • INVALID DEMO QR'
                : statusInfo.isExpired
                ? 'EXPIRED • INVALID DEMO QR'
                : 'DEMO PASSPORT QR • LOCAL PRESENTATION'}
            </Text>
          </View>
        </View>

        {/* Share ID & Expiry Details */}
        <View style={styles.detailsContainer}>
          <Text
            style={[
              theme.typography.captionMedium,
              {
                color: theme.colors.textPrimary,
                fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
                fontSize: 13,
                letterSpacing: 0.5,
              },
            ]}
          >
            {share.id}
          </Text>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textTertiary, marginTop: 4 },
            ]}
          >
            {statusInfo.expiryDisplay} • {share.scopes.length} categories authorized
          </Text>
        </View>

        {/* Factual Non-Bureau Transparency Note */}
        <View
          style={[
            styles.noticeBox,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Icon
            name="info"
            size={13}
            color={theme.colors.textTertiary}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, fontSize: 11, flex: 1 },
            ]}
          >
            {isInactive
              ? 'This demo share is invalid and cannot be verified by counterparties.'
              : 'This demo QR illustrates future counterparty verification. No real external data link or bureau credential is transmitted.'}
          </Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Button
              label={
                isInactive
                  ? 'Link Inactive'
                  : copied
                  ? 'Link Copied!'
                  : 'Copy Demo Link'
              }
              onPress={handleCopyLink}
              variant="secondary"
              size="md"
              leftIcon={copied ? 'check' : 'copy'}
              disabled={isInactive}
              fullWidth
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="Done"
              onPress={onClose}
              variant="primary"
              size="md"
              fullWidth
            />
          </View>
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
  topInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  qrCard: {
    width: 220,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  qrGridContainer: {
    width: 170,
    height: 170,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  finderOuter: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderWidth: 5,
    borderColor: '#111827',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finderInner: {
    width: 20,
    height: 20,
    backgroundColor: '#111827',
    borderRadius: 4,
  },
  simulatedDataBlocks: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  dotGroup: {
    position: 'absolute',
    width: 18,
    height: 18,
    backgroundColor: '#111827',
    borderRadius: 3,
  },
  qrCenterBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  demoLabelBox: {
    marginTop: 12,
    paddingVertical: 3,
    paddingHorizontal: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
  },
  demoLabelText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#4B5563',
    letterSpacing: 0.5,
  },
  detailsContainer: {
    alignItems: 'center',
    marginBottom: 14,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
    width: '100%',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
});
