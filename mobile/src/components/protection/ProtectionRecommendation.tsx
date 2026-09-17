/**
 * TAMVA ProtectionRecommendation Component
 *
 * Displays compact, understated protection awareness suggestions.
 * Designed to feel informative and low-priority without alarming the user
 * or looking like a security emergency.
 * Dynamically responds to healthy, attention, disconnected, and monitoring states.
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { Icon } from '../ui/Icon';
import { ProtectionRecommendation as ProtectionRecommendationType } from '../../types/protection';

export interface ProtectionRecommendationProps {
  recommendations: ProtectionRecommendationType[];
  onActionPress?: (rec: ProtectionRecommendationType) => void;
}

export const ProtectionRecommendation: React.FC<ProtectionRecommendationProps> = ({
  recommendations,
  onActionPress,
}) => {
  const { theme } = useTheme();
  const router = useRouter();
  const haptics = useHaptics();

  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  const handlePressAction = (rec: ProtectionRecommendationType) => {
    haptics.selection();
    if (onActionPress) {
      onActionPress(rec);
    } else {
      router.push('/(tabs)/consent');
    }
  };

  return (
    <View style={styles.container}>
      <Text
        style={[
          theme.typography.subheading,
          { color: theme.colors.textPrimary, marginBottom: 10, paddingHorizontal: 4 },
        ]}
      >
        Recommendations
      </Text>

      {recommendations.map((rec) => {
        const isAttention = rec.priority === 'medium' || rec.priority === 'high';
        const iconColor = isAttention
          ? theme.colors.warning
          : theme.colors.primary;
        const iconBg = isAttention
          ? theme.colors.warningLight
          : theme.colors.backgroundAlt;

        return (
          <View
            key={rec.id}
            style={[
              styles.compactBox,
              {
                backgroundColor: theme.colors.surface,
                borderColor: isAttention
                  ? theme.colors.warningMedium
                  : theme.colors.border,
              },
            ]}
          >
            <View style={styles.topRow}>
              <View
                style={[
                  styles.iconBadge,
                  { backgroundColor: iconBg },
                ]}
              >
                <Icon
                  name={rec.icon}
                  size={14}
                  color={iconColor}
                />
              </View>

              <View style={styles.titleColumn}>
                <Text
                  style={[
                    theme.typography.bodyMedium,
                    { color: theme.colors.textPrimary, fontWeight: '600' },
                  ]}
                  numberOfLines={1}
                >
                  {rec.title}
                </Text>
              </View>
            </View>

            <Text
              style={[
                theme.typography.caption,
                { color: theme.colors.textSecondary, lineHeight: 17, marginTop: 6 },
              ]}
            >
              {rec.description}
            </Text>

            {rec.actionLabel && (
              <Pressable
                onPress={() => handlePressAction(rec)}
                style={({ pressed }) => [
                  styles.actionButton,
                  {
                    backgroundColor: pressed
                      ? theme.colors.backgroundAlt
                      : 'transparent',
                  },
                ]}
                accessibilityRole="button"
                accessibilityLabel={rec.actionLabel}
              >
                <Text
                  style={[
                    theme.typography.buttonSm,
                    {
                      color: isAttention
                        ? theme.colors.warning
                        : theme.colors.primary,
                      fontSize: 13,
                    },
                  ]}
                >
                  {rec.actionLabel} →
                </Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  compactBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleColumn: {
    flex: 1,
    minWidth: 0,
  },
  actionButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    minHeight: 44,
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
});
