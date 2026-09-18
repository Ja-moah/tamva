import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  CircleGauge,
  Coins,
  Cpu,
  Menu,
  Network,
  Radio,
  Search,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { useSystemHealth } from "../../features/system/use-system-health";
import { ThemeToggle } from "../../lib/theme";
import { cn } from "../../lib/utils/cn";
import { LiveCurrencyConverter } from "../features/currency-converter";
import { NetworkStatusBanner } from "../feedback/network-status-banner";
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
  { label: "Analytics & Insights", to: "/analytics", icon: BarChart3, count: null },
] as const;

const governanceNav = [
  { label: "Team & Access", to: "/team", icon: UserCheck, count: "24" },
  { label: "Security & Governance", to: "/security", icon: ShieldCheck, count: "98%" },
  { label: "Alerts & Notifications", to: "/notifications", icon: Bell, count: "5" },
  { label: "Settings", to: "/settings", icon: Settings, count: null },
] as const;

const developerNav = [
  { label: "API & Integrations", to: "/integrations", icon: Cpu, count: "v1" },
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
  const [environment, setEnvironment] = useState<"Production" | "Sandbox">("Production");

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

  const handleToggleEnvironment = () => {
    const nextEnv = environment === "Production" ? "Sandbox" : "Production";
    setEnvironment(nextEnv);
    toast({
      title: `Switched to ${nextEnv}`,
      description: `System environment is now operating in ${nextEnv} profile.`,
      type: nextEnv === "Production" ? "success" : "info",
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] relative selection:bg-[var(--accent-gold)] selection:text-black text-sm">
      {/* Real-time Network Status Banner with Offline Loading Indicator */}
      <NetworkStatusBanner />

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

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col border-r border-[var(--border-default)] ios-glass p-4.5 transition-transform duration-300 ease-out lg:translate-x-0 shadow-lg overflow-y-auto",
          menuOpen && "translate-x-0",
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
          <Link
            to="/"
            className="flex items-center gap-3 group select-none"
            onClick={() => setMenuOpen(false)}
          >
            <BrandCrest className="size-10" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
                  TAMVA
                </span>
                <span className="rounded-md border border-[var(--accent-gold-border)] bg-[var(--accent-gold-subtle)] px-1.5 py-0.2 font-mono text-[10px] font-bold text-[var(--accent-gold-text)] dark:text-[var(--accent-gold)]">
                  {environment}
                </span>
              </div>
              <span className="block text-[11px] font-bold text-[var(--text-muted)] tracking-wider uppercase mt-0.5">
                People &bull; Data &bull; Trust &bull; Opportunity
              </span>
            </div>
          </Link>
          <button
            className="rounded-xl p-1.5 text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] lg:hidden cursor-pointer"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Search / Command trigger */}
        <div className="mt-3.5">
          <button
            onClick={() => setCommandOpen(true)}
            className="w-full flex items-center justify-between gap-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] px-3.5 py-2 text-xs font-medium text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] transition-all group cursor-pointer shadow-xs"
          >
            <span className="flex items-center gap-2.5">
              <Search className="size-3.5 text-[var(--accent-gold)] group-hover:scale-110 transition-transform" />
              <span className="font-semibold text-xs">Search for cases, entities...</span>
            </span>
            <kbd className="rounded border border-[var(--border-default)] bg-[var(--bg-surface)] px-1.5 py-0.2 font-mono text-[10px] font-bold text-[var(--text-muted)]">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Operations Navigation */}
        <nav className="mt-4 space-y-1 flex-1" aria-label="Primary navigation">
          <p className="px-3 py-1 font-mono text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
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
                  "relative flex min-h-10 items-center justify-between rounded-xl px-3 py-1.5 text-xs font-bold transition-all group",
                  active
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs scale-[1.01]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-transform group-hover:scale-105",
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
                      "rounded-md px-2 py-0.2 font-mono text-[10px] font-bold",
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

          {/* Governance & Administration */}
          <div className="pt-3 mt-3 border-t border-[var(--border-subtle)]">
            <p className="px-3 py-1 font-mono text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
              Governance &amp; Access
            </p>
            {governanceNav.map(({ icon: Icon, label, to, count }) => {
              const active = pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "relative flex min-h-10 items-center justify-between rounded-xl px-3 py-1.5 text-xs font-bold transition-all group",
                    active
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs scale-[1.01]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-transform group-hover:scale-105",
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
                        "rounded-md px-2 py-0.2 font-mono text-[10px] font-bold",
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
          </div>

          {/* Developer & Integration */}
          <div className="pt-3 mt-3 border-t border-[var(--border-subtle)]">
            <p className="px-3 py-1 font-mono text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
              Developer &amp; Contracts
            </p>
            {developerNav.map(({ icon: Icon, label, to, count }) => {
              const active = pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "relative flex min-h-10 items-center justify-between rounded-xl px-3 py-1.5 text-xs font-bold transition-all group",
                    active
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs scale-[1.01]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-transform group-hover:scale-105",
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
                        "rounded-md px-2 py-0.2 font-mono text-[10px] font-bold",
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
          </div>
        </nav>

        {/* Footer Area with Engine Status */}
        <div className="mt-auto pt-3 border-t border-[var(--border-subtle)] space-y-2">
          <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] p-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold text-[var(--text-primary)]">
                <Radio className="size-3.5 text-[var(--accent-emerald)] animate-pulse" />
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
            <p className="mt-1 text-[11px] text-[var(--text-muted)] font-mono font-medium">
              Django 5.2 · PG17 · Redis
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
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Sticky Top Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--border-default)] ios-glass px-4 sm:px-6 shadow-xs">
          <div className="flex items-center gap-3">
            <button
              className="rounded-xl p-2 text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] lg:hidden cursor-pointer"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </button>

            {/* Institution & MoMo Scope Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setTenantOpen(!tenantOpen)}
                className="flex items-center gap-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] px-3 py-1.5 text-left hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer shadow-xs"
              >
                {selectedTenant.id === "all" ? (
                  <Building2 className="size-4 text-[var(--accent-gold)] shrink-0" />
                ) : (
                  <BrandLogo brand={selectedTenant.brand} size="sm" />
                )}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[140px] sm:max-w-xs">
                    {selectedTenant.name}
                  </p>
                </div>
                <ChevronDown className="size-3.5 text-[var(--text-muted)] ml-0.5 shrink-0" />
              </button>

              {tenantOpen ? (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setTenantOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute left-0 mt-2 z-30 w-80 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-2 shadow-xl animate-in fade-in zoom-in-98 ios-glass max-h-[80vh] overflow-y-auto">
                    <p className="px-3 py-1.5 text-[10px] font-mono font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                      Switch Active Tenant &amp; Rail Scope
                    </p>
                    {institutions.map((inst) => (
                      <button
                        key={inst.id}
                        onClick={() => handleSelectTenant(inst)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2.5 transition-colors cursor-pointer",
                          selectedTenant.id === inst.id
                            ? "bg-[var(--accent-gold-subtle)] text-[var(--accent-gold-text)] dark:text-[var(--accent-gold)] font-bold border border-[var(--accent-gold-border)]"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] font-medium",
                        )}
                      >
                        {inst.id === "all" ? (
                          <div className="size-6 rounded-md bg-[var(--bg-canvas)] border border-[var(--border-default)] flex items-center justify-center shrink-0">
                            <Building2 className="size-3.5 text-[var(--accent-gold)]" />
                          </div>
                        ) : (
                          <BrandLogo brand={inst.brand} size="sm" />
                        )}
                        <div className="min-w-0 flex-1">
                          <span className="font-bold text-xs block truncate">{inst.name}</span>
                          <span className="text-[10px] text-[var(--text-muted)] font-mono block">
                            {inst.type} &bull; {inst.code}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            {/* Environment Switcher */}
            <button
              onClick={handleToggleEnvironment}
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[11px] font-mono font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  environment === "Production" ? "bg-emerald-500" : "bg-blue-500",
                )}
              />
              <span>{environment}</span>
            </button>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Live Currency Converter Header Action */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setConverterModalOpen(true)}
              className="hidden md:inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl text-amber-500 border border-amber-500/20 hover:bg-amber-500/10 cursor-pointer"
            >
              <Coins className="size-3.5 text-amber-500" />
              <span>FX Converter</span>
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications Bell */}
            <Link
              to="/notifications"
              className="relative p-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[var(--accent-gold)] ring-2 ring-[var(--bg-surface)]" />
            </Link>

            <div className="hidden h-6 w-px bg-[var(--border-default)] sm:block" />

            {/* Operator Badge */}
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-xl bg-[var(--accent-gold-subtle)] border border-[var(--accent-gold-border)] text-xs font-extrabold text-[var(--accent-gold-text)] dark:text-[var(--accent-gold)] select-none shadow-xs">
                RA
              </span>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-extrabold text-[var(--text-primary)] leading-tight">
                  Risk Analyst
                </p>
                <p className="text-[10px] text-[var(--accent-emerald)] font-mono font-bold">
                  Partner Bank Ghana
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 mx-auto w-full max-w-[1600px] p-5 sm:p-7">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
