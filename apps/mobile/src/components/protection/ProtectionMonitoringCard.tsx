/**
 * TAMVA ProtectionMonitoringCard Component
 *
 * Displays monitoring summary metrics across all lifecycle scenarios:
 * - Healthy: Active status, account count, 0 recent alerts
 * - Attention: Active status, account count, alert note (e.g. "1 needs review")
 * - Limited: "Limited coverage", accounts with available data
 * - Unavailable: "Unavailable" status, formatted as "Not available" without fake zeros
 *
 * Emphasizes monitoring awareness without claiming real-time bank monitoring.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Card } from '../ui/Card';
import { ProtectionMonitoring } from '../../types/protection';

export interface ProtectionMonitoringCardProps {
  monitoring: ProtectionMonitoring;
}

export const ProtectionMonitoringCard: React.FC<ProtectionMonitoringCardProps> = ({
  monitoring,
}) => {
  const { theme } = useTheme();

  const isAvailable = monitoring.isAvailable !== false;
  const isLimited = monitoring.statusLabel === 'Limited coverage';
  const isAttention = monitoring.recentAlerts > 0;

  // Status badge styling
  const badgeLabel =
    monitoring.statusLabel || (monitoring.enabled ? 'Active' : 'Paused');

  const dotColor = !isAvailable
    ? theme.colors.textTertiary
    : isLimited
    ? theme.colors.info
    : isAttention
    ? theme.colors.warning
    : monitoring.enabled
    ? theme.colors.success
    : theme.colors.textTertiary;

  const textColor = !isAvailable
    ? theme.colors.textSecondary
    : isLimited
    ? theme.colors.infoText
    : isAttention
    ? theme.colors.warningText
    : monitoring.enabled
    ? theme.colors.successText
    : theme.colors.textSecondary;

  // Metric displays
  const accountsValue = isAvailable
    ? String(monitoring.accountsMonitored)
    : '—';
  const accountsLabel = isAvailable
    ? isLimited
      ? 'accounts with data'
      : 'accounts monitored'
    : 'Data unavailable';

  const alertsValue = isAvailable
    ? String(monitoring.recentAlerts)
    : '—';
  const alertsLabel = isAvailable
    ? monitoring.alertNote || (monitoring.recentAlerts === 1 ? 'needs review' : 'recent alerts')
    : 'Not available';

  const checkedText = isAvailable
    ? `Checked ${monitoring.lastCheckedAt.toLowerCase()}`
    : 'Status unavailable';

  return (
    <View style={styles.container}>
      <Text
        style={[
          theme.typography.subheading,
          { color: theme.colors.textPrimary, marginBottom: 12, paddingHorizontal: 4 },
        ]}
      >
        Monitoring
      </Text>

      <Card variant="standard" padding="none" style={styles.card}>
        <View style={styles.cardContent}>
          {/* Status Header */}
          <View style={styles.statusHeaderRow}>
            <View style={styles.statusBadge}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: dotColor },
                ]}
              />
              <Text
                style={[
                  theme.typography.captionMedium,
                  { color: textColor },
                ]}
              >
                {badgeLabel}
              </Text>
            </View>

            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textTertiary },
              ]}
            >
              {checkedText}
            </Text>
          </View>

          {/* Metrics Row */}
          <View style={styles.metricsRow}>
            <View style={styles.metricItem}>
              <Text
                style={[
                  theme.typography.heading,
                  { color: theme.colors.textPrimary, fontSize: 20 },
                ]}
              >
                {accountsValue}
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, marginTop: 2 },
                ]}
              >
                {accountsLabel}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

            <View style={styles.metricItem}>
              <Text
                style={[
                  theme.typography.heading,
                  {
                    color:
                      isAttention && isAvailable
                        ? theme.colors.warning
                        : theme.colors.textPrimary,
                    fontSize: 20,
                  },
                ]}
              >
                {alertsValue}
              </Text>
              <Text
                style={[
                  theme.typography.caption,
                  {
                    color:
                      isAttention && isAvailable
                        ? theme.colors.warningText
                        : theme.colors.textSecondary,
                    marginTop: 2,
                  },
                ]}
              >
                {alertsLabel}
              </Text>
            </View>
          </View>

          {/* Quiet Explanatory Disclosure */}
          <View
            style={[
              styles.footnoteContainer,
              { borderTopColor: theme.colors.border },
            ]}
          >
            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textTertiary, lineHeight: 16 },
              ]}
            >
              {isAvailable
                ? 'Protection signals are based on the latest consented data available to TAMVA.'
                : 'Protection signals cannot be evaluated from the available data.'}
            </Text>
          </View>
        </View>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
  },
  cardContent: {
    padding: 16,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  metricItem: {
    alignItems: 'center',
    flex: 1,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 32,
  },
  footnoteContainer: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
