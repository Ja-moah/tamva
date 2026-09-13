import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  Bell,
  BriefcaseBusiness,
  ChevronDown,
  CircleGauge,
  Menu,
  Network,
  Settings,
  ShieldCheck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { cn } from "../../lib/utils/cn";
import { Button } from "../ui/button";

const navigation = [
  { label: "Overview", to: "/", icon: CircleGauge },
  { label: "Risk events", to: "/risk-events", icon: Activity },
  { label: "Cases", to: "/cases", icon: BriefcaseBusiness },
  { label: "Customers", to: "/customers", icon: Users },
  { label: "Trust network", to: "/network", icon: Network },
] as const;

export function AppShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <div className="min-h-screen bg-ink text-slate-100">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 -translate-x-full flex-col border-r border-white/8 bg-ink/95 p-5 backdrop-blur-xl transition-transform lg:translate-x-0",
          menuOpen && "translate-x-0",
        )}
      >
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3" onClick={() => setMenuOpen(false)}>
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-300 text-emerald-950">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-lg font-black tracking-[0.18em]">TAMVA</span>
              <span className="block text-xs text-slate-500">Admin &amp; operations</span>
            </span>
          </Link>
          <button
            className="rounded-lg p-2 text-slate-400 hover:bg-white/5 lg:hidden"
            onClick={() => setMenuOpen(false)}
            aria-label="Close navigation"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="mt-10 space-y-1" aria-label="Primary navigation">
          {navigation.map(({ icon: Icon, label, to }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link
                key={to}
                to={to}
                onClick={() => setMenuOpen(false)}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white",
                  active && "bg-emerald-300/10 text-emerald-200",
                )}
              >
                <Icon className="size-[18px]" strokeWidth={1.8} aria-hidden="true" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-1 border-t border-white/8 pt-5">
          <button className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white">
            <Settings className="size-[18px]" aria-hidden="true" />
            Settings
          </button>
          <div className="mt-4 rounded-xl border border-white/8 bg-white/[0.03] p-3">
            <p className="text-xs font-semibold text-slate-300">Django admin is separate</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              This portal is for authorized TAMVA and institution teams. Capabilities are controlled by backend roles and scopes.
            </p>
          </div>
        </div>
      </aside>

      {menuOpen ? (
        <button
          className="fixed inset-0 z-30 bg-black/60 lg:hidden"
          onClick={() => setMenuOpen(false)}
          aria-label="Close navigation overlay"
        />
      ) : null}

      <div className="lg:pl-72">
        <header className="sticky top-0 z-20 flex h-18 items-center border-b border-white/8 bg-ink/80 px-4 backdrop-blur-xl sm:px-7">
          <button
            className="mr-3 rounded-lg p-2 text-slate-300 hover:bg-white/5 lg:hidden"
            onClick={() => setMenuOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>
          <div className="min-w-0">
            <p className="truncate text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
              Active scope
            </p>
            <button className="flex items-center gap-1.5 text-sm font-semibold text-slate-200">
              Scope not selected <ChevronDown className="size-4" aria-hidden="true" />
            </button>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="ghost" className="size-10 px-0" aria-label="Notifications">
              <Bell className="size-5" />
            </Button>
            <div className="hidden h-8 w-px bg-white/10 sm:block" />
            <div className="hidden items-center gap-3 sm:flex">
              <span className="grid size-9 place-items-center rounded-full bg-cyan-300/15 text-sm font-bold text-cyan-200">
                JM
              </span>
              <span className="text-sm font-semibold">Signed-out preview</span>
            </div>
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1500px] p-4 sm:p-7 lg:p-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
