import type { LucideIcon } from "lucide-react";

import { Card } from "../components/ui/card";
import { StatusBadge } from "../components/feedback/status-badge";

type DomainPageProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export function DomainPage({ title, description, icon: Icon }: DomainPageProps) {
  return (
    <div className="space-y-7">
      <div>
        <StatusBadge>API pending</StatusBadge>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">{description}</p>
      </div>
      <Card className="grid min-h-[360px] place-items-center p-8 text-center">
        <div className="max-w-md">
          <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-white/8 bg-white/[0.04] text-slate-400">
            <Icon className="size-6" aria-hidden="true" />
          </span>
          <h2 className="mt-5 text-lg font-bold text-white">Waiting for the authoritative contract</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            This client will not invent domain rules or placeholder financial records. The screen will activate when Django exposes its reviewed `/api/v1/` endpoint.
          </p>
        </div>
      </Card>
    </div>
  );
}
