import type { ApiCredentialMeta, PartnerApplication } from "@tamva/client-contracts";
import { Copy, KeyRound, Plus } from "lucide-react";
import { useState } from "react";

import { DataTable, Pagination, type DataColumn } from "../components/data/data-table";
import { CapabilityGate } from "../components/data/gates";
import { PageHeader, Section } from "../components/data/page";
import { EmptyState, QueryBoundary } from "../components/data/states";
import { StatusBadge } from "../components/feedback/status-badge";
import { ActionDialog, dialogField } from "../components/ui/action-dialog";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useToast } from "../components/ui/toast";
import { useApplications, useConnections, useIntegrationActions, useScopes } from "../features/integrations/queries";
import { useFormatters } from "../features/locale/use-locale";
import { useListState } from "../features/lists/use-list-state";
import { useSession } from "../features/session/use-session";
import { ApiError } from "../lib/api";
import { humanize } from "../lib/format";
import type { connectionSchema } from "@tamva/client-contracts";
import type { z } from "zod";

type Connection = z.infer<typeof connectionSchema>;
const ENV_KINDS = ["SANDBOX", "STAGING", "PRODUCTION"];

const errorText = (error: unknown) => {
  if (!(error instanceof ApiError)) return "Something went wrong.";
  const details = error.details as Record<string, unknown> | null;
  const first = details && typeof details === "object" ? Object.values(details)[0] : null;
  return Array.isArray(first) ? String(first[0]) : typeof first === "string" ? first : error.message;
};

type Dialog =
  | { kind: "application" }
  | { kind: "environment"; app: PartnerApplication }
  | { kind: "credential"; environmentId: string; label: string }
  | { kind: "webhook"; environmentId: string; label: string }
  | { kind: "rotate"; credential: ApiCredentialMeta }
  | { kind: "revoke"; credential: ApiCredentialMeta }
  | null;

function SecretDialog({ secret, onClose }: { secret: { value: string; name: string } | null; onClose: () => void }) {
  const { toast } = useToast();
  return (
    <ActionDialog
      open={secret !== null}
      title="Copy your secret now"
      description={`This is the only time the secret for “${secret?.name}” is shown. TAMVA stores only a hash and cannot show it again.`}
      confirmLabel="I've saved it"
      onConfirm={onClose}
      onClose={onClose}
    >
      <div className="flex items-center gap-2">
        <input readOnly value={secret?.value ?? ""} aria-label="Secret" onFocus={(e) => e.currentTarget.select()} className={`${dialogField} mt-0 font-mono text-xs`} />
        <Button type="button" variant="secondary" size="sm" onClick={() => void navigator.clipboard?.writeText(secret?.value ?? "").then(() => toast({ title: "Copied", type: "success" }))}>
          <Copy className="size-3.5" aria-hidden /> Copy
        </Button>
      </div>
    </ActionDialog>
  );
}

function ConnectionsSection() {
  const list = useListState({ ordering: "-last_synced_at" });
  const query = useConnections(list.query);
  const fmt = useFormatters();
  const columns: DataColumn<Connection>[] = [
    { key: "provider", header: "Provider", sortKey: "provider", always: true, cell: (r) => <div><p className="font-bold">{r.provider_name}</p><p className="font-mono text-[10px] text-[var(--text-muted)]">{r.provider}</p></div> },
    { key: "status", header: "Status", sortKey: "status", cell: (r) => <StatusBadge size="sm" tone={r.status === "ACTIVE" ? "success" : r.status === "FAILED" ? "danger" : "warning"}>{humanize(r.status)}</StatusBadge> },
    { key: "scope_code", header: "Scope", cell: (r) => r.scope_code },
    { key: "purpose_code", header: "Purpose", cell: (r) => r.purpose_code },
    { key: "last_synced_at", header: "Last sync", sortKey: "last_synced_at", cell: (r) => (r.last_synced_at ? fmt.dateTime(r.last_synced_at) : <span className="text-[var(--text-muted)]">Never</span>) },
  ];
  return (
    <Section title="Data connections" description="Customer data connections and their health. Provider credentials are never shown.">
      <div className="mb-3">
        <label className="sr-only" htmlFor="conn-status">Status</label>
        <select id="conn-status" value={list.state.filters.status ?? ""} onChange={(e) => list.setFilter("status", e.target.value)} className="h-8 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface)] px-2 text-xs">
          <option value="">Any status</option>
          {["ACTIVE", "PAUSED", "REVOKED", "FAILED"].map((s) => <option key={s} value={s}>{humanize(s)}</option>)}
        </select>
      </div>
      <QueryBoundary query={query} isEmpty={(p) => p.count === 0} empty={<EmptyState title="No connections yet" />}>
        {(page) => (
          <>
            <DataTable caption="Data connections" columns={columns} rows={page.results} rowId={(r) => r.id} ordering={list.state.ordering} onOrderingChange={list.setOrdering} isFetching={query.isFetching} />
            <Pagination page={list.state.page} pageSize={list.state.pageSize} count={page.count} onPage={list.setPage} onPageSize={list.setPageSize} />
          </>
        )}
      </QueryBoundary>
    </Section>
  );
}

