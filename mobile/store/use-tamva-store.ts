import { create } from "zustand";
import {
  BEHAVIORAL_PILLARS,
  CONNECTED_ACCOUNTS,
  INITIAL_USER,
  PASSPORT_ACTIVITIES,
  SECURITY_ALERTS,
  TRANSACTIONS,
  BehavioralPillar,
  ConnectedAccount,
  PassportShareActivity,
  SecurityAlert,
  Transaction,
} from "../constants/mock-data";

export interface PassportDraft {
  purpose: "Business Loan" | "Personal Loan" | "Rent / Housing" | "Other";
  selectedData: string[];
  recipientId: string;
  recipientName: string;
  durationDays: number;
}

interface TamvaStoreState {
  user: typeof INITIAL_USER;
  showFunds: boolean;
  accounts: ConnectedAccount[];
  transactions: Transaction[];
  behavioralPillars: BehavioralPillar[];
  passportActivities: PassportShareActivity[];
  securityAlerts: SecurityAlert[];
  realtimeMonitoringActive: boolean;

  // Wizard state
  passportDraft: PassportDraft;

  // Actions
  toggleShowFunds: () => void;
  revokeConsent: (accountId: string) => void;
  connectAccount: (institutionName: string, type: ConnectedAccount["institutionType"]) => void;
  updatePassportDraft: (patch: Partial<PassportDraft>) => void;
  submitPassportShare: () => PassportShareActivity;
  revokePassportShare: (shareId: string) => void;
  reportSuspiciousActivity: (title: string, description: string) => void;
  toggleMonitoring: () => void;
}

export const useTamvaStore = create<TamvaStoreState>((set, get) => ({
  user: INITIAL_USER,
  showFunds: true,
  accounts: CONNECTED_ACCOUNTS,
  transactions: TRANSACTIONS,
  behavioralPillars: BEHAVIORAL_PILLARS,
  passportActivities: PASSPORT_ACTIVITIES,
  securityAlerts: SECURITY_ALERTS,
  realtimeMonitoringActive: true,

  passportDraft: {
    purpose: "Business Loan",
    selectedData: ["income", "balances", "transactions", "savings", "repayment"],
    recipientId: "inst_akua",
    recipientName: "Akua Savings & Loans",
    durationDays: 14,
  },

  toggleShowFunds: () => set((state) => ({ showFunds: !state.showFunds })),

  revokeConsent: (accountId: string) => {
    set((state) => ({
      accounts: state.accounts.map((acc) =>
        acc.id === accountId ? { ...acc, status: "REVOKED" } : acc
      ),
      securityAlerts: [
        {
          id: `alt_rev_${Date.now()}`,
          type: "INFO",
          title: "Consent Revoked",
          description: `Access revoked for ${
            state.accounts.find((a) => a.id === accountId)?.institutionName || "account"
          }. All active tokens terminated.`,
          timestamp: new Date().toISOString(),
          dateFormatted: "Just now",
        },
        ...state.securityAlerts,
      ],
    }));
  },

  connectAccount: (institutionName: string, type: ConnectedAccount["institutionType"]) => {
    const newAccount: ConnectedAccount = {
      id: `acc_${Date.now()}`,
      institutionId: `inst_${Date.now()}`,
      institutionName,
      institutionType: type,
      accountType: type === "Mobile Money" ? "Mobile Money Wallet" : "Savings Account",
      maskedIdentifier: `••••• ${Math.floor(1000 + Math.random() * 9000)}`,
      currency: "GH₵",
      balance: Math.floor(500 + Math.random() * 5000),
      status: "CONNECTED",
      logo: type === "Mobile Money" ? "smartphone" : "landmark",
      color: "#00d084",
      connectedSince: "Today",
      lastSyncAt: "Just now",
      scopes: ["balance:read", "transactions:read"],
    };

    set((state) => ({
      accounts: [newAccount, ...state.accounts],
      securityAlerts: [
        {
          id: `alt_conn_${Date.now()}`,
          type: "SUCCESS",
          title: "New Institution Connected",
          description: `${institutionName} successfully connected under Ghana Open Banking standard.`,
          timestamp: new Date().toISOString(),
          dateFormatted: "Just now",
        },
        ...state.securityAlerts,
      ],
    }));
  },

  updatePassportDraft: (patch) => {
    set((state) => ({
      passportDraft: { ...state.passportDraft, ...patch },
    }));
  },

  submitPassportShare: () => {
    const { passportDraft, passportActivities } = get();
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + passportDraft.durationDays);

    const newShare: PassportShareActivity = {
      id: `share_${Date.now()}`,
      recipientName: passportDraft.recipientName,
      recipientLogo: "landmark",
      purpose: passportDraft.purpose,
      sharedAt: "Today",
      expiresAt: expiryDate.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      status: "ACTIVE",
      scopes: passportDraft.selectedData,
    };

    set({
      passportActivities: [newShare, ...passportActivities],
    });

    return newShare;
  },

  revokePassportShare: (shareId: string) => {
    set((state) => ({
      passportActivities: state.passportActivities.map((share) =>
        share.id === shareId ? { ...share, status: "REVOKED" } : share
      ),
    }));
  },

  reportSuspiciousActivity: (title: string, description: string) => {
    const newAlert: SecurityAlert = {
      id: `alt_rep_${Date.now()}`,
      type: "WARNING",
      title: `Reported: ${title}`,
      description: `${description}. Case opened in TAMVA Fraud Operations Console.`,
      timestamp: new Date().toISOString(),
      dateFormatted: "Just now",
      actionRequired: true,
    };

    set((state) => ({
      securityAlerts: [newAlert, ...state.securityAlerts],
    }));
  },

  toggleMonitoring: () => {
    set((state) => ({ realtimeMonitoringActive: !state.realtimeMonitoringActive }));
  },
}));
