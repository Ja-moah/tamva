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
    external: true,
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
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] relative selection:bg-[var(--accent-gold)] selection:text-white">
      {/* Subtle Adinkra Watermark Pattern */}
      <AdinkraWatermark />

      {/* Global Command Palette */}
      <CommandMenu open={commandOpen} onClose={() => setCommandOpen(false)} />

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col border-r border-[var(--border-default)] bg-[var(--bg-surface)] p-5 backdrop-blur-xl transition-transform duration-200 ease-in-out lg:translate-x-0 shadow-sm",
          menuOpen && "translate-x-0",
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-5 border-b border-[var(--border-default)]">
          <Link
            to="/"
            className="flex items-center gap-3.5 group select-none"
            onClick={() => setMenuOpen(false)}
          >
            <BrandCrest className="size-10" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
                  TAMVA
                </span>
                <span className="rounded border border-[var(--border-strong)] bg-[var(--bg-surface-subtle)] px-2 py-0.5 font-mono text-xs font-bold text-[var(--text-primary)]">
                  OPS
                </span>
              </div>
              <span className="block text-xs font-semibold text-[var(--text-secondary)] tracking-wider uppercase mt-0.5">
                Trust &amp; Risk Platform
              </span>
            </div>
          </Link>
          <button
            className="rounded-lg p-2 text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] lg:hidden cursor-pointer"
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
            className="w-full flex items-center justify-between gap-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] px-3.5 py-2.5 text-sm text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] transition-all group cursor-pointer"
          >
            <span className="flex items-center gap-2.5">
              <Search className="size-4 text-[var(--text-muted)] group-hover:text-[var(--text-primary)]" />
              <span className="font-medium">Search console...</span>
            </span>
            <kbd className="rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 py-0.5 font-mono text-xs font-semibold text-[var(--text-muted)]">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Primary Operations Navigation */}
        <nav className="mt-5 space-y-1.5 flex-1" aria-label="Primary navigation">
          <p className="px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
            Operations
          </p>
          {operationsNav.map(({ icon: Icon, label, to, count }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "relative flex min-h-11 items-center justify-between rounded-lg px-3.5 text-base font-semibold transition-colors group",
                  active
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]",
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "size-5 shrink-0 transition-colors",
                      active
                        ? "text-white dark:text-slate-900"
                        : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]",
                    )}
                    strokeWidth={active ? 2.3 : 1.9}
                    aria-hidden="true"
                  />
                  <span>{label}</span>
                </div>
                {count ? (
                  <span
                    className={cn(
                      "rounded-md px-2.5 py-0.5 font-mono text-xs font-bold",
                      active
                        ? "bg-white/25 text-white dark:bg-black/15 dark:text-slate-900"
                        : "bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)]",
                    )}
                  >
                    {count}
                  </span>
                ) : null}
              </Link>
            );
          })}

          <div className="pt-5 mt-4 border-t border-[var(--border-default)]">
            <p className="px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Platform &amp; Engine
            </p>
            {platformLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.label}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-11 items-center justify-between rounded-lg px-3.5 text-base font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="size-5 text-[var(--text-muted)] group-hover:text-[var(--accent-gold)] shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  <span className="font-mono text-xs font-semibold text-[var(--text-muted)]">
                    {item.badge}
                  </span>
                </a>
              );
            })}
          </div>
        </nav>

        {/* Footer Area with Engine Status */}
        <div className="mt-auto pt-4 border-t border-[var(--border-default)] space-y-2">
          <div className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] p-3.5">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-sm font-bold text-[var(--text-primary)]">
                <Radio className="size-4 text-[var(--accent-emerald)]" />
                Backend Engine
              </span>
              <StatusBadge
                tone={isConnected ? "success" : "warning"}
                pulse={isConnected}
                size="md"
              >
                {isConnected ? "Healthy" : "Connecting"}
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
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-xs lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation overlay"
        />
      ) : null}

      {/* Main Content Viewport */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-surface)] px-4 sm:px-6 backdrop-blur-md shadow-xs">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </button>

            {/* Institution / Scope Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setTenantOpen(!tenantOpen)}
                className="flex items-center gap-2.5 rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] px-3 py-2 text-left hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer"
              >
                <Building2 className="size-4 text-[var(--accent-gold)]" />
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[var(--text-primary)] truncate max-w-[160px] sm:max-w-xs">
                    {selectedTenant.name}
                  </p>
                </div>
                <ChevronDown className="size-3.5 text-[var(--text-muted)] ml-0.5" />
              </button>

              {tenantOpen ? (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setTenantOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute left-0 mt-2 z-30 w-80 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-2 shadow-[var(--shadow-lg)] animate-in fade-in zoom-in-98">
                    <p className="px-3 py-1.5 text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
                      Switch Institution Scope
                    </p>
                    {institutions.map((inst) => (
                      <button
                        key={inst.id}
                        onClick={() => handleSelectTenant(inst)}
                        className={cn(
                          "w-full text-left px-3.5 py-2.5 rounded-lg text-sm flex flex-col gap-1 transition-colors cursor-pointer",
                          selectedTenant.id === inst.id
                            ? "bg-[var(--accent-gold-subtle)] text-[var(--accent-gold-text)] dark:text-[var(--accent-gold)] font-bold border border-[var(--accent-gold-border)]"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] font-medium",
                        )}
                      >
                        <span className="font-bold text-sm">{inst.name}</span>
                        <span className="text-xs text-[var(--text-muted)] font-mono">
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
          <div className="flex items-center gap-3">
            {/* Theme Toggle Control */}
            <ThemeToggle />

            {/* Quick Search Shortcut Button */}
            <Button
              variant="secondary"
              size="md"
              onClick={() => setCommandOpen(true)}
              className="hidden sm:inline-flex gap-2 text-sm font-semibold"
            >
              <Search className="size-4 text-[var(--accent-gold)]" />
              <span>Search ⌘K</span>
            </Button>

            {/* Notifications Bell */}
            <div className="relative">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label="Notifications"
                className="relative size-10"
              >
                <Bell className="size-4 text-[var(--text-secondary)]" />
                <span className="absolute top-2.5 right-2.5 size-2.5 rounded-full bg-[var(--accent-gold)] ring-2 ring-[var(--bg-surface)]" />
              </Button>

              {notificationsOpen ? (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setNotificationsOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2 z-30 w-88 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-4 shadow-[var(--shadow-lg)] animate-in fade-in zoom-in-98">
                    <div className="flex items-center justify-between pb-3 border-b border-[var(--border-default)] px-1">
                      <span className="text-base font-bold text-[var(--text-primary)]">
                        System Notifications
                      </span>
                      <StatusBadge tone="warning" size="sm">
                        3 Alerts
                      </StatusBadge>
                    </div>
                    <div className="mt-3 space-y-2.5">
                      <div className="p-3 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                        <p className="text-sm font-bold text-[var(--accent-gold)]">
                          Velocity Spike Flagged
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] mt-1 leading-normal">
                          High transaction velocity detected on Apex Bank Rail (Accra West).
                        </p>
                      </div>
                      <div className="p-3 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                        <p className="text-sm font-bold text-[var(--accent-emerald)]">
                          Transactional Outbox Synced
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] mt-1 leading-normal">
                          1,420 identity audit events committed to PostgreSQL 17.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <div className="hidden h-6 w-px bg-[var(--border-default)] sm:block" />

            {/* Operator Badge */}
            <div className="flex items-center gap-3">
              <span className="grid size-9 place-items-center rounded-lg bg-[var(--accent-gold-subtle)] border border-[var(--accent-gold-border)] text-sm font-bold text-[var(--accent-gold-text)] dark:text-[var(--accent-gold)] select-none">
                AD
              </span>
              <div className="hidden xl:block text-left">
                <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">Admin</p>
                <p className="text-xs text-[var(--accent-emerald)] font-mono font-semibold">Verified Session</p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Viewport Content */}
        <main className="flex-1 mx-auto w-full max-w-[1560px] p-5 sm:p-7 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

