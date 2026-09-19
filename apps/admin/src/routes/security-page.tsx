import { auditEventPageSchema, customerDevicePageSchema, locationObservationPageSchema, securityEventPageSchema } from "@tamva/client-contracts";
import type { z } from "zod";
import { useState } from "react";

import { DataTable, Pagination, type DataColumn } from "../components/data/data-table";
import { FilterBar } from "../components/data/filter-bar";
import { CapabilityGate } from "../components/data/gates";
import { PageHeader } from "../components/data/page";
import { EmptyState, QueryBoundary, UnauthorizedState } from "../components/data/states";
import { StatusBadge } from "../components/feedback/status-badge";
import { useFormatters } from "../features/locale/use-locale";
import { useListState } from "../features/lists/use-list-state";
import { usePagedQuery } from "../features/lists/use-paged-query";
import { useSession } from "../features/session/use-session";
import { cn } from "../lib/utils/cn";
import { humanize, severityTone, toNumber } from "../lib/format";

type EventRow = z.infer<typeof securityEventPageSchema>["results"][number];
type DeviceRow = z.infer<typeof customerDevicePageSchema>["results"][number];
type LocationRow = z.infer<typeof locationObservationPageSchema>["results"][number];
type AuditRow = z.infer<typeof auditEventPageSchema>["results"][number];

const short = (id: string | null) => (id ? `${id.slice(0, 8)}…` : "—");

function EventsTab() {
  const list = useListState({ ordering: "-occurred_at" });
  const query = usePagedQuery("security-events", "/security/events/", securityEventPageSchema, list.query);
  const fmt = useFormatters();
  const columns: DataColumn<EventRow>[] = [
    { key: "occurred_at", header: "Occurred", sortKey: "occurred_at", always: true, cell: (r) => fmt.dateTime(r.occurred_at) },
    { key: "category", header: "Category", sortKey: "category", always: true, cell: (r) => humanize(r.category) },
    { key: "severity", header: "Severity", sortKey: "severity", always: true, cell: (r) => <StatusBadge size="sm" tone={severityTone(r.severity)}>{humanize(r.severity)}</StatusBadge> },
    { key: "customer_id", header: "Customer", cell: (r) => <span className="font-mono">{short(r.customer_id)}</span> },
    { key: "source", header: "Source", cell: (r) => r.source },
  ];
  return (
    <>
      <FilterBar resource="SECURITY_EVENTS" list={list} columns={[{ key: "customer_id", label: "Customer" }, { key: "source", label: "Source" }]} />
      <QueryBoundary query={query} isEmpty={(p) => p.count === 0} empty={<EmptyState title="No security events">Events appear when new devices or unusual locations are observed.</EmptyState>}>
        {(page) => (
          <>
            <DataTable caption="Security events" columns={columns} rows={page.results} rowId={(r) => r.id} ordering={list.state.ordering} onOrderingChange={list.setOrdering} hidden={list.state.hidden} isFetching={query.isFetching} />
            <Pagination page={list.state.page} pageSize={list.state.pageSize} count={page.count} onPage={list.setPage} onPageSize={list.setPageSize} />
          </>
        )}
      </QueryBoundary>
    </>
  );
}

function DevicesTab() {
  const list = useListState({ ordering: "-last_seen_at" });
  const query = usePagedQuery("security-devices", "/security/devices/", customerDevicePageSchema, list.query);
  const fmt = useFormatters();
  const columns: DataColumn<DeviceRow>[] = [
    { key: "device_ref", header: "Device", always: true, cell: (r) => <span className="font-mono">{r.device_ref}</span> },
    { key: "customer_id", header: "Customer", cell: (r) => <span className="font-mono">{short(r.customer_id)}</span> },
    { key: "status", header: "Trust", cell: (r) => <StatusBadge size="sm" tone={r.status === "BLOCKED" || r.status === "SUSPICIOUS" ? "danger" : r.status === "TRUSTED" ? "success" : "neutral"}>{humanize(r.status)}</StatusBadge> },
    { key: "observation_count", header: "Seen", sortKey: "observation_count", cell: (r) => <span className="font-tabular">{r.observation_count}×</span> },
    { key: "first_seen_at", header: "First seen", sortKey: "first_seen_at", cell: (r) => fmt.dateTime(r.first_seen_at) },
    { key: "last_seen_at", header: "Last seen", sortKey: "last_seen_at", always: true, cell: (r) => fmt.dateTime(r.last_seen_at) },
  ];
  return (
    <QueryBoundary query={query} isEmpty={(p) => p.count === 0} empty={<EmptyState title="No devices observed yet" />}>
      {(page) => (
        <>
          <DataTable caption="Observed devices" columns={columns} rows={page.results} rowId={(r) => r.id} ordering={list.state.ordering} onOrderingChange={list.setOrdering} isFetching={query.isFetching} />
          <Pagination page={list.state.page} pageSize={list.state.pageSize} count={page.count} onPage={list.setPage} onPageSize={list.setPageSize} />
        </>
      )}
    </QueryBoundary>
  );
}

