/**
 * TAMVA ProtectionFreshnessFooter Component
 *
 * Footnote presenter conveying protection freshness timestamp
 * and conservative non-guarantee disclosure notice.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from '../ui/Icon';

export interface ProtectionFreshnessFooterProps {
  lastUpdated?: string;
}

export const ProtectionFreshnessFooter: React.FC<ProtectionFreshnessFooterProps> = ({
  lastUpdated = 'Just now',
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {/* Freshness Indicator */}
      <View style={styles.freshnessRow}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: theme.colors.success },
          ]}
        />
        <Text
          style={[
            theme.typography.captionMedium,
            { color: theme.colors.textSecondary, fontSize: 11 },
          ]}
        >
          Last updated {lastUpdated.toLowerCase()}
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
          Protection signals reflect the latest consented account data available to TAMVA.
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
