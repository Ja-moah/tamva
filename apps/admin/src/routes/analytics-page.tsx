import { useState } from "react";

import { DistributionChart } from "../components/charts/distribution-chart";
import { TimeSeriesChart } from "../components/charts/time-series-chart";
import { CapabilityGate } from "../components/data/gates";
import { CountList, PageHeader, Section, StatCard, WindowPicker } from "../components/data/page";
import { QueryBoundary } from "../components/data/states";
import { useFormatters } from "../features/locale/use-locale";
import { useAnalytics } from "../features/overview/queries";
import { DECISION_COLORS, humanize, toNumber } from "../lib/format";
import { reasonText } from "../lib/reason-codes";

export function AnalyticsPage() {
  const [days, setDays] = useState(30);
  const analytics = useAnalytics(days);
  const fmt = useFormatters();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Insights"
        title="Analytics & insights"
        description="Aggregates over your institution's own risk events, cases and profiles. TAMVA doesn't report a prevented-loss amount, and doesn't compare you with other institutions."
        actions={<WindowPicker days={days} onChange={setDays} />}
      />
      <QueryBoundary query={analytics}>
        {(data) => {
          const trend = data.risk.daily.map((d) => ({
            x: fmt.date(d.day),
            Evaluations: d.evaluations,
            Blocked: d.blocked,
            Held: d.held,
            Challenged: d.challenged,
          }));
          const caseDays = new Map<string, { x: string; Opened: number; Resolved: number }>();
          for (const row of data.cases.opened_daily) caseDays.set(row.day, { x: fmt.date(row.day), Opened: row.count, Resolved: 0 });
          for (const row of data.cases.resolved_daily) {
            const existing = caseDays.get(row.day) ?? { x: fmt.date(row.day), Opened: 0, Resolved: 0 };
            caseDays.set(row.day, { ...existing, Resolved: row.count });
          }
          const caseTrend = [...caseDays.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
          const decisions = ["ALLOW", "CHALLENGE", "HOLD", "BLOCK"].map((name) => ({ name: humanize(name), count: data.risk.decisions[name] ?? 0, color: DECISION_COLORS[name] }));
          const coverage = toNumber(data.profiles.average_coverage_ratio);
          return (
            <>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Evaluations" value={fmt.number(data.risk.evaluations, 0)} hint={`Avg risk score ${fmt.number(data.risk.average_score, 1)} / 1000`} />
                <StatCard label="Open cases" value={fmt.number(data.cases.open, 0)} hint={`${data.cases.unresolved_high_severity} high severity`} />
                <StatCard label="Profiles computed" value={fmt.number(data.profiles.current_snapshots, 0)} hint={coverage === null ? undefined : `${fmt.number(coverage * 100, 0)}% average account coverage`} />
                <StatCard label="Financial Confidence" value={toNumber(data.financial_confidence.average_score) === null ? "—" : fmt.number(data.financial_confidence.average_score, 1)} hint={`${data.financial_confidence.customers_scored} customers · 0–100`} />
              </div>

              <Section title="Risk evaluations per day" description="Daily evaluations and the decisions that needed attention.">
                {trend.length === 0 ? <p className="py-10 text-center text-xs text-[var(--text-muted)]">No evaluations in this window.</p> : (
                  <TimeSeriesChart label="Risk evaluations per day" data={trend} series={[
                    { key: "Evaluations", label: "Evaluations", color: "var(--accent-emerald)" },
                    { key: "Blocked", label: "Blocked", color: DECISION_COLORS.BLOCK },
                    { key: "Held", label: "Held", color: DECISION_COLORS.HOLD },
                    { key: "Challenged", label: "Challenged", color: DECISION_COLORS.CHALLENGE },
                  ]} />
                )}
              </Section>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Section title="Risk score distribution" description="Risk Score runs 0–1000; higher means riskier.">
                  <DistributionChart label="Risk score distribution" unit="evaluations" data={data.risk.score_distribution.map((b) => ({ name: `${b.min}–${b.max - 1}`, count: b.count, color: b.min >= 700 ? DECISION_COLORS.BLOCK : b.min >= 400 ? DECISION_COLORS.HOLD : DECISION_COLORS.ALLOW }))} height={300} />
                </Section>
                <Section title="Decisions">
                  <DistributionChart label="Risk decisions" unit="evaluations" data={decisions} height={300} />
                </Section>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                <Section title="Top reason codes" description="What drives decisions most often.">
                  {data.risk.top_reason_codes.length === 0 ? <p className="text-xs text-[var(--text-muted)]">No reasons recorded in this window.</p> : (
                    <ol className="space-y-2 text-xs">
                      {data.risk.top_reason_codes.map((r) => (
                        <li key={r.code} className="flex items-center justify-between gap-3">
                          <span><span className="font-semibold">{reasonText(r.code)}</span><span className="block font-mono text-[10px] text-[var(--text-muted)]">{r.code}</span></span>
                          <span className="font-tabular font-bold">{r.count.toLocaleString()}</span>
                        </li>
                      ))}
                    </ol>
                  )}
                </Section>
                <Section title="Cases opened vs resolved">
                  {caseTrend.length === 0 ? <p className="py-10 text-center text-xs text-[var(--text-muted)]">No case activity in this window.</p> : (
                    <TimeSeriesChart label="Cases opened versus resolved per day" height={240} data={caseTrend} series={[{ key: "Opened", label: "Opened", color: DECISION_COLORS.HOLD }, { key: "Resolved", label: "Resolved", color: "var(--accent-emerald)" }]} />
                  )}
                </Section>
              </div>

              <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                <Section title="Financial Confidence bands"><CountList counts={data.financial_confidence.bands} /></Section>
                <Section title="Profile confidence levels"><CountList counts={data.profiles.by_confidence_level} format={humanize} /></Section>
                <Section title="Connections & consents">
                  <CountList counts={data.connectors.connections_by_status} format={humanize} />
                  <p className="mb-1.5 mt-3 font-mono text-[10px] font-bold uppercase text-[var(--text-muted)]">Consents</p>
                  <CountList counts={data.consents.by_status} format={humanize} />
                </Section>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <CapabilityGate code="fraud_prevented_value" title="Fraud prevented" unavailable={<>TAMVA records decisions, not verified prevented loss, so it doesn't report a prevented amount.</>}><span /></CapabilityGate>
                <CapabilityGate code="institution_comparison" title="Peer comparison" unavailable={<>Comparing institutions would require cross-institution data, which TAMVA doesn't expose.</>}><span /></CapabilityGate>
                <CapabilityGate code="geographic_risk" title="Geographic risk" unavailable={<>Regional risk needs validated location data at scale, which isn't collected yet.</>}><span /></CapabilityGate>
              </div>
            </>
          );
        }}
      </QueryBoundary>
    </div>
  );
}
