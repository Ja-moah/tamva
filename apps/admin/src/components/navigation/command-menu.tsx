import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  CircleGauge,
  Cpu,
  ExternalLink,
  Network,
  Search,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { useSession } from "../../features/session/use-session";

interface CommandMenuProps {
  open: boolean;
  onClose: () => void;
}

export function CommandMenu({ open, onClose }: CommandMenuProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const { can } = useSession();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const go = (to: string) => () => {
    void navigate({ to });
    onClose();
  };
  const quickNav = [
    { title: "Overview", desc: "Risk decisions, cases, confidence and connection health", icon: CircleGauge, permission: "overview:read", action: go("/") },
    { title: "Risk events", desc: "Every evaluation, with decision and reason codes", icon: Activity, permission: "risk:read", action: go("/risk-events") },
    { title: "Cases", desc: "Investigation queue and workflow", icon: BriefcaseBusiness, permission: "case:read", action: go("/cases") },
    { title: "Customers", desc: "Consent-scoped customer summaries", icon: Users, permission: "customer:read", action: go("/customers") },
    { title: "Trust network", desc: "Entities and relationships in your institution", icon: Network, permission: "network:read", action: go("/network") },
    { title: "Analytics & insights", desc: "Aggregates over your own records", icon: BarChart3, permission: "analytics:read", action: go("/analytics") },
    { title: "Team & access", desc: "Members, roles and permissions", icon: UserCheck, permission: "team:read", action: go("/team") },
    { title: "Security & governance", desc: "Security events, devices, locations, audit trail", icon: ShieldCheck, permission: "security:read", action: go("/security") },
    { title: "Notifications", desc: "Alerts addressed to you", icon: Bell, permission: null, action: go("/notifications") },
    { title: "Settings", desc: "Notification and regional settings", icon: Settings, permission: null, action: go("/settings") },
    { title: "API & integrations", desc: "Applications, credentials, webhooks, connections", icon: Cpu, permission: "partner:read", action: go("/integrations") },
    {
      title: "API reference",
      desc: "OpenAPI documentation for the TAMVA API",
      icon: ExternalLink,
      permission: null,
      action: () => {
        window.open("/api/docs/", "_blank", "noopener");
        onClose();
      },
    },
  ].filter((item) => item.permission === null || can(item.permission));

  const filtered = quickNav.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.desc.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20" role="dialog" aria-modal="true" aria-label="Go to a page">
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-xl transform overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] shadow-[var(--shadow-lg)] transition-all animate-in fade-in zoom-in-98">
        <div className="relative flex items-center border-b border-[var(--border-default)] px-4">
          <Search className="size-4.5 text-[var(--accent-gold)] shrink-0" />
          <input
            type="text"
            className="w-full bg-transparent px-3.5 py-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
            placeholder="Go to… (e.g. cases, team, integrations)"
            aria-label="Go to a page"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <span className="hidden sm:inline-block rounded-md border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] px-2 py-0.5 font-mono text-xs text-[var(--text-muted)] uppercase">
            ESC
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] sm:hidden cursor-pointer"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2.5 space-y-1">
          <p className="px-3 py-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Go to
          </p>
          {filtered.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm font-semibold text-[var(--text-secondary)]">
                No matching pages
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 rounded-lg px-3.5 py-3 text-left transition-colors hover:bg-[var(--bg-surface-hover)] group cursor-pointer"
                >
                  <span className="grid size-9 place-items-center rounded-md bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] group-hover:text-[var(--accent-gold)] transition-colors shrink-0">
                    <Icon className="size-4.5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-gold)] transition-colors truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border-default)] px-4 py-3 bg-[var(--bg-surface-subtle)] text-xs text-[var(--text-secondary)] font-mono">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[var(--accent-emerald)]" />
            TAMVA Operations
          </span>
          <span>Press ESC to exit</span>
        </div>
      </div>
    </div>
  );
}
