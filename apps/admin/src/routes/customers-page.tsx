import type { CustomerSummary } from "@tamva/client-contracts";
import { useState } from "react";

import { DataTable, Pagination, type DataColumn } from "../components/data/data-table";
import { FilterBar } from "../components/data/filter-bar";
import { PageHeader } from "../components/data/page";
import { EmptyState, ErrorState, LoadingState, QueryBoundary } from "../components/data/states";
import { StatusBadge } from "../components/feedback/status-badge";
import { DetailDrawer } from "../components/ui/detail-drawer";
import { useCustomer, useCustomers } from "../features/customers/queries";
import { useFormatters } from "../features/locale/use-locale";
import { useListState } from "../features/lists/use-list-state";
import { caseStatusTone, decisionTone, humanize, priorityTone, toNumber } from "../lib/format";

const COLUMN_OPTIONS = [
  { key: "financial_confidence", label: "Financial Confidence" },
  { key: "financial_confidence_band", label: "Band" },
  { key: "profile_completeness", label: "Profile completeness" },
  { key: "latest_risk_decision", label: "Latest risk" },
  { key: "connection_state", label: "Connection" },
  { key: "consent_state", label: "Consent" },
  { key: "open_cases", label: "Open cases" },
];

function CustomerDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const detail = useCustomer(id);
  const fmt = useFormatters();
  const c = detail.data;
  return (
    <DetailDrawer open={id !== null} onClose={onClose} title={c?.display_name ?? "Customer"} subtitle={c?.email_masked}>
      {detail.isPending && id ? <LoadingState /> : null}
      {detail.isError ? <ErrorState error={detail.error} onRetry={() => void detail.refetch()} /> : null}
      {c ? (
        <div className="space-y-6 text-xs">
          <section aria-labelledby="fc">
            <h3 id="fc" className="mb-2 font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Financial Confidence</h3>
            {toNumber(c.financial_confidence.score) === null ? (
              <p className="text-[var(--text-secondary)]">Not yet computed for this customer.</p>
            ) : (
              <>
                <p className="font-tabular text-3xl font-extrabold">{fmt.number(c.financial_confidence.score, 0)}<span className="ml-1 text-sm text-[var(--text-muted)]">/ 100</span></p>
                <p className="mt-1 text-[var(--text-secondary)]">Band {c.financial_confidence.band} · completeness {fmt.number(toNumber(c.financial_confidence.completeness)! * 100, 0)}% · {fmt.dateTime(c.financial_confidence.evaluated_at)}</p>
                <p className="mt-1 text-[var(--text-muted)]">Informational; not a credit decision or a risk score.</p>
              </>
            )}
          </section>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div><dt className="text-[var(--text-muted)]">Connections</dt><dd className="font-semibold">{humanize(c.connection_state)} ({c.active_connection_count})</dd></div>
            <div><dt className="text-[var(--text-muted)]">Consent</dt><dd className="font-semibold">{humanize(c.consent_state)} ({c.active_consent_count})</dd></div>
            <div><dt className="text-[var(--text-muted)]">Cases</dt><dd className="font-semibold">{c.open_case_count} open / {c.case_count} total</dd></div>
            <div><dt className="text-[var(--text-muted)]">Passport shares</dt><dd className="font-semibold">{c.active_passport_shares ?? "Not permitted"}</dd></div>
            <div><dt className="text-[var(--text-muted)]">Last sign-in</dt><dd className="font-semibold">{fmt.dateTime(c.last_login)}</dd></div>
            <div className="col-span-2"><dt className="text-[var(--text-muted)]">Customer ID</dt><dd className="break-all font-mono">{c.id}</dd></div>
          </dl>
          <section aria-labelledby="rr">
            <h3 id="rr" className="mb-2 font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Recent risk events</h3>
            {c.recent_risk_events.length === 0 ? <p className="text-[var(--text-secondary)]">None.</p> : (
              <ul className="space-y-1.5">
                {c.recent_risk_events.map((e) => (
                  <li key={e.id} className="flex items-center justify-between">
                    <span>{fmt.dateTime(e.evaluated_at)} · score {fmt.number(e.score, 0)}</span>
                    <StatusBadge size="sm" tone={decisionTone(e.decision)}>{e.decision}</StatusBadge>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section aria-labelledby="rc">
            <h3 id="rc" className="mb-2 font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Recent cases</h3>
            {c.recent_cases.length === 0 ? <p className="text-[var(--text-secondary)]">None.</p> : (
              <ul className="space-y-1.5">
                {c.recent_cases.map((k) => (
                  <li key={k.id} className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold">{k.reference}</span>
                    <span className="flex gap-1.5">
                      <StatusBadge size="sm" tone={priorityTone(k.priority)}>{humanize(k.priority)}</StatusBadge>
                      <StatusBadge size="sm" tone={caseStatusTone(k.status)}>{humanize(k.status)}</StatusBadge>
                    </span>
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

export function CustomersPage() {
  const list = useListState({ ordering: "name" });
  const customers = useCustomers(list.query);
  const fmt = useFormatters();
  const [openId, setOpenId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const columns: DataColumn<CustomerSummary>[] = [
    { key: "display_name", header: "Customer", sortKey: "name", always: true, cell: (r) => <div><p className="font-bold">{r.display_name}</p><p className="font-mono text-[10px] text-[var(--text-muted)]">{r.email_masked}</p></div> },
    { key: "financial_confidence", header: "Financial Confidence", sortKey: "financial_confidence", cell: (r) => (toNumber(r.financial_confidence.score) === null ? <span className="text-[var(--text-muted)]">Not computed</span> : <span className="font-tabular font-bold">{fmt.number(r.financial_confidence.score, 0)}</span>) },
    { key: "financial_confidence_band", header: "Band", cell: (r) => r.financial_confidence.band ?? "—" },
    { key: "profile_completeness", header: "Completeness", sortKey: "profile_completeness", cell: (r) => (toNumber(r.financial_confidence.completeness) === null ? "—" : `${fmt.number(toNumber(r.financial_confidence.completeness)! * 100, 0)}%`) },
    { key: "latest_risk_decision", header: "Latest risk", sortKey: "latest_risk_score", cell: (r) => (r.latest_risk.decision ? <StatusBadge size="sm" tone={decisionTone(r.latest_risk.decision)}>{r.latest_risk.decision}</StatusBadge> : "—") },
    { key: "connection_state", header: "Connection", cell: (r) => <StatusBadge size="sm" tone={r.connection_state === "CONNECTED" ? "success" : "neutral"}>{humanize(r.connection_state)}</StatusBadge> },
    { key: "consent_state", header: "Consent", cell: (r) => <StatusBadge size="sm" tone={r.consent_state === "ACTIVE" ? "success" : "warning"}>{humanize(r.consent_state)}</StatusBadge> },
    { key: "open_cases", header: "Open cases", sortKey: "open_cases", cell: (r) => <span className="font-tabular">{r.open_case_count}</span> },
  ];

  return (
    <div>
      <PageHeader eyebrow="Customers" title="Customers" description="Customers your institution has a connection, consent or profile with. Identifiers are masked and no raw transactions are shown." />
      <FilterBar resource="CUSTOMERS" list={list} columns={COLUMN_OPTIONS} selectedIds={[...selected]} />
      <QueryBoundary query={customers} isEmpty={(p) => p.count === 0} empty={<EmptyState title="No customers match">Adjust or reset the filters.</EmptyState>}>
        {(page) => (
          <>
            <DataTable caption="Customers" columns={columns} rows={page.results} rowId={(r) => r.id} ordering={list.state.ordering} onOrderingChange={list.setOrdering} hidden={list.state.hidden} selected={selected} onSelectedChange={setSelected} onRowOpen={(r) => setOpenId(r.id)} isFetching={customers.isFetching} />
            <Pagination page={list.state.page} pageSize={list.state.pageSize} count={page.count} onPage={list.setPage} onPageSize={list.setPageSize} />
          </>
        )}
      </QueryBoundary>
      <CustomerDrawer id={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
