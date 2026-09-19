import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BarChart3,
  Bell,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  CircleGauge,
  Cpu,
  LogOut,
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
import { useEffect, useState } from "react";

import { useUnreadNotificationCount } from "../../features/notifications/use-notifications";
import { useSession } from "../../features/session/use-session";
import { useSystemHealth } from "../../features/system/use-system-health";
import { ThemeToggle } from "../../lib/theme";
import { cn } from "../../lib/utils/cn";
import { TamvaMark } from "../brand/tamva-logo";
import { NetworkStatusBanner } from "../feedback/network-status-banner";
import { StatusBadge } from "../feedback/status-badge";
import { CommandMenu } from "../navigation/command-menu";
import { AdinkraWatermark } from "../ui/adinkra-pattern";
import { useToast } from "../ui/toast";

/** `permission` only decides whether the link is shown; every API call is re-checked server-side. */
const operationsNav = [
  { label: "Overview", to: "/", icon: CircleGauge, permission: "overview:read" },
  { label: "Risk Events", to: "/risk-events", icon: Activity, permission: "risk:read" },
  { label: "Cases", to: "/cases", icon: BriefcaseBusiness, permission: "case:read" },
  { label: "Customers", to: "/customers", icon: Users, permission: "customer:read" },
  { label: "Trust Network", to: "/network", icon: Network, permission: "network:read" },
  { label: "Analytics & Insights", to: "/analytics", icon: BarChart3, permission: "analytics:read" },
] as const;

const governanceNav = [
  { label: "Team & Access", to: "/team", icon: UserCheck, permission: "team:read" },
  { label: "Security & Governance", to: "/security", icon: ShieldCheck, permission: "security:read" },
  { label: "Alerts & Notifications", to: "/notifications", icon: Bell, permission: null },
  { label: "Settings", to: "/settings", icon: Settings, permission: null },
] as const;

const developerNav = [
  { label: "API & Integrations", to: "/integrations", icon: Cpu, permission: "partner:read" },
] as const;

type NavItem = { label: string; to: string; icon: typeof CircleGauge; permission: string | null };

