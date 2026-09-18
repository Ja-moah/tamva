export interface Transaction {
  id: string;
  sourceEventId: string;
  institution: string;
  institutionLogo: string;
  institutionColor: string;
  title: string;
  category: "INCOME" | "EXPENSE" | "TRANSFER" | "SAVING" | "PAYMENT";
  description: string;
  amount: number;
  currency: string;
  direction: "IN" | "OUT";
  occurredAt: string;
  timeFormatted: string;
  dateGroup: "Today" | "Yesterday" | "Earlier";
  dateFormatted: string;
  channel: string;
}

export interface ConnectedAccount {
  id: string;
  institutionId: string;
  institutionName: string;
  institutionType: "Bank" | "Mobile Money" | "Fintech" | "Savings";
  accountType: string;
  maskedIdentifier: string;
  currency: string;
  balance: number;
  status: "CONNECTED" | "SUSPENDED" | "REVOKED";
  logo: string;
  color: string;
  connectedSince: string;
  lastSyncAt: string;
  scopes: string[];
}

export interface BehavioralPillar {
  id: string;
  name: string;
  score: number;
  status: "Stable" | "Good" | "Strong" | "Excellent" | "Moderate";
  description: string;
  color: string;
  windowDays: number;
}

export interface PassportShareActivity {
  id: string;
  recipientName: string;
  recipientLogo: string;
  purpose: string;
  sharedAt: string;
  expiresAt: string;
  status: "ACTIVE" | "EXPIRED" | "REVOKED";
  scopes: string[];
}

export interface SecurityAlert {
  id: string;
  type: "WARNING" | "INFO" | "SUCCESS";
  title: string;
  description: string;
  timestamp: string;
  dateFormatted: string;
  location?: string;
  actionRequired?: boolean;
}

export const INITIAL_USER = {
  id: "cus_01J8G3TAMVA9910",
  name: "Elijah Dery",
  initials: "ED",
  type: "Individual Profile",
  status: "Verified",
  country: "Ghana",
  memberSince: "Jun 2024",
  confidenceScore: 89,
  scoreRating: "Good",
  scoreChange: "+6 this month",
  availableFunds: 12450.75,
  fundsCurrency: "GH₵",
  fundsChangePercent: "+12%",
  monthlyInflow: 18200.0,
  monthlyOutflow: 11340.0,
  monthlySavings: 8750.0,
  monthlyDebt: 4200.0,
  monthlyNet: 6860.0,
};

export const BEHAVIORAL_PILLARS: BehavioralPillar[] = [
  {
    id: "income",
    name: "Income Consistency",
    score: 85,
    status: "Stable",
    description: "Regular income with low volatility over past 180 days.",
    color: "#00d084",
    windowDays: 180,
  },
  {
    id: "cashflow",
    name: "Cash Flow Stability",
    score: 78,
    status: "Good",
    description: "Consistent positive net monthly cash flow.",
    color: "#3b82f6",
    windowDays: 90,
  },
  {
    id: "savings",
    name: "Savings Behaviour",
    score: 82,
    status: "Strong",
    description: "Consistent savings pattern exceeding 15% of inflows.",
    color: "#a855f7",
    windowDays: 90,
  },
  {
    id: "repayment",
    name: "Repayment Behaviour",
    score: 91,
    status: "Excellent",
    description: "Zero defaults and on-time settlements across accounts.",
    color: "#10b981",
    windowDays: 365,
  },
  {
    id: "debt",
    name: "Debt Management",
    score: 74,
    status: "Moderate",
    description: "Healthy and manageable debt service ratio of 23%.",
    color: "#f59e0b",
    windowDays: 90,
  },
  {
    id: "resilience",
    name: "Financial Resilience",
    score: 76,
    status: "Good",
    description: "Healthy 3.8-month emergency buffer and low risk exposure.",
    color: "#00d084",
    windowDays: 90,
  },
];

