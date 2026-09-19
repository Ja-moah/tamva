/**
 * TAMVA Mock Activity Data
 *
 * Realistic financial activity data reflecting typical Ghanaian banking & fintech flows:
 * Mobile money, bank transfers, utilities, merchants, and salary inflows in GHS (GH₵).
 */

import { ActivityScreenData, ActivityTransaction } from '../../types/activity';

export const mockTransactions: ActivityTransaction[] = [
  // TODAY
  {
    id: 'tx-001',
    title: 'Salary Deposit — FinTech Lab',
    category: 'Employment Income',
    date: 'Today, 09:30 AM',
    rawDate: '2026-09-14',
    amount: 14500.0,
    currency: 'GHS',
    flow: 'income',
    status: 'completed',
    accountLabel: 'GCB Bank •• 4021',
    icon: 'arrow-down-left',
    categoryTag: 'income',
  },
  {
    id: 'tx-002',
    title: 'Starbites Restaurant',
    category: 'Dining & Food',
    date: 'Today, 01:15 PM',
    rawDate: '2026-09-14',
    amount: 285.5,
    currency: 'GHS',
    flow: 'outflow',
    status: 'completed',
    accountLabel: 'Stanbic •• 8812',
    icon: 'coffee',
    categoryTag: 'outflow',
  },
  {
    id: 'tx-003',
    title: 'Telecel Fibre Broadband',
    category: 'Utilities & Internet',
    date: 'Today, 03:40 PM',
    rawDate: '2026-09-14',
    amount: 450.0,
    currency: 'GHS',
    flow: 'outflow',
    status: 'pending',
    accountLabel: 'MTN MoMo •• 3019',
    icon: 'wifi',
    categoryTag: 'outflow',
  },

  // YESTERDAY
  {
    id: 'tx-004',
    title: 'CalBank High-Yield Vault',
    category: 'Auto-Save Deposit',
    date: 'Yesterday, 08:00 AM',
    rawDate: '2026-09-13',
    amount: 1200.0,
    currency: 'GHS',
    flow: 'outflow',
    status: 'completed',
    accountLabel: 'CalBank Vault',
    icon: 'shield',
    categoryTag: 'savings',
  },
  {
    id: 'tx-005',
    title: 'Shell Airport City',
    category: 'Transportation & Fuel',
    date: 'Yesterday, 11:20 AM',
    rawDate: '2026-09-13',
    amount: 620.0,
    currency: 'GHS',
    flow: 'outflow',
    status: 'completed',
    accountLabel: 'GCB Bank •• 4021',
    icon: 'navigation',
    categoryTag: 'outflow',
  },
  {
    id: 'tx-006',
    title: 'Transfer from Kwame Mensah',
    category: 'Peer Transfer',
    date: 'Yesterday, 05:45 PM',
    rawDate: '2026-09-13',
    amount: 850.0,
    currency: 'GHS',
    flow: 'income',
    status: 'completed',
    accountLabel: 'MTN MoMo •• 3019',
    icon: 'arrow-down-left',
    categoryTag: 'transfers',
  },
  {
    id: 'tx-007',
    title: 'ECG Prepaid Power Token',
    category: 'Electricity & Utilities',
    date: 'Yesterday, 07:10 PM',
    rawDate: '2026-09-13',
    amount: 350.0,
    currency: 'GHS',
    flow: 'outflow',
    status: 'completed',
    accountLabel: 'GCB Bank •• 4021',
    icon: 'zap',
    categoryTag: 'outflow',
  },

  // EARLIER THIS MONTH
  {
    id: 'tx-008',
    title: 'MaxMart Supermarket — East Legon Mega Complex',
    category: 'Groceries & Provisions',
    date: '10 Sep 2026, 02:20 PM',
    rawDate: '2026-09-10',
    amount: 1420.0,
    currency: 'GHS',
    flow: 'outflow',
    status: 'completed',
    accountLabel: 'Stanbic •• 8812',
    icon: 'shopping-bag',
    categoryTag: 'outflow',
  },
  {
    id: 'tx-009',
    title: 'Consulting Honorarium',
    category: 'Professional Services',
    date: '08 Sep 2026, 11:00 AM',
    rawDate: '2026-09-08',
    amount: 3800.0,
    currency: 'GHS',
    flow: 'income',
    status: 'completed',
    accountLabel: 'GCB Bank •• 4021',
    icon: 'briefcase',
    categoryTag: 'income',
  },
  {
    id: 'tx-010',
    title: 'Ghana Water Company (GWCL)',
    category: 'Municipal Water',
    date: '06 Sep 2026, 09:15 AM',
    rawDate: '2026-09-06',
    amount: 195.0,
    currency: 'GHS',
    flow: 'outflow',
    status: 'completed',
    accountLabel: 'MTN MoMo •• 3019',
    icon: 'droplet',
    categoryTag: 'outflow',
  },
  {
    id: 'tx-011',
    title: 'Databank MFund Top-Up',
    category: 'Mutual Fund Investment',
    date: '04 Sep 2026, 04:00 PM',
    rawDate: '2026-09-04',
    amount: 1500.0,
    currency: 'GHS',
    flow: 'outflow',
    status: 'completed',
    accountLabel: 'Stanbic •• 8812',
    icon: 'trending-up',
    categoryTag: 'savings',
  },
  {
    id: 'tx-012',
    title: 'Pharmacy Plus East Legon',
    category: 'Health & Pharmacy',
    date: '02 Sep 2026, 06:30 PM',
    rawDate: '2026-09-02',
    amount: 245.0,
    currency: 'GHS',
    flow: 'outflow',
    status: 'completed',
    accountLabel: 'MTN MoMo •• 3019',
    icon: 'plus-circle',
    categoryTag: 'outflow',
  },
  {
    id: 'tx-013',
    title: 'Inter-Account Sweep to Stanbic',
    category: 'Bank Transfer',
    date: '01 Sep 2026, 10:00 AM',
    rawDate: '2026-09-01',
    amount: 2000.0,
    currency: 'GHS',
    flow: 'neutral',
    status: 'completed',
    accountLabel: 'GCB -> Stanbic',
    icon: 'repeat',
    categoryTag: 'transfers',
  },
  {
    id: 'TX-GH-20260831-99482103859-EXP',
    title: 'Failed Transfer — Express Pay',
    category: 'Failed Transfer',
    date: '31 Aug 2026, 08:20 PM',
    rawDate: '2026-08-31',
    amount: 500.0,
    currency: 'GHS',
    flow: 'outflow',
    status: 'failed',
    accountLabel: 'GCB Bank •• 4021',
    icon: 'alert-circle',
    categoryTag: 'transfers',
  },
];

