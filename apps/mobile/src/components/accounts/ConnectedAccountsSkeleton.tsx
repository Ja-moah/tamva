/**
 * TAMVA ConnectedAccountsSkeleton Component
 *
 * Layout-preserving skeleton loader for Connected Accounts & Consent screen.
 * Prevents Cumulative Layout Shift (CLS) across screen header, trust card,
 * summary metrics, primary action button, and institution account rows.
 */

import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Skeleton } from '../ui/Skeleton';

export const ConnectedAccountsSkeleton: React.FC = () => {
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
          <Skeleton width={180} height={26} borderRadius={theme.radius.sm} />
          <View style={{ height: 6 }} />
          <Skeleton width={230} height={14} borderRadius={theme.radius.xs} />
        </View>
        <View style={styles.headerRight}>
          <Skeleton width={40} height={40} circle />
          <View style={{ width: 8 }} />
          <Skeleton width={40} height={40} circle />
        </View>
      </View>

      {/* Trust Card Skeleton */}
      <View
        style={[
          styles.trustCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            borderRadius: theme.radius.lg,
          },
        ]}
      >
        <View style={styles.trustHeader}>
          <Skeleton width={36} height={36} circle />
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Skeleton width={160} height={15} borderRadius={theme.radius.xs} />
            <View style={{ height: 4 }} />
            <Skeleton width={210} height={12} borderRadius={theme.radius.xs} />
          </View>
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
          <View>
            <Skeleton width={140} height={12} borderRadius={theme.radius.xs} />
            <View style={{ height: 8 }} />
            <Skeleton width={60} height={28} borderRadius={theme.radius.sm} />
          </View>
          <Skeleton width={36} height={36} circle />
        </View>

        <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.summaryBottom}>
          <Skeleton width={80} height={14} borderRadius={theme.radius.xs} />
          <Skeleton width={110} height={14} borderRadius={theme.radius.xs} />
        </View>
      </View>

      {/* Primary Action Button Skeleton */}
      <View style={styles.buttonWrapper}>
        <Skeleton width="100%" height={48} borderRadius={theme.radius.md} />
      </View>

      {/* Section Header Skeleton */}
      <View style={styles.sectionHeaderRow}>
        <Skeleton width={120} height={13} borderRadius={theme.radius.xs} />
      </View>

      {/* 3 Account Row Skeletons */}
      {[1, 2, 3].map((item) => (
        <View
          key={item}
          style={[
            styles.accountRow,
            {
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
              borderRadius: theme.radius.lg,
            },
          ]}
        >
          <Skeleton width={44} height={44} circle />
          <View style={styles.accountInfo}>
            <Skeleton width={130} height={15} borderRadius={theme.radius.xs} />
            <View style={{ height: 6 }} />
            <Skeleton width={170} height={12} borderRadius={theme.radius.xs} />
            <View style={{ height: 8 }} />
            <Skeleton width={85} height={18} borderRadius={theme.radius.xs} />
          </View>
          <View style={styles.accountRight}>
            <Skeleton width={70} height={16} borderRadius={theme.radius.xs} />
          </View>
        </View>
      ))}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trustCard: {
    width: '100%',
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
  },
  trustHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryCard: {
    width: '100%',
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  summaryTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  divider: {
    height: 1,
    width: '100%',
    marginVertical: 14,
  },
  summaryBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonWrapper: {
    width: '100%',
    marginBottom: 20,
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  accountInfo: {
    flex: 1,
    marginLeft: 14,
  },
  accountRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
