import { useState } from "react";

import { DistributionChart } from "../components/charts/distribution-chart";
import { CapabilityGate } from "../components/data/gates";
import { CountList, Section, StatCard, WindowPicker } from "../components/data/page";
import { QueryBoundary } from "../components/data/states";
import { CurrencyConverterUnavailable } from "../components/features/currency-converter-unavailable";
import { StatusBadge } from "../components/feedback/status-badge";
import { useOverview } from "../features/overview/queries";
import { useFormatters } from "../features/locale/use-locale";
import { useSystemHealth } from "../features/system/use-system-health";
import { DECISION_COLORS, humanize, toNumber } from "../lib/format";

const DECISION_ORDER = ["ALLOW", "CHALLENGE", "HOLD", "BLOCK"];
const CASE_ORDER = ["OPEN", "TRIAGED", "INVESTIGATING", "ACTIONED", "RESOLVED"];

export function OverviewPage() {
  const [days, setDays] = useState(30);
  const overview = useOverview(days);
  const health = useSystemHealth();
  const fmt = useFormatters();
  const connected = health.data?.status === "ok" && health.data.database === "ok";

  return (
    <div className="space-y-6">
      <div className="ios-hero-banner p-7 shadow-md sm:p-9">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2.5 flex items-center gap-2.5">
              <span className="rounded-full border border-[var(--accent-gold-border)] bg-[var(--bg-surface-elevated)] px-3 py-1 font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--accent-gold)] shadow-xs">
                Operations overview
              </span>
              <StatusBadge tone={connected ? "success" : health.isError ? "danger" : "warning"} pulse={connected}>
                {connected ? "API healthy" : health.isError ? "API unreachable" : "Checking API"}
              </StatusBadge>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
              Institutional trust &amp; risk operations
            </h1>
            <p className="mt-2.5 max-w-3xl text-base font-medium leading-relaxed text-[var(--text-secondary)]">
              What TAMVA has evaluated, what needs a person, and how your connections and consents are
              doing — computed from your institution&apos;s own records.
            </p>
          </div>
          <div className="shrink-0 self-start md:self-auto">
            <WindowPicker days={days} onChange={setDays} />
          </div>
        </div>
      </div>

      <QueryBoundary query={overview}>
        {(data) => {
          const decisions = DECISION_ORDER.map((name) => ({
            name: humanize(name),
            count: data.risk.decisions[name] ?? 0,
            color: DECISION_COLORS[name],
          }));
          const cases = CASE_ORDER.map((name) => ({ name: humanize(name), count: data.cases.by_status[name] ?? 0 }));
          const bands = Object.entries(data.financial_confidence.bands).map(([name, count]) => ({ name, count }));
          const held = (data.risk.decisions.HOLD ?? 0) + (data.risk.decisions.BLOCK ?? 0);
          return (
            <>
              <p className="text-xs text-[var(--text-muted)]">
                Last {data.window.days} days · updated {fmt.dateTime(data.generated_at)}
              </p>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Risk evaluations" value={fmt.number(data.risk.evaluations, 0)} hint={`Average risk score ${fmt.number(data.risk.average_score, 1)} / 1000`} />
                <StatCard label="Held or blocked" value={fmt.number(held, 0)} tone={held > 0 ? "warning" : "neutral"} hint="HOLD + BLOCK decisions" />
                <StatCard label="Open cases" value={fmt.number(data.cases.open, 0)} hint={`${data.cases.unassigned_open} unassigned`} />
                <StatCard label="High-severity unresolved" value={fmt.number(data.cases.unresolved_high_severity, 0)} tone={data.cases.unresolved_high_severity > 0 ? "danger" : "neutral"} hint="HIGH or CRITICAL priority" />
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Section title="Risk decisions" description="Decision mix for the selected window.">
                  <DistributionChart data={decisions} unit="evaluations" label="Risk decisions distribution" />
                </Section>
                <Section title="Cases by state" description="Every case, by backend workflow state.">
                  <DistributionChart data={cases} unit="cases" label="Cases by workflow state" />
                </Section>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <Section title="Financial Confidence" description={`${data.financial_confidence.score_scale}. Informational, not a credit decision.`}>
                  <p className="font-tabular mb-2 text-2xl font-extrabold">
                    {toNumber(data.financial_confidence.average_score) === null ? "—" : fmt.number(data.financial_confidence.average_score, 1)}
                    <span className="ml-1.5 text-xs font-semibold text-[var(--text-muted)]">
                      avg · {data.financial_confidence.customers_scored} customers scored
                    </span>
                  </p>
                  <CountList counts={Object.fromEntries(bands.map((b) => [b.name, b.count]))} />
                </Section>
                <Section title="Connections" description="Data connections and recent sync runs.">
                  <CountList counts={data.connectors.connections_by_status} format={humanize} />
                  <p className="mb-1.5 mt-3 font-mono text-[10px] font-bold uppercase text-[var(--text-muted)]">Sync runs</p>
                  <CountList counts={data.connectors.sync_runs_by_status} format={humanize} />
                </Section>
                <Section title="Consents &amp; passports" description="Customer-controlled sharing.">
                  <CountList counts={{ ...data.consents.by_status, "Expiring in 30 days": data.consents.expiring_within_30_days }} format={humanize} />
                  <p className="mb-1.5 mt-3 font-mono text-[10px] font-bold uppercase text-[var(--text-muted)]">Passport</p>
                  <CountList
                    counts={{
                      "Active shares": data.passport.active_shares,
                      "Created in window": data.passport.shares_created,
                      ...Object.fromEntries(Object.entries(data.passport.accesses_by_outcome).map(([k, v]) => [`Access ${k.toLowerCase()}`, v])),
                    }}
                  />
                </Section>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <Section title="Ledger activity" description="Postings in the window, in each transaction's own currency.">
                  <p className="font-tabular text-2xl font-extrabold">{fmt.number(data.ledger.postings, 0)}<span className="ml-1.5 text-xs font-semibold text-[var(--text-muted)]">postings</span></p>
                  {Object.keys(data.ledger.debit_volume_by_currency).length === 0 ? (
                    <p className="mt-2 text-xs text-[var(--text-muted)]">No debit volume in this window.</p>
                  ) : (
                    <ul className="mt-2 space-y-1 text-xs">
                      {Object.entries(data.ledger.debit_volume_by_currency).map(([currency, amount]) => (
                        <li key={currency} className="flex justify-between">
                          <span className="text-[var(--text-secondary)]">Debits, {currency}</span>
                          <span className="font-tabular font-bold">{fmt.money(amount, currency)}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-2 text-[11px] text-[var(--text-muted)]">Amounts are never converted between currencies.</p>
                </Section>
                <Section title="Notifications &amp; integrations">
                  <CountList
                    counts={{
                      Notifications: data.notifications.total,
                      Unread: data.notifications.unread,
                      "Active API credentials": data.credentials.active,
                      "Used in window": data.credentials.used_in_window,
                    }}
                  />
                </Section>
                <CapabilityGate code="currency_conversion" title="Cross-border conversion" unavailable={<>No approved exchange-rate provider is configured, so TAMVA shows original amounts only.</>}>
                  <CurrencyConverterUnavailable />
                </CapabilityGate>
              </div>
            </>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
