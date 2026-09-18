/**
 * TAMVA ActivitySearchBar Component
 *
 * Clean search input for filtering transactions by merchant,
 * category, account institution, or reference ID.
 * Features instant clear button, focused border state, and
 * integrated secondary filter sheet trigger with active count badge.
 */

import React, { useState } from 'react';
import { View, TextInput, Pressable, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../theme';
import { Icon } from '../ui/Icon';
import { useHaptics } from '../../hooks/useHaptics';

export interface ActivitySearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
  onFilterPress?: () => void;
  activeFilterCount?: number;
}

export const ActivitySearchBar: React.FC<ActivitySearchBarProps> = ({
  value,
  onChangeText,
  onClear,
  placeholder = 'Search merchant, category, account...',
  onFilterPress,
  activeFilterCount = 0,
}) => {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const [isFocused, setIsFocused] = useState(false);

  const hasValue = value.length > 0;
  const hasActiveSecondaryFilters = activeFilterCount > 0;

  const handleClear = () => {
    haptics.lightImpact();
    onClear();
  };

  const handleFilterPress = () => {
    haptics.lightImpact();
    onFilterPress?.();
  };

  return (
    <View style={styles.outerRow}>
      {/* Search Input Box */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: theme.colors.surface,
            borderColor: isFocused ? theme.colors.primary : theme.colors.border,
            borderRadius: theme.radius.md,
          },
        ]}
      >
        <View style={styles.iconWrapper}>
          <Icon
            name="search"
            size={16}
            color={isFocused ? theme.colors.primary : theme.colors.textTertiary}
          />
        </View>

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.textTertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[
            styles.input,
            theme.typography.bodySm,
            {
              color: theme.colors.textPrimary,
            },
          ]}
          returnKeyType="search"
          accessibilityLabel="Search transactions"
          accessibilityHint="Filters transaction list by merchant, category, account, or reference"
        />

        {hasValue && (
          <Pressable
            onPress={handleClear}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.clearButton}
            accessibilityRole="button"
            accessibilityLabel="Clear search text"
          >
            <View
              style={[
                styles.clearCircle,
                { backgroundColor: theme.colors.backgroundAlt },
              ]}
            >
              <Icon name="x" size={12} color={theme.colors.textSecondary} />
            </View>
          </Pressable>
        )}
      </View>

      {/* Secondary Filter Button */}
      {onFilterPress && (
        <Pressable
          onPress={handleFilterPress}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          style={({ pressed }) => [
            styles.filterButton,
            {
              backgroundColor: hasActiveSecondaryFilters
                ? theme.colors.primaryLight
                : theme.colors.surface,
              borderColor: hasActiveSecondaryFilters
                ? theme.colors.primary
                : theme.colors.border,
              borderRadius: theme.radius.md,
              opacity: pressed ? 0.82 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            hasActiveSecondaryFilters
              ? `Filter options, ${activeFilterCount} active filter${
                  activeFilterCount > 1 ? 's' : ''
                }`
              : 'Open filter options'
          }
          accessibilityHint="Opens sheet to filter by status and financial institution"
        >
          <Icon
            name="sliders"
            size={17}
            color={
              hasActiveSecondaryFilters
                ? theme.colors.primary
                : theme.colors.textSecondary
            }
          />

          {hasActiveSecondaryFilters && (
            <View
              style={[
                styles.filterBadge,
                {
                  backgroundColor: theme.colors.primary,
                  borderColor: theme.colors.background,
                  borderWidth: 1.5,
                },
              ]}
            >
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  outerRow: {
    marginHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  iconWrapper: {
    marginRight: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    paddingVertical: 0,
    fontSize: 14,
  },
  clearButton: {
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButton: {
    width: 44,
    height: 44,
    borderWidth: 1,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});
