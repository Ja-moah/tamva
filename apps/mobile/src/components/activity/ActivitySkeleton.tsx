/**
 * TAMVA ActivitySkeleton Component
 *
 * Accurate, layout-preserving skeleton loader for the Activity screen.
 * Prevents Cumulative Layout Shift (CLS) across summary, filters,
 * date groupings, and transaction rows.
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Skeleton } from '../ui/Skeleton';

export const ActivitySkeleton: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: Math.max(insets.top, 16) },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Skeleton */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Skeleton width={120} height={26} borderRadius={theme.radius.sm} />
          <View style={{ height: 6 }} />
          <Skeleton width={180} height={14} borderRadius={theme.radius.xs} />
        </View>
        <View style={styles.headerRight}>
          <Skeleton width={40} height={40} circle />
          <View style={{ width: 8 }} />
          <Skeleton width={40} height={40} circle />
        </View>
      </View>

      {/* Summary Card Skeleton */}
      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <View style={styles.summaryTop}>
          <Skeleton width={130} height={14} borderRadius={theme.radius.xs} />
          <Skeleton width={78} height={20} borderRadius={10} />
        </View>

        <View style={{ height: 14 }} />
        <Skeleton width={80} height={11} borderRadius={theme.radius.xs} />
        <View style={{ height: 6 }} />
        <Skeleton width={150} height={28} borderRadius={theme.radius.sm} />

        <View style={{ height: 14 }} />
        <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />
        <View style={{ height: 12 }} />

        <View style={styles.summaryBottom}>
          <View style={{ flex: 1 }}>
            <Skeleton width={70} height={12} borderRadius={theme.radius.xs} />
            <View style={{ height: 6 }} />
            <Skeleton width={90} height={18} borderRadius={theme.radius.xs} />
          </View>
          <View style={{ flex: 1, paddingLeft: 12 }}>
            <Skeleton width={70} height={12} borderRadius={theme.radius.xs} />
            <View style={{ height: 6 }} />
            <Skeleton width={90} height={18} borderRadius={theme.radius.xs} />
          </View>
        </View>
      </View>

      {/* Search Bar + Filter Trigger Skeleton */}
      <View style={styles.searchSkeleton}>
        <Skeleton width="100%" height={44} borderRadius={theme.radius.md} style={{ flex: 1 }} />
        <View style={{ width: 8 }} />
        <Skeleton width={44} height={44} borderRadius={theme.radius.md} />
      </View>

      {/* Filter Bar Skeleton */}
      <View style={styles.filterSkeleton}>
        <Skeleton width={60} height={34} borderRadius={17} />
        <Skeleton width={85} height={34} borderRadius={17} />
        <Skeleton width={90} height={34} borderRadius={17} />
        <Skeleton width={95} height={34} borderRadius={17} />
      </View>

      {/* Section 1 Header */}
      <View style={styles.sectionHeaderSkeleton}>
        <Skeleton width={80} height={14} borderRadius={theme.radius.xs} />
      </View>

      {/* Section 1 Card */}
      <View
        style={[
          styles.listCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        {[1, 2, 3].map((item, index) => (
          <View key={item} style={styles.rowItem}>
            <Skeleton width={40} height={40} borderRadius={theme.radius.md} />
            <View style={styles.rowCenter}>
              <Skeleton width={140} height={16} borderRadius={theme.radius.xs} />
              <View style={{ height: 6 }} />
              <Skeleton width={90} height={12} borderRadius={theme.radius.xs} />
            </View>
            <View style={styles.rowRight}>
              <Skeleton width={75} height={16} borderRadius={theme.radius.xs} />
              <View style={{ height: 6 }} />
              <Skeleton width={50} height={10} borderRadius={theme.radius.xs} />
            </View>
            {index < 2 && (
              <View
                style={[
                  styles.itemDivider,
                  { backgroundColor: theme.colors.border },
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {/* Section 2 Header */}
      <View style={styles.sectionHeaderSkeleton}>
        <Skeleton width={100} height={14} borderRadius={theme.radius.xs} />
      </View>

      {/* Section 2 Card */}
      <View
        style={[
          styles.listCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        {[1, 2].map((item, index) => (
          <View key={item} style={styles.rowItem}>
            <Skeleton width={40} height={40} borderRadius={theme.radius.md} />
            <View style={styles.rowCenter}>
              <Skeleton width={150} height={16} borderRadius={theme.radius.xs} />
              <View style={{ height: 6 }} />
              <Skeleton width={100} height={12} borderRadius={theme.radius.xs} />
            </View>
            <View style={styles.rowRight}>
              <Skeleton width={80} height={16} borderRadius={theme.radius.xs} />
            </View>
            {index < 1 && (
              <View
                style={[
                  styles.itemDivider,
                  { backgroundColor: theme.colors.border },
                ]}
              />
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCard: {
    marginHorizontal: 20,
    marginTop: 4,
    marginBottom: 14,
    padding: 16,
    borderWidth: 1,
  },
  summaryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
  },
  summaryBottom: {
    flexDirection: 'row',
  },
  searchSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  filterSkeleton: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 8,
    marginBottom: 10,
  },
  sectionHeaderSkeleton: {
    paddingHorizontal: 22,
    marginTop: 16,
    marginBottom: 8,
  },
  listCard: {
    marginHorizontal: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    position: 'relative',
  },
  rowCenter: {
    flex: 1,
    marginLeft: 12,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  itemDivider: {
    position: 'absolute',
    bottom: 0,
    left: 52,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
});
