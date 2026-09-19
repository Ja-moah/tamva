import { graphEdgePageSchema, graphNodePageSchema, networkSummarySchema } from "@tamva/client-contracts";
import { useQuery } from "@tanstack/react-query";
import type { z } from "zod";

import { DistributionChart } from "../components/charts/distribution-chart";
import { DataTable, Pagination, type DataColumn } from "../components/data/data-table";
import { CapabilityGate } from "../components/data/gates";
import { PageHeader, Section, StatCard } from "../components/data/page";
import { EmptyState, QueryBoundary } from "../components/data/states";
import { StatusBadge } from "../components/feedback/status-badge";
import { useFormatters } from "../features/locale/use-locale";
import { useListState } from "../features/lists/use-list-state";
import { usePagedQuery } from "../features/lists/use-paged-query";
import { apiRequest } from "../lib/api";
import { humanize } from "../lib/format";

type Node = z.infer<typeof graphNodePageSchema>["results"][number];
type Edge = z.infer<typeof graphEdgePageSchema>["results"][number];

const NODE_TYPES = ["CUSTOMER", "INSTITUTION", "ACCOUNT", "COUNTERPARTY", "CASE", "RISK_EVENT"];
const EDGE_TYPES = ["CUSTOMER_OWNS_ACCOUNT", "CUSTOMER_CONNECTED_TO_INSTITUTION", "ACCOUNT_TRANSACTED_WITH_COUNTERPARTY", "CASE_RELATES_TO_CUSTOMER", "CASE_RELATES_TO_RISK_EVENT"];
const field = "h-8 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 text-xs";

function NodesList() {
  const list = useListState({ ordering: "label" });
  const query = usePagedQuery("network-nodes", "/network/nodes/", graphNodePageSchema, list.query);
  const fmt = useFormatters();
  const columns: DataColumn<Node>[] = [
    { key: "label", header: "Entity", sortKey: "label", always: true, cell: (r) => <span className="font-bold">{r.label || "—"}</span> },
    { key: "node_type", header: "Type", sortKey: "node_type", cell: (r) => <StatusBadge size="sm">{humanize(r.node_type)}</StatusBadge> },
    { key: "created_at", header: "First mapped", sortKey: "created", cell: (r) => fmt.date(r.created_at) },
  ];
  return (
    <Section title="Entities" description="People, accounts, counterparties and records in your institution's graph.">
      <div className="mb-3 flex flex-wrap gap-2" role="search" aria-label="Filter entities">
        <label className="sr-only" htmlFor="node-search">Search entities</label>
        <input id="node-search" type="search" placeholder="Search label…" value={list.state.search} onChange={(e) => list.setSearch(e.target.value)} className={`${field} w-56`} />
        <label className="sr-only" htmlFor="node-type">Entity type</label>
        <select id="node-type" value={list.state.filters.node_type ?? ""} onChange={(e) => list.setFilter("node_type", e.target.value)} className={field}>
          <option value="">Any type</option>
          {NODE_TYPES.map((t) => <option key={t} value={t}>{humanize(t)}</option>)}
        </select>
      </div>
      <QueryBoundary query={query} isEmpty={(p) => p.count === 0} empty={<EmptyState title="No entities yet">The graph fills as customers connect data and cases are opened.</EmptyState>}>
        {(page) => (
          <>
            <DataTable caption="Graph entities" columns={columns} rows={page.results} rowId={(r) => r.id} ordering={list.state.ordering} onOrderingChange={list.setOrdering} isFetching={query.isFetching} />
            <Pagination page={list.state.page} pageSize={list.state.pageSize} count={page.count} onPage={list.setPage} onPageSize={list.setPageSize} />
          </>
        )}
      </QueryBoundary>
    </Section>
  );
}

