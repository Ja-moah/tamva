/**
 * TAMVA RiskSkeleton Component
 *
 * Layout-preserving skeleton loader for the Risk Overview screen (Phase 8A).
 * Mirrors the exact visual layout and vertical rhythm of:
 * - RiskHeader
 * - RiskLevelCard (with segmented scale)
 * - RiskFactorsCard (4 factor rows)
 * - RiskSummaryCard
 * - RiskCoverageCard (3 metric tiles)
 * - RiskFreshnessFooter
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Skeleton } from '../ui/Skeleton';

export const RiskSkeleton: React.FC = () => {
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
      {/* 1. Header Skeleton */}
      <View style={styles.headerRow}>
        <Skeleton width={44} height={44} circle />
        <View style={styles.headerTitleCol}>
          <Skeleton width={150} height={24} borderRadius={theme.radius.sm} />
          <View style={{ height: 6 }} />
          <Skeleton width={200} height={14} borderRadius={theme.radius.xs} />
        </View>
        <Skeleton width={44} height={44} circle />
      </View>

      {/* 2. Hero Level Card Skeleton */}
      <View
        style={[
          styles.cardBox,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <View style={styles.topSpaceBetween}>
          <Skeleton width={130} height={13} borderRadius={theme.radius.xs} />
          <Skeleton width={70} height={20} borderRadius={theme.radius.full} />
        </View>

        <View style={{ height: 16 }} />
        <Skeleton width={160} height={32} borderRadius={theme.radius.sm} />

        {/* Segmented Scale Skeleton */}
        <View style={{ height: 16 }} />
        <View style={styles.segmentsRow}>
          <Skeleton width="31%" height={6} borderRadius={3} />
          <Skeleton width="31%" height={6} borderRadius={3} />
          <Skeleton width="31%" height={6} borderRadius={3} />
        </View>
        <View style={{ height: 8 }} />
        <View style={styles.topSpaceBetween}>
          <Skeleton width={60} height={10} borderRadius={theme.radius.xs} />
          <Skeleton width={80} height={10} borderRadius={theme.radius.xs} />
          <Skeleton width={75} height={10} borderRadius={theme.radius.xs} />
        </View>

        <View style={{ height: 20 }} />
        <Skeleton width={180} height={18} borderRadius={theme.radius.xs} />
        <View style={{ height: 8 }} />
        <Skeleton width="100%" height={14} borderRadius={theme.radius.xs} />
        <View style={{ height: 4 }} />
        <Skeleton width="85%" height={14} borderRadius={theme.radius.xs} />

        <View style={{ height: 16 }} />
        <Skeleton width="100%" height={32} borderRadius={theme.radius.md} />
      </View>

      {/* 3. Factors Card Skeleton */}
      <View
        style={[
          styles.cardBox,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <Skeleton width={110} height={18} borderRadius={theme.radius.xs} />
        <View style={{ height: 4 }} />
        <Skeleton width={220} height={12} borderRadius={theme.radius.xs} />
        <View style={{ height: 16 }} />

        {[1, 2, 3, 4].map((i) => (
          <View key={i} style={styles.factorRowSkeleton}>
            <Skeleton width={38} height={38} circle />
            <View style={styles.factorTextCol}>
              <Skeleton width={120} height={14} borderRadius={theme.radius.xs} />
              <View style={{ height: 4 }} />
              <Skeleton width="90%" height={12} borderRadius={theme.radius.xs} />
            </View>
            <Skeleton width={56} height={20} borderRadius={theme.radius.full} />
          </View>
        ))}
      </View>

      {/* 4. Summary Card Skeleton */}
      <View
        style={[
          styles.cardBox,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <Skeleton width={140} height={18} borderRadius={theme.radius.xs} />
        <View style={{ height: 4 }} />
        <Skeleton width={200} height={12} borderRadius={theme.radius.xs} />
        <View style={{ height: 14 }} />
        <Skeleton width="100%" height={14} borderRadius={theme.radius.xs} />
        <View style={{ height: 6 }} />
        <Skeleton width="92%" height={14} borderRadius={theme.radius.xs} />
        <View style={{ height: 14 }} />
        <Skeleton width="100%" height={60} borderRadius={theme.radius.md} />
      </View>

      {/* 5. Decision Intelligence Card Skeleton */}
      <View
        style={[
          styles.cardBox,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <View style={styles.topSpaceBetween}>
          <View>
            <Skeleton width={150} height={18} borderRadius={theme.radius.xs} />
            <View style={{ height: 4 }} />
            <Skeleton width={220} height={12} borderRadius={theme.radius.xs} />
          </View>
          <Skeleton width={90} height={20} borderRadius={theme.radius.full} />
        </View>

        <View style={{ height: 14 }} />
        <Skeleton width="100%" height={40} borderRadius={theme.radius.md} />

        <View style={{ height: 14 }} />
        <Skeleton width="100%" height={14} borderRadius={theme.radius.xs} />
        <View style={{ height: 4 }} />
        <Skeleton width="80%" height={14} borderRadius={theme.radius.xs} />

        <View style={{ height: 14 }} />
        <Skeleton width="100%" height={74} borderRadius={theme.radius.md} />

        <View style={{ height: 14 }} />
        <Skeleton width={140} height={14} borderRadius={theme.radius.xs} />
      </View>

      {/* 6. Coverage Card Skeleton */}
      <View
        style={[
          styles.cardBox,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <Skeleton width={120} height={18} borderRadius={theme.radius.xs} />
        <View style={{ height: 4 }} />
        <Skeleton width={210} height={12} borderRadius={theme.radius.xs} />
        <View style={{ height: 14 }} />
        <View style={styles.metricsRow}>
          <Skeleton width="31%" height={56} borderRadius={theme.radius.md} />
          <Skeleton width="31%" height={56} borderRadius={theme.radius.md} />
          <Skeleton width="31%" height={56} borderRadius={theme.radius.md} />
        </View>
      </View>

      {/* 6. Footer Skeleton */}
      <View style={styles.footerCenter}>
        <Skeleton width={120} height={12} borderRadius={theme.radius.xs} />
        <View style={{ height: 8 }} />
        <Skeleton width={260} height={12} borderRadius={theme.radius.xs} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  headerTitleCol: {
    flex: 1,
  },
  cardBox: {
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
  },
  topSpaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  segmentsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  factorRowSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
  },
  factorTextCol: {
    flex: 1,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerCenter: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
});
