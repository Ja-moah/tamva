/**
 * TAMVA HomeSkeleton Component
 *
 * Full-page structured skeleton for the Home screen.
 * Preserves the exact visual layout during async data fetching to prevent layout shift.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Skeleton } from '../ui/Skeleton';
import { Card } from '../ui/Card';

export const HomeSkeleton: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* 1. Header Skeleton (Pinned, matching HomeHeader) */}
      <View
        style={[
          styles.headerRow,
          {
            paddingTop: Math.max(insets.top, 16),
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Skeleton circle width={40} height={40} />
          <View style={{ marginLeft: 12 }}>
            <Skeleton width={80} height={12} style={{ marginBottom: 6 }} />
            <Skeleton width={120} height={18} />
          </View>
        </View>
        <View style={styles.headerRight}>
          <Skeleton circle width={40} height={40} />
          <Skeleton circle width={40} height={40} style={{ marginLeft: 10 }} />
        </View>
      </View>

      {/* 2. Scrollable Dashboard Body Skeleton */}
      <View style={styles.body}>
        {/* Financial Confidence Hero Skeleton */}
        <View style={styles.sectionContainer}>
          <View
            style={[
              styles.confidenceCardSkeleton,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.border,
                borderRadius: 20,
              },
            ]}
          >
            <View style={styles.confidenceHeader}>
              <Skeleton width={140} height={14} />
              <Skeleton width={72} height={22} borderRadius={11} />
            </View>
            <View style={styles.scoreRowSkeleton}>
              <Skeleton width={95} height={42} style={{ marginRight: 6 }} />
              <Skeleton width={45} height={16} />
            </View>
            {/* 5-segment track skeleton */}
            <View style={styles.gaugeTrackSkeleton}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Skeleton key={s} width="18%" height={5} borderRadius={2.5} />
              ))}
            </View>
            <Skeleton width="92%" height={12} style={{ marginTop: 12, marginBottom: 4 }} />
            <Skeleton width="65%" height={12} />
          </View>
        </View>

        {/* Financial Overview Skeleton */}
        <View style={styles.sectionContainer}>
          <Card variant="elevated" padding="none" style={styles.overviewCard}>
            <View style={styles.overviewTop}>
              <View style={styles.overviewHeaderRow}>
                <Skeleton width={135} height={14} />
                <Skeleton width={56} height={20} borderRadius={10} />
              </View>
              <Skeleton width={190} height={34} style={{ marginVertical: 6 }} />
              <Skeleton width={175} height={12} />
            </View>
            <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.border }} />
            <View style={styles.overviewBottom}>
              <View style={styles.flowColumn}>
                <Skeleton width={85} height={12} style={{ marginBottom: 6 }} />
                <Skeleton width={95} height={18} />
              </View>
              <View style={{ width: StyleSheet.hairlineWidth, height: 32, backgroundColor: theme.colors.border }} />
              <View style={[styles.flowColumn, { paddingLeft: 16 }]}>
                <Skeleton width={85} height={12} style={{ marginBottom: 6 }} />
                <Skeleton width={95} height={18} />
              </View>
            </View>
          </Card>
        </View>

        {/* Quick Actions Skeleton (48x48 squircles) */}
        <View style={styles.quickActionsRow}>
          {[1, 2, 3, 4].map((i) => (
            <View key={i} style={styles.quickActionItem}>
              <Skeleton width={48} height={48} borderRadius={14} style={{ marginBottom: 6 }} />
              <Skeleton width={38} height={12} />
            </View>
          ))}
        </View>

        {/* Protection Banner Skeleton */}
        <View style={styles.sectionContainer}>
          <Card variant="standard" padding="none" style={styles.protectionCard}>
            <View style={styles.protectionContentRow}>
              <Skeleton width={36} height={36} borderRadius={10} style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Skeleton width={140} height={14} style={{ marginBottom: 4 }} />
                <Skeleton width={180} height={11} />
              </View>
              <Skeleton width={12} height={12} borderRadius={6} />
            </View>
          </Card>
        </View>

        {/* Recent Activity Skeleton */}
        <View style={styles.sectionContainer}>
          <View style={styles.activityHeader}>
            <Skeleton width={120} height={18} />
            <Skeleton width={48} height={14} />
          </View>
          <Card variant="standard" padding="none" style={styles.activityCard}>
            {[1, 2, 3].map((i) => (
              <View key={i} style={styles.activityRow}>
                <Skeleton width={38} height={38} borderRadius={12} style={{ marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Skeleton width="55%" height={14} style={{ marginBottom: 6 }} />
                  <Skeleton width="38%" height={11} />
                </View>
                <Skeleton width={75} height={16} />
              </View>
            ))}
          </Card>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  body: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionContainer: {
    marginBottom: 4,
  },
  confidenceCardSkeleton: {
    padding: 20,
    borderWidth: 1,
    marginTop: 4,
    width: '100%',
  },
  confidenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  scoreRowSkeleton: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  overviewCard: {
    marginVertical: 12,
  },
  overviewTop: {
    padding: 20,
  },
  overviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  overviewBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  flowColumn: {
    flex: 1,
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 18,
    paddingHorizontal: 12,
  },
  quickActionItem: {
    flex: 1,
    alignItems: 'center',
  },
  gaugeTrackSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 5,
    marginBottom: 8,
  },
  protectionCard: {
    marginVertical: 8,
    borderRadius: 16,
  },
  protectionContentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  activityCard: {
    marginTop: 8,
  },
  activityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 64,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
});
