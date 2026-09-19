import type { Member } from "@tamva/client-contracts";
import { useState } from "react";

import { DataTable, Pagination, type DataColumn } from "../components/data/data-table";
import { CapabilityGate } from "../components/data/gates";
import { PageHeader, Section } from "../components/data/page";
import { EmptyState, QueryBoundary } from "../components/data/states";
import { StatusBadge } from "../components/feedback/status-badge";
import { ActionDialog, dialogField } from "../components/ui/action-dialog";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/toast";
import { useFormatters } from "../features/locale/use-locale";
import { useListState } from "../features/lists/use-list-state";
import { useSession } from "../features/session/use-session";
import { useMemberChange, useMembers, usePermissions, useRoles } from "../features/team/queries";
import { ApiError } from "../lib/api";
import { humanize } from "../lib/format";

const STATUSES = ["ACTIVE", "SUSPENDED", "ENDED"];
const errorText = (error: unknown) => {
  if (!(error instanceof ApiError)) return "Something went wrong.";
  const details = error.details as Record<string, unknown> | null;
  const first = details && Object.values(details)[0];
  return Array.isArray(first) ? String(first[0]) : typeof first === "string" ? first : error.message;
};

type Dialog = { kind: "roles"; member: Member } | { kind: "status"; member: Member } | null;

