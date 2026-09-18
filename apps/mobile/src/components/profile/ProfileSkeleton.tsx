/**
 * TAMVA ProfileSkeleton Component
 *
 * Layout-preserving skeleton loader for the Financial Profile screen.
 * Guarantees zero Cumulative Layout Shift (CLS) by mirroring the exact
 * dimensions and vertical rhythm of:
 * - ProfileHeader
 * - ProfileScoreCard
 * - ProfileDimensions
 * - ProfileCashflowCard
 * - ProfileInsights
 * - ProfileSourcesCard
 * - ProfileFreshnessFooter
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Skeleton } from '../ui/Skeleton';

export const ProfileSkeleton: React.FC = () => {
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
          <Skeleton width={170} height={26} borderRadius={theme.radius.sm} />
          <View style={{ height: 6 }} />
          <Skeleton width={230} height={14} borderRadius={theme.radius.xs} />
        </View>
        <View style={styles.headerRight}>
          <Skeleton width={40} height={40} circle />
          <View style={{ width: 8 }} />
          <Skeleton width={40} height={40} circle />
        </View>
      </View>

      {/* 2. Score Card Skeleton */}
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
        {/* 1. Score Skeleton (Score top, kicker below) */}
        <View style={styles.scoreRow}>
          <Skeleton width={150} height={42} borderRadius={theme.radius.sm} />
          <Skeleton width={90} height={24} borderRadius={theme.radius.full} />
        </View>
        <View style={{ height: 6 }} />
        <Skeleton width={130} height={13} borderRadius={theme.radius.xs} />

        <View style={{ height: 12 }} />
        <View style={styles.meterRow}>
          <Skeleton width="18%" height={6} borderRadius={3} />
          <Skeleton width="18%" height={6} borderRadius={3} />
          <Skeleton width="18%" height={6} borderRadius={3} />
          <Skeleton width="18%" height={6} borderRadius={3} />
          <Skeleton width="18%" height={6} borderRadius={3} />
        </View>

        <View style={{ height: 12 }} />
        <Skeleton width="100%" height={14} borderRadius={theme.radius.xs} />
        <View style={{ height: 6 }} />
        <Skeleton width="75%" height={14} borderRadius={theme.radius.xs} />

        <View style={{ height: 14 }} />
        <Skeleton width="100%" height={32} borderRadius={theme.radius.sm} />
      </View>

      {/* 3. Behavioural Dimensions Skeleton */}
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
        <View style={styles.cardHeaderRow}>
          <Skeleton width={160} height={14} borderRadius={theme.radius.xs} />
          <Skeleton width={120} height={14} borderRadius={theme.radius.xs} />
        </View>
        <View style={{ height: 8 }} />
        <Skeleton width={200} height={18} borderRadius={theme.radius.xs} />
        <View style={{ height: 6 }} />
        <Skeleton width="90%" height={14} borderRadius={theme.radius.xs} />

        <View style={{ height: 14 }} />
        {/* 5 dimension rows inside container */}
        <View
          style={[
            styles.groupedBox,
            {
              backgroundColor: theme.colors.backgroundAlt,
              borderColor: theme.colors.border,
            },
          ]}
        >
          {[1, 2, 3, 4, 5].map((item, idx) => (
            <View key={item} style={styles.dimRow}>
              <View style={styles.dimRowHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Skeleton width={28} height={28} borderRadius={7} />
                  <View style={{ width: 10 }} />
                  <Skeleton width={130} height={16} borderRadius={theme.radius.xs} />
                </View>
                <Skeleton width={40} height={18} borderRadius={theme.radius.xs} />
              </View>
              <View style={{ height: 6 }} />
              <Skeleton width="95%" height={12} borderRadius={theme.radius.xs} />
              {idx < 4 && (
                <View
                  style={[
                    styles.rowDivider,
                    { backgroundColor: theme.colors.border },
                  ]}
                />
              )}
            </View>
          ))}
        </View>
      </View>

      {/* 4. Cashflow Dynamics Skeleton */}
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
        <View style={styles.cardHeaderRow}>
          <Skeleton width={140} height={14} borderRadius={theme.radius.xs} />
          <Skeleton width={80} height={22} borderRadius={theme.radius.full} />
        </View>

        <View style={{ height: 12 }} />
        <Skeleton width={180} height={12} borderRadius={theme.radius.xs} />
        <View style={{ height: 6 }} />
        <Skeleton width={200} height={36} borderRadius={theme.radius.sm} />

        <View style={{ height: 14 }} />
        <Skeleton width="100%" height={116} borderRadius={12} />
      </View>

      {/* 5. Financial Insights Skeleton */}
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
        <View style={styles.cardHeaderRow}>
          <Skeleton width={150} height={14} borderRadius={theme.radius.xs} />
          <Skeleton width={90} height={14} borderRadius={theme.radius.xs} />
        </View>
        <View style={{ height: 8 }} />
        <Skeleton width={210} height={18} borderRadius={theme.radius.xs} />
        <View style={{ height: 14 }} />

        {[1, 2, 3].map((item) => (
          <View
            key={item}
            style={[
              styles.insightSkeletonItem,
              {
                backgroundColor: theme.colors.backgroundAlt,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.cardHeaderRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Skeleton width={24} height={24} borderRadius={6} />
                <View style={{ width: 8 }} />
                <Skeleton width={140} height={14} borderRadius={theme.radius.xs} />
              </View>
              <Skeleton width={80} height={18} borderRadius={theme.radius.full} />
            </View>
            <View style={{ height: 6 }} />
            <Skeleton width="90%" height={12} borderRadius={theme.radius.xs} />
          </View>
        ))}
      </View>

      {/* 6. Profile Sources Skeleton */}
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
        <View style={styles.cardHeaderRow}>
          <Skeleton width={120} height={14} borderRadius={theme.radius.xs} />
          <Skeleton width={80} height={14} borderRadius={theme.radius.xs} />
        </View>
        <View style={{ height: 8 }} />
        <Skeleton width={190} height={18} borderRadius={theme.radius.xs} />
        <View style={{ height: 14 }} />

        <Skeleton width="100%" height={160} borderRadius={12} />
        <View style={{ height: 14 }} />
        <Skeleton width="100%" height={44} borderRadius={theme.radius.sm} />
      </View>

      {/* 7. Freshness Footnote Skeleton */}
      <View style={styles.footerCenter}>
        <Skeleton width={190} height={14} borderRadius={theme.radius.xs} />
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
    justifyContent: 'space-between',
    marginBottom: 16,
    minHeight: 44,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardBox: {
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 12,
  },
  meterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 4,
  },
  groupedBox: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  dimRow: {
    padding: 12,
  },
  dimRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    width: '100%',
    marginTop: 10,
  },
  insightSkeletonItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  footerCenter: {
    alignItems: 'center',
    paddingVertical: 16,
  },
});