export const availableAccounts: string[] = Array.from(
  new Set(mockTransactions.map((tx) => tx.accountLabel))
);

export const mockActivityData: ActivityScreenData = {
  summary: {
    periodLabel: 'September 2026',
    totalInflow: 19150.0,
    totalOutflow: 6480.5,
    netCashflow: 12669.5,
    currency: 'GHS',
  },
  groups: [
    {
      title: 'TODAY',
      dateKey: '2026-09-14',
      data: mockTransactions.filter((tx) => tx.rawDate === '2026-09-14'),
    },
    {
      title: 'YESTERDAY',
      dateKey: '2026-09-13',
      data: mockTransactions.filter((tx) => tx.rawDate === '2026-09-13'),
    },
    {
      title: 'EARLIER THIS MONTH',
      dateKey: '2026-09-older',
      data: mockTransactions.filter(
        (tx) => tx.rawDate !== '2026-09-14' && tx.rawDate !== '2026-09-13'
      ),
    },
  ],
  totalTransactionCount: mockTransactions.length,
};

export const mockEmptyActivityData: ActivityScreenData = {
  summary: {
    periodLabel: 'September 2026',
    totalInflow: 0,
    totalOutflow: 0,
    netCashflow: 0,
    currency: 'GHS',
  },
  groups: [],
  totalTransactionCount: 0,
};

/**
 * Register a newly completed transfer into the shared Activity mock state.
 */
export function addActivityTransaction(transaction: ActivityTransaction): void {
  // Prepend to raw transactions so newly sent transfer is at the top of TODAY
  mockTransactions.unshift(transaction);

  // Update grouped cache if present
  if (mockActivityData.groups && mockActivityData.groups.length > 0) {
    const todayGroup = mockActivityData.groups.find((g) => g.title === 'TODAY');
    if (todayGroup) {
      todayGroup.data.unshift(transaction);
    }
    mockActivityData.totalTransactionCount = mockTransactions.length;
    mockActivityData.summary.totalOutflow += transaction.amount;
    mockActivityData.summary.netCashflow -= transaction.amount;
  }
}

