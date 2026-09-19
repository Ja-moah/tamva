import { CASE_STATUSES, type CaseSummary } from "@tamva/client-contracts";
import { useState } from "react";

import { DataTable, Pagination, type DataColumn } from "../components/data/data-table";
import { FilterBar } from "../components/data/filter-bar";
import { PageHeader } from "../components/data/page";
import { EmptyState, ErrorState, LoadingState, QueryBoundary } from "../components/data/states";
import { StatusBadge } from "../components/feedback/status-badge";
import { ActionDialog, dialogField } from "../components/ui/action-dialog";
import { Button } from "../components/ui/button";
import { DetailDrawer } from "../components/ui/detail-drawer";
import { useToast } from "../components/ui/toast";
import { useBulkCaseAction, useCase, useCaseAction, useCases } from "../features/cases/queries";
import { useFormatters } from "../features/locale/use-locale";
import { useListState } from "../features/lists/use-list-state";
import { useSession } from "../features/session/use-session";
import { ApiError } from "../lib/api";
import { caseStatusTone, humanize, priorityTone } from "../lib/format";

const NEXT: Record<string, string | undefined> = {
  OPEN: "TRIAGED",
  TRIAGED: "INVESTIGATING",
  INVESTIGATING: "ACTIONED",
};
const OUTCOMES = ["CONFIRMED_RISK", "CLEARED", "FALSE_POSITIVE", "CUSTOMER_VERIFIED", "POLICY_EXCEPTION", "OTHER"];
const COLUMN_OPTIONS = [
  { key: "customer_id", label: "Customer" },
  { key: "case_type", label: "Type" },
  { key: "source", label: "Source" },
  { key: "assignee_id", label: "Assignee" },
  { key: "closed_at", label: "Closed" },
];

const errorText = (error: unknown) =>
  error instanceof ApiError ? (typeof error.details === "object" && error.details ? JSON.stringify(error.details) : error.message) : "Something went wrong.";

type Dialog =
  | { kind: "transition"; to: string }
  | { kind: "assign" }
  | { kind: "resolve" }
  | null;

function CaseDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const detail = useCase(id);
  const action = useCaseAction();
  const { actor, can } = useSession();
  const { toast } = useToast();
  const fmt = useFormatters();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [note, setNote] = useState("");
  const [newNote, setNewNote] = useState("");
  const [outcome, setOutcome] = useState(OUTCOMES[0]);
  const [reason, setReason] = useState("");
  const canManage = can("case:manage");
  const me = actor?.user.id ?? null;
  const who = (userId: string | null) => (userId === null ? "System" : userId === me ? "You" : `${userId.slice(0, 8)}…`);

  const close = () => {
    setDialog(null);
    setNote("");
    setReason("");
    action.reset();
  };
  const run = (payload: Parameters<typeof action.mutate>[0], message: string) =>
    action.mutate(payload, {
      onSuccess: () => {
        toast({ title: message, type: "success" });
        close();
        setNewNote("");
      },
    });

  const c = detail.data;
  const timeline = !c ? [] : [
      ...c.status_events.map((e) => ({ at: e.occurred_at, text: `${humanize(e.previous_status || "created")} → ${humanize(e.new_status)}`, by: e.actor_id, extra: e.note })),
      ...c.assignments.map((e) => ({ at: e.assigned_at, text: e.assignee_id ? `Assigned to ${who(e.assignee_id)}` : "Unassigned", by: e.assigned_by_id, extra: e.note })),
      ...c.notes.map((e) => ({ at: e.created_at, text: "Note added", by: e.author_id, extra: e.body })),
      ...c.actions.map((e) => ({ at: e.created_at, text: humanize(e.action_type), by: e.actor_id, extra: "" })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  const next = c ? NEXT[c.status] : undefined;
  return (
    <DetailDrawer
      open={id !== null}
      onClose={onClose}
      title={c ? c.reference : "Case"}
      subtitle={c ? humanize(c.case_type) : undefined}
      badge={c ? <StatusBadge tone={caseStatusTone(c.status)}>{humanize(c.status)}</StatusBadge> : undefined}
    >
      {detail.isPending && id ? <LoadingState /> : null}
      {detail.isError ? <ErrorState error={detail.error} onRetry={() => void detail.refetch()} /> : null}
      {c ? (
        <div className="space-y-6 text-xs">
          <ol className="flex flex-wrap gap-1.5" aria-label="Workflow">
            {CASE_STATUSES.map((status) => (
              <li key={status} aria-current={status === c.status ? "step" : undefined}>
                <StatusBadge size="sm" tone={status === c.status ? "info" : "neutral"}>{humanize(status)}</StatusBadge>
              </li>
            ))}
          </ol>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <div><dt className="text-[var(--text-muted)]">Priority</dt><dd><StatusBadge size="sm" tone={priorityTone(c.priority)}>{humanize(c.priority)}</StatusBadge></dd></div>
            <div><dt className="text-[var(--text-muted)]">Source</dt><dd className="font-semibold">{humanize(c.source)}</dd></div>
            <div><dt className="text-[var(--text-muted)]">Opened</dt><dd className="font-semibold">{fmt.dateTime(c.opened_at)}</dd></div>
            <div><dt className="text-[var(--text-muted)]">Assignee</dt><dd className="font-semibold">{c.current_assignee_id ? who(c.current_assignee_id) : "Unassigned"}</dd></div>
            <div className="col-span-2"><dt className="text-[var(--text-muted)]">Customer</dt><dd className="break-all font-mono">{c.customer_id}</dd></div>
          </dl>

          {c.resolution ? (
            <section className="rounded-lg border border-[var(--risk-low-border)] bg-[var(--risk-low-bg)] p-3 text-[var(--risk-low-text)]">
              <p className="font-bold">Resolved: {humanize(c.resolution.outcome)}</p>
              <p className="mt-1">{c.resolution.reason}</p>
            </section>
          ) : null}

          {canManage && c.status !== "RESOLVED" ? (
            <div className="flex flex-wrap gap-2" role="group" aria-label="Case actions">
              {next ? <Button size="sm" variant="primary" onClick={() => setDialog({ kind: "transition", to: next })}>Move to {humanize(next)}</Button> : null}
              {c.status === "ACTIONED" ? <Button size="sm" variant="primary" onClick={() => setDialog({ kind: "resolve" })}>Resolve…</Button> : null}
              {me && c.current_assignee_id !== me ? <Button size="sm" variant="secondary" onClick={() => setDialog({ kind: "assign" })}>Assign to me</Button> : null}
            </div>
          ) : null}

          {canManage ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (newNote.trim()) run({ kind: "note", id: c.id, body: newNote.trim() }, "Note added");
              }}
              className="space-y-2"
            >
              <label htmlFor="case-note" className="font-bold">Add a note</label>
              <textarea id="case-note" rows={3} value={newNote} onChange={(e) => setNewNote(e.target.value)} className={dialogField} />
              <Button type="submit" size="sm" variant="secondary" disabled={!newNote.trim()} loading={action.isPending && !dialog}>Add note</Button>
            </form>
          ) : null}

          <section aria-labelledby="history">
            <h3 id="history" className="mb-2 font-extrabold uppercase tracking-wider text-[var(--text-muted)]">History</h3>
            <ol className="space-y-3 border-l border-[var(--border-default)] pl-4">
              {timeline.map((entry, index) => (
                <li key={`${entry.at}-${index}`}>
                  <p className="font-semibold">{entry.text}</p>
                  {entry.extra ? <p className="mt-0.5 text-[var(--text-secondary)]">{entry.extra}</p> : null}
                  <p className="font-mono text-[10px] text-[var(--text-muted)]">{fmt.dateTime(entry.at)} · {who(entry.by)}</p>
                </li>
              ))}
            </ol>
          </section>

          <ActionDialog
            open={dialog?.kind === "transition"}
            title={`Move to ${dialog?.kind === "transition" ? humanize(dialog.to) : ""}`}
            description="This is recorded in the case history and audit trail."
            confirmLabel="Confirm"
            busy={action.isPending}
            error={action.isError ? errorText(action.error) : null}
            onClose={close}
            onConfirm={() => dialog?.kind === "transition" && run({ kind: "transition", id: c.id, new_status: dialog.to, note }, "Case updated")}
          >
            <label className="block text-xs font-bold">Note (optional)<textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={dialogField} /></label>
          </ActionDialog>
          <ActionDialog
            open={dialog?.kind === "assign"}
            title="Assign this case to yourself"
            confirmLabel="Assign to me"
            busy={action.isPending}
            error={action.isError ? errorText(action.error) : null}
            onClose={close}
            onConfirm={() => me && run({ kind: "assign", id: c.id, assignee_id: me, note }, "Case assigned")}
          >
            <label className="block text-xs font-bold">Note (optional)<textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} className={dialogField} /></label>
          </ActionDialog>
          <ActionDialog
            open={dialog?.kind === "resolve"}
            title="Resolve case"
            description="Resolution is final. A reason is required and kept on the record."
            confirmLabel="Resolve case"
            busy={action.isPending}
            disabled={!reason.trim()}
            error={action.isError ? errorText(action.error) : null}
            onClose={close}
            onConfirm={() => run({ kind: "resolve", id: c.id, outcome, reason: reason.trim() }, "Case resolved")}
          >
            <label className="block text-xs font-bold">Outcome
              <select value={outcome} onChange={(e) => setOutcome(e.target.value)} className={dialogField}>
                {OUTCOMES.map((o) => <option key={o} value={o}>{humanize(o)}</option>)}
              </select>
            </label>
            <label className="block text-xs font-bold">Reason (required)<textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className={dialogField} /></label>
          </ActionDialog>
        </div>
      ) : null}
    </DetailDrawer>
  );
}

