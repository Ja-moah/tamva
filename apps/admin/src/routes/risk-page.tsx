import type { RiskEvent } from "@tamva/client-contracts";
import { useState } from "react";

import { DataTable, Pagination, type DataColumn } from "../components/data/data-table";
import { FilterBar } from "../components/data/filter-bar";
import { PageHeader } from "../components/data/page";
import { EmptyState, ErrorState, LoadingState, QueryBoundary } from "../components/data/states";
import { StatusBadge } from "../components/feedback/status-badge";
import { DetailDrawer } from "../components/ui/detail-drawer";
import { useFormatters } from "../features/locale/use-locale";
import { useListState } from "../features/lists/use-list-state";
import { useRiskEvent, useRiskEvents } from "../features/risk/queries";
import { decisionTone, humanize, severityTone } from "../lib/format";
import { reasonText } from "../lib/reason-codes";

const COLUMN_OPTIONS = [
  { key: "customer_id", label: "Customer" },
  { key: "risk_score", label: "Risk score" },
  { key: "confidence", label: "Confidence" },
  { key: "reason_codes", label: "Reasons" },
];

function EventDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const detail = useRiskEvent(id);
  const fmt = useFormatters();
  return (
    <DetailDrawer
      open={id !== null}
      onClose={onClose}
      title="Risk event"
      subtitle={id ?? undefined}
      badge={detail.data ? <StatusBadge tone={decisionTone(detail.data.decision)}>{detail.data.decision}</StatusBadge> : undefined}
    >
      {detail.isPending ? <LoadingState /> : null}
      {detail.isError ? <ErrorState error={detail.error} onRetry={() => void detail.refetch()} /> : null}
      {detail.data ? (
        <div className="space-y-6 text-sm">
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-xs">
            <div><dt className="text-[var(--text-muted)]">Evaluated</dt><dd className="font-semibold">{fmt.dateTime(detail.data.evaluated_at)}</dd></div>
            <div><dt className="text-[var(--text-muted)]">Customer</dt><dd className="break-all font-mono">{detail.data.customer_id}</dd></div>
            <div><dt className="text-[var(--text-muted)]">Risk score (0–1000, higher = riskier)</dt><dd className="font-tabular text-lg font-extrabold">{fmt.number(detail.data.score, 1)}</dd></div>
            <div><dt className="text-[var(--text-muted)]">Evaluation confidence</dt><dd className="font-tabular font-semibold">{fmt.number(detail.data.confidence, 2)}</dd></div>
            <div><dt className="text-[var(--text-muted)]">Policy</dt><dd className="font-mono">{detail.data.policy_version}</dd></div>
            <div><dt className="text-[var(--text-muted)]">Ruleset</dt><dd className="font-mono">{detail.data.ruleset_version ?? "—"}</dd></div>
            <div><dt className="text-[var(--text-muted)]">Model</dt><dd className="font-mono">{detail.data.model_version ?? "—"}</dd></div>
          </dl>
          <section aria-labelledby="reasons-heading">
            <h3 id="reasons-heading" className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Why this decision</h3>
            {detail.data.reasons.length === 0 ? (
              <p className="text-xs text-[var(--text-secondary)]">No reasons were recorded.</p>
            ) : (
              <ul className="space-y-2">
                {detail.data.reasons.map((reason) => (
                  <li key={`${reason.source}-${reason.code}`} className="rounded-lg border border-[var(--border-default)] p-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold">{reasonText(reason.code)}</span>
                      {reason.severity ? <StatusBadge size="sm" tone={severityTone(reason.severity)}>{humanize(reason.severity)}</StatusBadge> : null}
                    </div>
                    <p className="mt-1 font-mono text-[10px] text-[var(--text-muted)]">{reason.code} · {humanize(reason.source)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : null}
    </DetailDrawer>
  );
}

export function RiskPage() {
  const list = useListState({ ordering: "-evaluated_at" });
  const events = useRiskEvents(list.query);
  const fmt = useFormatters();
  const [openId, setOpenId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const columns: DataColumn<RiskEvent>[] = [
    { key: "evaluated_at", header: "Evaluated", sortKey: "evaluated_at", always: true, cell: (r) => fmt.dateTime(r.evaluated_at) },
    { key: "customer_id", header: "Customer", cell: (r) => <span className="font-mono">{r.customer_id.slice(0, 8)}…</span> },
    { key: "risk_score", header: "Risk score", sortKey: "score", cell: (r) => <span className="font-tabular font-bold">{fmt.number(r.score, 1)}</span> },
    { key: "decision", header: "Decision", sortKey: "decision", always: true, cell: (r) => <StatusBadge size="sm" tone={decisionTone(r.decision)}>{r.decision}</StatusBadge> },
    { key: "confidence", header: "Confidence", sortKey: "confidence", cell: (r) => <span className="font-tabular">{fmt.number(r.confidence, 2)}</span> },
    {
      key: "reason_codes",
      header: "Reasons",
      cell: (r) => (
        <span className="text-[var(--text-secondary)]" title={r.reason_codes.map(reasonText).join("\n")}>
          {r.reason_codes.slice(0, 2).map(humanize).join(", ")}
          {r.reason_codes.length > 2 ? ` +${r.reason_codes.length - 2}` : ""}
          {r.reason_codes.length === 0 ? "—" : ""}
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Risk"
        title="Risk events"
        description="Every evaluation TAMVA has made for your institution. Risk Score runs 0–1000 (higher = riskier) and is separate from a customer's Financial Confidence."
      />
      <FilterBar resource="RISK_EVENTS" list={list} columns={COLUMN_OPTIONS} selectedIds={[...selected]} />
      <QueryBoundary
        query={events}
        isEmpty={(page) => page.count === 0}
        empty={<EmptyState title="No risk events match">Adjust or reset the filters, or widen the date range.</EmptyState>}
      >
        {(page) => (
          <>
            <DataTable
              caption="Risk events"
              columns={columns}
              rows={page.results}
              rowId={(r) => r.id}
              ordering={list.state.ordering}
              onOrderingChange={list.setOrdering}
              hidden={list.state.hidden}
              selected={selected}
              onSelectedChange={setSelected}
              onRowOpen={(r) => setOpenId(r.id)}
              isFetching={events.isFetching}
            />
            <Pagination page={list.state.page} pageSize={list.state.pageSize} count={page.count} onPage={list.setPage} onPageSize={list.setPageSize} />
          </>
        )}
      </QueryBoundary>
      <EventDrawer id={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
