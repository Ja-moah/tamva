import { Link, Outlet } from "@tanstack/react-router";
import { Bell, CircleUserRound, Home, Landmark, ShieldCheck } from "lucide-react";

const navigation = [
  { to: "/", label: "Home", icon: Home },
  { to: "/activity", label: "Activity", icon: Landmark },
  { to: "/passport", label: "Passport", icon: CircleUserRound },
  { to: "/protection", label: "Protection", icon: ShieldCheck },
] as const;

export function CustomerShell() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2" aria-label="TAMVA customer home">
            <span className="grid size-9 place-items-center rounded-xl bg-emerald-950 text-sm font-black text-emerald-200">
              T
            </span>
            <span className="font-bold tracking-tight text-slate-950">TAMVA</span>
          </Link>

          <nav className="ml-6 hidden items-center gap-1 md:flex" aria-label="Primary navigation">
            {navigation.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                activeProps={{ className: "bg-emerald-50 text-emerald-900" }}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/notifications"
              className="grid size-10 place-items-center rounded-full text-slate-600 transition hover:bg-slate-100"
              aria-label="Notifications"
            >
              <Bell className="size-5" aria-hidden="true" />
            </Link>
            <Link
              to="/settings"
              className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 sm:block"
            >
              Settings
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-24 sm:px-6 sm:py-10 lg:px-8">
        <Outlet />
      </main>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-4 border-t border-slate-200 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur md:hidden"
        aria-label="Mobile navigation"
      >
        {navigation.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex flex-col items-center gap-1 rounded-xl py-1.5 text-[0.7rem] font-semibold text-slate-500"
            activeProps={{ className: "text-emerald-900" }}
          >
            <Icon className="size-5" aria-hidden="true" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
