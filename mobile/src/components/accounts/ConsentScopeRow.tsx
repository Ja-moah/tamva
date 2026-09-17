/**
 * TAMVA ConsentScopeRow Component
 *
 * Granular row for reviewing or toggling individual data access scopes:
 * - Scope icon avatar with semantic color
 * - Title, short description, and clear explanation of purpose
 * - Obvious hierarchy between REQUIRED (locked with lock badge) and OPTIONAL (switch)
 * - Accessible switch announcements and tactile haptic feedback
 */

import React from 'react';
import { View, Text, Switch, StyleSheet, Platform } from 'react-native';
import { useTheme } from '../../theme';
import { ConsentedScopeDetail } from '../../types/accounts';
import { Icon } from '../ui/Icon';
import { Badge } from '../ui/Badge';
import { useHaptics } from '../../hooks/useHaptics';

export interface ConsentScopeRowProps {
  scope: ConsentedScopeDetail;
  isSelected: boolean;
  onToggle?: (scopeId: string, value: boolean) => void;
  disabled?: boolean;
}

export const ConsentScopeRow: React.FC<ConsentScopeRowProps> = ({
  scope,
  isSelected,
  onToggle,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();

  const handleValueChange = (val: boolean) => {
    if (scope.isRequired || disabled) return;
    haptics.selection();
    onToggle?.(scope.id, val);
  };

  const isSwitchDisabled = scope.isRequired || disabled;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: scope.isRequired
            ? theme.colors.surfaceElevated
            : theme.colors.surface,
          borderColor: scope.isRequired
            ? theme.colors.borderStrong
            : theme.colors.border,
          borderRadius: theme.radius.md,
        },
      ]}
      accessible
      accessibilityRole="switch"
      accessibilityLabel={`${scope.title}, ${
        scope.isRequired ? 'Required permission' : 'Optional permission'
      }`}
      accessibilityHint={
        scope.isRequired
          ? 'Required for account connection. Cannot be disabled.'
          : `Double tap to ${isSelected ? 'disable' : 'enable'} access to ${scope.title}`
      }
      accessibilityState={{
        checked: isSelected,
        disabled: isSwitchDisabled,
      }}
    >
      <View style={styles.topRow}>
        {/* Scope Icon Avatar */}
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: scope.isRequired
                ? theme.colors.surface
                : theme.colors.primaryLight,
              borderColor: theme.colors.border,
            },
          ]}
        >
          <Icon
            name={scope.icon}
            size={16}
            color={scope.isRequired ? theme.colors.textPrimary : theme.colors.primary}
          />
        </View>

        {/* Scope Title & Required / Optional Badge */}
        <View style={styles.titleColumn}>
          <View style={styles.titleHeader}>
            <Text
              style={[
                theme.typography.bodyMedium,
                { color: theme.colors.textPrimary, fontWeight: '600' },
              ]}
            >
              {scope.title}
            </Text>
            {scope.isRequired ? (
              <Badge
                label="Required"
                tone="neutral"
                size="sm"
                icon="lock"
                style={styles.tagBadge}
              />
            ) : (
              <Badge
                label="Optional"
                tone="information"
                size="sm"
                style={styles.tagBadge}
              />
            )}
          </View>
        </View>

        {/* Switch Control or Fixed Lock Status */}
        <View style={styles.switchWrapper}>
          {scope.isRequired ? (
            <View
              style={[
                styles.lockedPill,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Icon name="check" size={12} color={theme.colors.success} />
              <Text
                style={[
                  theme.typography.caption,
                  { color: theme.colors.textSecondary, marginLeft: 4, fontSize: 11, fontWeight: '600' },
                ]}
              >
                Locked
              </Text>
            </View>
          ) : (
            <Switch
              value={isSelected}
              onValueChange={handleValueChange}
              disabled={isSwitchDisabled}
              trackColor={{
                false: theme.colors.borderStrong,
                true: theme.colors.primary,
              }}
              thumbColor={
                Platform.OS === 'android'
                  ? isSelected
                    ? theme.colors.surface
                    : theme.colors.textTertiary
                  : undefined
              }
              ios_backgroundColor={theme.colors.border}
            />
          )}
        </View>
      </View>

      {/* Descriptions */}
      <View style={styles.descriptionColumn}>
        <Text
          style={[
            theme.typography.captionMedium,
            { color: theme.colors.textSecondary, marginTop: 4, lineHeight: 16 },
          ]}
        >
          {scope.shortDescription}
        </Text>
        <Text
          style={[
            theme.typography.caption,
            { color: theme.colors.textTertiary, marginTop: 2, lineHeight: 15 },
          ]}
        >
          {scope.purposeDescription}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    flexShrink: 0,
  },
  titleColumn: {
    flex: 1,
    marginRight: 6,
  },
  titleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagBadge: {
    marginLeft: 2,
  },
  switchWrapper: {
    marginLeft: 4,
    flexShrink: 0,
  },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  descriptionColumn: {
    marginTop: 6,
    paddingLeft: 44,
  },
});
