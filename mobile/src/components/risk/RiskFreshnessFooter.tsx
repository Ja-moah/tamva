/**
 * TAMVA RiskFreshnessFooter Component
 *
 * Footnote presenter conveying risk assessment freshness
 * and subtle non-guarantee trust disclosure notice (Phase 8A).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from '../ui/Icon';

export interface RiskFreshnessFooterProps {
  lastUpdated?: string;
  disclosure?: string;
  isLimited?: boolean;
  isUnavailable?: boolean;
}

export const RiskFreshnessFooter: React.FC<RiskFreshnessFooterProps> = ({
  lastUpdated = 'Updated today',
  disclosure = 'This assessment reflects signals calculated from the financial data currently available to TAMVA. It is not a guaranteed lending or financial-services decision.',
  isLimited = false,
  isUnavailable = false,
}) => {
  const { theme } = useTheme();

  const dotColor = isUnavailable
    ? theme.colors.textTertiary
    : isLimited
    ? theme.colors.warning
    : theme.colors.success;

  return (
    <View style={styles.container}>
      {/* Freshness Row */}
      <View style={styles.freshnessRow}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: dotColor },
          ]}
        />
        <Text
          style={[
            theme.typography.captionMedium,
            { color: theme.colors.textSecondary, fontSize: 11 },
          ]}
        >
          {lastUpdated}
        </Text>
      </View>

      {/* Conservative Trust Footnote */}
      <View style={styles.disclosureBox}>
        <Icon
          name="info"
          size={13}
          color={theme.colors.textTertiary}
          style={styles.disclosureIcon}
        />
        <Text
          style={[
            theme.typography.caption,
            {
              color: theme.colors.textTertiary,
              fontSize: 11,
              lineHeight: 16,
              flex: 1,
            },
          ]}
        >
          {disclosure}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    marginBottom: 24,
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  freshnessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  disclosureBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingHorizontal: 8,
  },
  disclosureIcon: {
    marginTop: 1,
  },
});
