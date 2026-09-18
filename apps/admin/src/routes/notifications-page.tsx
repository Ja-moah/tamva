import {
  ArrowRight,
  Bell,
  CheckCheck,
  ChevronRight,
  FileCheck2,
  PieChart,
  Search,
  ShieldAlert,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";

import { Button } from "../components/ui/button";
import { DeleteConfirmationModal } from "../components/ui/delete-confirmation-modal";
import { useToast } from "../components/ui/toast";
import { cn } from "../lib/utils/cn";

export interface NotificationItem {
  id: string;
  category: "security" | "transactions" | "passport" | "insights";
  label: string;
  title: string;
  description: string;
  timestamp: string;
  unread: boolean;
  severity: "critical" | "high" | "medium" | "info";
  metadata?: {
    amount?: string;
    riskScore?: number;
    status?: string;
    channel?: string;
    recipient?: string;
    expiryDays?: number;
  };
}

const initialNotifications: NotificationItem[] = [
  {
    id: "NOTIF-2026-001",
    category: "security",
    label: "SECURITY ALERT",
    title: "Transaction needs your attention",
    description: "GH₵ 25,000 transfer to a new beneficiary is on hold due to high-risk indicators.",
    timestamp: "10 min ago",
    unread: true,
    severity: "critical",
    metadata: {
      amount: "GH₵ 25,000.00",
      riskScore: 94,
      status: "HOLD",
      channel: "Internet Banking",
      recipient: "Kofi Mensah",
    },
  },
  {
    id: "NOTIF-2026-002",
    category: "security",
    label: "NEW DEVICE DETECTED",
    title: "New iPhone sign-in from Accra, Ghana",
    description: "A new iPhone 15 Pro signed in from IP 102.176.94.22 (Accra, Greater Accra). Secure account immediately if unauthorized.",
    timestamp: "1 hour ago",
    unread: true,
    severity: "high",
    metadata: {
      status: "CHALLENGED",
    },
  },
  {
    id: "NOTIF-2026-003",
    category: "passport",
    label: "PASSPORT SHARED",
    title: "Financial Passport shared with Partner Bank",
    description: "Financial Passport shared with Partner Bank for credit assessment verification. Valid for 30 days under customer consent.",
    timestamp: "3 hours ago",
    unread: false,
    severity: "info",
    metadata: {
      expiryDays: 30,
      status: "ACTIVE",
    },
  },
  {
    id: "NOTIF-2026-004",
    category: "passport",
    label: "CONSENT EXPIRING SOON",
    title: "Data-sharing consent for Fintech C expires in 3 days",
    description: "Consent token GHA-CONSENT-8842 expires on June 21, 2026. Review and renew with client to avoid API telemetry disruption.",
    timestamp: "1 day ago",
    unread: false,
    severity: "medium",
    metadata: {
      expiryDays: 3,
      status: "EXPIRING",
    },
  },
  {
    id: "NOTIF-2026-005",
    category: "insights",
    label: "MONTHLY INSIGHT READY",
    title: "May 2026 institutional risk report is ready",
    description: "Comprehensive risk intelligence summary: 284,921 transactions screened, GH₵ 4.8M fraud prevented, 99.97% API availability.",
    timestamp: "1 day ago",
    unread: false,
    severity: "info",
    metadata: {
      status: "PUBLISHED",
    },
  },
];

export function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [activeTab, setActiveTab] = useState<"all" | "security" | "transactions" | "passport">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [singleDeleteId, setSingleDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const filtered = useMemo(() => {
    return notifications.filter((item) => {
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "security" && item.category === "security") ||
        (activeTab === "transactions" && item.category === "transactions") ||
        (activeTab === "passport" && item.category === "passport");

      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.label.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesTab && matchesSearch;
    });
  }, [notifications, activeTab, searchQuery]);

  const counts = useMemo(() => {
    return {
      all: notifications.length,
      security: notifications.filter((n) => n.category === "security").length,
      transactions: notifications.filter((n) => n.category === "transactions").length,
      passport: notifications.filter((n) => n.category === "passport").length,
    };
  }, [notifications]);

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map((n) => n.id));
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    toast({
      title: "All Notifications Read",
      description: "Marked all alert items as reviewed.",
      type: "success",
    });
  };

  const handleSingleDelete = (id: string) => {
    setSingleDeleteId(id);
    setDeleteModalOpen(true);
  };

  const handleBulkDelete = () => {
    setSingleDeleteId(null);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (singleDeleteId) {
      setNotifications((prev) => prev.filter((n) => n.id !== singleDeleteId));
      setSelectedIds((prev) => prev.filter((id) => id !== singleDeleteId));
      toast({
        title: "Notification Removed",
        description: "Alert record purged from local cache.",
        type: "info",
      });
    } else if (selectedIds.length > 0) {
      setNotifications((prev) => prev.filter((n) => !selectedIds.includes(n.id)));
      toast({
        title: "Batch Deletion Completed",
        description: `Permanently removed ${selectedIds.length} notification items.`,
        type: "info",
      });
      setSelectedIds([]);
    }
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
        title={singleDeleteId ? "Delete Notification" : "Bulk Delete Notifications"}
        itemName={singleDeleteId ? notifications.find((n) => n.id === singleDeleteId)?.title : undefined}
        itemCount={singleDeleteId ? 1 : selectedIds.length}
        isBulk={!singleDeleteId}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent-gold)] uppercase tracking-wider font-bold">
            <Bell className="size-3.5" />
            <span>Alerts &amp; Intelligence Stream</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight mt-1">
            Alerts &amp; Notifications
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5 font-medium">
            Stay informed. Stay in control across banking and mobile money rails.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAllAsRead}
            className="font-semibold text-xs gap-1.5 cursor-pointer rounded-xl"
          >
            <CheckCheck className="size-3.5 text-[var(--accent-emerald)]" />
            <span>Mark All as Read</span>
          </Button>

          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)] transition-all cursor-pointer shadow-xs"
          >
            <span>Notification Settings</span>
            <ArrowRight className="size-3 text-[var(--accent-gold)]" />
          </Link>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] p-2.5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(
            [
              { id: "all", label: "All", count: counts.all },
              { id: "security", label: "Security", count: counts.security },
              { id: "transactions", label: "Transactions", count: counts.transactions },
              { id: "passport", label: "Passport", count: counts.passport },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0",
                activeTab === tab.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]",
              )}
            >
              <span>{tab.label}</span>
              <span
                className={cn(
                  "px-1.5 py-0.2 font-mono text-[10px] rounded-md",
                  activeTab === tab.id
                    ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                    : "bg-[var(--bg-canvas)] text-[var(--text-muted)] border border-[var(--border-subtle)]",
                )}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSelectAll}
            className="text-xs font-bold rounded-xl px-2.5 py-1.5 cursor-pointer"
          >
            {selectedIds.length === filtered.length && filtered.length > 0
              ? "Deselect All"
              : "Select All"}
          </Button>

          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8.5 pr-3 py-1.5 text-xs rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-hidden focus:border-[var(--accent-gold)] font-medium"
            />
          </div>

          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              className="text-xs font-bold gap-1 rounded-xl px-2.5 py-1.5 cursor-pointer shadow-xs"
            >
              <Trash2 className="size-3" />
              <span>Delete ({selectedIds.length})</span>
            </Button>
          )}
        </div>
      </div>

      {/* Notification Stream Cards */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] text-[var(--text-muted)]">
            <Bell className="size-8 mx-auto mb-2 opacity-40 text-[var(--accent-gold)]" />
            <p className="text-sm font-semibold">No notifications match your filter</p>
            <p className="text-xs mt-1">Try clearing search keywords or switching filter tabs.</p>
          </div>
        ) : (
          filtered.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            return (
              <div
                key={item.id}
                className={cn(
                  "relative rounded-2xl border transition-all duration-150 p-4.5 sm:p-5 flex flex-col sm:flex-row sm:items-start justify-between gap-4 shadow-xs",
                  item.unread
                    ? "bg-[var(--bg-surface-elevated)] border-[var(--accent-gold-border)] ring-1 ring-[var(--accent-gold-subtle)]"
                    : "bg-[var(--bg-surface)] border-[var(--border-default)] hover:border-[var(--border-strong)]",
                )}
              >
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Select Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(item.id)}
                    className="mt-1 size-4 rounded border-[var(--border-default)] text-[var(--accent-gold)] focus:ring-[var(--accent-gold)] cursor-pointer"
                    aria-label={`Select ${item.title}`}
                  />

                  {/* Icon Representation */}
                  <div
                    className={cn(
                      "size-10 rounded-xl flex items-center justify-center shrink-0 border",
                      item.severity === "critical"
                        ? "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                        : item.severity === "high"
                          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          : item.severity === "medium"
                            ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
                    )}
                  >
                    {item.category === "security" && item.severity === "critical" ? (
                      <ShieldAlert className="size-5" />
                    ) : item.category === "security" ? (
                      <Smartphone className="size-5" />
                    ) : item.category === "passport" ? (
                      <FileCheck2 className="size-5" />
                    ) : (
                      <PieChart className="size-5" />
                    )}
                  </div>

                  {/* Content Details */}
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-md font-mono text-[10px] font-extrabold uppercase tracking-wider",
                          item.severity === "critical"
                            ? "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30"
                            : item.severity === "high"
                              ? "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                              : "bg-[var(--bg-surface-subtle)] text-[var(--text-muted)] border border-[var(--border-subtle)]",
                        )}
                      >
                        {item.label}
                      </span>
                      {item.unread && (
                        <span className="size-2 rounded-full bg-rose-500 ring-2 ring-[var(--bg-surface)]" />
                      )}
                      <span className="text-xs text-[var(--text-muted)] font-mono font-medium">
                        &bull; {item.timestamp}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-[var(--text-primary)] leading-tight">
                      {item.title}
                    </h3>
                    <p className="text-xs text-[var(--text-secondary)] leading-normal font-medium">
                      {item.description}
                    </p>

                    {/* Metadata Context Box */}
                    {item.metadata?.amount && (
                      <div className="mt-3 flex items-center gap-3 p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] font-mono text-xs flex-wrap">
                        <span className="font-bold text-[var(--text-primary)]">
                          Amount: {item.metadata.amount}
                        </span>
                        <span className="text-[var(--text-muted)]">&bull;</span>
                        <span className="text-rose-600 dark:text-rose-400 font-bold">
                          Risk Score: {item.metadata.riskScore}/100
                        </span>
                        <span className="text-[var(--text-muted)]">&bull;</span>
                        <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400 font-extrabold">
                          {item.metadata.status}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex sm:flex-col items-center sm:items-end justify-end gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border-subtle)]">
                  {item.category === "security" && item.severity === "critical" && (
                    <Link
                      to="/risk-events"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:scale-102 transition-transform cursor-pointer shadow-xs"
                    >
                      <span>Review</span>
                      <ChevronRight className="size-3" />
                    </Link>
                  )}

                  {item.category === "passport" && (
                    <Link
                      to="/customers"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                    >
                      <span>View Passport</span>
                    </Link>
                  )}

                  <button
                    onClick={() => handleSingleDelete(item.id)}
                    className="p-2 rounded-xl text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete notification"
                    aria-label="Delete notification"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