export const CONNECTED_ACCOUNTS: ConnectedAccount[] = [
  {
    id: "acc_gcb_01",
    institutionId: "inst_gcb",
    institutionName: "GCB Bank",
    institutionType: "Bank",
    accountType: "Savings Account",
    maskedIdentifier: "••••• 4583",
    currency: "GH₵",
    balance: 4820.5,
    status: "CONNECTED",
    logo: "landmark",
    color: "#0284c7",
    connectedSince: "12 Jan 2024",
    lastSyncAt: "Just now",
    scopes: ["balance:read", "transactions:read"],
  },
  {
    id: "acc_momo_01",
    institutionId: "inst_mtn",
    institutionName: "MTN MoMo",
    institutionType: "Mobile Money",
    accountType: "Mobile Money Wallet",
    maskedIdentifier: "••••• 9127",
    currency: "GH₵",
    balance: 3150.25,
    status: "CONNECTED",
    logo: "smartphone",
    color: "#eab308",
    connectedSince: "14 Feb 2024",
    lastSyncAt: "2 mins ago",
    scopes: ["balance:read", "transactions:read", "profile:read"],
  },
  {
    id: "acc_stanbic_01",
    institutionId: "inst_stanbic",
    institutionName: "Stanbic Bank",
    institutionType: "Bank",
    accountType: "Current Account",
    maskedIdentifier: "••••• 2210",
    currency: "GH₵",
    balance: 2900.0,
    status: "CONNECTED",
    logo: "shield",
    color: "#2563eb",
    connectedSince: "03 Mar 2024",
    lastSyncAt: "10 mins ago",
    scopes: ["balance:read", "transactions:read"],
  },
  {
    id: "acc_absa_01",
    institutionId: "inst_absa",
    institutionName: "Absa Bank",
    institutionType: "Bank",
    accountType: "Savings Account",
    maskedIdentifier: "••••• 7741",
    currency: "GH₵",
    balance: 1120.0,
    status: "CONNECTED",
    logo: "circle-dot",
    color: "#dc2626",
    connectedSince: "20 Apr 2024",
    lastSyncAt: "1 hour ago",
    scopes: ["balance:read", "transactions:read"],
  },
  {
    id: "acc_zeepay_01",
    institutionId: "inst_zeepay",
    institutionName: "Zeepay",
    institutionType: "Fintech",
    accountType: "Digital Wallet",
    maskedIdentifier: "••••• 3901",
    currency: "GH₵",
    balance: 360.0,
    status: "CONNECTED",
    logo: "zap",
    color: "#ea580c",
    connectedSince: "05 May 2024",
    lastSyncAt: "3 hours ago",
    scopes: ["transactions:read"],
  },
  {
    id: "acc_finex_01",
    institutionId: "inst_finex",
    institutionName: "Finex Savings",
    institutionType: "Savings",
    accountType: "Investment Account",
    maskedIdentifier: "••••• 6680",
    currency: "GH₵",
    balance: 100.0,
    status: "CONNECTED",
    logo: "pie-chart",
    color: "#059669",
    connectedSince: "18 Jun 2024",
    lastSyncAt: "1 day ago",
    scopes: ["balance:read"],
  },
];

export const TRANSACTIONS: Transaction[] = [
  {
    id: "tx_01",
    sourceEventId: "mtn_evt_88491",
    institution: "MTN Mobile Money",
    institutionLogo: "smartphone",
    institutionColor: "#eab308",
    title: "MTN Mobile Money",
    category: "INCOME",
    description: "Money received from K. Mensah",
    amount: 450.0,
    currency: "GH₵",
    direction: "IN",
    occurredAt: "2026-06-14T10:24:00Z",
    timeFormatted: "10:24 AM",
    dateGroup: "Today",
    dateFormatted: "Tue, 14 Jun 2026",
    channel: "MOBILE_MONEY",
  },
  {
    id: "tx_02",
    sourceEventId: "pos_melcom_991",
    institution: "GCB Bank",
    institutionLogo: "shopping-bag",
    institutionColor: "#0284c7",
    title: "Melcom (Accra Mall)",
    category: "EXPENSE",
    description: "Groceries & Household",
    amount: 320.0,
    currency: "GH₵",
    direction: "OUT",
    occurredAt: "2026-06-14T09:12:00Z",
    timeFormatted: "09:12 AM",
    dateGroup: "Today",
    dateFormatted: "Tue, 14 Jun 2026",
    channel: "POS_CARD",
  },
  {
    id: "tx_03",
    sourceEventId: "stan_trf_331",
    institution: "Stanbic Bank",
    institutionLogo: "shield",
    institutionColor: "#2563eb",
    title: "Stanbic Bank",
    category: "TRANSFER",
    description: "Transfer to savings (neutralized)",
    amount: 1000.0,
    currency: "GH₵",
    direction: "OUT",
    occurredAt: "2026-06-14T08:41:00Z",
    timeFormatted: "08:41 AM",
    dateGroup: "Today",
    dateFormatted: "Tue, 14 Jun 2026",
    channel: "BANK_TRANSFER",
  },
  {
    id: "tx_04",
    sourceEventId: "biz_inv_7712",
    institution: "Stanbic Bank",
    institutionLogo: "briefcase",
    institutionColor: "#059669",
    title: "Client Payment",
    category: "INCOME",
    description: "Business contract payment - Deliverable #3",
    amount: 2500.0,
    currency: "GH₵",
    direction: "IN",
    occurredAt: "2026-06-13T18:20:00Z",
    timeFormatted: "6:20 PM",
    dateGroup: "Yesterday",
    dateFormatted: "Mon, 13 Jun 2026",
    channel: "ACH_SETTLEMENT",
  },
  {
    id: "tx_05",
    sourceEventId: "uber_ride_121",
    institution: "MTN Mobile Money",
    institutionLogo: "car",
    institutionColor: "#0f172a",
    title: "Uber",
    category: "EXPENSE",
    description: "Transport - Airport to Cantonments",
    amount: 65.0,
    currency: "GH₵",
    direction: "OUT",
    occurredAt: "2026-06-13T14:14:00Z",
    timeFormatted: "2:14 PM",
    dateGroup: "Yesterday",
    dateFormatted: "Mon, 13 Jun 2026",
    channel: "MOBILE_MONEY",
  },
  {
    id: "tx_06",
    sourceEventId: "goil_fuel_90",
    institution: "GCB Bank",
    institutionLogo: "fuel",
    institutionColor: "#ea580c",
    title: "GOIL",
    category: "EXPENSE",
    description: "Vehicle Fuel - Spintex Branch",
    amount: 400.0,
    currency: "GH₵",
    direction: "OUT",
    occurredAt: "2026-06-13T11:03:00Z",
    timeFormatted: "11:03 AM",
    dateGroup: "Yesterday",
    dateFormatted: "Mon, 13 Jun 2026",
    channel: "POS_CARD",
  },
  {
    id: "tx_07",
    sourceEventId: "inv_contrib_01",
    institution: "Finex Savings",
    institutionLogo: "trending-up",
    institutionColor: "#059669",
    title: "Investment Contribution",
    category: "SAVING",
    description: "Automated monthly recurring savings",
    amount: 500.0,
    currency: "GH₵",
    direction: "OUT",
    occurredAt: "2026-06-12T16:36:00Z",
    timeFormatted: "4:36 PM",
    dateGroup: "Earlier",
    dateFormatted: "Sun, 12 Jun 2026",
    channel: "DIRECT_DEBIT",
  },
];