export function TeamPage() {
  const list = useListState({ ordering: "email", pageSize: 25 });
  const members = useMembers(list.query);
  const roles = useRoles();
  const permissions = usePermissions();
  const change = useMemberChange();
  const { can, actor } = useSession();
  const { toast } = useToast();
  const fmt = useFormatters();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [chosenRoles, setChosenRoles] = useState<string[]>([]);
  const [chosenStatus, setChosenStatus] = useState("ACTIVE");
  const canManage = can("team:manage");
  const me = actor?.user.id;

  const openDialog = (next: Dialog) => {
    change.reset();
    if (next?.kind === "roles") setChosenRoles(next.member.roles);
    if (next?.kind === "status") setChosenStatus(next.member.status);
    setDialog(next);
  };
  const apply = () => {
    if (!dialog) return;
    change.mutate(
      dialog.kind === "roles" ? { id: dialog.member.id, roles: chosenRoles } : { id: dialog.member.id, status: chosenStatus },
      {
        onSuccess: () => {
          toast({ title: "Access updated", description: dialog.member.email, type: "success" });
          setDialog(null);
        },
      },
    );
  };

  const columns: DataColumn<Member>[] = [
    { key: "email", header: "Member", sortKey: "email", always: true, cell: (r) => <div><p className="font-bold">{r.name}</p><p className="font-mono text-[10px] text-[var(--text-muted)]">{r.email}</p></div> },
    { key: "roles", header: "Roles", cell: (r) => (r.roles.length ? <span className="flex flex-wrap gap-1">{r.roles.map((role) => <StatusBadge key={role} size="sm" tone="info">{humanize(role)}</StatusBadge>)}</span> : <span className="text-[var(--text-muted)]">No role</span>) },
    { key: "status", header: "Status", sortKey: "status", cell: (r) => <StatusBadge size="sm" tone={r.status === "ACTIVE" ? "success" : r.status === "SUSPENDED" ? "warning" : "neutral"}>{humanize(r.status)}</StatusBadge> },
    { key: "last_login", header: "Last sign-in", sortKey: "last_login", cell: (r) => fmt.dateTime(r.last_login) },
    { key: "joined", header: "Joined", sortKey: "joined", cell: (r) => fmt.date(r.created_at) },
    {
      key: "actions",
      header: "Access",
      always: true,
      cell: (r) =>
        canManage && r.user_id !== me ? (
          <span className="flex gap-1.5">
            <Button size="sm" variant="secondary" onClick={() => openDialog({ kind: "roles", member: r })} aria-label={`Change roles for ${r.email}`}>Roles</Button>
            <Button size="sm" variant="ghost" onClick={() => openDialog({ kind: "status", member: r })} aria-label={`Change status for ${r.email}`}>Status</Button>
          </span>
        ) : r.user_id === me ? <span className="text-[var(--text-muted)]">You</span> : null,
    },
  ];

  const fieldClass = "h-8 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 text-xs";
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Governance" title="Team & access" description="Members of this institution and what their roles allow. Roles and permissions are defined by the backend; the interface only shows them." />
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-2" role="search" aria-label="Filter members">
          <label className="sr-only" htmlFor="member-search">Search members</label>
          <input id="member-search" type="search" placeholder="Search name or email…" value={list.state.search} onChange={(e) => list.setSearch(e.target.value)} className={`${fieldClass} w-64`} />
          <label className="sr-only" htmlFor="member-status">Status</label>
          <select id="member-status" value={list.state.filters.status ?? ""} onChange={(e) => list.setFilter("status", e.target.value)} className={fieldClass}>
            <option value="">Any status</option>
            {STATUSES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
          </select>
          <label className="sr-only" htmlFor="member-role">Role</label>
          <select id="member-role" value={list.state.filters.role ?? ""} onChange={(e) => list.setFilter("role", e.target.value)} className={fieldClass}>
            <option value="">Any role</option>
            {(roles.data ?? []).map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
          </select>
        </div>
        <QueryBoundary query={members} isEmpty={(p) => p.count === 0} empty={<EmptyState title="No members match" />}>
          {(page) => (
            <>
              <DataTable caption="Institution members" columns={columns} rows={page.results} rowId={(r) => r.id} ordering={list.state.ordering} onOrderingChange={list.setOrdering} isFetching={members.isFetching} />
              <Pagination page={list.state.page} pageSize={list.state.pageSize} count={page.count} onPage={list.setPage} onPageSize={list.setPageSize} />
            </>
          )}
        </QueryBoundary>
      </div>

      <CapabilityGate code="team_invitations" title="Invite team members" unavailable={<>Invitations aren't available yet. Add members through your identity administrator; you can then assign their roles here.</>}>
        <span />
      </CapabilityGate>

      <Section title="What each role can do" description="Permissions granted by every role, as defined in the backend catalog.">
        <QueryBoundary query={roles}>
          {(roleList) => (
            <QueryBoundary query={permissions}>
              {(permissionList) => (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[640px] text-left text-xs">
                    <caption className="sr-only">Role permission matrix</caption>
                    <thead>
                      <tr className="border-b border-[var(--border-default)]">
                        <th scope="col" className="py-2 pr-3 font-mono text-[10px] uppercase text-[var(--text-muted)]">Permission</th>
                        {roleList.map((role) => <th key={role.code} scope="col" className="px-2 py-2 text-center font-bold">{role.name}</th>)}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-subtle)]">
                      {permissionList.map((permission) => (
                        <tr key={permission.code}>
                          <th scope="row" className="py-2 pr-3 text-left font-medium"><span className="block">{permission.name}</span><span className="font-mono text-[10px] text-[var(--text-muted)]">{permission.code}</span></th>
                          {roleList.map((role) => (
                            <td key={role.code} className="px-2 py-2 text-center">
                              {role.permissions.includes(permission.code) ? <span aria-label="Granted" className="text-[var(--risk-low-text)]">●</span> : <span aria-label="Not granted" className="text-[var(--text-muted)]">–</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </QueryBoundary>
          )}
        </QueryBoundary>
      </Section>

      <ActionDialog
        open={dialog?.kind === "roles"}
        title={`Change roles for ${dialog?.member.email ?? ""}`}
        description="Takes effect immediately and is recorded in the audit trail. You can't change your own access, and an institution must keep an active administrator."
        confirmLabel="Save roles"
        busy={change.isPending}
        error={change.isError ? errorText(change.error) : null}
        onClose={() => setDialog(null)}
        onConfirm={apply}
      >
        <fieldset className="space-y-1.5">
          <legend className="sr-only">Roles</legend>
          {(roles.data ?? []).map((role) => (
            <label key={role.code} className="flex cursor-pointer items-start gap-2 text-xs">
              <input type="checkbox" className="mt-0.5 accent-[var(--accent-emerald)]" checked={chosenRoles.includes(role.code)} onChange={() => setChosenRoles((cur) => (cur.includes(role.code) ? cur.filter((c) => c !== role.code) : [...cur, role.code]))} />
              <span><span className="font-bold">{role.name}</span><span className="block text-[var(--text-muted)]">{role.permissions.length} permissions</span></span>
            </label>
          ))}
        </fieldset>
      </ActionDialog>
      <ActionDialog
        open={dialog?.kind === "status"}
        title={`Change access status for ${dialog?.member.email ?? ""}`}
        description="Suspended or ended members can't sign in to this institution."
        confirmLabel="Save status"
        tone={chosenStatus === "ACTIVE" ? "primary" : "danger"}
        busy={change.isPending}
        error={change.isError ? errorText(change.error) : null}
        onClose={() => setDialog(null)}
        onConfirm={apply}
      >
        <label className="block text-xs font-bold">Status
          <select value={chosenStatus} onChange={(e) => setChosenStatus(e.target.value)} className={dialogField}>
            {STATUSES.map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
          </select>
        </label>
      </ActionDialog>
    </div>
  );
}
