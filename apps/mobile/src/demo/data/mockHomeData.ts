/**
 * TAMVA Home Screen Mock Data
 *
 * Provides realistic, presentation-grade demonstration data for Phase 2A.
 * Clearly separated from UI components so it can be swapped for an API client later.
 */

import { HomeScreenData } from '../../types/home';

export const mockHomeData: HomeScreenData = {
  user: {
    greeting: 'Good morning,',
    userName: 'Karim',
    initials: 'KA',
    unreadNotificationsCount: 2,
  },
  confidence: {
    score: 780,
    maxScore: 850,
    rating: 'exceptional',
    ratingLabel: 'Exceptional',
    summaryText:
      'Strong transaction consistency and active consent validation across verified accounts.',
    verifiedAccountsCount: 4,
  },
  overview: {
    netPosition: 28450.0,
    currency: 'GHS',
    monthlyInflow: 7200.0,
    monthlyOutflow: 3450.0,
    netSavings: 3750.0,
    trend: {
      value: 12.4,
      direction: 'up',
      label: 'vs last month',
    },
  },
  quickActions: [
    {
      id: 'send',
      label: 'Send',
      icon: 'send',
      isPrimary: true,
    },
    {
      id: 'receive',
      label: 'Receive',
      icon: 'arrow-down-left',
    },
    {
      id: 'save',
      label: 'Save',
      icon: 'credit-card',
    },
    {
      id: 'more',
      label: 'More',
      icon: 'more-horizontal',
    },
  ],
  protection: {
    status: 'protected',
    statusLabel: 'Protected',
    description:
      'Your connected accounts are being monitored for important security and consent events.',
    monitoredAccountsCount: 4,
    lastVerifiedText: 'Active protection • 4 accounts synced',
  },
  recentActivity: [
    {
      id: 'tx-1',
      title: 'Ghana Commercial Bank',
      category: 'Salary Deposit',
      date: 'Today, 09:15',
      amount: 4500.0,
      currency: 'GHS',
      flow: 'income',
      status: 'completed',
      accountLabel: 'Direct Transfer',
      iconName: 'arrow-down-left',
    },
    {
      id: 'tx-2',
      title: 'Starbites Restaurant',
      category: 'Food & Dining',
      date: 'Yesterday, 19:40',
      amount: 285.5,
      currency: 'GHS',
      flow: 'outflow',
      status: 'completed',
      accountLabel: 'MTN MoMo',
      iconName: 'coffee',
    },
    {
      id: 'tx-3',
      title: 'ECG Electricity',
      category: 'Utilities',
      date: '12 Sep, 14:10',
      amount: 150.0,
      currency: 'GHS',
      flow: 'outflow',
      status: 'completed',
      accountLabel: 'GCB Checking',
      iconName: 'arrow-up-right',
    },
  ],
};

/**
 * Empty mock state for testing zero-transaction empty experiences.
 */
export const mockEmptyHomeData: HomeScreenData = {
  ...mockHomeData,
  recentActivity: [],
};