export const PASSPORT_ACTIVITIES: PassportShareActivity[] = [
  {
    id: "share_01",
    recipientName: "Akua Savings & Loans",
    recipientLogo: "landmark",
    purpose: "Business Loan Application #BL-992",
    sharedAt: "14 Jun 2026",
    expiresAt: "28 Jun 2026",
    status: "ACTIVE",
    scopes: ["income", "cashflow", "balances"],
  },
  {
    id: "share_02",
    recipientName: "Stanbic Bank",
    recipientLogo: "shield",
    purpose: "Commercial Account Opening",
    sharedAt: "10 Jun 2026",
    expiresAt: "24 Jun 2026",
    status: "ACTIVE",
    scopes: ["identity", "profile"],
  },
  {
    id: "share_03",
    recipientName: "MTN MoMo (Consent Active)",
    recipientLogo: "smartphone",
    purpose: "Credit Limit Assessment",
    sharedAt: "02 Jun 2026",
    expiresAt: "02 Jul 2026",
    status: "ACTIVE",
    scopes: ["balances", "transactions"],
  },
];

export const SECURITY_ALERTS: SecurityAlert[] = [
  {
    id: "alt_01",
    type: "WARNING",
    title: "Unusual login attempt blocked",
    description: "From an unrecognized device in Lagos, Nigeria. Blocked automatically.",
    timestamp: "2026-06-12T20:14:00Z",
    dateFormatted: "12 Jun 2026, 08:14 PM",
    location: "Lagos, Nigeria",
    actionRequired: false,
  },
  {
    id: "alt_02",
    type: "SUCCESS",
    title: "Large transaction verified",
    description: "GH₵ 5,000.00 transfer to Stanbic Bank verified via 2FA.",
    timestamp: "2026-06-10T14:36:00Z",
    dateFormatted: "10 Jun 2026, 02:36 PM",
    location: "Accra, Ghana",
    actionRequired: false,
  },
];

export const SCORE_HISTORY = [
  { month: "Jan", score: 72 },
  { month: "Feb", score: 75 },
  { month: "Mar", score: 78 },
  { month: "Apr", score: 81 },
  { month: "May", score: 83 },
  { month: "Jun", score: 89 },
];

export const VERIFIED_INSTITUTIONS = [
  { id: "inst_akua", name: "Akua Savings & Loans", type: "Savings & Loans", verified: true },
  { id: "inst_stanbic", name: "Stanbic Bank Ghana", type: "Commercial Bank", verified: true },
  { id: "inst_gcb", name: "GCB Bank PLC", type: "Commercial Bank", verified: true },
  { id: "inst_absa", name: "Absa Bank Ghana", type: "Commercial Bank", verified: true },
  { id: "inst_fidelity", name: "Fidelity Bank", type: "Commercial Bank", verified: true },
  { id: "inst_mtn", name: "MTN MoMo Ghana", type: "Mobile Money Issuer", verified: true },
  { id: "inst_telecel", name: "Telecel Cash", type: "Mobile Money Issuer", verified: true },
  { id: "inst_zeepay", name: "Zeepay Ghana", type: "Fintech / Payment Hub", verified: true },
];
