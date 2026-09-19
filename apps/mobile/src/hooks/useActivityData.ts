/**
 * TAMVA useActivityData Hook
 *
 * State management and filtering pipeline for the Activity screen:
 * RAW TRANSACTIONS
 *        ↓
 * CATEGORY FILTER (All, Income, Outflow, Transfers, Savings)
 *        ↓
 * SECONDARY FILTERS (Status: Completed, Pending, Failed; Account / Institution)
 *        ↓
 * SEARCH QUERY (Title, Category, Account, Reference ID)
 *        ↓
 * DATE GROUPING (Today, Yesterday, Earlier)
 *        ↓
 * SECTION LIST
 */

import { useState, useMemo, useCallback } from 'react';
import {
  ActivityFilterId,
  ActivityFilterOption,
  ActivityStateMode,
  ActivityTransaction,
  ActivityDateGroup,
  ActivitySecondaryFilters,
} from '../types/activity';
import { TransactionStatus } from '../types/financial';
import {
  mockActivityData,
  mockEmptyActivityData,
  mockTransactions,
  availableAccounts,
} from '../demo/data/mockActivityData';
import { useHaptics } from './useHaptics';

export const INITIAL_SECONDARY_FILTERS: ActivitySecondaryFilters = {
  status: 'all',
  account: 'all',
};

export const AVAILABLE_STATUSES: (TransactionStatus | 'all')[] = [
  'all',
  'completed',
  'pending',
  'failed',
];

