import {
  AlertOctagon,
  AlertTriangle,
  Ban,
  Copy,
  Download,
  PauseCircle,
  PlayCircle,
  ShieldAlert,
  Trash2,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";

import { StatusBadge } from "../components/feedback/status-badge";
import { Button } from "../components/ui/button";
import { DeleteConfirmationModal } from "../components/ui/delete-confirmation-modal";
import { useToast } from "../components/ui/toast";
import { cn } from "../lib/utils/cn";

export interface RiskEvent {
  id: string;
  timestamp: string;
  institution: string;
  customerName: string;
  customerId: string;
  fromAccount: string;
  toAccount: string;
  beneficiaryName: string;
  amount: string;
  fee: string;
  score: number;
  tamvaDecision: "HOLD" | "ALLOW" | "CHALLENGE" | "BLOCK";
  institutionAction?: "RELEASED" | "HELD" | "ESCALATED" | "BLOCKED" | null;
  channel: string;
  device: string;
  ipAddress: string;
  deviceId: string;
  location: string;
  reasonCodes: string[];
  reasons: {
    title: string;
    description: string;
    severity: "critical" | "high" | "medium";
  }[];
}

const initialRiskEvents: RiskEvent[] = [
  {
    id: "RSK-2026-9921",
    timestamp: "2026-09-18 10:42:19",
    institution: "Partner Bank (Ghana)",
    customerName: "Elijah Dery",
    customerId: "GHA-66718290-3",
    fromAccount: "•••• •••• 4491",
    toAccount: "•••• •••• 8820",
    beneficiaryName: "Kofi Mensah",
    amount: "GH₵ 25,000.00",
    fee: "GH₵ 2.50",
    score: 94,
    tamvaDecision: "HOLD",
    institutionAction: null,
    channel: "Internet Banking",
    device: "iPhone 15 Pro (iOS 18.2)",
    ipAddress: "102.176.94.22",
    deviceId: "DEV-IPHONE-15-GH-8842",
    location: "Accra, Ghana",
    reasonCodes: ["NEW_DEVICE", "NEW_BENEFICIARY", "AMOUNT_4.2X_SPIKE", "BEHAVIOURAL_DEVIATION"],
    reasons: [
      {
        title: "New Device",
        description: "Transaction initiated from a device hardware fingerprint not seen before.",
        severity: "critical",
      },
      {
        title: "New Beneficiary",
        description: "Customer has not sent money to recipient Kofi Mensah in past 24 months.",
        severity: "high",
      },
      {
        title: "Amount 4.2× Normal",
        description: "Amount (GH₵ 25,000.00) is significantly higher than 90-day typical transfer size.",
        severity: "critical",
      },
      {
        title: "Unusual Behaviour Pattern",
        description: "Transaction executed outside customer's usual daytime activity window.",
        severity: "high",
      },
    ],
  },
  {
    id: "RSK-2026-9920",
    timestamp: "2026-09-18 10:35:10",
    institution: "MTN Mobile Money",
    customerName: "Ama Mensah",
    customerId: "GHA-88192014-1",
    fromAccount: "•••• •••• 1920",
    toAccount: "•••• •••• 3041",
    beneficiaryName: "Kwame Boateng",
    amount: "GH₵ 8,500.00",
    fee: "GH₵ 1.00",
    score: 68,
    tamvaDecision: "CHALLENGE",
    institutionAction: null,
    channel: "Mobile Money USSD / App",
    device: "Samsung Galaxy A54 (Android 14)",
    ipAddress: "154.160.22.91",
    deviceId: "DEV-SAMS-A54-GH-1092",
    location: "Kumasi, Ghana",
    reasonCodes: ["VELOCITY_1HR", "SIM_SWAP_RISK"],
    reasons: [
      {
        title: "High Velocity Spike",
        description: "3 outbound transfers within 20 minutes across merchant rails.",
        severity: "high",
      },
      {
        title: "SIM Swap Signal",
        description: "SIM profile updated 14 hours ago at telecom network provider.",
        severity: "medium",
      },
    ],
  },
  {
    id: "RSK-2026-9919",
    timestamp: "2026-09-18 10:14:02",
    institution: "Telecel Cash",
    customerName: "Kojo Asante",
    customerId: "GHA-33918204-7",
    fromAccount: "•••• •••• 9912",
    toAccount: "•••• •••• 5501",
    beneficiaryName: "Urban Stores Ltd",
    amount: "GH₵ 1,200.00",
    fee: "GH₵ 0.50",
    score: 18,
    tamvaDecision: "ALLOW",
    institutionAction: "RELEASED",
    channel: "QR Merchant Pay",
    device: "iPhone 13 (iOS 17.5)",
    ipAddress: "41.215.160.8",
    deviceId: "DEV-IPHONE-13-GH-9931",
    location: "Accra, Ghana",
    reasonCodes: ["KNOWN_MERCHANT", "NORMAL_TIME_WINDOW"],
    reasons: [
      {
        title: "Known Merchant",
        description: "Regular monthly grocery purchase at verified merchant node.",
        severity: "medium",
      },
    ],
  },
];

export function RiskPage() {
  const [events, setEvents] = useState<RiskEvent[]>(initialRiskEvents);
  const [selectedEventId, setSelectedEventId] = useState<string | null>("RSK-2026-9921");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);

  // Institution action confirmation modal
  const [pendingAction, setPendingAction] = useState<{
    action: "RELEASED" | "HELD" | "ESCALATED" | "BLOCKED";
    label: string;
  } | null>(null);

  const { toast } = useToast();

  const selectedEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || events[0] || null;
  }, [events, selectedEventId]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: `${label}: ${text}`,
      type: "info",
    });
  };

  const confirmDelete = () => {
    if (singleDeleteId) {
      setEvents((prev) => prev.filter((e) => e.id !== singleDeleteId));
      setSelectedIds((prev) => prev.filter((id) => id !== singleDeleteId));
      if (selectedEventId === singleDeleteId) {
        setSelectedEventId(null);
      }
      toast({
        title: "Risk Event Purged",
        description: `Reference ${singleDeleteId} removed from active memory.`,
        type: "info",
      });
    } else if (selectedIds.length > 0) {
      setEvents((prev) => prev.filter((e) => !selectedIds.includes(e.id)));
      if (selectedEventId && selectedIds.includes(selectedEventId)) {
        setSelectedEventId(null);
      }
      toast({
        title: "Bulk Purge Completed",
        description: `Removed ${selectedIds.length} risk evaluation records.`,
        type: "info",
      });
      setSelectedIds([]);
    }
  };

  const executeInstitutionAction = () => {
    if (!selectedEvent || !pendingAction) return;

    setEvents((prev) =>
      prev.map((e) =>
        e.id === selectedEvent.id
          ? { ...e, institutionAction: pendingAction.action }
          : e,
      ),
    );

    toast({
      title: `Institution Decision: ${pendingAction.label}`,
      description: `Action committed to PostgreSQL compliance ledger for ${selectedEvent.id}.`,
      type: pendingAction.action === "BLOCKED" ? "error" : "success",
    });

    setPendingAction(null);
  };

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSingleDeleteId(null);
        }}
        onConfirm={confirmDelete}
        title={singleDeleteId ? "Purge Risk Event" : "Bulk Purge Risk Events"}
        itemName={singleDeleteId ? singleDeleteId : undefined}
        itemCount={singleDeleteId ? 1 : selectedIds.length}
        isBulk={!singleDeleteId}
      />

      {/* Institution Action Confirmation Modal */}
      {pendingAction && selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "size-10 rounded-xl flex items-center justify-center font-bold",
                  pendingAction.action === "BLOCKED"
                    ? "bg-rose-500/10 text-rose-600 border border-rose-500/30"
                    : pendingAction.action === "HELD"
                      ? "bg-amber-500/10 text-amber-600 border border-amber-500/30"
                      : pendingAction.action === "ESCALATED"
                        ? "bg-purple-500/10 text-purple-600 border border-purple-500/30"
                        : "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30",
                )}
              >
                {pendingAction.action === "BLOCKED" && <Ban className="size-5" />}
                {pendingAction.action === "HELD" && <PauseCircle className="size-5" />}
                {pendingAction.action === "ESCALATED" && <AlertTriangle className="size-5" />}
                {pendingAction.action === "RELEASED" && <PlayCircle className="size-5" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-primary)]">
                  Confirm Institution Action: {pendingAction.label}
                </h3>
                <p className="text-xs text-[var(--text-muted)] font-mono">
                  Event: {selectedEvent.id} &bull; Amount: {selectedEvent.amount}
                </p>
              </div>
            </div>

            <p className="text-xs text-[var(--text-secondary)] bg-[var(--bg-canvas)] p-3 rounded-xl border border-[var(--border-subtle)] leading-relaxed font-medium">
              You are about to <strong>{pendingAction.label.toUpperCase()}</strong> transaction{" "}
              <span className="font-mono font-bold text-[var(--text-primary)]">{selectedEvent.amount}</span>{" "}
              from {selectedEvent.customerName} to {selectedEvent.beneficiaryName}. TAMVA provides risk
              intelligence, but the institution takes full operational and regulatory responsibility for this decision.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPendingAction(null)}
                className="rounded-xl font-semibold cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={executeInstitutionAction}
                className={cn(
                  "rounded-xl font-bold gap-1.5 cursor-pointer shadow-md",
                  pendingAction.action === "BLOCKED"
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : pendingAction.action === "HELD"
                      ? "bg-amber-600 hover:bg-amber-700 text-white"
                      : pendingAction.action === "ESCALATED"
                        ? "bg-purple-600 hover:bg-purple-700 text-white"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white",
                )}
              >
                <span>Confirm {pendingAction.label}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Screen 1 Heading & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent-gold)] uppercase tracking-wider font-bold">
            <ShieldAlert className="size-3.5" />
            <span>Screen 1 &bull; Investigation View</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight mt-1">
            Risk Event Detail
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5 font-medium">
            Transaction analysis, explainability intelligence, and institutional decisioning.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-xs font-mono font-bold flex items-center gap-2">
            <span className="size-2 rounded-full bg-[var(--accent-emerald)]" />
            <span>Environment: Production</span>
          </div>

          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setSingleDeleteId(null);
                setDeleteModalOpen(true);
              }}
              className="text-xs font-bold gap-1 rounded-xl px-2.5 py-1.5 cursor-pointer shadow-xs"
            >
              <Trash2 className="size-3" />
              <span>Bulk Purge ({selectedIds.length})</span>
            </Button>
          )}
        </div>
      </div>

      {/* Event Selection Switcher Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] p-2 rounded-2xl shadow-xs">
        <span className="text-xs font-mono text-[var(--text-muted)] uppercase font-bold px-2 shrink-0">
          Select Event:
        </span>
        {events.map((evt) => (
          <button
            key={evt.id}
            onClick={() => setSelectedEventId(evt.id)}
            className={cn(
              "px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0",
              selectedEvent?.id === evt.id
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)]",
            )}
          >
            <span>{evt.id}</span>
            <span
              className={cn(
                "px-1.5 py-0.2 text-[10px] rounded",
                evt.score >= 70
                  ? "bg-rose-500/20 text-rose-600 dark:text-rose-400 font-extrabold"
                  : "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold",
              )}
            >
              {evt.score}/100
            </span>
          </button>
        ))}
      </div>

      {selectedEvent && (
        <div className="space-y-6">
          {/* Main Transaction Summary & Risk Score Hero */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left: Transaction Summary (2 cols) */}
            <div className="lg:col-span-2 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-6 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                  <div className="size-11 rounded-xl bg-rose-500/10 text-rose-600 border border-rose-500/30 flex items-center justify-center font-bold shrink-0">
                    <Zap className="size-5.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase">
                        {selectedEvent.channel}
                      </span>
                      <span className="px-2 py-0.5 rounded-md font-mono text-[10px] font-extrabold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                        High Risk Transaction
                      </span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-[var(--text-primary)] font-tabular mt-0.5">
                      {selectedEvent.amount}
                    </h2>
                  </div>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-[var(--text-muted)]">Ref: {selectedEvent.id}</span>
                  <button
                    onClick={() => handleCopy(selectedEvent.id, "Event Reference")}
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-canvas)] cursor-pointer"
                    title="Copy Reference"
                  >
                    <Copy className="size-3.5" />
                  </button>
                </div>
              </div>

              {/* 2-Column Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-medium">
                {/* Origin */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1">
                  <span className="text-[var(--text-muted)] font-mono uppercase text-[10px] block">
                    Origin Account
                  </span>
                  <p className="text-sm font-bold text-[var(--text-primary)]">
                    {selectedEvent.customerName}
                  </p>
                  <p className="font-mono text-[var(--text-secondary)]">{selectedEvent.fromAccount}</p>
                </div>

                {/* Destination */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1">
                  <span className="text-[var(--text-muted)] font-mono uppercase text-[10px] block">
                    Destination Account
                  </span>
                  <p className="text-sm font-bold text-[var(--text-primary)]">
                    {selectedEvent.beneficiaryName}
                  </p>
                  <p className="font-mono text-[var(--text-secondary)]">{selectedEvent.toAccount}</p>
                </div>

                {/* Device & Location */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1">
                  <span className="text-[var(--text-muted)] font-mono uppercase text-[10px] block">
                    Device Fingerprint
                  </span>
                  <p className="text-xs font-bold text-[var(--text-primary)]">
                    {selectedEvent.device}
                  </p>
                  <span className="inline-block px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 font-mono text-[10px] font-bold">
                    New Device Flag
                  </span>
                </div>

                {/* Geolocation & IP */}
                <div className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1">
                  <span className="text-[var(--text-muted)] font-mono uppercase text-[10px] block">
                    Location &amp; IP Address
                  </span>
                  <p className="text-xs font-bold text-[var(--text-primary)]">
                    🇬🇭 {selectedEvent.location}
                  </p>
                  <p className="font-mono text-[var(--text-secondary)]">{selectedEvent.ipAddress}</p>
                </div>
              </div>
            </div>

            {/* Right: Risk Score & TAMVA Decision */}
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-6 space-y-5 shadow-xs flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono uppercase text-[var(--text-muted)] font-bold">
                  TAMVA Risk Intelligence
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-extrabold text-rose-600 dark:text-rose-400 font-tabular">
                    {selectedEvent.score}
                  </span>
                  <span className="text-sm text-[var(--text-muted)] font-mono">/ 100 Risk Score</span>
                </div>

                {/* Horizontal Progress Bar */}
                <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 mt-3 overflow-hidden">
                  <div
                    className="h-full bg-rose-500 rounded-full transition-all duration-500"
                    style={{ width: `${selectedEvent.score}%` }}
                  />
                </div>
              </div>

              {/* Recommendation Card */}
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-extrabold uppercase text-rose-700 dark:text-rose-300">
                    TAMVA Recommendation
                  </span>
                  <span className="px-2 py-0.5 rounded font-mono text-xs font-extrabold bg-rose-500 text-white">
                    {selectedEvent.tamvaDecision}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
                  Requires step-up authentication (OTP, Biometric match, or Out-of-band call) before settlement processing.
                </p>
              </div>

              {/* Customer Quick Context */}
              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="size-7 rounded-full bg-[var(--accent-gold-subtle)] text-[var(--accent-gold)] flex items-center justify-center font-bold">
                    ED
                  </div>
                  <div>
                    <span className="font-bold text-[var(--text-primary)] block">
                      {selectedEvent.customerName}
                    </span>
                    <span className="text-[10px] font-mono text-[var(--text-muted)]">
                      KYC Verified &bull; Savings
                    </span>
                  </div>
                </div>
                <Link
                  to="/customers"
                  className="text-xs font-bold text-[var(--accent-gold)] hover:underline"
                >
                  View Profile →
                </Link>
              </div>
            </div>
          </div>

          {/* "Why TAMVA Flagged This" Explanations */}
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-6 space-y-4 shadow-xs">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Why TAMVA Flagged This Transaction
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
                Multiple correlated telemetry signals indicate elevated account takeover and structuring risk.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {selectedEvent.reasons.map((r, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <AlertOctagon className="size-4 text-rose-500 shrink-0" />
                      <h4 className="text-xs font-bold text-[var(--text-primary)]">{r.title}</h4>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-medium leading-relaxed">
                      {r.description}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-rose-600 uppercase">
                    Severity: {r.severity}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Institution Action Bar (Major Operational Mutations) */}
          <div className="rounded-2xl border border-[var(--accent-gold-border)] bg-[var(--bg-surface-elevated)] p-6 space-y-4 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Institution Action &amp; Final Decision
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
                  TAMVA provides risk intelligence and recommendations. Final operational decision belongs to the institution.
                </p>
              </div>

              {selectedEvent.institutionAction && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-[var(--text-muted)] font-bold">
                    Recorded Status:
                  </span>
                  <StatusBadge
                    tone={
                      selectedEvent.institutionAction === "BLOCKED"
                        ? "danger"
                        : selectedEvent.institutionAction === "HELD"
                          ? "warning"
                          : "success"
                    }
                    size="md"
                  >
                    {selectedEvent.institutionAction}
                  </StatusBadge>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Release */}
              <button
                onClick={() => setPendingAction({ action: "RELEASED", label: "Release Transaction" })}
                className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
              >
                <PlayCircle className="size-4" />
                <span>Release</span>
              </button>

              {/* Hold */}
              <button
                onClick={() => setPendingAction({ action: "HELD", label: "Hold Transaction" })}
                className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
              >
                <PauseCircle className="size-4" />
                <span>Hold</span>
              </button>

              {/* Escalate */}
              <button
                onClick={() =>
                  setPendingAction({ action: "ESCALATED", label: "Escalate to Fraud Team" })
                }
                className="p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
              >
                <AlertTriangle className="size-4" />
                <span>Escalate</span>
              </button>

              {/* Block */}
              <button
                onClick={() => setPendingAction({ action: "BLOCKED", label: "Block & Blacklist" })}
                className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all shadow-xs"
              >
                <Ban className="size-4" />
                <span>Block</span>
              </button>
            </div>
          </div>

          {/* Decision Timeline & Signals Considered */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Timeline */}
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-6 space-y-4 shadow-xs">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Evaluation Timeline</h3>
              <div className="space-y-3 font-mono text-xs">
                {[
                  { step: "Transaction Received", time: "10:42:19.012", status: "Completed" },
                  { step: "Identity & Sanction Checks", time: "10:42:19.045", status: "Clear" },
                  { step: "Device Hardware Analysis", time: "10:42:19.088", status: "New Device" },
                  { step: "Behavioural Model Inference", time: "10:42:19.120", status: "Unusual Pattern" },
                  { step: "Rules Triggered", time: "10:42:19.142", status: "3 Rules Matched" },
                  { step: "TAMVA Decision: HOLD", time: "10:42:19.145", status: "Step-up Needed" },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="size-2 rounded-full bg-[var(--accent-gold)]" />
                      <span className="font-bold text-[var(--text-primary)]">{item.step}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[var(--text-muted)]">
                      <span>{item.status}</span>
                      <span>&bull;</span>
                      <span>{item.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Audit Trail & Model Info */}
            <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-6 space-y-4 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-[var(--text-primary)]">
                  Model &amp; Ruleset Specifications
                </h3>
                <div className="mt-3 space-y-2.5 text-xs font-mono">
                  <div className="flex justify-between p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)]">Model Version</span>
                    <span className="font-bold text-[var(--text-primary)]">TAMVA-GBoost-v4.2-WestAfrica</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)]">Ruleset Engine</span>
                    <span className="font-bold text-[var(--text-primary)]">GH-FIN-RULES-2026.09</span>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)]">Data Sources</span>
                    <span className="font-bold text-[var(--accent-gold)]">Transaction &bull; Device &bull; Network &bull; MoMo</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setSingleDeleteId(selectedEvent.id);
                    setDeleteModalOpen(true);
                  }}
                  className="text-xs font-bold text-rose-600 hover:bg-rose-500/10 gap-1.5 rounded-xl cursor-pointer"
                >
                  <Trash2 className="size-3.5" />
                  <span>Purge Event Record</span>
                </Button>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleCopy(JSON.stringify(selectedEvent, null, 2), "Event JSON")}
                  className="text-xs font-bold gap-1.5 rounded-xl cursor-pointer"
                >
                  <Download className="size-3.5" />
                  <span>Export JSON Payload</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