export function IntegrationsPage() {
  const apps = useApplications();
  const scopes = useScopes();
  const actions = useIntegrationActions();
  const { can } = useSession();
  const { toast } = useToast();
  const fmt = useFormatters();
  const canManage = can("partner:manage");

  const [dialog, setDialog] = useState<Dialog>(null);
  const [secret, setSecret] = useState<{ value: string; name: string } | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", kind: "SANDBOX", url: "", events: "", scopes: [] as string[] });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const open = (next: Dialog) => {
    Object.values(actions).forEach((m) => m.reset());
    setForm({ name: "", slug: "", description: "", kind: "SANDBOX", url: "", events: "", scopes: [] });
    setDialog(next);
  };
  const done = (message: string) => {
    toast({ title: message, type: "success" });
    setDialog(null);
  };
  const reveal = (name: string) => (result: { data: { secret: string } }) => {
    setDialog(null);
    setSecret({ value: result.data.secret, name });
  };
  const active = dialog ? Object.values(actions).find((m) => m.isError || m.isPending) : undefined;
  const dialogError = active?.isError ? errorText(active.error) : null;
  const busy = Object.values(actions).some((m) => m.isPending);

  const confirm = () => {
    if (!dialog) return;
    if (dialog.kind === "application") actions.createApplication.mutate({ name: form.name.trim(), slug: form.slug.trim(), description: form.description.trim() }, { onSuccess: () => done("Application created") });
    else if (dialog.kind === "environment") actions.addEnvironment.mutate({ applicationId: dialog.app.id, kind: form.kind }, { onSuccess: () => done("Environment added") });
    else if (dialog.kind === "credential") actions.issueCredential.mutate({ environmentId: dialog.environmentId, name: form.name.trim(), scopes: form.scopes }, { onSuccess: reveal(form.name.trim()) });
    else if (dialog.kind === "webhook") actions.addWebhook.mutate({ environmentId: dialog.environmentId, url: form.url.trim(), event_types: form.events.split(",").map((e) => e.trim()).filter(Boolean) }, { onSuccess: () => done("Webhook added") });
    else if (dialog.kind === "rotate") actions.rotateCredential.mutate(dialog.credential.id, { onSuccess: reveal(dialog.credential.name) });
    else actions.revokeCredential.mutate(dialog.credential.id, { onSuccess: () => done("Credential revoked") });
  };

  const titles: Record<string, string> = {
    application: "New application", environment: "Add environment", credential: "Issue API credential",
    webhook: "Add webhook endpoint", rotate: "Rotate credential", revoke: "Revoke credential",
  };
  const disabled =
    dialog?.kind === "application" ? !form.name.trim() || !form.slug.trim()
    : dialog?.kind === "credential" ? !form.name.trim() || form.scopes.length === 0
    : dialog?.kind === "webhook" ? !form.url.trim() || !form.events.trim() : false;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Developer"
        title="API & integrations"
        description="Applications, credentials and webhooks for your institution. Secrets are shown exactly once."
        actions={canManage ? <Button variant="primary" onClick={() => open({ kind: "application" })}><Plus className="size-4" aria-hidden /> New application</Button> : undefined}
      />

      <QueryBoundary query={apps} isEmpty={(a) => a.length === 0} empty={<EmptyState title="No applications yet">{canManage ? "Create an application to issue credentials." : "An integration manager can create applications."}</EmptyState>}>
        {(applications) => (
          <div className="space-y-4">
            {applications.map((app) => {
              const missing = ENV_KINDS.filter((k) => !app.environments.some((e) => e.kind === k));
              return (
                <Card key={app.id} className="ios-glass-card p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h2 className="text-base font-extrabold">{app.name}</h2>
                      <p className="font-mono text-[11px] text-[var(--text-muted)]">{app.slug}</p>
                      {app.description ? <p className="mt-1 text-xs text-[var(--text-secondary)]">{app.description}</p> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge size="sm" tone={app.status === "ACTIVE" ? "success" : "warning"}>{humanize(app.status)}</StatusBadge>
                      {canManage && missing.length > 0 ? <Button size="sm" variant="secondary" onClick={() => open({ kind: "environment", app })}>Add environment</Button> : null}
                    </div>
                  </div>
                  {app.environments.length === 0 ? <p className="mt-3 text-xs text-[var(--text-muted)]">No environments yet.</p> : null}
                  {app.environments.map((env) => (
                    <section key={env.id} className="mt-4 rounded-xl border border-[var(--border-default)] p-4" aria-label={`${humanize(env.kind)} environment`}>
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="text-xs font-extrabold uppercase tracking-wider">{humanize(env.kind)} <StatusBadge size="sm" tone={env.status === "ACTIVE" ? "success" : "neutral"}>{humanize(env.status)}</StatusBadge></h3>
                        {canManage ? (
                          <span className="flex gap-1.5">
                            <Button size="sm" variant="secondary" onClick={() => open({ kind: "credential", environmentId: env.id, label: `${app.name} · ${humanize(env.kind)}` })}><KeyRound className="size-3.5" aria-hidden /> Issue credential</Button>
                            <Button size="sm" variant="ghost" onClick={() => open({ kind: "webhook", environmentId: env.id, label: `${app.name} · ${humanize(env.kind)}` })}>Add webhook</Button>
                          </span>
                        ) : null}
                      </div>
                      {env.credentials.length === 0 ? <p className="text-xs text-[var(--text-muted)]">No credentials.</p> : (
                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[620px] text-left text-xs">
                            <caption className="sr-only">Credentials for {app.name} {env.kind}</caption>
                            <thead><tr className="text-[10px] uppercase text-[var(--text-muted)]"><th scope="col" className="py-1.5 pr-3">Name</th><th scope="col" className="pr-3">Client ID</th><th scope="col" className="pr-3">Scopes</th><th scope="col" className="pr-3">Status</th><th scope="col" className="pr-3">Last used</th><th scope="col"><span className="sr-only">Actions</span></th></tr></thead>
                            <tbody className="divide-y divide-[var(--border-subtle)]">
                              {env.credentials.map((c) => (
                                <tr key={c.id}>
                                  <td className="py-2 pr-3 font-bold">{c.name}</td>
                                  <td className="pr-3 font-mono text-[10px]">{c.client_id}</td>
                                  <td className="pr-3">{c.scopes.join(", ")}</td>
                                  <td className="pr-3"><StatusBadge size="sm" tone={c.status === "ACTIVE" ? "success" : "neutral"}>{humanize(c.status)}</StatusBadge></td>
                                  <td className="pr-3">{c.last_used_at ? fmt.dateTime(c.last_used_at) : "Never"}</td>
                                  <td className="text-right">
                                    {canManage && c.status === "ACTIVE" ? (
                                      <span className="flex justify-end gap-1.5">
                                        <Button size="sm" variant="secondary" onClick={() => open({ kind: "rotate", credential: c })} aria-label={`Rotate ${c.name}`}>Rotate</Button>
                                        <Button size="sm" variant="ghost" onClick={() => open({ kind: "revoke", credential: c })} aria-label={`Revoke ${c.name}`}>Revoke</Button>
                                      </span>
                                    ) : null}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {env.webhooks.length > 0 ? (
                        <ul className="mt-3 space-y-1 text-xs" aria-label="Webhook endpoints">
                          {env.webhooks.map((w) => (
                            <li key={w.id} className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-mono">{w.url}</span>
                              <span className="text-[var(--text-secondary)]">{w.event_types.join(", ")} · <StatusBadge size="sm" tone={w.status === "ACTIVE" ? "success" : "neutral"}>{humanize(w.status)}</StatusBadge></span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </section>
                  ))}
                </Card>
              );
            })}
          </div>
        )}
      </QueryBoundary>

      <ConnectionsSection />

      <CapabilityGate code="api_usage_metrics" title="API usage & request logs" unavailable={<>Request metering and logs aren't recorded yet. Each credential shows when it was last used.</>}><span /></CapabilityGate>

      <ActionDialog
        open={dialog !== null}
        title={dialog ? titles[dialog.kind] : ""}
        description={
          dialog?.kind === "credential" || dialog?.kind === "webhook" ? dialog.label
          : dialog?.kind === "rotate" ? `A new secret is issued and “${dialog.credential.name}” stops working immediately.`
          : dialog?.kind === "revoke" ? `“${dialog.credential.name}” stops working immediately. This can't be undone.`
          : undefined
        }
        confirmLabel={dialog?.kind === "revoke" ? "Revoke" : dialog?.kind === "rotate" ? "Rotate" : "Save"}
        tone={dialog?.kind === "revoke" || dialog?.kind === "rotate" ? "danger" : "primary"}
        busy={busy}
        disabled={disabled}
        error={dialogError}
        onClose={() => setDialog(null)}
        onConfirm={confirm}
      >
        {dialog?.kind === "application" ? (
          <>
            <label className="block text-xs font-bold">Name<input value={form.name} onChange={(e) => set({ name: e.target.value })} className={dialogField} maxLength={150} /></label>
            <label className="block text-xs font-bold">Slug<input value={form.slug} onChange={(e) => set({ slug: e.target.value })} className={dialogField} pattern="[-a-zA-Z0-9_]+" maxLength={100} /></label>
            <label className="block text-xs font-bold">Description (optional)<textarea rows={2} value={form.description} onChange={(e) => set({ description: e.target.value })} className={dialogField} /></label>
          </>
        ) : null}
        {dialog?.kind === "environment" ? (
          <label className="block text-xs font-bold">Environment
            <select value={form.kind} onChange={(e) => set({ kind: e.target.value })} className={dialogField}>
              {ENV_KINDS.filter((k) => !dialog.app.environments.some((e) => e.kind === k)).map((k) => <option key={k} value={k}>{humanize(k)}</option>)}
            </select>
          </label>
        ) : null}
        {dialog?.kind === "credential" ? (
          <>
            <label className="block text-xs font-bold">Name<input value={form.name} onChange={(e) => set({ name: e.target.value })} className={dialogField} maxLength={150} /></label>
            <fieldset><legend className="text-xs font-bold">Scopes</legend>
              {(scopes.data ?? []).map((s) => (
                <label key={s.code} className="mt-1 flex cursor-pointer items-start gap-2 text-xs">
                  <input type="checkbox" className="mt-0.5 accent-[var(--accent-emerald)]" checked={form.scopes.includes(s.code)} onChange={() => set({ scopes: form.scopes.includes(s.code) ? form.scopes.filter((c) => c !== s.code) : [...form.scopes, s.code] })} />
                  <span><span className="font-mono">{s.code}</span><span className="block text-[var(--text-muted)]">{s.name}</span></span>
                </label>
              ))}
              {scopes.data?.length === 0 ? <p className="text-xs text-[var(--text-muted)]">No scopes are defined yet.</p> : null}
            </fieldset>
          </>
        ) : null}
        {dialog?.kind === "webhook" ? (
          <>
            <label className="block text-xs font-bold">URL (HTTPS required in production)<input type="url" value={form.url} onChange={(e) => set({ url: e.target.value })} className={dialogField} /></label>
            <label className="block text-xs font-bold">Event types (comma-separated)<input value={form.events} onChange={(e) => set({ events: e.target.value })} className={dialogField} placeholder="case.created, case.resolved" /></label>
          </>
        ) : null}
      </ActionDialog>
      <SecretDialog secret={secret} onClose={() => setSecret(null)} />
    </div>
  );
}
