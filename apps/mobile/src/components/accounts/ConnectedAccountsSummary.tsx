/**
 * TAMVA ConnectedAccountsSummary Component
 *
 * Overview metric card displaying:
 * - Total connected financial institutions
 * - Active connection vs Attention breakdown
 * - Global sync freshness status
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle } from 'react-native';
import { useTheme } from '../../theme';
import { ConnectedAccountsSummaryData } from '../../types/accounts';
import { Icon } from '../ui/Icon';
import { useHaptics } from '../../hooks/useHaptics';

export interface ConnectedAccountsSummaryProps {
  summary: ConnectedAccountsSummaryData;
  onRefreshPress?: () => void;
  isRefreshing?: boolean;
  style?: ViewStyle;
}

export const ConnectedAccountsSummary: React.FC<ConnectedAccountsSummaryProps> = ({
  summary,
  onRefreshPress,
  isRefreshing = false,
  style,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  const handleRefresh = () => {
    haptics.lightImpact();
    onRefreshPress?.();
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          borderRadius: theme.radius.lg,
        },
        style,
      ]}
    >
      <View style={styles.topRow}>
        {/* Metric: Total Connected */}
        <View style={styles.metricColumn}>
          <Text
            style={[
              theme.typography.captionMedium,
              { color: theme.colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.6 },
            ]}
          >
            Connected Institutions
          </Text>
          <View style={styles.countRow}>
            <Text
              style={[
                theme.typography.display,
                { color: theme.colors.textPrimary, fontSize: 28, lineHeight: 34 },
              ]}
            >
              {summary.totalConnected}
            </Text>
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textTertiary, marginLeft: 6, marginBottom: 3 },
              ]}
            >
              active link{summary.totalConnected === 1 ? '' : 's'}
            </Text>
          </View>
        </View>

        {/* Sync / Refresh Button */}
        {onRefreshPress && (
          <Pressable
            onPress={handleRefresh}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            disabled={isRefreshing}
            style={({ pressed }) => [
              styles.refreshButton,
              {
                backgroundColor: theme.colors.surfaceElevated,
                borderColor: theme.colors.border,
                opacity: isRefreshing ? 0.6 : pressed ? 0.8 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Refresh connected accounts sync"
          >
            <Icon
              name="refresh-cw"
              size={15}
              color={isRefreshing ? theme.colors.primary : theme.colors.textSecondary}
            />
          </Pressable>
        )}
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

      {/* Bottom Status / Freshness Row */}
      <View style={styles.bottomRow}>
        <View style={styles.statusPills}>
          {/* Active indicator */}
          <View style={styles.pillItem}>
            <View
              style={[
                styles.dot,
                { backgroundColor: theme.colors.success },
              ]}
            />
            <Text
              style={[
                theme.typography.captionMedium,
                { color: theme.colors.textPrimary },
              ]}
            >
              {summary.activeCount} Active
            </Text>
          </View>

          {/* Attention indicator (if any) */}
          {summary.attentionCount > 0 && (
            <View style={[styles.pillItem, { marginLeft: 14 }]}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: theme.colors.warning },
                ]}
              />
              <Text
                style={[
                  theme.typography.captionMedium,
                  { color: theme.colors.warningText },
                ]}
              >
                {summary.attentionCount} Attention
              </Text>
            </View>
          )}
        </View>

        {/* Freshness Timestamp */}
        <View style={styles.freshnessRow}>
          <Icon name="clock" size={12} color={theme.colors.textTertiary} />
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textSecondary, marginLeft: 4 },
            ]}
          >
            {isRefreshing ? 'Syncing...' : `Synced ${summary.lastGlobalSync}`}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  metricColumn: {
    flex: 1,
  },
  countRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 4,
  },
  refreshButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 14,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusPills: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pillItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  freshnessRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