function EdgesList() {
  const list = useListState({ ordering: "-last_occurred_at" });
  const query = usePagedQuery("network-edges", "/network/edges/", graphEdgePageSchema, list.query);
  const fmt = useFormatters();
  const columns: DataColumn<Edge>[] = [
    { key: "edge_type", header: "Relationship", sortKey: "edge_type", always: true, cell: (r) => humanize(r.edge_type) },
    { key: "source_id", header: "From", cell: (r) => <span className="font-mono">{r.source_id.slice(0, 8)}…</span> },
    { key: "target_id", header: "To", cell: (r) => <span className="font-mono">{r.target_id.slice(0, 8)}…</span> },
    { key: "occurrence_count", header: "Times", sortKey: "occurrence_count", cell: (r) => <span className="font-tabular">{r.occurrence_count}</span> },
    { key: "last_occurred_at", header: "Last seen", sortKey: "last_occurred_at", cell: (r) => fmt.dateTime(r.last_occurred_at) },
  ];
  return (
    <Section title="Relationships" description="Evidence-backed links between entities.">
      <div className="mb-3">
        <label className="sr-only" htmlFor="edge-type">Relationship type</label>
        <select id="edge-type" value={list.state.filters.edge_type ?? ""} onChange={(e) => list.setFilter("edge_type", e.target.value)} className={field}>
          <option value="">Any relationship</option>
          {EDGE_TYPES.map((t) => <option key={t} value={t}>{humanize(t)}</option>)}
        </select>
      </div>
      <QueryBoundary query={query} isEmpty={(p) => p.count === 0} empty={<EmptyState title="No relationships yet" />}>
        {(page) => (
          <>
            <DataTable caption="Graph relationships" columns={columns} rows={page.results} rowId={(r) => r.id} ordering={list.state.ordering} onOrderingChange={list.setOrdering} isFetching={query.isFetching} />
            <Pagination page={list.state.page} pageSize={list.state.pageSize} count={page.count} onPage={list.setPage} onPageSize={list.setPageSize} />
          </>
        )}
      </QueryBoundary>
    </Section>
  );
}

export function NetworkPage() {
  const summary = useQuery({
    queryKey: ["network", "summary"],
    queryFn: ({ signal }) => apiRequest({ path: "/network/summary/", schema: networkSummarySchema, signal }),
    select: (e) => e.data,
  });
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Trust network" title="Trust network" description="The relationships TAMVA has mapped inside your institution. Nothing here is shared with, or inferred from, other institutions." />
      <QueryBoundary query={summary}>
        {(data) => {
          const nodeTotal = Object.values(data.nodes_by_type).reduce((a, b) => a + b, 0);
          const edgeTotal = Object.values(data.edges_by_type).reduce((a, b) => a + b, 0);
          return (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <StatCard label="Entities" value={nodeTotal.toLocaleString()} />
                <StatCard label="Relationships" value={edgeTotal.toLocaleString()} />
                <StatCard label="Customers with a computed graph" value={data.customers_with_computed_graph.toLocaleString()} />
              </div>
              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Section title="Entities by type"><DistributionChart label="Entities by type" unit="entities" data={Object.entries(data.nodes_by_type).map(([name, count]) => ({ name: humanize(name), count }))} /></Section>
                <Section title="Relationships by type"><DistributionChart label="Relationships by type" unit="relationships" height={260} data={Object.entries(data.edges_by_type).map(([name, count]) => ({ name: humanize(name), count }))} /></Section>
              </div>
            </>
          );
        }}
      </QueryBoundary>
      <NodesList />
      <EdgesList />
      <div className="grid gap-4 md:grid-cols-2">
        <CapabilityGate code="cross_institution_graph" title="Cross-institution intelligence" unavailable={<>Sharing signals between institutions needs governance and consent frameworks that aren't in place.</>}><span /></CapabilityGate>
        <CapabilityGate code="merchant_intelligence" title="Merchant & rail intelligence" unavailable={<>Rail health, latency and merchant reputation need monitored external sources, which aren't connected.</>}><span /></CapabilityGate>
      </div>
    </div>
  );
}
