/**
 * TAMVA PassportActiveShareCard Component
 *
 * Prominent banner card displayed on the Passport screen when an active
 * share is currently live. Gives immediate visibility into authorized access,
 * accurate expiration status, and quick access to "View QR" or "Revoke Access".
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { PassportShareRecord } from '../../types/passport';
import { getShareStatusInfo } from '../../utils/shareUtils';

export interface PassportActiveShareCardProps {
  share: PassportShareRecord;
  onViewQr: () => void;
  onRevokePress: () => void;
}

export const PassportActiveShareCard: React.FC<PassportActiveShareCardProps> = ({
  share,
  onViewQr,
  onRevokePress,
}) => {
  const { theme } = useTheme();
  const statusInfo = getShareStatusInfo(share);

  return (
    <Card
      variant="elevated"
      padding="none"
      style={StyleSheet.flatten([
        styles.card,
        { borderColor: theme.colors.primaryMedium },
      ])}
      accessibilityLabel={`Active Passport share for ${share.purposeLabel}, status ${statusInfo.statusLabel}`}
    >
      <View style={styles.content}>
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.liveIndicator,
                { backgroundColor: theme.colors.successLight },
              ]}
            >
              <View
                style={[
                  styles.liveDot,
                  { backgroundColor: theme.colors.success },
                ]}
              />
              <Text
                style={[
                  theme.typography.captionMedium,
                  { color: theme.colors.successText, fontSize: 11 },
                ]}
              >
                LIVE SHARE
              </Text>
            </View>
            <Text
              style={[
                theme.typography.caption,
                {
                  color: theme.colors.textTertiary,
                  marginLeft: 8,
                  fontSize: 11,
                },
              ]}
              numberOfLines={1}
            >
              ID: {share.id}
            </Text>
          </View>

          <Badge
            label={statusInfo.statusLabel}
            tone={statusInfo.badgeTone}
            size="sm"
          />
        </View>

        {/* Purpose & Details */}
        <View style={styles.bodySection}>
          <Text
            style={[
              theme.typography.bodyMedium,
              {
                color: theme.colors.textPrimary,
                fontWeight: '600',
                fontSize: 15,
              },
            ]}
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {share.purposeLabel}
          </Text>

          {share.customPurposeNote ? (
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, marginTop: 2 },
              ]}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              &quot;{share.customPurposeNote}&quot;
            </Text>
          ) : null}

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Icon
                name="clock"
                size={13}
                color={theme.colors.textTertiary}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, fontSize: 11 },
                ]}
                numberOfLines={1}
              >
                {statusInfo.expiryDisplay}
              </Text>
            </View>

            <View
              style={[
                styles.metaDivider,
                { backgroundColor: theme.colors.border },
              ]}
            />

            <View style={styles.metaItem}>
              <Icon
                name="shield"
                size={13}
                color={theme.colors.textTertiary}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, fontSize: 11 },
                ]}
                numberOfLines={1}
              >
                {share.scopes.length} Categories
              </Text>
            </View>
          </View>
        </View>

        {/* Actions Row */}
        <View style={styles.actionsRow}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Button
              label="View QR"
              onPress={onViewQr}
              variant="secondary"
              size="md"
              leftIcon="maximize"
              fullWidth
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              label="Revoke Access"
              onPress={onRevokePress}
              variant="destructive"
              size="md"
              leftIcon="slash"
              fullWidth
            />
          </View>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  content: {
    padding: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  bodySection: {
    marginBottom: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaDivider: {
    width: 1,
    height: 12,
    marginHorizontal: 10,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
});
