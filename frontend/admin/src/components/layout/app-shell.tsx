import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  CircleGauge,
  ExternalLink,
  Menu,
  Network,
  Radio,
  Search,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { useSystemHealth } from "../../features/system/use-system-health";
import { ThemeToggle } from "../../lib/theme";
import { cn } from "../../lib/utils/cn";
import { StatusBadge } from "../feedback/status-badge";
import { CommandMenu } from "../navigation/command-menu";
import { AdinkraWatermark } from "../ui/adinkra-pattern";
import { BrandCrest } from "../ui/brand-crest";
import { Button } from "../ui/button";
import { useToast } from "../ui/toast";

const operationsNav = [
  { label: "Overview", to: "/", icon: CircleGauge, count: null },
  { label: "Risk Events", to: "/risk-events", icon: Activity, count: "12" },
  { label: "Cases", to: "/cases", icon: BriefcaseBusiness, count: "3" },
  { label: "Customers", to: "/customers", icon: Users, count: null },
  { label: "Trust Network", to: "/network", icon: Network, count: "Live" },
] as const;

const platformLinks = [
  {
    label: "OpenAPI Swagger",
    href: "/api/docs/",
    icon: ExternalLink,
    badge: "Django 5.2",
  },
] as const;

const institutions = [
  { id: "all", name: "Global Platform Scope", type: "System-wide", code: "TAMVA-ROOT" },
  { id: "inst-1", name: "Apex Bank PLC", type: "Tier 1 Commercial", code: "APEX-GH" },
  { id: "inst-2", name: "Zenith Digital Trust", type: "FinTech Rail", code: "ZNTH-AF" },
  { id: "inst-3", name: "Ecobank Payment Gateway", type: "Regional Hub", code: "ECO-REG" },
];

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [tenantOpen, setTenantOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(institutions[0]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const health = useSystemHealth();
  const { toast } = useToast();

  const isConnected = health.data?.status === "ok" && health.data.database === "ok";

  const handleSelectTenant = (inst: typeof institutions[0]) => {
    setSelectedTenant(inst);
    setTenantOpen(false);
    toast({
      title: "Active Tenant Scope Changed",
      description: `Operations scoped to: ${inst.name} (${inst.code})`,
      type: "info",
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] relative selection:bg-[var(--accent-gold)] selection:text-black">
      {/* Precision Vector Watermark */}
      <AdinkraWatermark />

      {/* Global Command Palette */}
      <CommandMenu open={commandOpen} onClose={() => setCommandOpen(false)} />

      {/* iPhone Glassmorphic Sidebar Navigation */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-76 -translate-x-full flex-col border-r border-[var(--border-default)] ios-glass p-5 transition-transform duration-300 ease-out lg:translate-x-0 shadow-lg",
          menuOpen && "translate-x-0",
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-5 border-b border-[var(--border-subtle)]">
          <Link
            to="/"
            className="flex items-center gap-3.5 group select-none"
            onClick={() => setMenuOpen(false)}
          >
            <BrandCrest className="size-11" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
                  TAMVA
                </span>
                <span className="rounded-full border border-[var(--accent-gold-border)] bg-[var(--accent-gold-subtle)] px-2 py-0.5 font-mono text-xs font-bold text-[var(--accent-gold-text)] dark:text-[var(--accent-gold)]">
                  ENTERPRISE
                </span>
              </div>
              <span className="block text-xs font-bold text-[var(--text-muted)] tracking-wider uppercase mt-0.5">
                African Trust &amp; Risk Rail
              </span>
            </div>
          </Link>
          <button
            className="rounded-xl p-2 text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] lg:hidden cursor-pointer"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Search / Command trigger */}
        <div className="mt-4">
          <button
            onClick={() => setCommandOpen(true)}
            className="w-full flex items-center justify-between gap-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] px-4 py-3 text-sm font-medium text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] transition-all group cursor-pointer shadow-xs"
          >
            <span className="flex items-center gap-3">
              <Search className="size-4.5 text-[var(--accent-gold)] group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-base">Search console...</span>
            </span>
            <kbd className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-xs font-bold text-[var(--text-muted)]">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Primary Operations Navigation */}
        <nav className="mt-6 space-y-1.5 flex-1" aria-label="Primary navigation">
          <p className="px-3.5 py-1.5 font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
            Operations Center
          </p>
          {operationsNav.map(({ icon: Icon, label, to, count }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "relative flex min-h-12 items-center justify-between rounded-xl px-4 text-base font-bold transition-all group",
                  active
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md scale-[1.01]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]",
                )}
              >
                <div className="flex items-center gap-3.5">
                  <Icon
                    className={cn(
                      "size-5.5 shrink-0 transition-transform group-hover:scale-105",
                      active
                        ? "text-white dark:text-slate-900"
                        : "text-[var(--text-muted)] group-hover:text-[var(--accent-gold)]",
                    )}
                    strokeWidth={active ? 2.4 : 2}
                    aria-hidden="true"
                  />
                  <span className="text-base font-bold tracking-tight">{label}</span>
                </div>
                {count ? (
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 font-mono text-xs font-bold shadow-xs",
                      active
                        ? "bg-white/25 text-white dark:bg-black/15 dark:text-slate-900"
                        : "bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] text-[var(--text-primary)]",
                    )}
                  >
                    {count}
                  </span>
                ) : null}
              </Link>
            );
          })}

          <div className="pt-5 mt-5 border-t border-[var(--border-subtle)]">
            <p className="px-3.5 py-1.5 font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
              Core Engine API
            </p>
            {platformLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-11 items-center justify-between rounded-xl px-4 text-base font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="size-5 text-[var(--text-muted)] group-hover:text-[var(--accent-gold)] shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[var(--text-muted)] rounded bg-[var(--bg-surface-subtle)] px-2 py-0.5 border border-[var(--border-default)]">
                    {item.badge}
                  </span>
                </a>
              );
            })}
          </div>
        </nav>

        {/* Footer Area with Engine Status */}
        <div className="mt-auto pt-4 border-t border-[var(--border-subtle)] space-y-2">
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                <Radio className="size-4 text-[var(--accent-emerald)] animate-pulse" />
                Backend Node
              </span>
              <StatusBadge
                tone={isConnected ? "success" : "warning"}
                pulse={isConnected}
                size="sm"
              >
                {isConnected ? "Healthy (18ms)" : "Connecting"}
              </StatusBadge>
            </div>
            <p className="mt-1.5 text-xs text-[var(--text-muted)] font-mono font-medium">
              Django 5.2 · PG17 · Redis Outbox
            </p>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile menu */}
      {menuOpen ? (
        <button
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation overlay"
        />
      ) : null}

      {/* Main Content Viewport */}
      <div className="lg:pl-76 flex flex-col min-h-screen">
        {/* Sticky Top Header with Apple Glassmorphism */}
        <header className="sticky top-0 z-20 flex h-18 items-center justify-between border-b border-[var(--border-default)] ios-glass px-4 sm:px-7 shadow-xs">
          <div className="flex items-center gap-3.5">
            <button
              className="rounded-xl p-2.5 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] lg:hidden cursor-pointer"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-6" />
            </button>

            {/* Institution / Scope Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setTenantOpen(!tenantOpen)}
                className="flex items-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] px-4 py-2.5 text-left hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer shadow-xs"
              >
                <Building2 className="size-4.5 text-[var(--accent-gold)]" />
                <div className="min-w-0">
                  <p className="text-base font-bold text-[var(--text-primary)] truncate max-w-[170px] sm:max-w-xs">
                    {selectedTenant.name}
                  </p>
                </div>
                <ChevronDown className="size-4 text-[var(--text-muted)] ml-0.5" />
              </button>

              {tenantOpen ? (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setTenantOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute left-0 mt-2 z-30 w-84 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-2.5 shadow-xl animate-in fade-in zoom-in-98 ios-glass">
                    <p className="px-3.5 py-2 text-xs font-mono font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                      Switch Institution Scope
                    </p>
                    {institutions.map((inst) => (
                      <button
                        key={inst.id}
                        onClick={() => handleSelectTenant(inst)}
                        className={cn(
                          "w-full text-left px-4 py-3 rounded-xl text-base flex flex-col gap-1 transition-colors cursor-pointer",
                          selectedTenant.id === inst.id
                            ? "bg-[var(--accent-gold-subtle)] text-[var(--accent-gold-text)] dark:text-[var(--accent-gold)] font-bold border border-[var(--accent-gold-border)]"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] font-medium",
                        )}
                      >
                        <span className="font-bold text-base">{inst.name}</span>
                        <span className="text-xs text-[var(--text-muted)] font-mono font-semibold">
                          {inst.type} · {inst.code}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Theme Toggle Control */}
            <ThemeToggle />

            {/* Quick Search Shortcut Button */}
            <Button
              variant="secondary"
              size="md"
              onClick={() => setCommandOpen(true)}
              className="hidden sm:inline-flex gap-2 text-base font-semibold px-4 py-2.5 rounded-xl"
            >
              <Search className="size-4.5 text-[var(--accent-gold)]" />
              <span>Search ⌘K</span>
            </Button>

            {/* Notifications Bell */}
            <div className="relative">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label="Notifications"
                className="relative size-11 rounded-xl"
              >
                <Bell className="size-5 text-[var(--text-secondary)]" />
                <span className="absolute top-2.5 right-2.5 size-2.5 rounded-full bg-[var(--accent-gold)] ring-2 ring-[var(--bg-surface)] animate-ping" />
                <span className="absolute top-2.5 right-2.5 size-2.5 rounded-full bg-[var(--accent-gold)] ring-2 ring-[var(--bg-surface)]" />
              </Button>

              {notificationsOpen ? (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setNotificationsOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2 z-30 w-92 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-4 shadow-xl animate-in fade-in zoom-in-98 ios-glass">
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] px-1">
                      <span className="text-base font-extrabold text-[var(--text-primary)]">
                        Real-Time Alerts
                      </span>
                      <StatusBadge tone="warning" size="sm">
                        2 Active
                      </StatusBadge>
                    </div>
                    <div className="mt-3 space-y-2.5">
                      <div className="p-3.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                        <p className="text-sm font-bold text-[var(--accent-gold)]">
                          Velocity Spike Flagged
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] mt-1 leading-normal font-medium">
                          High transaction velocity detected on Apex Bank Rail (Accra West).
                        </p>
                      </div>
                      <div className="p-3.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                        <p className="text-sm font-bold text-[var(--accent-emerald)]">
                          Transactional Outbox Synced
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] mt-1 leading-normal font-medium">
                          1,420 identity audit events committed to PostgreSQL 17.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <div className="hidden h-7 w-px bg-[var(--border-default)] sm:block" />

            {/* Operator Badge */}
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[var(--accent-gold-subtle)] border border-[var(--accent-gold-border)] text-sm font-extrabold text-[var(--accent-gold-text)] dark:text-[var(--accent-gold)] select-none shadow-xs">
                OP
              </span>
              <div className="hidden xl:block text-left">
                <p className="text-base font-extrabold text-[var(--text-primary)] leading-tight">Lead Officer</p>
                <p className="text-xs text-[var(--accent-emerald)] font-mono font-bold">Session Verified</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Viewport Content */}
        <main className="flex-1 mx-auto w-full max-w-[1600px] p-6 sm:p-8 lg:p-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
