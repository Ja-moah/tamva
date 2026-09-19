/**
 * TAMVA Activity Screen (Phase 3C)
 *
 * Financial Activity screen featuring:
 * - Clean screen header with privacy toggle shortcut and notification link
 * - Monthly cashflow summary card (Inflow, Outflow, Net Cashflow via MoneyDisplay)
 * - Quick search input with instant clear action, smooth typing, and integrated filter trigger
 * - Filter bar (All, Income, Outflow, Transfers, Savings) with live counts
 * - Secondary FilterSheet (Status: Completed/Pending/Failed, Accounts from mock data, staged Apply/Reset)
 * - SectionList grouping transactions by date ("TODAY", "YESTERDAY", "EARLIER THIS MONTH")
 * - High-polish TransactionRow integration
 * - Dedicated TransactionDetailSheet with focal amount hierarchy, semantic status notices, and copy feedback
 * - Layout-preserving ActivitySkeleton for zero CLS
 * - Accessible empty and error states with comprehensive "Reset Filters" action
 * - QA State previewer for rapid testing
 */

import { withFeatureGate } from '../../src/components/ui/withFeatureGate';
import { DEMO_MODE } from '../../src/config/env';
import { ActivityLive } from '../../src/components/live/ActivityLive';
import React, { useState } from 'react';
import {
  View,
  Text,
  SectionList,
  RefreshControl,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../../src/theme';
import { useActivityData } from '../../src/hooks/useActivityData';
import { ActivityTransaction, ActivityStateMode } from '../../src/types/activity';
import {
  ActivityHeader,
  ActivitySummaryCard,
  ActivitySearchBar,
  ActivityFilterBar,
  ActivitySkeleton,
  ActivityFilterSheet,
  TransactionDetailSheet,
} from '../../src/components/activity';
import { TransactionRow } from '../../src/components/financial/TransactionRow';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { ErrorState } from '../../src/components/ui/ErrorState';
import { Chip } from '../../src/components/ui/Chip';
import { Icon } from '../../src/components/ui/Icon';

function ActivityScreen() {
  const { theme } = useTheme();

  const {
    stateMode,
    setStateMode,
    summary,
    sections,
    filteredCount,
    selectedFilter,
    setSelectedFilter,
    secondaryFilters,
    setSecondaryFilters,
    activeSecondaryFilterCount,
    hasActiveFilters,
    filterOptions,
    searchQuery,
    setSearchQuery,
    clearSearch,
    resetAllFilters,
    availableAccounts,
    availableStatuses,
    isRefreshing,
    handleRefresh,
  } = useActivityData();

  // Selected transaction for inspection sheet
  const [selectedTx, setSelectedTx] = useState<ActivityTransaction | null>(null);
  // Secondary filter sheet visibility
  const [isFilterSheetVisible, setIsFilterSheetVisible] = useState(false);

  // If in loading mode, render layout-preserving skeleton
  if (stateMode === 'loading') {
    return (
      <View style={[styles.screenContainer, { backgroundColor: theme.colors.background }]}>
        <ActivitySkeleton />
        {/* Floating state switcher for testing */}
        {renderStateSwitcher(stateMode, setStateMode, theme)}
      </View>
    );
  }

  // If in error mode, render header + ErrorState
  if (stateMode === 'error') {
    return (
      <View style={[styles.screenContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityHeader />
        <View style={styles.centerContainer}>
          <ErrorState
            title="Unable to Load Activity"
            message="We couldn't synchronize your recent transaction timeline. Check your network or retry."
            errorCode="ACT-SYNC-503"
            retryLabel="Retry Synchronization"
            onRetry={() => setStateMode('loaded')}
          />
        </View>
        {renderStateSwitcher(stateMode, setStateMode, theme)}
      </View>
    );
  }

  const renderSectionHeader = ({ section }: { section: { title: string; data: ActivityTransaction[] } }) => (
    <View style={styles.sectionHeaderContainer}>
      <Text
        style={[
          theme.typography.captionMedium,
          {
            color: theme.colors.textTertiary,
            letterSpacing: 0.9,
            fontSize: 11,
            textTransform: 'uppercase',
            fontWeight: '600',
          },
        ]}
      >
        {section.title}
      </Text>
      <Text
        style={[
          theme.typography.caption,
          { color: theme.colors.textTertiary, fontSize: 11 },
        ]}
      >
        {section.data.length} {section.data.length === 1 ? 'transaction' : 'transactions'}
      </Text>
    </View>
  );

  const renderItem = ({
    item,
    index,
    section,
  }: {
    item: ActivityTransaction;
    index: number;
    section: { data: ActivityTransaction[] };
  }) => {
    const isFirst = index === 0;
    const isLast = index === section.data.length - 1;

    const rowCardStyle: ViewStyle = {
      marginHorizontal: 20,
      backgroundColor: theme.colors.surface,
      borderColor: theme.colors.border,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderTopWidth: isFirst ? 1 : 0,
      borderBottomWidth: isLast ? 1 : 0,
      borderTopLeftRadius: isFirst ? theme.radius.lg : 0,
      borderTopRightRadius: isFirst ? theme.radius.lg : 0,
      borderBottomLeftRadius: isLast ? theme.radius.lg : 0,
      borderBottomRightRadius: isLast ? theme.radius.lg : 0,
      overflow: 'hidden',
    };

    return (
      <View style={rowCardStyle}>
        <TransactionRow
          id={item.id}
          title={item.title}
          category={item.category}
          date={item.date}
          amount={item.amount}
          currency={item.currency}
          flow={item.flow}
          status={item.status}
          accountLabel={item.accountLabel}
          icon={item.icon}
          onPress={() => setSelectedTx(item)}
          showDivider={!isLast}
        />
      </View>
    );
  };

  const renderListHeader = () => (
    <View style={styles.headerWrapper}>
      <ActivityHeader />
      <ActivitySummaryCard summary={summary} />
      <ActivitySearchBar
        value={searchQuery}
        onChangeText={setSearchQuery}
        onClear={clearSearch}
        onFilterPress={() => setIsFilterSheetVisible(true)}
        activeFilterCount={activeSecondaryFilterCount}
      />
      <ActivityFilterBar
        options={filterOptions}
        selectedFilter={selectedFilter}
        onSelectFilter={setSelectedFilter}
      />
    </View>
  );

  const renderEmptyComponent = () => {
    if (hasActiveFilters) {
      return (
        <View style={styles.emptyWrapper}>
          <EmptyState
            icon="search"
            title="No Transactions Found"
            description="No transactions match your filters. Try clearing your search keyword, adjusting category chips, or resetting status and account filters."
            actionLabel="Reset Filters"
            onActionPress={resetAllFilters}
          />
        </View>
      );
    }

    return (
      <View style={styles.emptyWrapper}>
        <EmptyState
          icon="inbox"
          title="No Financial Activity"
          description="Your financial activity will appear here."
          actionLabel="Refresh Activity"
          onActionPress={handleRefresh}
        />
      </View>
    );
  };

  const renderListFooter = () => (
    <View style={styles.footerWrapper}>
      {filteredCount > 0 && (
        <View style={styles.securityNote}>
          <Icon name="shield" size={12} color={theme.colors.textTertiary} />
          <Text
            style={[
              theme.typography.caption,
              { color: theme.colors.textTertiary, marginLeft: 6 },
            ]}
          >
            Encrypted end-to-end via TAMVA Consent Network
          </Text>
        </View>
      )}

      {/* State Switcher Strip for Verification */}
      {renderStateSwitcher(stateMode, setStateMode, theme)}
    </View>
  );

  return (
    <View style={[styles.screenContainer, { backgroundColor: theme.colors.background }]}>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        renderSectionHeader={renderSectionHeader}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderListFooter}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={theme.colors.primary}
            colors={[theme.colors.primary]}
          />
        }
        stickySectionHeadersEnabled={false}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Secondary Filter Bottom Sheet */}
      <ActivityFilterSheet
        visible={isFilterSheetVisible}
        onClose={() => setIsFilterSheetVisible(false)}
        appliedFilters={secondaryFilters}
        onApply={setSecondaryFilters}
        availableAccounts={availableAccounts}
        availableStatuses={availableStatuses}
      />

      {/* Polished Transaction Details Bottom Sheet */}
      <TransactionDetailSheet
        transaction={selectedTx}
        visible={Boolean(selectedTx)}
        onClose={() => setSelectedTx(null)}
      />
    </View>
  );
}