export function useActivityData() {
  const haptics = useHaptics();
  const [stateMode, setStateMode] = useState<ActivityStateMode>('loaded');
  const [selectedFilter, setSelectedFilter] = useState<ActivityFilterId>('all');
  const [secondaryFilters, setSecondaryFilters] = useState<ActivitySecondaryFilters>(
    INITIAL_SECONDARY_FILTERS
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Compute number of active secondary filters
  const activeSecondaryFilterCount = useMemo(() => {
    let count = 0;
    if (secondaryFilters.status !== 'all') count += 1;
    if (secondaryFilters.account !== 'all') count += 1;
    return count;
  }, [secondaryFilters]);

  // Total active filter count including category and search
  const hasActiveFilters = useMemo(() => {
    return (
      selectedFilter !== 'all' ||
      activeSecondaryFilterCount > 0 ||
      searchQuery.trim().length > 0
    );
  }, [selectedFilter, activeSecondaryFilterCount, searchQuery]);

  // Compute transaction counts for each primary filter chip based on secondary filter scope
  const filterCounts = useMemo(() => {
    let baseList = mockTransactions;

    // Constrain counts by active secondary filters for high contextual accuracy
    if (secondaryFilters.status !== 'all') {
      baseList = baseList.filter((tx) => tx.status === secondaryFilters.status);
    }
    if (secondaryFilters.account !== 'all') {
      baseList = baseList.filter((tx) => tx.accountLabel === secondaryFilters.account);
    }

    const counts: Record<ActivityFilterId, number> = {
      all: baseList.length,
      income: 0,
      outflow: 0,
      transfers: 0,
      savings: 0,
    };

    baseList.forEach((tx) => {
      if (tx.categoryTag === 'income') counts.income += 1;
      else if (tx.categoryTag === 'outflow') counts.outflow += 1;
      else if (tx.categoryTag === 'transfers') counts.transfers += 1;
      else if (tx.categoryTag === 'savings') counts.savings += 1;
    });

    return counts;
  }, [secondaryFilters]);

  const filterOptions: ActivityFilterOption[] = useMemo(
    () => [
      { id: 'all', label: 'All', count: filterCounts.all },
      { id: 'income', label: 'Income', icon: 'arrow-down-left', count: filterCounts.income },
      { id: 'outflow', label: 'Outflow', icon: 'arrow-up-right', count: filterCounts.outflow },
      { id: 'transfers', label: 'Transfers', icon: 'repeat', count: filterCounts.transfers },
      { id: 'savings', label: 'Savings', icon: 'shield', count: filterCounts.savings },
    ],
    [filterCounts]
  );

  // Filter pipeline: RAW -> CATEGORY -> SECONDARY -> SEARCH
  const filteredTransactions = useMemo(() => {
    if (stateMode === 'empty' || stateMode === 'error') {
      return [];
    }

    let list = mockTransactions;

    // 1. Primary Category Filter
    if (selectedFilter !== 'all') {
      list = list.filter((tx) => tx.categoryTag === selectedFilter);
    }

    // 2. Secondary Filter: Status
    if (secondaryFilters.status !== 'all') {
      list = list.filter((tx) => tx.status === secondaryFilters.status);
    }

    // 3. Secondary Filter: Institution Account
    if (secondaryFilters.account !== 'all') {
      list = list.filter((tx) => tx.accountLabel === secondaryFilters.account);
    }

    // 4. Text Search Query: merchant/title, category, accountLabel, reference id
    const trimmed = searchQuery.trim().toLowerCase();
    if (trimmed.length > 0) {
      list = list.filter(
        (tx) =>
          tx.title.toLowerCase().includes(trimmed) ||
          tx.category.toLowerCase().includes(trimmed) ||
          tx.accountLabel.toLowerCase().includes(trimmed) ||
          tx.id.toLowerCase().includes(trimmed)
      );
    }

    return list;
  }, [stateMode, selectedFilter, secondaryFilters, searchQuery]);

  // Regroup filtered transactions into date sections
  const groupedSections: ActivityDateGroup[] = useMemo(() => {
    if (filteredTransactions.length === 0) return [];

    const todayItems = filteredTransactions.filter((tx) => tx.rawDate === '2026-09-14');
    const yesterdayItems = filteredTransactions.filter((tx) => tx.rawDate === '2026-09-13');
    const olderItems = filteredTransactions.filter(
      (tx) => tx.rawDate !== '2026-09-14' && tx.rawDate !== '2026-09-13'
    );

    const sections: ActivityDateGroup[] = [];

    if (todayItems.length > 0) {
      sections.push({
        title: 'TODAY',
        dateKey: 'today',
        data: todayItems,
      });
    }

    if (yesterdayItems.length > 0) {
      sections.push({
        title: 'YESTERDAY',
        dateKey: 'yesterday',
        data: yesterdayItems,
      });
    }

    if (olderItems.length > 0) {
      sections.push({
        title: 'EARLIER THIS MONTH',
        dateKey: 'earlier',
        data: olderItems,
      });
    }

    return sections;
  }, [filteredTransactions]);

  // Pull-to-refresh handler (preserves current filters)
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    haptics.lightImpact();
    // Simulate brief network refresh
    setTimeout(() => {
      setIsRefreshing(false);
      haptics.success();
    }, 850);
  }, [haptics]);

  const handleSelectFilter = useCallback(
    (filterId: ActivityFilterId) => {
      haptics.selection();
      setSelectedFilter(filterId);
    },
    [haptics]
  );

  const handleApplySecondaryFilters = useCallback(
    (filters: ActivitySecondaryFilters) => {
      haptics.selection();
      setSecondaryFilters(filters);
    },
    [haptics]
  );

  const handleClearSearch = useCallback(() => {
    haptics.lightImpact();
    setSearchQuery('');
  }, [haptics]);

  // Comprehensive reset: clears search, resets category to 'all', and resets secondary filters
  const handleResetAllFilters = useCallback(() => {
    haptics.lightImpact();
    setSearchQuery('');
    setSelectedFilter('all');
    setSecondaryFilters(INITIAL_SECONDARY_FILTERS);
  }, [haptics]);

  return {
    stateMode,
    setStateMode,
    summary: stateMode === 'empty' ? mockEmptyActivityData.summary : mockActivityData.summary,
    sections: groupedSections,
    filteredCount: filteredTransactions.length,
    selectedFilter,
    setSelectedFilter: handleSelectFilter,
    secondaryFilters,
    setSecondaryFilters: handleApplySecondaryFilters,
    activeSecondaryFilterCount,
    hasActiveFilters,
    filterOptions,
    searchQuery,
    setSearchQuery,
    clearSearch: handleClearSearch,
    resetAllFilters: handleResetAllFilters,
    availableAccounts,
    availableStatuses: AVAILABLE_STATUSES,
    isRefreshing,
    handleRefresh,
  };
}
