/**
 * TAMVA ProfileFreshnessFooter Component
 *
 * Footnote presenter conveying profile freshness timestamp, consented data window,
 * and mandatory non-bureau regulatory transparency notice.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from '../ui/Icon';
import { ProfileFreshness } from '../../types/profile';

export interface ProfileFreshnessFooterProps {
  freshness: ProfileFreshness;
}

export const ProfileFreshnessFooter: React.FC<ProfileFreshnessFooterProps> = ({
  freshness,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      {/* Freshness Row */}
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
          {freshness.lastUpdated} • {freshness.dataWindow}
        </Text>
      </View>

      {/* Transparent Disclosure */}
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
          {freshness.disclosure}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 24,
  },
  freshnessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  disclosureBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 12,
  },
  disclosureIcon: {
    marginRight: 8,
    marginTop: 2,
  },
});
