/**
 * TAMVA ActivityFilterBar Component
 *
 * Horizontally scrollable row of filter chips.
 * Reuses TAMVA's Chip component with category counts and iconography.
 */

import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { ActivityFilterId, ActivityFilterOption } from '../../types/activity';
import { Chip } from '../ui/Chip';

export interface ActivityFilterBarProps {
  options: ActivityFilterOption[];
  selectedFilter: ActivityFilterId;
  onSelectFilter: (filterId: ActivityFilterId) => void;
}

export const ActivityFilterBar: React.FC<ActivityFilterBarProps> = ({
  options,
  selectedFilter,
  onSelectFilter,
}) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {options.map((option) => (
          <Chip
            key={option.id}
            label={option.label}
            icon={option.icon}
            count={option.count}
            selected={selectedFilter === option.id}
            onPress={() => onSelectFilter(option.id)}
            style={styles.chipItem}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chipItem: {},
});