export function CasesPage() {
  const list = useListState({ ordering: "-opened_at" });
  const cases = useCases(list.query);
  const bulk = useBulkCaseAction();
  const { actor, can } = useSession();
  const { toast } = useToast();
  const fmt = useFormatters();
  const [openId, setOpenId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDialog, setBulkDialog] = useState<"assign" | "triage" | null>(null);
  const canManage = can("case:manage");
  const me = actor?.user.id ?? null;

  const columns: DataColumn<CaseSummary>[] = [
    { key: "reference", header: "Case", sortKey: "reference", always: true, cell: (r) => <span className="font-mono font-bold">{r.reference}</span> },
    { key: "case_type", header: "Type", cell: (r) => humanize(r.case_type) },
    { key: "customer_id", header: "Customer", cell: (r) => <span className="font-mono">{r.customer_id.slice(0, 8)}…</span> },
    { key: "priority", header: "Priority", sortKey: "priority", always: true, cell: (r) => <StatusBadge size="sm" tone={priorityTone(r.priority)}>{humanize(r.priority)}</StatusBadge> },
    { key: "status", header: "State", sortKey: "status", always: true, cell: (r) => <StatusBadge size="sm" tone={caseStatusTone(r.status)}>{humanize(r.status)}</StatusBadge> },
    { key: "source", header: "Source", cell: (r) => humanize(r.source) },
    { key: "assignee_id", header: "Assignee", cell: (r) => (r.current_assignee_id ? (r.current_assignee_id === me ? "You" : `${r.current_assignee_id.slice(0, 8)}…`) : <span className="text-[var(--text-muted)]">Unassigned</span>) },
    { key: "opened_at", header: "Opened", sortKey: "opened_at", always: true, cell: (r) => fmt.dateTime(r.opened_at) },
    { key: "closed_at", header: "Closed", sortKey: "closed_at", cell: (r) => fmt.dateTime(r.closed_at) },
  ];

  const runBulk = () => {
    if (!bulkDialog) return;
    bulk.mutate(
      { kind: bulkDialog, case_ids: [...selected], assignee_id: bulkDialog === "assign" ? me : undefined, note: "" },
      {
        onSuccess: (result) => {
          toast({
            title: `${result.summary.succeeded} of ${result.summary.requested} updated`,
            description: result.summary.failed ? `${result.summary.failed} could not be changed (already in that state or not found).` : undefined,
            type: result.summary.failed ? "warning" : "success",
          });
          setBulkDialog(null);
          setSelected(new Set());
        },
      },
    );
  };

  return (
    <div>
      <PageHeader eyebrow="Investigations" title="Cases" description="Work cases through OPEN → TRIAGED → INVESTIGATING → ACTIONED → RESOLVED. Every change is audited." />
      <FilterBar resource="CASES" list={list} columns={COLUMN_OPTIONS} selectedIds={[...selected]}>
        {canManage && selected.size > 0 ? (
          <>
            <span className="text-xs font-semibold text-[var(--text-secondary)]">{selected.size} selected</span>
            <Button size="sm" variant="primary" onClick={() => setBulkDialog("triage")}>Triage selected</Button>
            <Button size="sm" variant="secondary" onClick={() => setBulkDialog("assign")}>Assign to me</Button>
          </>
        ) : null}
      </FilterBar>
      <QueryBoundary query={cases} isEmpty={(p) => p.count === 0} empty={<EmptyState title="No cases match">Adjust or reset the filters.</EmptyState>}>
        {(page) => (
          <>
            <DataTable
              caption="Cases"
              columns={columns}
              rows={page.results}
              rowId={(r) => r.id}
              ordering={list.state.ordering}
              onOrderingChange={list.setOrdering}
              hidden={list.state.hidden}
              selected={selected}
              onSelectedChange={setSelected}
              onRowOpen={(r) => setOpenId(r.id)}
              isFetching={cases.isFetching}
            />
            <Pagination page={list.state.page} pageSize={list.state.pageSize} count={page.count} onPage={list.setPage} onPageSize={list.setPageSize} />
          </>
        )}
      </QueryBoundary>
      <CaseDrawer id={openId} onClose={() => setOpenId(null)} />
      <ActionDialog
        open={bulkDialog !== null}
        title={bulkDialog === "triage" ? `Triage ${selected.size} cases` : `Assign ${selected.size} cases to you`}
        description={bulkDialog === "triage" ? "Only OPEN cases can be triaged. Others are skipped and reported." : "Each case is updated independently and audited."}
        confirmLabel={bulkDialog === "triage" ? "Triage" : "Assign to me"}
        busy={bulk.isPending}
        error={bulk.isError ? errorText(bulk.error) : null}
        onClose={() => setBulkDialog(null)}
        onConfirm={runBulk}
      />
    </div>
  );
}
