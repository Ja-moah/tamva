import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { CapabilityGate } from "../components/data/gates";
import { PageHeader, Section } from "../components/data/page";
import { QueryBoundary } from "../components/data/states";
import { Button } from "../components/ui/button";
import { dialogField } from "../components/ui/action-dialog";
import { useToast } from "../components/ui/toast";
import { LOCALE_KEY, useLocaleSettings } from "../features/locale/use-locale";
import { listNotificationPreferences, setNotificationPreference } from "../features/notifications/api";
import { useSession } from "../features/session/use-session";
import { ApiError, apiRequest } from "../lib/api";
import { humanize } from "../lib/format";
import { localeSettingsSchema } from "@tamva/client-contracts";

const CHANNELS = ["IN_APP", "EMAIL", "SMS", "PUSH"];
// Categories the backend emits today; a preference row is created on first toggle.
const CATEGORIES = ["CASE"];

function NotificationPreferences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const prefs = useQuery({ queryKey: ["notifications", "preferences"], queryFn: ({ signal }) => listNotificationPreferences(signal) });
  const save = useMutation({
    mutationFn: setNotificationPreference,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications", "preferences"] }),
    onError: (error) => toast({ title: "Couldn't save preference", description: error instanceof ApiError ? error.message : undefined, type: "error" }),
  });
  return (
    <Section title="Notification preferences" description="Choose how you're told about each kind of event. Some mandatory notices can't be turned off.">
      <QueryBoundary query={prefs}>
        {(page) => {
          const enabled = (category: string, channel: string) => page.results.find((p) => p.category === category && p.channel === channel)?.enabled ?? true;
          const categories = [...new Set([...CATEGORIES, ...page.results.map((p) => p.category)])];
          return (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[420px] text-left text-xs">
                <caption className="sr-only">Notification preferences by category and channel</caption>
                <thead><tr className="border-b border-[var(--border-default)]"><th scope="col" className="py-2 pr-3 text-[10px] uppercase text-[var(--text-muted)]">Category</th>{CHANNELS.map((c) => <th key={c} scope="col" className="px-2 py-2 text-center font-bold">{humanize(c)}</th>)}</tr></thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {categories.map((category) => (
                    <tr key={category}>
                      <th scope="row" className="py-2 pr-3 text-left font-semibold">{humanize(category)}</th>
                      {CHANNELS.map((channel) => (
                        <td key={channel} className="px-2 py-2 text-center">
                          <input type="checkbox" className="size-4 cursor-pointer accent-[var(--accent-emerald)]" aria-label={`${humanize(category)} via ${humanize(channel)}`} checked={enabled(category, channel)} disabled={save.isPending} onChange={(e) => save.mutate({ category, channel, enabled: e.target.checked })} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }}
      </QueryBoundary>
    </Section>
  );
}

function LocaleSettingsCard() {
  const { can } = useSession();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const settings = useLocaleSettings();
  const canEdit = can("institution:manage");
  const [draft, setDraft] = useState<Record<string, string>>({});
  const save = useMutation({
    mutationFn: (body: Record<string, string>) => apiRequest({ method: "PATCH", path: "/institution/locale/", body, schema: localeSettingsSchema }),
    onSuccess: () => {
      setDraft({});
      toast({ title: "Regional settings saved", type: "success" });
      return queryClient.invalidateQueries({ queryKey: LOCALE_KEY });
    },
  });
  const error = save.error instanceof ApiError ? JSON.stringify(save.error.details) : null;
  return (
    <Section title="Regional settings" description="Country, currency, time zone and language used to present dates and amounts. Original transaction amounts and currencies are never converted.">
      <QueryBoundary query={settings}>
        {(s) => {
          const value = (key: "country_code" | "default_currency" | "timezone" | "locale") => draft[key] ?? s[key];
          return (
            <form onSubmit={(e) => { e.preventDefault(); save.mutate(draft); }} className="grid gap-3 sm:grid-cols-2">
              {s.is_default ? <p className="col-span-full text-xs text-[var(--text-muted)]">Showing platform defaults; nothing has been chosen for this institution yet.</p> : null}
              {([["country_code", "Country (ISO 3166)"], ["default_currency", "Default currency (ISO 4217)"], ["timezone", "Time zone (IANA)"], ["locale", "Language / locale (BCP 47)"]] as const).map(([key, label]) => (
                <label key={key} className="block text-xs font-bold">{label}
                  <input value={value(key)} disabled={!canEdit} onChange={(e) => setDraft({ ...draft, [key]: e.target.value })} className={dialogField} />
                </label>
              ))}
              {error ? <p role="alert" className="col-span-full text-xs text-[var(--risk-high-text)]">{error}</p> : null}
              {canEdit ? <div className="col-span-full"><Button type="submit" variant="primary" disabled={Object.keys(draft).length === 0} loading={save.isPending}>Save regional settings</Button></div> : <p className="col-span-full text-xs text-[var(--text-muted)]">Only an institution administrator can change these.</p>}
            </form>
          );
        }}
      </QueryBoundary>
    </Section>
  );
}

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Settings" title="Settings" description="Your notification preferences and your institution's regional settings." />
      <NotificationPreferences />
      <LocaleSettingsCard />
      <CapabilityGate code="quiet_hours" title="Quiet hours" unavailable={<>Scheduled do-not-disturb windows aren't supported by the notification service yet.</>}><span /></CapabilityGate>
    </div>
  );
}