const initials = (value: string) =>
  value
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [tenantOpen, setTenantOpen] = useState(false);

  const session = useSession();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const health = useSystemHealth();
  const unread = useUnreadNotificationCount();
  const { toast } = useToast();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const environment = session.version?.environment ?? null;
  const isConnected = health.data?.status === "ok" && health.data.database === "ok";
  const visible = (items: readonly NavItem[]) =>
    items.filter((item) => item.permission === null || session.can(item.permission));

  const handleSelectTenant = (institutionId: string, name: string) => {
    setTenantOpen(false);
    if (institutionId === session.institutionId) return;
    session.selectInstitution(institutionId);
    toast({ title: "Institution changed", description: `Now working in ${name}.`, type: "info" });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-canvas)] text-[var(--text-primary)] relative selection:bg-[var(--accent-gold)] selection:text-black text-sm">
      {/* Real-time Network Status Banner with Offline Loading Indicator */}
      <NetworkStatusBanner />

      {/* Precision Vector Watermark */}
      <AdinkraWatermark />

      {/* Global Command Palette */}
      <CommandMenu open={commandOpen} onClose={() => setCommandOpen(false)} />

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
            <TamvaMark className="size-10" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
                  TAMVA
                </span>
                {environment ? (
                  <span className="rounded-md border border-[var(--accent-gold-border)] bg-[var(--accent-gold-subtle)] px-1.5 py-0.2 font-mono text-[10px] font-bold uppercase text-[var(--accent-gold-text)] dark:text-[var(--accent-gold)]">
                    {environment}
                  </span>
                ) : null}
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
              <span className="font-semibold text-xs">Go to…</span>
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
          {visible(operationsNav).map(({ icon: Icon, label, to }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "relative flex min-h-10 items-center justify-between rounded-xl px-3 py-1.5 text-xs font-bold transition-all group",
                  active
                    ? "bg-[var(--brand-primary)] text-[var(--brand-on-primary)] shadow-xs scale-[1.01]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]",
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={cn(
                      "size-4 shrink-0 transition-transform group-hover:scale-105",
                      active
                        ? "text-[var(--brand-on-primary)]"
                        : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]",
                    )}
                  />
                  <span>{label}</span>
                </div>
              </Link>
            );
          })}

          {/* Governance & Administration */}
          <div className="pt-3 mt-3 border-t border-[var(--border-subtle)]">
            <p className="px-3 py-1 font-mono text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
              Governance &amp; Access
            </p>
            {visible(governanceNav).map(({ icon: Icon, label, to }) => {
              const active = pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "relative flex min-h-10 items-center justify-between rounded-xl px-3 py-1.5 text-xs font-bold transition-all group",
                    active
                      ? "bg-[var(--brand-primary)] text-[var(--brand-on-primary)] shadow-xs scale-[1.01]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-transform group-hover:scale-105",
                        active
                          ? "text-[var(--brand-on-primary)]"
                          : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]",
                      )}
                    />
                    <span>{label}</span>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Developer & Integration */}
          <div className="pt-3 mt-3 border-t border-[var(--border-subtle)]">
            <p className="px-3 py-1 font-mono text-[11px] font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
              Developer &amp; Contracts
            </p>
            {visible(developerNav).map(({ icon: Icon, label, to }) => {
              const active = pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "relative flex min-h-10 items-center justify-between rounded-xl px-3 py-1.5 text-xs font-bold transition-all group",
                    active
                      ? "bg-[var(--brand-primary)] text-[var(--brand-on-primary)] shadow-xs scale-[1.01]"
                      : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]",
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={cn(
                        "size-4 shrink-0 transition-transform group-hover:scale-105",
                        active
                          ? "text-[var(--brand-on-primary)]"
                          : "text-[var(--text-muted)] group-hover:text-[var(--text-primary)]",
                      )}
                    />
                    <span>{label}</span>
                  </div>
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
                <Radio className={cn("size-3.5", isConnected ? "text-[var(--accent-emerald)] animate-pulse" : "text-[var(--text-muted)]")} aria-hidden />
                Backend Node
              </span>
              <StatusBadge
                tone={isConnected ? "success" : health.isError ? "danger" : "warning"}
                pulse={isConnected}
                size="sm"
              >
                {isConnected ? "Healthy" : health.isError ? "Unreachable" : "Checking"}
              </StatusBadge>
            </div>
            <p className="mt-1 text-[11px] text-[var(--text-muted)] font-mono font-medium">
              {session.version
                ? `API ${session.version.api_version} · app ${session.version.application_version}`
                : "Version unavailable"}
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

            {/* Institution switcher: memberships come from the backend (/me/). */}
            <div className="relative">
              {session.memberships.length > 1 ? (
                <button
                  onClick={() => setTenantOpen(!tenantOpen)}
                  aria-haspopup="listbox"
                  aria-expanded={tenantOpen}
                  className="flex items-center gap-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] px-3 py-1.5 text-left hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer shadow-xs"
                >
                  <Building2 className="size-4 text-[var(--accent-gold)] shrink-0" aria-hidden />
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[140px] sm:max-w-xs">
                    {session.institutionName}
                  </p>
                  <ChevronDown className="size-3.5 text-[var(--text-muted)] ml-0.5 shrink-0" aria-hidden />
                </button>
              ) : (
                <div className="flex items-center gap-2.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] px-3 py-1.5">
                  <Building2 className="size-4 text-[var(--accent-gold)] shrink-0" aria-hidden />
                  <p className="text-xs font-bold text-[var(--text-primary)] truncate max-w-[140px] sm:max-w-xs">
                    {session.institutionName}
                  </p>
                </div>
              )}

              {tenantOpen ? (
                <>
                  <div className="fixed inset-0 z-20" onClick={() => setTenantOpen(false)} aria-hidden="true" />
                  <div
                    role="listbox"
                    aria-label="Switch institution"
                    className="absolute left-0 mt-2 z-30 w-80 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-2 shadow-xl animate-in fade-in zoom-in-98 ios-glass max-h-[80vh] overflow-y-auto"
                  >
                    <p className="px-3 py-1.5 text-[10px] font-mono font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
                      Your institutions
                    </p>
                    {session.memberships.map((membership) => (
                      <button
                        key={membership.institution_id}
                        role="option"
                        aria-selected={membership.institution_id === session.institutionId}
                        onClick={() => handleSelectTenant(membership.institution_id, membership.institution_name)}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer",
                          membership.institution_id === session.institutionId
                            ? "bg-[var(--accent-gold-subtle)] text-[var(--accent-gold-text)] dark:text-[var(--accent-gold)] font-bold border border-[var(--accent-gold-border)]"
                            : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] font-medium",
                        )}
                      >
                        {membership.institution_name}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            {/* Environment: reported by the backend, never toggled locally. */}
            {environment ? (
              <span
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[11px] font-mono font-bold uppercase text-[var(--text-secondary)]"
                title={`API ${session.version?.api_version} · app ${session.version?.application_version}`}
              >
                <span
                  className={cn(
                    "size-2 rounded-full",
                    environment === "production" ? "bg-emerald-500" : "bg-blue-500",
                  )}
                  aria-hidden
                />
                {environment}
              </span>
            ) : null}
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notifications Bell */}
            <Link
              to="/notifications"
              className="relative p-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
            >
              <Bell className="size-4" />
              {unread > 0 ? (
                <span
                  className="absolute top-1.5 right-1.5 size-2 rounded-full bg-[var(--accent-gold)] ring-2 ring-[var(--bg-surface)]"
                  aria-hidden
                />
              ) : null}
            </Link>

            <div className="hidden h-6 w-px bg-[var(--border-default)] sm:block" />

            {/* Operator: the signed-in user and their roles, from /me/. */}
            <div className="flex items-center gap-2">
              <span
                className="grid size-8 place-items-center rounded-xl bg-[var(--accent-gold-subtle)] border border-[var(--accent-gold-border)] text-xs font-extrabold text-[var(--accent-gold-text)] dark:text-[var(--accent-gold)] select-none shadow-xs"
                aria-hidden
              >
                {initials(session.actor?.user.email ?? "?")}
              </span>
              <div className="hidden xl:block text-left">
                <p className="text-xs font-extrabold text-[var(--text-primary)] leading-tight max-w-[160px] truncate">
                  {session.actor?.user.email}
                </p>
                <p className="text-[10px] text-[var(--accent-emerald)] font-mono font-bold max-w-[160px] truncate">
                  {session.actor?.roles.join(", ") || "No role assigned"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void session.logout()}
                className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
                aria-label="Sign out"
              >
                <LogOut className="size-4" aria-hidden />
              </button>
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
