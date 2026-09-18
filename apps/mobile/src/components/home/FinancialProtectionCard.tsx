/**
 * TAMVA FinancialProtectionCard Component
 *
 * Displays current security monitoring and consent protection status.
 * Reassures users with calm, transparent trust metrics without making exaggerated claims.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { StatusIndicator } from '../financial/StatusIndicator';
import { FinancialProtectionData } from '../../types/home';

export interface FinancialProtectionCardProps {
  protection: FinancialProtectionData;
  onPress?: () => void;
}

export const FinancialProtectionCard: React.FC<FinancialProtectionCardProps> = ({
  protection,
  onPress,
}) => {
  const { theme } = useTheme();

  return (
    <Card
      variant="standard"
      padding="none"
      onPress={onPress}
      style={styles.card}
      accessibilityLabel={`Financial Protection: Active. ${protection.monitoredAccountsCount} accounts synced.`}
    >
      <View style={styles.contentRow}>
        {/* Left: Reassuring Shield Badge */}
        <View
          style={[
            styles.iconBadge,
            { backgroundColor: theme.colors.primaryLight },
          ]}
        >
          <Icon name="shield" size={17} color={theme.colors.primary} />
        </View>

        {/* Center: Title and Security Subtitle */}
        <View style={styles.textColumn}>
          <View style={styles.statusTitleRow}>
            <Text
              style={[
                styles.title,
                { color: theme.colors.textPrimary },
              ]}
            >
              Financial Protection
            </Text>
            <View style={styles.activeDot} />
            <Text style={[styles.activeStatusText, { color: theme.colors.success }]}>
              Active
            </Text>
          </View>

          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, marginTop: 1 },
            ]}
            numberOfLines={1}
          >
            {protection.monitoredAccountsCount} accounts synced · Protected
          </Text>
        </View>

        {/* Right: Discreet Navigation Chevron */}
        {onPress && (
          <Icon
            name="chevron-right"
            size={14}
            color={theme.colors.textTertiary}
            style={styles.chevron}
          />
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    borderRadius: 16,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textColumn: {
    flex: 1,
    justifyContent: 'center',
  },
  statusTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#12B76A',
    marginHorizontal: 6,
  },
  activeStatusText: {
    fontSize: 12,
    fontWeight: '600',
    lineHeight: 16,
  },
  chevron: {
    marginLeft: 8,
  },
});
