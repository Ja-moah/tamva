/**
 * TAMVA ProtectionActivityCard Component
 *
 * Displays recent protection lifecycle events (NOT financial transactions):
 * e.g., consent renewals, periodic security checks, connection handshakes.
 * Dynamically colors glyphs based on event status (warning for attention, primary for healthy).
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Card } from '../ui/Card';
import { Icon } from '../ui/Icon';
import { ProtectionActivity } from '../../types/protection';

export interface ProtectionActivityCardProps {
  activity: ProtectionActivity[];
}

export const ProtectionActivityCard: React.FC<ProtectionActivityCardProps> = ({
  activity,
}) => {
  const { theme } = useTheme();

  return (
    <View style={styles.container}>
      <Text
        style={[
          theme.typography.subheading,
          { color: theme.colors.textPrimary, marginBottom: 12, paddingHorizontal: 4 },
        ]}
      >
        Recent protection activity
      </Text>

      <Card variant="standard" padding="none" style={styles.card}>
        {activity.length === 0 ? (
          <View style={styles.emptyActivityBox}>
            <Text
              style={[
                theme.typography.bodySm,
                { color: theme.colors.textTertiary, textAlign: 'center' },
              ]}
            >
              No recent protection activity recorded.
            </Text>
          </View>
        ) : (
          activity.map((item, index) => {
            const isLast = index === activity.length - 1;
            const iconColor =
              item.status === 'attention'
                ? theme.colors.warning
                : theme.colors.primary;

            return (
              <View
                key={item.id}
                style={[
                  styles.itemRow,
                  !isLast && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: theme.colors.border,
                  },
                ]}
              >
                {/* Event Glyph */}
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor:
                        item.status === 'attention'
                          ? theme.colors.warningLight
                          : theme.colors.backgroundAlt,
                    },
                  ]}
                >
                  <Icon
                    name={item.icon}
                    size={15}
                    color={iconColor}
                  />
                </View>

                {/* Event Content */}
                <View style={styles.textColumn}>
                  <Text
                    style={[
                      theme.typography.bodyMedium,
                      { color: theme.colors.textPrimary, fontWeight: '500' },
                    ]}
                    numberOfLines={1}
                  >
                    {item.title}
                  </Text>
                  <Text
                    style={[
                      theme.typography.caption,
                      { color: theme.colors.textSecondary, marginTop: 1 },
                    ]}
                    numberOfLines={1}
                  >
                    {item.description}
                  </Text>
                </View>

                {/* Timestamp */}
                <Text
                  style={[
                    theme.typography.caption,
                    { color: theme.colors.textTertiary, marginLeft: 8 },
                  ]}
                >
                  {item.timestamp}
                </Text>
              </View>
            );
          })
        )}
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
    overflow: 'hidden',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  emptyActivityBox: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textColumn: {
    flex: 1,
    minWidth: 0,
  },
});
