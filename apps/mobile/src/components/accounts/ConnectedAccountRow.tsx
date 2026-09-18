/**
 * TAMVA ConnectedAccountRow Component
 *
 * Dedicated list row for connected financial institutions:
 * - Institution icon avatar with type-based coloring
 * - Institution name, account classification, and masked account identifier
 * - Semantic AccountStatusBadge (Connected, Syncing, Action Required, Disconnected)
 * - Balance display (masked by PrivacyContext; historical styling when disconnected)
 * - Freshness timestamp / sync status indicator
 * - Edge case handling: long text wrapping/truncation, minimum 44pt touch targets
 * - Tap target triggering the account detail & consent preview
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { ConnectedAccount } from '../../types/accounts';
import { AccountStatusBadge } from './AccountStatusBadge';
import { MoneyDisplay } from '../financial/MoneyDisplay';
import { Icon } from '../ui/Icon';
import { BrandLogo } from '../ui/BrandLogo';
import { FeatherIconName } from '../../constants/icons';

export interface ConnectedAccountRowProps {
  account: ConnectedAccount;
  onPress: (account: ConnectedAccount) => void;
  style?: ViewStyle;
}

export const ConnectedAccountRow: React.FC<ConnectedAccountRowProps> = ({
  account,
  onPress,
  style,
}) => {
  const { theme } = useTheme();

  const isDisconnected = account.status === 'disconnected';
  const isSyncing = account.status === 'syncing';
  const isActionRequired = account.status === 'action_required';

  // Institution icon resolution
  const getIconConfig = (): { name: FeatherIconName; bg: string; color: string } => {
    switch (account.institutionType) {
      case 'mobile_money':
        return {
          name: 'smartphone',
          bg: theme.colors.primaryLight,
          color: theme.colors.primary,
        };
      case 'investment':
        return {
          name: 'trending-up',
          bg: theme.colors.successLight,
          color: theme.colors.successText,
        };
      case 'bank':
      default:
        return {
          name: account.icon ?? 'credit-card',
          bg: theme.colors.surfaceElevated,
          color: theme.colors.textPrimary,
        };
    }
  };

  const iconConfig = getIconConfig();

  const accessibilityLabel = `${account.institutionName}, ${account.accountType}, ${
    account.maskedIdentifier
  }. Status: ${account.status.replace('_', ' ')}. ${
    isDisconnected
      ? 'Access revoked. Tap to view details or reconnect.'
      : isActionRequired
      ? 'Action required. Tap to review connection.'
      : 'Tap to inspect account details and consent scopes.'
  }`;

  return (
    <Pressable
      onPress={() => onPress(account)}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: isDisconnected
            ? theme.colors.surface
            : theme.colors.surface,
          borderColor: isActionRequired
            ? theme.colors.warningMedium
            : theme.colors.border,
          borderRadius: theme.radius.lg,
          opacity: pressed ? 0.88 : isDisconnected ? 0.82 : 1,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Opens institution details, sync status, and data consent permissions"
    >
      <View style={styles.contentRow}>
        {/* Institution Brand Logo Avatar */}
        <BrandLogo
          name={account.institutionName}
          containerSize={44}
          isDisconnected={isDisconnected}
          fallbackIcon={iconConfig.name}
          fallbackIconColor={isDisconnected ? theme.colors.textTertiary : iconConfig.color}
          fallbackBg={isDisconnected ? theme.colors.surfaceElevated : iconConfig.bg}
          style={styles.iconAvatar}
        />

        {/* Institution & Account Info */}
        <View style={styles.infoColumn}>
          <View style={styles.titleRow}>
            <Text
              style={[
                theme.typography.bodyMedium,
                {
                  color: isDisconnected
                    ? theme.colors.textSecondary
                    : theme.colors.textPrimary,
                  flexShrink: 1,
                },
              ]}
              numberOfLines={2}
            >
              {account.institutionName}
            </Text>
          </View>

          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, marginTop: 2 },
            ]}
            numberOfLines={1}
          >
            {account.accountType}{' '}
            <Text style={{ color: theme.colors.textTertiary }}>
              {account.maskedIdentifier}
            </Text>
          </Text>

          {/* Status Badge & Timestamp Row */}
          <View style={styles.metaRow}>
            <AccountStatusBadge status={account.status} size="sm" />
            <Text
              style={[
                theme.typography.caption,
                {
                  color: isSyncing
                    ? theme.colors.primary
                    : theme.colors.textTertiary,
                  fontSize: 11,
                },
              ]}
              numberOfLines={1}
            >
              {isDisconnected
                ? 'Access revoked'
                : isSyncing
                ? 'Syncing...'
                : account.lastSyncedAt}
            </Text>
          </View>
        </View>

        {/* Balance & Chevron */}
        <View style={styles.rightColumn}>
          {account.balance !== undefined && !isDisconnected ? (
            <MoneyDisplay
              amount={account.balance}
              currency={account.currency}
              size="sm"
              style={styles.balanceDisplay}
            />
          ) : (
            <View style={styles.inactiveBalanceContainer}>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textTertiary, fontSize: 11 },
                ]}
              >
                {isDisconnected ? 'Inactive' : '—'}
              </Text>
            </View>
          )}

          <Icon
            name="chevron-right"
            size={18}
            color={theme.colors.textTertiary}
            style={styles.chevron}
          />
        </View>
      </View>

      {/* Action Required Notice Banner if applicable */}
      {isActionRequired && account.statusMessage && (
        <View
          style={[
            styles.noticeBanner,
            {
              backgroundColor: theme.colors.warningLight,
              borderTopColor: theme.colors.warningMedium,
            },
          ]}
        >
          <Icon name="alert-circle" size={13} color={theme.colors.warning} />
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.warningText, marginLeft: 6, flex: 1 },
            ]}
            numberOfLines={2}
          >
            {account.statusMessage}
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 10,
    minHeight: 74,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  iconAvatar: {
    marginRight: 14,
  },
  infoColumn: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    flexWrap: 'wrap',
    gap: 4,
  },
  rightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 6,
    flexShrink: 0,
  },
  balanceDisplay: {
    marginBottom: 2,
  },
  inactiveBalanceContainer: {
    marginBottom: 2,
  },
  chevron: {
    marginTop: 2,
  },
  noticeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
});