/**
 * State previewer widget for QA testing loaded/loading/empty/error modes
 */
function renderStateSwitcher(
  currentMode: ActivityStateMode,
  setMode: (mode: ActivityStateMode) => void,
  theme: any
) {
  const modes: ActivityStateMode[] = ['loaded', 'loading', 'empty', 'error'];

  return (
    <View style={styles.switcherContainer}>
      <Text
        style={[
          theme.typography.captionMedium,
          {
            color: theme.colors.textTertiary,
            fontSize: 10,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            marginBottom: 6,
          },
        ]}
      >
        Activity Screen QA State Preview
      </Text>
      <View style={styles.switcherRow}>
        {modes.map((mode) => {
          const isSelected = currentMode === mode;
          return (
            <Chip
              key={mode}
              label={mode.charAt(0).toUpperCase() + mode.slice(1)}
              selected={isSelected}
              onPress={() => setMode(mode)}
              style={styles.switcherChip}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  headerWrapper: {
    paddingBottom: 4,
  },
  listContent: {
    paddingBottom: 64,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyWrapper: {
    paddingVertical: 24,
    paddingHorizontal: 20,
  },
  footerWrapper: {
    marginTop: 24,
    alignItems: 'center',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  switcherContainer: {
    marginTop: 12,
    alignItems: 'center',
    paddingHorizontal: 16,
    width: '100%',
  },
  switcherRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  switcherChip: {
    minHeight: 30,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
});


export default DEMO_MODE ? ActivityScreen : withFeatureGate(ActivityLive, {
  capability: 'customer_activity',
  wired: true,
  title: 'Activity',
  description: "Your live activity isn't available from TAMVA yet.",
});
