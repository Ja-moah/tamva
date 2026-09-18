/**
 * TAMVA PassportShareHistory Component
 *
 * Compact list of recent Passport shares showing active, revoked, and expired statuses,
 * purpose context, expiration dates, and quick access to inspect share parameters & QR.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { PassportShareRecord } from '../../types/passport';
import { getShareStatusInfo } from '../../utils/shareUtils';
import { FeatherIconName } from '../../constants/icons';

export interface PassportShareHistoryProps {
  shares: PassportShareRecord[];
  onSelectShare: (share: PassportShareRecord) => void;
}

export const PassportShareHistory: React.FC<PassportShareHistoryProps> = ({
  shares,
  onSelectShare,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  if (!shares || shares.length === 0) return null;

  const handlePress = (share: PassportShareRecord) => {
    haptics.lightImpact();
    onSelectShare(share);
  };

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <Text
          style={[
            theme.typography.captionMedium,
            {
              color: theme.colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              fontSize: 11,
            },
          ]}
        >
          RECENT PASSPORT SHARES ({shares.length})
        </Text>
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textTertiary, marginTop: 2 },
          ]}
        >
          Audit history of authorized profile presentations
        </Text>
      </View>

      {/* History List */}
      <Card variant="elevated" padding="none" style={styles.card}>
        {shares.map((share, index) => {
          const isLast = index === shares.length - 1;
          const statusInfo = getShareStatusInfo(share);

          let iconName: FeatherIconName = 'slash';
          let iconColor = theme.colors.textTertiary;
          let iconBg = theme.colors.backgroundAlt;

          if (statusInfo.isActive) {
            iconName = 'share-2';
            iconColor = theme.colors.success;
            iconBg = theme.colors.successLight;
          } else if (statusInfo.isExpired) {
            iconName = 'clock';
            iconColor = theme.colors.warning;
            iconBg = theme.colors.warningLight;
          }

          return (
            <Pressable
              key={share.id}
              onPress={() => handlePress(share)}
              style={({ pressed }) => [
                styles.rowItem,
                {
                  borderBottomColor: theme.colors.border,
                  borderBottomWidth: isLast ? 0 : StyleSheet.hairlineWidth,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${share.purposeLabel}, status ${statusInfo.statusLabel}, ${statusInfo.expiryDisplay}`}
            >
              <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
                <Icon name={iconName} size={15} color={iconColor} />
              </View>

              <View style={styles.infoCol}>
                <View style={styles.titleRow}>
                  <Text
                    style={[
                      theme.typography.bodyMedium,
                      {
                        color: theme.colors.textPrimary,
                        fontWeight: '600',
                        fontSize: 14,
                      },
                    ]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {share.purposeLabel}
                  </Text>
                </View>

                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textTertiary, marginTop: 2 },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {statusInfo.expiryDisplay} • {share.scopes.length} categories
                </Text>
              </View>

              <View style={styles.badgeCol}>
                <Badge
                  label={statusInfo.statusLabel}
                  tone={statusInfo.badgeTone}
                  size="sm"
                />
              </View>
            </Pressable>
          );
        })}
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  sectionHeader: {
    marginBottom: 10,
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 56,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  infoCol: {
    flex: 1,
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeCol: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
});