function LocationsTab() {
  const list = useListState({ ordering: "-observed_at" });
  const query = usePagedQuery("security-locations", "/security/locations/", locationObservationPageSchema, list.query);
  const fmt = useFormatters();
  const columns: DataColumn<LocationRow>[] = [
    { key: "observed_at", header: "Observed", sortKey: "observed_at", always: true, cell: (r) => fmt.dateTime(r.observed_at) },
    { key: "country_code", header: "Country", always: true, cell: (r) => r.country_code },
    { key: "region", header: "Region / city", cell: (r) => [r.region, r.city].filter(Boolean).join(" · ") || "—" },
    { key: "customer_id", header: "Customer", cell: (r) => <span className="font-mono">{short(r.customer_id)}</span> },
    { key: "confidence", header: "Confidence", sortKey: "confidence", cell: (r) => `${fmt.number((toNumber(r.confidence) ?? 0) * 100, 0)}%` },
    { key: "source", header: "Source", cell: (r) => r.source },
  ];
  return (
    <QueryBoundary query={query} isEmpty={(p) => p.count === 0} empty={<EmptyState title="No locations observed yet" />}>
      {(page) => (
        <>
          <DataTable caption="Location observations" columns={columns} rows={page.results} rowId={(r) => r.id} ordering={list.state.ordering} onOrderingChange={list.setOrdering} isFetching={query.isFetching} />
          <Pagination page={list.state.page} pageSize={list.state.pageSize} count={page.count} onPage={list.setPage} onPageSize={list.setPageSize} />
        </>
      )}
    </QueryBoundary>
  );
}

function AuditTab() {
  const { can } = useSession();
  const list = useListState({ ordering: "-created_at" });
  const allowed = can("audit:read");
  const query = usePagedQuery("audit-events", "/audit/events/", auditEventPageSchema, list.query, allowed);
  const fmt = useFormatters();
  if (!allowed) return <UnauthorizedState what="The audit trail" />;
  const columns: DataColumn<AuditRow>[] = [
    { key: "created_at", header: "When", sortKey: "created_at", always: true, cell: (r) => fmt.dateTime(r.created_at) },
    { key: "action", header: "Action", sortKey: "action", always: true, cell: (r) => humanize(r.action) },
    { key: "outcome", header: "Outcome", sortKey: "outcome", cell: (r) => <StatusBadge size="sm" tone={r.outcome === "SUCCESS" ? "success" : "danger"}>{humanize(r.outcome)}</StatusBadge> },
    { key: "actor_id", header: "Actor", cell: (r) => <span className="font-mono">{short(r.actor_id)}</span> },
  ];
  return (
    <>
      <FilterBar resource="AUDIT_EVENTS" list={list} columns={[]} />
      <QueryBoundary query={query} isEmpty={(p) => p.count === 0} empty={<EmptyState title="No audit events match" />}>
        {(page) => (
          <>
            <DataTable caption="Audit trail" columns={columns} rows={page.results} rowId={(r) => r.id} ordering={list.state.ordering} onOrderingChange={list.setOrdering} isFetching={query.isFetching} />
            <Pagination page={list.state.page} pageSize={list.state.pageSize} count={page.count} onPage={list.setPage} onPageSize={list.setPageSize} />
          </>
        )}
      </QueryBoundary>
    </>
  );
}

const TABS = [
  { id: "events", label: "Security events", View: EventsTab },
  { id: "devices", label: "Devices", View: DevicesTab },
  { id: "locations", label: "Locations", View: LocationsTab },
  { id: "audit", label: "Audit trail", View: AuditTab },
] as const;

export function SecurityPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("events");
  const Active = TABS.find((t) => t.id === tab)!.View;
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Governance" title="Security & governance" description="What TAMVA has observed about devices and locations, and every audited action in your institution." />
      <CapabilityGate code="security_events" title="Security events" partialNote="only new-device and unusual-location events are produced today">
        <div role="tablist" aria-label="Security views" className="mb-4 flex flex-wrap gap-1 border-b border-[var(--border-default)]">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={cn("cursor-pointer border-b-2 px-3 py-2 text-xs font-bold", tab === t.id ? "border-[var(--brand-primary)] text-[var(--text-primary)]" : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]")}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
          <Active />
        </div>
      </CapabilityGate>

      <div className="grid gap-4 md:grid-cols-3">
        <CapabilityGate code="dark_web_monitoring" title="Dark-web monitoring" unavailable={<>Requires an external monitoring provider. TAMVA does not show detections it cannot verify.</>}><span /></CapabilityGate>
        <CapabilityGate code="external_breach_monitoring" title="Breach monitoring" unavailable={<>Requires an external breach-intelligence source, which isn't connected.</>}><span /></CapabilityGate>
        <CapabilityGate code="account_takeover_detection" title="Account-takeover detection" unavailable={<>Not implemented yet. Device and location signals feed risk decisions today.</>}><span /></CapabilityGate>
      </div>
    </div>
  );
}
