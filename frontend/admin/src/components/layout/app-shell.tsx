import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  CircleGauge,
  Clock,
  ExternalLink,
  Menu,
  Network,
  Radio,
  Search,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

import { useSystemHealth } from "../../features/system/use-system-health";
import { cn } from "../../lib/utils/cn";
import { StatusBadge } from "../feedback/status-badge";
import { CommandMenu } from "../navigation/command-menu";
import { Button } from "../ui/button";
import { useToast } from "../ui/toast";

const navigation = [
  { label: "Overview", to: "/", icon: CircleGauge, count: null, shortcut: "⌘1" },
  { label: "Risk Events", to: "/risk-events", icon: Activity, count: "12", shortcut: "⌘2" },
  { label: "Cases", to: "/cases", icon: BriefcaseBusiness, count: "3", shortcut: "⌘3" },
  { label: "Customers", to: "/customers", icon: Users, count: null, shortcut: "⌘4" },
  { label: "Trust Network", to: "/network", icon: Network, count: "Live", shortcut: "⌘5" },
] as const;

const institutions = [
  { id: "all", name: "Global Platform Scope", type: "System-wide", code: "TAMVA-ROOT", icon: "🌐" },
  { id: "inst-1", name: "Apex Bank PLC", type: "Tier 1 Commercial", code: "APEX-GH", icon: "🏦" },
  { id: "inst-2", name: "Zenith Digital Trust", type: "FinTech Rail", code: "ZNTH-AF", icon: "⚡" },
  { id: "inst-3", name: "Ecobank Payment Gateway", type: "Regional Hub", code: "ECO-REG", icon: "🌍" },
];

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [tenantOpen, setTenantOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState(institutions[0]);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [timeString, setTimeString] = useState("");
  const [notifications, setNotifications] = useState([
    {
      id: "notif-1",
      title: "Velocity Spike Flagged",
      desc: "High transaction velocity detected on Apex Bank Rail (Accra West).",
      time: "2m ago",
      tone: "warning" as const,
      read: false,
    },
    {
      id: "notif-2",
      title: "Transactional Outbox Synced",
      desc: "1,420 identity audit events committed to PostgreSQL 17 system of record.",
      time: "8m ago",
      tone: "success" as const,
      read: false,
    },
    {
      id: "notif-3",
      title: "GhIPSS Bridge Heartbeat",
      desc: "Instant Pay settlement channel latency stabilized at 19ms.",
      time: "15m ago",
      tone: "info" as const,
      read: true,
    },
  ]);

  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const navigate = useNavigate();
  const health = useSystemHealth();
  const { toast } = useToast();

  const isConnected = health.data?.status === "ok" && health.data.database === "ok";

  // Live UTC Clock for financial audit compliance (HCI Principle)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toUTCString().slice(17, 25) + " UTC · " + now.toISOString().slice(0, 10),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keyboard shortcut handler for high-velocity power users (HCI Principle)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        if (e.key === "1") {
          e.preventDefault();
          navigate({ to: "/" });
        } else if (e.key === "2") {
          e.preventDefault();
          navigate({ to: "/risk-events" });
        } else if (e.key === "3") {
          e.preventDefault();
          navigate({ to: "/cases" });
        } else if (e.key === "4") {
          e.preventDefault();
          navigate({ to: "/customers" });
        } else if (e.key === "5") {
          e.preventDefault();
          navigate({ to: "/network" });
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  const handleSelectTenant = (inst: typeof institutions[0]) => {
    setSelectedTenant(inst);
    setTenantOpen(false);
    toast({
      title: "Operational Rail Switched",
      description: `Active scope updated to: ${inst.name} (${inst.code})`,
      type: "info",
    });
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    toast({
      title: "Notifications Cleared",
      description: "All pending system notifications marked as reviewed.",
      type: "success",
    });
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="min-h-screen bg-[#070709] text-[#F8F9FC] relative selection:bg-[#D4A017] selection:text-black">
      {/* Ambient background mesh glow */}
      <div aria-hidden="true" className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="mesh-blob mesh-blob-gold absolute -top-[20%] left-[-10%] opacity-20" />
        <div className="mesh-blob mesh-blob-green absolute top-[30%] -right-[15%] opacity-15" />
        <div className="mesh-blob mesh-blob-cyan absolute -bottom-[20%] left-[25%] opacity-10" />
      </div>

      <CommandMenu open={commandOpen} onClose={() => setCommandOpen(false)} />

      {/* Sidebar navigation */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col border-r border-white/[0.08] bg-[#0C0B0F]/95 p-5 backdrop-blur-3xl transition-transform duration-300 ease-in-out lg:translate-x-0 shadow-[4px_0_30px_rgba(0,0,0,0.5)]",
          menuOpen && "translate-x-0",
        )}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between pb-6 border-b border-white/[0.06]">
          <Link
            to="/"
            className="flex items-center gap-3.5 group"
            onClick={() => setMenuOpen(false)}
          >
            <div className="relative">
              <span className="grid size-11 place-items-center rounded-2xl bg-gradient-to-br from-[#D4A017] via-[#FCD116] to-[#A37B10] text-[#0A0A0B] shadow-[0_8px_24px_rgba(212,160,23,0.4)] group-hover:scale-105 transition-transform duration-200">
                <ShieldCheck className="size-6 stroke-[2.3]" aria-hidden="true" />
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-[#00C97A] ring-2 ring-[#0C0B0F]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-extrabold tracking-[0.14em] text-white">TAMVA</span>
                <span className="rounded-md border border-[#D4A017]/40 bg-[#D4A017]/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#FCD116] uppercase">
                  PRO
                </span>
              </div>
              <span className="block text-[11px] font-medium text-white/45 tracking-wider uppercase">
                Trust &amp; Risk Platform
              </span>
            </div>
          </Link>
          <button
            className="rounded-xl p-2 text-white/40 hover:bg-white/[0.06] hover:text-white lg:hidden"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Quick Command / Search trigger */}
        <div className="mt-5">
          <button
            onClick={() => setCommandOpen(true)}
            className="w-full flex items-center justify-between gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2.5 text-xs text-white/50 hover:border-white/20 hover:bg-white/[0.06] hover:text-white transition-all group"
          >
            <span className="flex items-center gap-2">
              <Search className="size-3.5 text-[#D4A017]" />
              <span>Search routes &amp; entities...</span>
            </span>
            <kbd className="rounded border border-white/10 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-white/50 group-hover:text-white">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Navigation list */}
        <nav className="mt-6 space-y-1.5" aria-label="Primary navigation">
          <p className="px-3 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-white/30">
            Operations Console
          </p>
          {navigation.map(({ icon: Icon, label, to, count, shortcut }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "relative flex min-h-11 items-center justify-between rounded-xl px-3.5 text-xs font-semibold uppercase tracking-[0.14em] transition-all duration-200 group select-none",
                  active
                    ? "bg-gradient-to-r from-[#D4A017]/15 to-transparent text-[#FCD116] border-l-2 border-[#D4A017] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.06)]"
                    : "text-white/60 hover:bg-white/[0.04] hover:text-white",
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "size-[18px] transition-colors",
                      active ? "text-[#D4A017]" : "text-white/40 group-hover:text-white/80",
                    )}
                    strokeWidth={1.9}
                    aria-hidden="true"
                  />
                  <span>{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {count ? (
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 font-mono text-[10px] font-bold",
                        active
                          ? "bg-[#D4A017]/25 text-[#FCD116]"
                          : "bg-white/[0.06] text-white/40 group-hover:text-white/70",
                      )}
                    >
                      {count}
                    </span>
                  ) : null}
                  <span className="hidden font-mono text-[10px] text-white/20 group-hover:inline-block">
                    {shortcut}
                  </span>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Footer Area with System Status Card */}
        <div className="mt-auto space-y-3 pt-5 border-t border-white/[0.06]">
          {/* Live System Beacon Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#141419]/90 p-3.5 backdrop-blur-md shadow-inner">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-semibold text-white/90">
                <Radio className="size-3.5 text-[#D4A017] animate-pulse" />
                Backend Engine
              </span>
              <StatusBadge
                tone={isConnected ? "success" : "warning"}
                pulse={isConnected}
                size="sm"
              >
                {isConnected ? "Healthy (12ms)" : "Connecting"}
              </StatusBadge>
            </div>
            <div className="mt-2.5 flex items-center justify-between text-[11px] text-white/40 font-mono">
              <span>PG 17 · Redis Outbox</span>
              <span className="text-[#00C97A]">● Sync active</span>
            </div>
          </div>

          <a
            href="/api/docs/"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-medium text-white/50 hover:bg-white/[0.05] hover:text-white transition-colors group"
          >
            <span className="flex items-center gap-2.5">
              <ExternalLink className="size-4 text-[#D4A017] group-hover:scale-110 transition-transform" />
              OpenAPI Swagger
            </span>
            <span className="font-mono text-[10px] text-white/30">/api/docs/</span>
          </a>
        </div>
      </aside>

      {/* Overlay for mobile menu */}
      {menuOpen ? (
        <button
          className="fixed inset-0 z-30 bg-black/80 backdrop-blur-sm lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation overlay"
        />
      ) : null}

      {/* Main Content Area */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-white/[0.08] bg-[#070709]/85 px-4 backdrop-blur-2xl sm:px-8">
          <div className="flex items-center gap-4">
            <button
              className="rounded-xl p-2.5 text-white/70 hover:bg-white/[0.06] hover:text-white lg:hidden"
              onClick={() => setMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="size-5" />
            </button>

            {/* Institution / Scope Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setTenantOpen(!tenantOpen)}
                className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-left hover:border-white/20 hover:bg-white/[0.06] transition-all shadow-sm group"
              >
                <span className="text-base">{selectedTenant.icon}</span>
                <div className="min-w-0">
                  <p className="text-[10px] font-mono uppercase tracking-widest text-white/40 group-hover:text-[#D4A017] transition-colors">
                    Active Rail Scope
                  </p>
                  <p className="text-xs font-bold text-white truncate max-w-[160px] sm:max-w-xs">
                    {selectedTenant.name}
                  </p>
                </div>
                <ChevronDown className="size-3.5 text-white/40 ml-1 group-hover:text-white transition-colors" />
              </button>

              {tenantOpen ? (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setTenantOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute left-0 mt-2 z-30 w-80 rounded-2xl border border-white/10 bg-[#121217] p-2.5 shadow-[0_24px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl animate-in fade-in zoom-in-95">
                    <p className="px-3 py-2 text-[10px] font-mono font-semibold uppercase tracking-widest text-white/40 border-b border-white/[0.06] mb-1">
                      Switch Institution Settlement Rail
                    </p>
                    {institutions.map((inst) => (
                      <button
                        key={inst.id}
                        onClick={() => handleSelectTenant(inst)}
                        className={cn(
                          "w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-3 transition-colors my-0.5",
                          selectedTenant.id === inst.id
                            ? "bg-[#D4A017]/15 text-[#FCD116] border border-[#D4A017]/30 font-semibold"
                            : "text-white/70 hover:bg-white/[0.05] hover:text-white",
                        )}
                      >
                        <span className="text-base">{inst.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold truncate">{inst.name}</p>
                          <p className="text-[10px] text-white/40 font-mono">
                            {inst.type} · {inst.code}
                          </p>
                        </div>
                        {selectedTenant.id === inst.id && (
                          <CheckCircle2 className="size-4 text-[#D4A017]" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              ) : null}
            </div>

            {/* Live Financial Audit UTC Clock (HCI Compliance) */}
            <div className="hidden xl:flex items-center gap-2 rounded-xl border border-white/[0.06] bg-white/[0.02] px-3.5 py-2 text-[11px] font-mono text-white/60">
              <Clock className="size-3.5 text-[#00C97A]" />
              <span className="font-tabular">{timeString || "SYNCHRONIZING..."}</span>
            </div>
          </div>

          {/* Right Header Utilities */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Quick Search Shortcut */}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setCommandOpen(true)}
              className="hidden md:inline-flex gap-2"
            >
              <Search className="size-3.5 text-[#D4A017]" />
              <span>Search</span>
              <kbd className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[9px] text-white/60">
                ⌘K
              </kbd>
            </Button>

            {/* Notifications Bell with Dropdown */}
            <div className="relative">
              <Button
                variant="secondary"
                size="icon"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                aria-label="Notifications"
                className="relative"
              >
                <Bell className="size-4 text-white/80" />
                {unreadCount > 0 && (
                  <span className="absolute top-2 right-2 size-2 rounded-full bg-[#D4A017] ring-2 ring-[#070709]" />
                )}
              </Button>

              {notificationsOpen ? (
                <>
                  <div
                    className="fixed inset-0 z-20"
                    onClick={() => setNotificationsOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="absolute right-0 mt-2 z-30 w-88 rounded-2xl border border-white/10 bg-[#121217] p-3 shadow-[0_24px_50px_rgba(0,0,0,0.85)] backdrop-blur-2xl animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.06] px-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">System Alerts</span>
                        {unreadCount > 0 && (
                          <span className="rounded-full bg-[#D4A017]/20 px-2 py-0.5 font-mono text-[10px] font-bold text-[#FCD116]">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[11px] text-white/40 hover:text-white transition-colors"
                      >
                        Mark all read
                      </button>
                    </div>
                    <div className="mt-2.5 space-y-2 max-h-80 overflow-y-auto pr-1">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={cn(
                            "p-3 rounded-xl border transition-colors",
                            notif.read
                              ? "bg-white/[0.02] border-white/[0.03] opacity-60"
                              : "bg-white/[0.05] border-white/[0.08]",
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <p
                              className={cn(
                                "text-xs font-semibold",
                                notif.tone === "warning" && "text-[#FCD116]",
                                notif.tone === "success" && "text-[#00C97A]",
                                notif.tone === "info" && "text-[#06B6D4]",
                              )}
                            >
                              {notif.title}
                            </p>
                            <span className="font-mono text-[10px] text-white/40">
                              {notif.time}
                            </span>
                          </div>
                          <p className="text-[11px] text-white/70 mt-1 leading-relaxed">
                            {notif.desc}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>

            <div className="hidden h-6 w-px bg-white/10 sm:block" />

            {/* Operator Profile with Real High-Resolution Portrait */}
            <div className="flex items-center gap-3 pl-1">
              <div className="relative">
                <img
                  src="/assets/avatar-operator.jpg"
                  alt="Ama Boateng"
                  className="size-10 rounded-2xl object-cover border border-[#D4A017]/40 shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                />
                <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-[#00C97A] ring-2 ring-[#070709]" />
              </div>
              <div className="hidden xl:block text-left">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-white leading-tight">Ama Boateng</p>
                  <span className="rounded bg-[#D4A017]/20 px-1 py-0.2 font-mono text-[9px] font-bold text-[#FCD116]">
                    LVL 3
                  </span>
                </div>
                <p className="text-[10px] text-white/50 font-mono">Lead AML Compliance</p>
              </div>
            </div>
          </div>
        </header>

        {/* Viewport Content */}
        <main className="flex-1 mx-auto w-full max-w-[1560px] p-4 sm:p-7 lg:p-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
