import { Link } from "@tanstack/react-router";
import { ArrowRight, Fingerprint, Landmark, ShieldCheck, UserRound } from "lucide-react";

import { useSystemHealth } from "../features/system/use-system-health";

const capabilities = [
  {
    to: "/activity",
    title: "Financial activity",
    description: "Review connected financial activity when ledger APIs become available.",
    icon: Landmark,
  },
  {
    to: "/profile",
    title: "Financial profile",
    description: "See the profile calculated by TAMVA's authoritative backend.",
    icon: UserRound,
  },
  {
    to: "/consent",
    title: "Consent",
    description: "Understand and control approved data access and its purpose.",
    icon: Fingerprint,
  },
  {
    to: "/protection",
    title: "Protection",
    description: "Review backend-issued protection signals and security guidance.",
    icon: ShieldCheck,
  },
] as const;

export function HomePage() {
  const health = useSystemHealth();
  const connected = health.data?.status === "ok" && health.data.database === "ok";

  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2rem] bg-emerald-950 px-6 py-9 text-white shadow-2xl shadow-emerald-950/10 sm:px-10 sm:py-12 lg:grid lg:grid-cols-[1.35fr_0.65fr] lg:items-end lg:gap-12">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Customer workspace</p>
          <h1 className="mt-4 max-w-3xl text-3xl font-black tracking-tight sm:text-5xl">
            Your financial identity, visible and under your control.
          </h1>
          <p className="mt-5 max-w-2xl text-sm leading-6 text-emerald-50/75 sm:text-base">
            TAMVA brings consent, financial activity, profile, passport, and protection into one responsive customer experience.
          </p>
        </div>
        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 lg:mt-0">
          <div className="flex items-center gap-3">
            <span
              className={`size-2.5 rounded-full ${health.isPending ? "bg-amber-300" : connected ? "bg-emerald-300" : "bg-rose-300"}`}
              aria-hidden="true"
            />
            <p className="text-sm font-bold">
              {health.isPending ? "Checking connection" : connected ? "Connected to TAMVA" : "Backend unavailable"}
            </p>
          </div>
          <p className="mt-2 text-xs leading-5 text-emerald-50/60">
            Customer data is shown only after backend identity, authorization, tenancy, and consent checks.
          </p>
        </div>
      </section>

      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Your TAMVA</p>
            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Customer capabilities</h2>
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {capabilities.map(({ to, title, description, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-xl hover:shadow-emerald-950/5"
            >
              <span className="grid size-11 place-items-center rounded-2xl bg-emerald-50 text-emerald-900">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-bold text-slate-950">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
              <span className="mt-5 flex items-center gap-2 text-sm font-bold text-emerald-800">
                Open <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden="true" />
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
