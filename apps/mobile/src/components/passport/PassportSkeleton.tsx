/**
 * TAMVA PassportSkeleton Component
 *
 * Layout-preserving skeleton loader for the Financial Passport screen.
 * Guarantees zero Cumulative Layout Shift (CLS) by mirroring the exact
 * dimensions and vertical rhythm of:
 * - PassportHeader
 * - PassportIdentityCard
 * - PassportConfidenceCard
 * - PassportFinancialPositionCard
 * - PassportBehaviorMetrics
 * - PassportInstitutionsCard
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Skeleton } from '../ui/Skeleton';

export const PassportSkeleton: React.FC = () => {
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
        <View style={styles.headerLeft}>
          <Skeleton width={180} height={26} borderRadius={theme.radius.sm} />
          <View style={{ height: 6 }} />
          <Skeleton width={240} height={14} borderRadius={theme.radius.xs} />
        </View>
        <View style={styles.headerRight}>
          <Skeleton width={40} height={40} circle />
          <View style={{ width: 8 }} />
          <Skeleton width={40} height={40} circle />
        </View>
      </View>

      {/* 2. Identity Card Skeleton */}
      <View
        style={[
          styles.cardBox,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: 16,
          },
        ]}
      >
        <View style={styles.identityHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Skeleton width={34} height={34} borderRadius={10} />
            <View style={{ marginLeft: 10 }}>
              <Skeleton width={80} height={10} borderRadius={theme.radius.xs} />
              <View style={{ height: 4 }} />
              <Skeleton width={110} height={14} borderRadius={theme.radius.xs} />
            </View>
          </View>
          <Skeleton width={80} height={22} borderRadius={11} />
        </View>

        <View style={styles.cardPadding}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View>
              <Skeleton width={90} height={10} borderRadius={theme.radius.xs} />
              <View style={{ height: 6 }} />
              <Skeleton width={160} height={24} borderRadius={theme.radius.xs} />
            </View>
            <Skeleton width={40} height={40} circle />
          </View>
          <View style={{ height: 12 }} />
          <Skeleton width="90%" height={12} borderRadius={theme.radius.xs} />
          <View style={{ height: 6 }} />
          <Skeleton width="75%" height={12} borderRadius={theme.radius.xs} />
        </View>
      </View>

      {/* 3. Confidence Card Skeleton */}
      <View
        style={[
          styles.cardBox,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: 16,
          },
        ]}
      >
        <View style={styles.cardPadding}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width={150} height={14} borderRadius={theme.radius.xs} />
            <Skeleton width={90} height={24} borderRadius={12} />
          </View>
          <View style={{ height: 14 }} />
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
            <Skeleton width={120} height={44} borderRadius={theme.radius.sm} />
            <Skeleton width={140} height={24} borderRadius={8} />
          </View>
          <View style={{ height: 14 }} />
          {/* Segmented bar */}
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {[1, 2, 3, 4, 5].map((item) => (
              <View key={item} style={{ flex: 1 }}>
                <Skeleton width="100%" height={6} borderRadius={3} />
              </View>
            ))}
          </View>
          <View style={{ height: 14 }} />
          <Skeleton width="95%" height={12} borderRadius={theme.radius.xs} />
          <View style={{ height: 6 }} />
          <Skeleton width="80%" height={12} borderRadius={theme.radius.xs} />
        </View>
      </View>

      {/* 4. Financial Position Skeleton */}
      <View
        style={[
          styles.cardBox,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: 16,
          },
        ]}
      >
        <View style={styles.cardPadding}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Skeleton width={140} height={14} borderRadius={theme.radius.xs} />
            <Skeleton width={80} height={20} borderRadius={6} />
          </View>
          <View style={{ height: 12 }} />
          <Skeleton width={110} height={12} borderRadius={theme.radius.xs} />
          <View style={{ height: 6 }} />
          <Skeleton width={200} height={36} borderRadius={theme.radius.sm} />
          <View style={{ height: 16 }} />
          <Skeleton width="100%" height={60} borderRadius={12} />
        </View>
      </View>

      {/* 5. Metrics Skeleton */}
      <View style={{ marginTop: 4, marginBottom: 16 }}>
        <Skeleton width={160} height={14} borderRadius={theme.radius.xs} />
        <View style={{ height: 10 }} />
        <View
          style={[
            styles.cardBox,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: 16,
              marginBottom: 0,
            },
          ]}
        >
          {[1, 2, 3, 4, 5].map((item, idx) => (
            <View
              key={item}
              style={[
                styles.metricSkeletonGroupRow,
                idx < 4 && {
                  borderBottomColor: theme.colors.border,
                  borderBottomWidth: StyleSheet.hairlineWidth,
                },
              ]}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Skeleton width={32} height={32} borderRadius={8} />
                  <View style={{ marginLeft: 10 }}>
                    <Skeleton width={140} height={14} borderRadius={theme.radius.xs} />
                  </View>
                </View>
                <Skeleton width={70} height={20} borderRadius={10} />
              </View>
              <View style={{ height: 8, paddingLeft: 42 }} />
              <View style={{ paddingLeft: 42 }}>
                <Skeleton width="85%" height={11} borderRadius={theme.radius.xs} />
              </View>
            </View>
          ))}
        </View>
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
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardBox: {
    width: '100%',
    borderWidth: 1,
    marginBottom: 16,
    overflow: 'hidden',
  },
  identityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  cardPadding: {
    padding: 16,
  },
  metricSkeletonRow: {
    width: '100%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  metricSkeletonGroupRow: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
});
