/**
 * TAMVA PassportShareDuration Component
 *
 * Step 3 of the Share Financial Passport flow.
 * Lets the customer choose how long access should remain valid.
 */

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { useHaptics } from '../../hooks/useHaptics';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { PassportShareDurationId } from '../../types/passport';
import { PASSPORT_SHARE_DURATIONS } from '../../demo/data/mockPassportData';

export interface PassportShareDurationProps {
  selectedDurationId: PassportShareDurationId;
  onSelectDuration: (id: PassportShareDurationId) => void;
  onBack: () => void;
  onContinue: () => void;
}

export const PassportShareDuration: React.FC<PassportShareDurationProps> = ({
  selectedDurationId,
  onSelectDuration,
  onBack,
  onContinue,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  const handleSelect = (id: PassportShareDurationId) => {
    haptics.selection();
    onSelectDuration(id);
  };

  return (
    <View style={styles.container}>
      <Text
        style={[
          theme.typography.caption,
          { color: theme.colors.textSecondary, marginBottom: 14, lineHeight: 18 },
        ]}
      >
        Choose how long this Passport share remains accessible. Access expires
        automatically after the selected timeframe.
      </Text>

      {/* Duration Options List */}
      <View style={styles.list}>
        {PASSPORT_SHARE_DURATIONS.map((duration) => {
          const isSelected = selectedDurationId === duration.id;

          return (
            <Pressable
              key={duration.id}
              onPress={() => handleSelect(duration.id)}
              style={({ pressed }) => [
                styles.card,
                {
                  backgroundColor: isSelected
                    ? theme.colors.primaryLight
                    : theme.colors.surface,
                  borderColor: isSelected
                    ? theme.colors.primary
                    : theme.colors.border,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${duration.label}: ${duration.description}`}
            >
              <View style={styles.cardContent}>
                <View style={styles.leftRow}>
                  <View
                    style={[
                      styles.iconCircle,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.surface
                          : theme.colors.backgroundAlt,
                      },
                    ]}
                  >
                    <Icon
                      name="clock"
                      size={15}
                      color={
                        isSelected
                          ? theme.colors.primary
                          : theme.colors.textSecondary
                      }
                    />
                  </View>

                  <View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Text
                        style={[
                          theme.typography.bodyMedium,
                          {
                            color: theme.colors.textPrimary,
                            fontWeight: isSelected ? '600' : '500',
                            fontSize: 14,
                          },
                        ]}
                      >
                        {duration.label}
                      </Text>
                      {duration.isDefault && (
                        <View style={{ marginLeft: 6 }}>
                          <Badge label="Recommended" tone="neutral" size="sm" />
                        </View>
                      )}
                    </View>
                    <Text
                      style={[
                        theme.typography.caption,
                        { color: theme.colors.textSecondary, marginTop: 2 },
                      ]}
                    >
                      {duration.description}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.radioCircle,
                    {
                      borderColor: isSelected
                        ? theme.colors.primary
                        : theme.colors.border,
                      backgroundColor: isSelected
                        ? theme.colors.primary
                        : 'transparent',
                    },
                  ]}
                >
                  {isSelected && <View style={styles.radioInnerDot} />}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Reassurance Notice */}
      <View
        style={[
          styles.reassuranceBox,
          {
            backgroundColor: theme.colors.backgroundAlt,
            borderColor: theme.colors.border,
          },
        ]}
      >
        <Icon
          name="shield"
          size={14}
          color={theme.colors.primary}
          style={{ marginRight: 8 }}
        />
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textSecondary, flex: 1, fontSize: 11 },
          ]}
        >
          You remain in full control and can manually revoke access at any point
          before the expiry date.
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Button
            label="Back"
            onPress={onBack}
            variant="secondary"
            size="lg"
            fullWidth
          />
        </View>
        <View style={{ flex: 2 }}>
          <Button
            label="Review Share"
            onPress={onContinue}
            variant="primary"
            size="lg"
            rightIcon="arrow-right"
            fullWidth
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: 24,
  },
  list: {
    width: '100%',
    gap: 8,
  },
  card: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    minHeight: 56,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  reassuranceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: 14,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
});
