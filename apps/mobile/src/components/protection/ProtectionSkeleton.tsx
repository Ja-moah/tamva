/**
 * TAMVA ProtectionSkeleton Component
 *
 * Layout-preserving skeleton loader for the Financial Protection screen.
 * Mirrors the exact visual dimensions and vertical rhythm of:
 * - ProtectionHeader
 * - ProtectionStatusCard
 * - ProtectionOverview
 * - ProtectionMonitoringCard
 * - ProtectionAccountsCard
 * - ProtectionActivityCard
 * - ProtectionRecommendation
 * - ProtectionFreshnessFooter
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Skeleton } from '../ui/Skeleton';

export const ProtectionSkeleton: React.FC = () => {
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
          <Skeleton width={180} height={24} borderRadius={theme.radius.sm} />
          <View style={{ height: 6 }} />
          <Skeleton width={220} height={14} borderRadius={theme.radius.xs} />
        </View>
        <Skeleton width={44} height={44} circle />
      </View>

      {/* 2. Hero Status Card Skeleton */}
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
        <View style={styles.topSpaceBetween}>
          <Skeleton width={140} height={14} borderRadius={theme.radius.xs} />
          <Skeleton width={50} height={14} borderRadius={theme.radius.xs} />
        </View>
        <View style={{ height: 16 }} />
        <View style={styles.rowAlign}>
          <Skeleton width={48} height={48} borderRadius={14} />
          <View style={{ width: 14 }} />
          <Skeleton width={120} height={28} borderRadius={theme.radius.sm} />
        </View>
        <View style={{ height: 16 }} />
        <Skeleton width="100%" height={16} borderRadius={theme.radius.xs} />
        <View style={{ height: 6 }} />
        <Skeleton width="85%" height={16} borderRadius={theme.radius.xs} />
      </View>

      {/* 3. Protection Overview Skeleton */}
      <Skeleton width={160} height={20} borderRadius={theme.radius.xs} style={{ marginBottom: 12, marginLeft: 4 }} />
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
        {[1, 2, 3, 4].map((item, index) => (
          <View
            key={item}
            style={[
              styles.overviewRow,
              index < 3 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.topSpaceBetween}>
              <View style={styles.rowAlign}>
                <Skeleton width={28} height={28} circle />
                <View style={{ width: 10 }} />
                <Skeleton width={130} height={16} borderRadius={theme.radius.xs} />
              </View>
              <Skeleton width={60} height={22} borderRadius={theme.radius.full} />
            </View>
            <View style={{ height: 8 }} />
            <Skeleton width="90%" height={14} borderRadius={theme.radius.xs} style={{ marginLeft: 38 }} />
          </View>
        ))}
      </View>

      {/* 4. Monitoring Skeleton */}
      <Skeleton width={110} height={20} borderRadius={theme.radius.xs} style={{ marginBottom: 12, marginLeft: 4 }} />
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
        <View style={styles.topSpaceBetween}>
          <Skeleton width={60} height={18} borderRadius={theme.radius.xs} />
          <Skeleton width={110} height={14} borderRadius={theme.radius.xs} />
        </View>
        <View style={{ height: 20 }} />
        <View style={styles.rowCenterEvenly}>
          <Skeleton width={80} height={36} borderRadius={theme.radius.xs} />
          <Skeleton width={80} height={36} borderRadius={theme.radius.xs} />
        </View>
      </View>

      {/* 5. Connected Accounts Skeleton */}
      <Skeleton width={160} height={20} borderRadius={theme.radius.xs} style={{ marginBottom: 12, marginLeft: 4 }} />
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
        <View style={styles.rowCenterEvenly}>
          <Skeleton width={60} height={32} borderRadius={theme.radius.xs} />
          <Skeleton width={60} height={32} borderRadius={theme.radius.xs} />
          <Skeleton width={60} height={32} borderRadius={theme.radius.xs} />
        </View>
      </View>

      {/* 6. Recent Activity Skeleton */}
      <Skeleton width={190} height={20} borderRadius={theme.radius.xs} style={{ marginBottom: 12, marginLeft: 4 }} />
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
        {[1, 2, 3].map((item, index) => (
          <View
            key={item}
            style={[
              styles.activityRow,
              index < 2 && {
                borderBottomWidth: StyleSheet.hairlineWidth,
                borderBottomColor: theme.colors.border,
              },
            ]}
          >
            <Skeleton width={32} height={32} circle />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Skeleton width={140} height={16} borderRadius={theme.radius.xs} />
              <View style={{ height: 4 }} />
              <Skeleton width={90} height={12} borderRadius={theme.radius.xs} />
            </View>
            <Skeleton width={40} height={12} borderRadius={theme.radius.xs} />
          </View>
        ))}
      </View>

      {/* 7. Freshness Skeleton */}
      <View style={styles.freshnessSkeleton}>
        <Skeleton width={140} height={12} borderRadius={theme.radius.xs} />
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
    padding: 16,
    marginBottom: 16,
  },
  topSpaceBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowAlign: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overviewRow: {
    paddingVertical: 12,
  },
  rowCenterEvenly: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 6,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  freshnessSkeleton: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
});
