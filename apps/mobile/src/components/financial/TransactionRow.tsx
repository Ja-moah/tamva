/**
 * TAMVA TransactionRow Component
 *
 * Reusable foundation for transaction records.
 * Integrates MoneyDisplay with privacy masking, category icon avatars,
 * transaction flow styling (income vs outflow), and accessible labeling.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { FeatherIconName } from '../../constants/icons';
import { CurrencyCode, TransactionFlow, TransactionStatus } from '../../types/financial';
import { Icon } from '../ui/Icon';
import { BrandLogo } from '../ui/BrandLogo';
import { normalizeBrandName } from '../../constants/brands';
import { MoneyDisplay } from './MoneyDisplay';
import { Badge } from '../ui/Badge';

export interface TransactionRowProps {
  id?: string;
  title: string;
  category: string;
  date: string;
  amount: number;
  currency?: CurrencyCode;
  flow: TransactionFlow;
  status?: TransactionStatus;
  accountLabel?: string;
  icon?: FeatherIconName;
  onPress?: () => void;
  showDivider?: boolean;
  style?: ViewStyle;
}

export const TransactionRow: React.FC<TransactionRowProps> = ({
  title,
  category,
  date,
  amount,
  currency = 'GHS',
  flow,
  status = 'completed',
  accountLabel,
  icon,
  onPress,
  showDivider = true,
  style,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  const handlePress = () => {
    if (!onPress) return;
    haptics.lightImpact();
    onPress();
  };

  const isInteractive = Boolean(onPress);

  // Default icon based on flow or category
  const getCategoryIcon = (): FeatherIconName => {
    if (icon) return icon;
    if (status === 'failed') return 'alert-circle';
    if (flow === 'income') return 'arrow-down-left';
    return 'arrow-up-right';
  };

  const getIconBackground = (): string => {
    if (status === 'failed') return theme.colors.dangerLight;
    if (status === 'pending') return theme.colors.warningLight;
    if (flow === 'income') return theme.colors.successLight;
    if (flow === 'outflow') return theme.colors.backgroundAlt;
    return theme.colors.backgroundAlt;
  };

  const getIconColor = (): string => {
    if (status === 'failed') return theme.colors.danger;
    if (status === 'pending') return theme.colors.warning;
    if (flow === 'income') return theme.colors.income;
    return theme.colors.textPrimary;
  };

  const brandKey = normalizeBrandName(title);

  return (
    <Pressable
      onPress={isInteractive ? handlePress : undefined}
      disabled={!isInteractive}
      style={({ pressed }) => [
        styles.container,
        {
          backgroundColor: pressed && isInteractive ? theme.colors.backgroundAlt : theme.colors.surface,
          opacity: pressed && isInteractive ? 0.88 : 1,
          borderBottomColor: theme.colors.border,
          borderBottomWidth: showDivider ? StyleSheet.hairlineWidth : 0,
        },
        style,
      ]}
      accessibilityRole={isInteractive ? 'button' : 'none'}
      accessibilityLabel={`Transaction: ${title}, ${category}, amount: ${amount} ${currency}, status: ${status}`}
      accessibilityHint={isInteractive ? 'Tap to inspect transaction details in Activity' : undefined}
    >
      {/* Category / Direction Icon Avatar or Official Brand Logo */}
      {brandKey ? (
        <BrandLogo
          brandKey={brandKey}
          containerSize={40}
          shape="rounded"
          fallbackIcon={getCategoryIcon()}
          fallbackIconColor={getIconColor()}
          fallbackBg={getIconBackground()}
          style={styles.avatar}
        />
      ) : (
        <View
          style={[
            styles.avatar,
            { backgroundColor: getIconBackground() },
          ]}
        >
          <Icon
            name={getCategoryIcon()}
            size={18}
            color={getIconColor()}
          />
        </View>
      )}

      {/* Details Column */}
      <View style={styles.detailsCol}>
        <View style={styles.titleRow}>
          <Text
            style={[
              styles.title,
              theme.typography.bodySmMedium,
              { color: theme.colors.textPrimary, flexShrink: 1 },
            ]}
            numberOfLines={1}
          >
            {title}
          </Text>

          {status === 'pending' && (
            <Badge
              label="Pending"
              tone="warning"
              size="sm"
              style={styles.pendingBadge}
            />
          )}

          {status === 'failed' && (
            <Badge
              label="Failed"
              tone="danger"
              size="sm"
              style={styles.pendingBadge}
            />
          )}
        </View>

        <View style={styles.subRow}>
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, flexShrink: 1 },
            ]}
            numberOfLines={1}
          >
            {category} {accountLabel ? `• ${accountLabel}` : ''}
          </Text>

          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textTertiary, marginLeft: 6 },
            ]}
          >
            {date}
          </Text>
        </View>
      </View>

      {/* Amount Column */}
      <View style={styles.amountCol}>
        <MoneyDisplay
          amount={amount}
          currency={currency}
          flow={flow}
          showSign={true}
          size="sm"
        />
      </View>

      {isInteractive && (
        <Icon
          name="chevron-right"
          size={13}
          color={theme.colors.textTertiary}
          style={{ marginLeft: 6 }}
        />
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 64,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailsCol: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: '600',
  },
  pendingBadge: {
    marginLeft: 6,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  amountCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    marginLeft: 12,
    flexShrink: 0,
  },
});
