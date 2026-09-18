import { Link } from "@tanstack/react-router";
import { Activity, ArrowUpRight, Database, RadioTower, ShieldCheck } from "lucide-react";

import { StatusBadge } from "../components/feedback/status-badge";
import { ModuleTable } from "../components/tables/module-table";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useSystemHealth } from "../features/system/use-system-health";

export function OverviewPage() {
  const health = useSystemHealth();
  const connected = health.data?.status === "ok" && health.data.database === "ok";

  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-emerald-300">Operational overview</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Trust infrastructure at a glance
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">
            The portal is connected to TAMVA's Django API. Product data appears only when its
            owning backend domain publishes an authorized contract.
          </p>
        </div>
        <Button asChild variant="secondary">
          <a href="/api/docs/" target="_blank" rel="noreferrer">
            Open API docs <ArrowUpRight className="size-4" aria-hidden="true" />
          </a>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="relative overflow-hidden p-5">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent" />
          <div className="flex items-start justify-between">
            <span className="grid size-10 place-items-center rounded-xl bg-emerald-300/10 text-emerald-300">
              <RadioTower className="size-5" aria-hidden="true" />
            </span>
            {health.isPending ? <StatusBadge>Checking</StatusBadge> : null}
            {connected ? <StatusBadge tone="success">Connected</StatusBadge> : null}
            {health.isError ? <StatusBadge tone="warning">Unavailable</StatusBadge> : null}
          </div>
          <p className="mt-7 text-sm text-slate-500">Django API</p>
          <p className="mt-1 text-xl font-bold text-white">{connected ? "Operational" : "Connection check"}</p>
          <p className="mt-2 text-sm text-slate-400">Live response from `/health/`</p>
        </Card>

        <Card className="p-5">
          <span className="grid size-10 place-items-center rounded-xl bg-cyan-300/10 text-cyan-300">
            <Database className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-7 text-sm text-slate-500">System of record</p>
          <p className="mt-1 text-xl font-bold text-white">
            {connected ? "PostgreSQL available" : "Awaiting backend"}
          </p>
          <p className="mt-2 text-sm text-slate-400">Verified through the backend, never queried by clients</p>
        </Card>

        <Card className="p-5">
          <span className="grid size-10 place-items-center rounded-xl bg-violet-300/10 text-violet-300">
            <ShieldCheck className="size-5" aria-hidden="true" />
          </span>
          <p className="mt-7 text-sm text-slate-500">Access boundary</p>
          <p className="mt-1 text-xl font-bold text-white">Default deny</p>
          <p className="mt-2 text-sm text-slate-400">Institution membership and tenant enforcement stay in Django</p>
        </Card>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.75fr]">
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
            <div>
              <h2 className="font-bold text-white">Backend domain readiness</h2>
              <p className="mt-1 text-sm text-slate-500">Contract availability, not simulated business data</p>
            </div>
            <Activity className="size-5 text-slate-500" aria-hidden="true" />
          </div>
          <ModuleTable />
        </Card>

        <Card className="p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Next integration</p>
          <h2 className="mt-3 text-xl font-bold text-white">Identity and tenant session</h2>
          <p className="mt-3 text-sm leading-6 text-slate-400">
            Authentication, active institution, roles, and permissions must arrive from one backend session contract before operational screens become active.
          </p>
          <div className="mt-6 rounded-xl border border-dashed border-white/10 p-4">
            <p className="text-sm font-semibold text-slate-200">No partner access through Django Admin</p>
            <p className="mt-2 text-sm leading-6 text-slate-500">`/admin/` remains a restricted platform engineering tool.</p>
          </div>
          <Button asChild variant="ghost" className="mt-4 px-0 text-emerald-300">
            <Link to="/customers">
              View client boundary <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
