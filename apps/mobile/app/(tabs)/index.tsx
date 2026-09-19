/**
 * TAMVA Customer Home Screen (Phase 2A)
 *
 * The central financial intelligence dashboard for TAMVA.
 * Composed entirely from Phase 1 design tokens, typography, and reusable primitives.
 */

import { DEMO_MODE } from '../../src/config/env';
import { HomeLive } from '../../src/components/home/HomeLive';
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';

// Design System Foundations (Phase 1)
import { useTheme } from '../../src/theme';
import { useToast } from '../../src/components/ui/Toast';
import { Card } from '../../src/components/ui/Card';
import { Chip } from '../../src/components/ui/Chip';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { ScoreDisplay } from '../../src/components/financial/ScoreDisplay';
import { TransactionRow } from '../../src/components/financial/TransactionRow';

// Home Feature Components & Hooks (Phase 2A)
import { useHomeData, ScreenStateMode } from '../../src/hooks/useHomeData';
import {
  HomeHeader,
  QuickActions,
  FinancialOverview,
  FinancialProtectionCard,
  HomeSkeleton,
} from '../../src/components/home';
import { QuickActionItem } from '../../src/types/home';

function HomeScreen() {
  const { theme } = useTheme();
  const { showToast } = useToast();
  const router = useRouter();

  // Encapsulated data layer (ready for API integration)
  const {
    data,
    isLoading,
    isError,
    isEmpty,
    errorMessage,
    status,
    refresh,
    setStatus,
  } = useHomeData('loaded');

  const [refreshing, setRefreshing] = useState(false);

  const onPullToRefresh = async () => {
    try {
      setRefreshing(true);
      await refresh();
    } catch {
      // Gracefully handled
    } finally {
      setRefreshing(false);
    }
  };

  const handleQuickAction = (action: QuickActionItem) => {
    switch (action.id) {
      case 'send':
        router.push('/send');
        break;
      case 'receive':
        router.push('/receive');
        break;
      case 'save':
        router.push('/save');
        break;
      case 'more':
        showToast({
          type: 'info',
          title: 'Quick Services',
          message: 'Service shortcuts will connect in the next phase.',
        });
        break;
    }
  };

  const handleTransactionPress = (title: string, category: string) => {
    router.push('/(tabs)/activity');
  };

  const handleConfidenceCardPress = () => {
    router.push('/(tabs)/passport');
  };

  const handleProtectionPress = () => {
    router.push('/(tabs)/protection');
  };

  const handleSeeAllActivity = () => {
    router.push('/(tabs)/activity');
  };

  // ─────────────────────────────────────────────────────────────
  // 1. LOADING STATE (Structured Skeleton preserving layout)
  // ─────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 64 }}
        >
          <HomeSkeleton />
          {renderStateTester()}
        </ScrollView>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. ERROR STATE (Friendly presentation with retry)
  // ─────────────────────────────────────────────────────────────
  if (isError || !data) {
    return (
      <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
        <View style={styles.stateCenterContainer}>
          <ErrorState
            title="Unable to load dashboard"
            message={errorMessage || 'We could not refresh your financial intelligence. Please check your network and try again.'}
            onRetry={refresh}
            retryLabel="Retry Connection"
          />
          {renderStateTester()}
        </View>
      </View>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 3. LOADED & EMPTY STATES
  // ─────────────────────────────────────────────────────────────
  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      {/* 1. HEADER */}
      <HomeHeader user={data.user} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onPullToRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
      >
        {/* 2. FINANCIAL CONFIDENCE (Hero Section) */}
        <View style={styles.sectionContainer}>
          <ScoreDisplay
            score={data.confidence.score}
            maxScore={data.confidence.maxScore}
            label="Financial Confidence"
            rating={data.confidence.rating}
            ratingLabel={data.confidence.ratingLabel}
            summaryText={data.confidence.summaryText}
            style={styles.confidenceCard}
            onPress={handleConfidenceCardPress}
          />
        </View>

        {/* 3. FINANCIAL OVERVIEW (Position & Cashflow) */}
        <View style={styles.sectionContainer}>
          <FinancialOverview
            overview={data.overview}
            onPressDetails={() => router.push('/(tabs)/activity')}
          />
        </View>

        {/* 4. QUICK ACTIONS */}
        <QuickActions
          actions={data.quickActions}
          onActionPress={handleQuickAction}
        />

        {/* 5. FINANCIAL PROTECTION STATUS */}
        <View style={styles.sectionContainer}>
          <FinancialProtectionCard
            protection={data.protection}
            onPress={handleProtectionPress}
          />
        </View>

        {/* 6. RECENT ACTIVITY */}
        <View style={styles.sectionContainer}>
          <SectionHeader
            title="Recent Activity"
            actionLabel="See all"
            onActionPress={handleSeeAllActivity}
            badge={{
              label: `${data.recentActivity.length} new`,
              tone: 'neutral',
            }}
          />

          {data.recentActivity.length > 0 ? (
            <Card variant="standard" padding="none" style={styles.activityCard}>
              {data.recentActivity.map((tx, index) => (
                <TransactionRow
                  key={tx.id}
                  title={tx.title}
                  category={tx.category}
                  date={String(tx.date)}
                  amount={tx.amount}
                  currency={tx.currency || 'GHS'}
                  flow={tx.flow}
                  status={tx.status}
                  accountLabel={tx.accountLabel}
                  icon={tx.iconName as any}
                  showDivider={index < data.recentActivity.length - 1}
                  onPress={() => handleTransactionPress(tx.title, tx.category)}
                />
              ))}
            </Card>
          ) : (
            <Card variant="standard" padding="lg" style={styles.activityCard}>
              <EmptyState
                icon="activity"
                title="No recent transactions"
                description="When your verified accounts record activity, your financial intelligence will update automatically."
              />
            </Card>
          )}
        </View>

        {/* Development & Review State Switcher */}
        {renderStateTester()}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );

  /**
   * Helper component rendering a clean state switcher
   * to immediately test Loaded, Loading, Empty, and Error states.
   */
  function renderStateTester() {
    return (
      <View style={styles.stateTesterWrapper}>
        <View style={styles.stateTesterHeader}>
          <Text
            style={[
              theme.typography.overline,
              { color: theme.colors.textTertiary, fontSize: 10 },
            ]}
          >
            STATE PREVIEW
          </Text>
        </View>
        <View style={styles.stateTesterRow}>
          {(['loaded', 'loading', 'empty', 'error'] as ScreenStateMode[]).map((st) => (
            <Chip
              key={st}
              label={st.charAt(0).toUpperCase() + st.slice(1)}
              selected={status === st}
              onPress={() => setStatus(st)}
            />
          ))}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 64,
  },
  sectionContainer: {
    marginBottom: 4,
  },
  confidenceCard: {
    marginTop: 4,
  },
  activityCard: {
    marginTop: 8,
  },
  stateCenterContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  stateTesterWrapper: {
    marginTop: 28,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
    alignItems: 'center',
  },
  stateTesterHeader: {
    marginBottom: 10,
  },
  stateTesterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
  },
});


// Outside demo mode Home shows only what the backend can verify.
export default DEMO_MODE ? HomeScreen : HomeLive;
