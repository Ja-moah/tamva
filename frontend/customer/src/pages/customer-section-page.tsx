import type { LucideIcon } from "lucide-react";

interface CustomerSectionPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function CustomerSectionPage({ title, description, icon: Icon }: CustomerSectionPageProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
      <span className="grid size-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-900">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <p className="mt-7 text-xs font-bold uppercase tracking-[0.16em] text-emerald-800">Customer area</p>
      <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">{title}</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600">{description}</p>
      <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        This surface is ready for its backend API. No customer records or business decisions are generated in the browser.
      </div>
    </section>
  );
}
