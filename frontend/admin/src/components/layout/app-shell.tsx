import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  CircleGauge,
  Coins,
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
import { LiveCurrencyConverter } from "../features/currency-converter";
import { StatusBadge } from "../feedback/status-badge";
import { CommandMenu } from "../navigation/command-menu";
import { AdinkraWatermark } from "../ui/adinkra-pattern";
import { BrandCrest } from "../ui/brand-crest";
import { BrandLogo, type BrandType } from "../ui/brand-logo";
import { Button } from "../ui/button";
import { useToast } from "../ui/toast";

const operationsNav = [
  { label: "Overview", to: "/", icon: CircleGauge, count: null },
  { label: "Risk Events", to: "/risk-events", icon: Activity, count: "12" },
  { label: "Cases", to: "/cases", icon: BriefcaseBusiness, count: "3" },
  { label: "Customers", to: "/customers", icon: Users, count: null },
  { label: "Trust Network", to: "/network", icon: Network, count: "7 Rails" },
] as const;

const platformLinks = [
  {
    label: "OpenAPI Swagger",
    href: "/api/docs/",
    icon: ExternalLink,
    badge: "Django 5.2",
  },
] as const;

export interface InstitutionScope {
  id: string;
  name: string;
  type: string;
  code: string;
  brand: BrandType;
}

const institutions: InstitutionScope[] = [
  { id: "all", name: "Global Platform Scope", type: "System-wide", code: "TAMVA-ROOT", brand: "apex" },
  { id: "momo-1", name: "MTN Mobile Money", type: "Mobile Money Operator", code: "MOMO-GH", brand: "mtn" },
  { id: "momo-2", name: "Telecel Cash", type: "Mobile Money Operator", code: "TELE-GH", brand: "telecel" },
  { id: "momo-3", name: "AirtelTigo Money", type: "Mobile Money Operator", code: "AT-GH", brand: "airteltigo" },
  { id: "inst-1", name: "Apex Bank PLC", type: "Tier 1 Commercial", code: "APEX-GH", brand: "apex" },
  { id: "inst-2", name: "Zenith Digital Trust", type: "FinTech Rail", code: "ZNTH-AF", brand: "zenith" },
  { id: "inst-3", name: "Ecobank Payment Gateway", type: "Regional Hub (PAPSS)", code: "ECO-REG", brand: "ecobank" },
];

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [converterModalOpen, setConverterModalOpen] = useState(false);
  const [tenantOpen, setTenantOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<InstitutionScope>(institutions[0]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const health = useSystemHealth();
  const { toast } = useToast();

  const isConnected = health.data?.status === "ok" && health.data.database === "ok";

  const handleSelectTenant = (inst: InstitutionScope) => {
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

      {/* Quick Currency Converter Modal */}
      {converterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-2xl">
            <div className="relative">
              <button
                onClick={() => setConverterModalOpen(false)}
                className="absolute top-4 right-4 z-10 p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-surface-elevated)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="size-5" />
              </button>
              <LiveCurrencyConverter variant="card" />
            </div>
          </div>
        </div>
      )}

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
                        ? "text-[var(--accent-gold)]"
                        : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]",
                    )}
                  />
                  <span>{label}</span>
                </div>
                {count ? (
                  <span
                    className={cn(
                      "rounded-lg px-2.5 py-0.5 font-mono text-xs font-bold",
                      active
                        ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900"
                        : "bg-[var(--bg-surface-elevated)] text-[var(--accent-gold)] border border-[var(--border-default)]",
                    )}
                  >
                    {count}
                  </span>
                ) : null}
              </Link>
            );
          })}

          {/* Quick Currency Converter Navigation Item */}
          <button
            onClick={() => setConverterModalOpen(true)}
            className="w-full flex min-h-12 items-center justify-between rounded-xl px-4 text-base font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-3.5">
              <Coins className="size-5.5 shrink-0 text-amber-500 transition-transform group-hover:scale-110" />
              <span>Currency Converter</span>
            </div>
            <span className="rounded-lg px-2 py-0.5 font-mono text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20">
              FX Live
            </span>
          </button>

          <div className="pt-4 mt-4 border-t border-[var(--border-subtle)]">
            <p className="px-3.5 py-1.5 font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
              Developer &amp; Backend Contracts
            </p>
            {platformLinks.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex min-h-11 items-center justify-between rounded-xl px-4 text-base font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] transition-colors group cursor-pointer"
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

            {/* Institution & MoMo Scope Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setTenantOpen(!tenantOpen)}
                className="flex items-center gap-3 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] px-4 py-2.5 text-left hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer shadow-xs"
              >
                {selectedTenant.id === "all" ? (
                  <Building2 className="size-4.5 text-[var(--accent-gold)] shrink-0" />
                ) : (
                  <BrandLogo brand={selectedTenant.brand} size="sm" />
                )}
                <div className="min-w-0">
                  <p className="text-base font-bold text-[var(--text-primary)] truncate max-w-[170px] sm:max-w-xs">
                    {selectedTenant.name}
                  </p>
                </div>
                <ChevronDown className="size-4 text-[var(--text-muted)] ml-0.5 shrink-0" />
              </button>

              {tenantOpen ? (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setTenantOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute left-0 mt-2 z-30 w-88 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-2.5 shadow-xl animate-in fade-in zoom-in-98 ios-glass max-h-[80vh] overflow-y-auto">
                    <p className="px-3.5 py-2 text-xs font-mono font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                      Switch Active Tenant &amp; Rail Scope
                    </p>
                    {institutions.map((inst) => (
                      <button
                        key={inst.id}
                        onClick={() => handleSelectTenant(inst)}
                        className={cn(
                          "w-full text-left px-3.5 py-2.5 rounded-xl text-base flex items-center gap-3 transition-colors cursor-pointer",
                          selectedTenant.id === inst.id
                            ? "bg-[var(--accent-gold-subtle)] text-[var(--accent-gold-text)] dark:text-[var(--accent-gold)] font-bold border border-[var(--accent-gold-border)]"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] font-medium",
                        )}
                      >
                        {inst.id === "all" ? (
                          <div className="size-7 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-default)] flex items-center justify-center shrink-0">
                            <Building2 className="size-4 text-[var(--accent-gold)]" />
                          </div>
                        ) : (
                          <BrandLogo brand={inst.brand} size="sm" />
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-sm block truncate">{inst.name}</span>
                          <span className="text-[11px] text-[var(--text-muted)] font-mono block">
                            {inst.type} &bull; {inst.code}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Quick Live Currency Converter Header Action */}
            <Button
              variant="secondary"
              size="md"
              onClick={() => setConverterModalOpen(true)}
              className="hidden md:inline-flex items-center gap-2 text-sm font-bold px-3.5 py-2 rounded-xl text-amber-500 border border-amber-500/20 hover:bg-amber-500/10 cursor-pointer"
            >
              <Coins className="size-4 text-amber-500" />
              <span>Live FX Converter</span>
            </Button>

            {/* Theme Toggle Control */}
            <ThemeToggle />

            {/* Quick Search Shortcut Button */}
            <Button
              variant="secondary"
              size="md"
              onClick={() => setCommandOpen(true)}
              className="hidden sm:inline-flex gap-2 text-base font-semibold px-4 py-2.5 rounded-xl cursor-pointer"
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
                className="relative size-11 rounded-xl cursor-pointer"
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
                        3 Active
                      </StatusBadge>
                    </div>
                    <div className="mt-3 space-y-2.5">
                      <div className="p-3.5 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-subtle)]">
                        <p className="text-sm font-bold text-[var(--accent-gold)]">
                          MTN MoMo Settlement Spike
                        </p>
                        <p className="text-sm text-[var(--text-secondary)] mt-1 leading-normal font-medium">
                          High settlement velocity (2,850 TPS) cleared via GhIPSS switch without queue buildup.
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
