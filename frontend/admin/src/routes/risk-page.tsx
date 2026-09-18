import { AlertTriangle, Copy, ExternalLink, Search } from "lucide-react";
import { useState } from "react";

import { RiskDistributionChart } from "../components/charts/risk-distribution-chart";
import { StatusBadge, type StatusTone } from "../components/feedback/status-badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DetailDrawer } from "../components/ui/detail-drawer";
import { useToast } from "../components/ui/toast";

interface RiskEvent {
  id: string;
  timestamp: string;
  institution: string;
  customer: string;
  amount: string;
  score: number;
  decision: "ALLOW" | "REVIEW" | "BLOCK";
  tone: StatusTone;
  reasonCodes: string[];
  channel: string;
  ipLocation: string;
}

const mockRiskEvents: RiskEvent[] = [
  {
    id: "RSK-99042",
    timestamp: "2026-09-17 02:04:12",
    institution: "Apex Bank PLC",
    customer: "Kofi Mensah (ID: GHA-8921)",
    amount: "GH₵ 78,500.00",
    score: 88,
    decision: "BLOCK",
    tone: "danger",
    reasonCodes: ["GEO_IMPOSSIBLE_TRAVEL", "DEVICE_FINGERPRINT_MISMATCH"],
    channel: "Instant Inter-Bank Wire",
    ipLocation: "Lagos, NG (Expected: Accra, GH)",
  },
  {
    id: "RSK-99041",
    timestamp: "2026-09-17 02:01:45",
    institution: "Zenith Digital Trust",
    customer: "Abena Osei (ID: GHA-4412)",
    amount: "GH₵ 12,300.00",
    score: 42,
    decision: "REVIEW",
    tone: "warning",
    reasonCodes: ["VELOCITY_SPIKE_1HR", "NEW_PAYEE_RECIPIENT"],
    channel: "Mobile Money Outward",
    ipLocation: "Kumasi, GH",
  },
  {
    id: "RSK-99040",
    timestamp: "2026-09-17 01:58:30",
    institution: "Ecobank Regional Hub",
    customer: "Kwame Asante (ID: GHA-7820)",
    amount: "GH₵ 3,450.00",
    score: 12,
    decision: "ALLOW",
    tone: "success",
    reasonCodes: ["WHITELISTED_BENEFICIARY", "BIOMETRIC_MATCH_99"],
    channel: "POS Card Payment",
    ipLocation: "Accra, GH",
  },
  {
    id: "RSK-99039",
    timestamp: "2026-09-17 01:54:10",
    institution: "Apex Bank PLC",
    customer: "Esi Badu (ID: GHA-1093)",
    amount: "GH₵ 500.00",
    score: 8,
    decision: "ALLOW",
    tone: "success",
    reasonCodes: ["KNOWN_DEVICE", "NORMAL_TIME_WINDOW"],
    channel: "ATM Cash Out",
    ipLocation: "Takoradi, GH",
  },
  {
    id: "RSK-99038",
    timestamp: "2026-09-17 01:48:22",
    institution: "Zenith Digital Trust",
    customer: "Musa Ibrahim (ID: GHA-6671)",
    amount: "GH₵ 95,000.00",
    score: 94,
    decision: "BLOCK",
    tone: "danger",
    reasonCodes: ["SANCTION_NAME_MATCH_88", "HIGH_VALUE_THRESHOLD"],
    channel: "Cross-Border Remittance",
    ipLocation: "Dubai, UAE",
  },
];

export function RiskPage() {
  const [events] = useState<RiskEvent[]>(mockRiskEvents);
  const [filterDecision, setFilterDecision] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<RiskEvent | null>(null);
  const { toast } = useToast();

  const filtered = events.filter((evt) => {
    const matchesFilter = filterDecision === "ALL" || evt.decision === filterDecision;
    const matchesSearch =
      evt.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.reasonCodes.some((rc) => rc.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({
      title: "Copied to Clipboard",
      description: `Risk Event reference ${id} copied`,
      type: "info",
    });
  };

  const handleOverride = () => {
    if (!selectedEvent) return;
    toast({
      title: "Decision Overridden",
      description: `Event ${selectedEvent.id} marked as manually approved by compliance officer`,
      type: "success",
    });
    setSelectedEvent(null);
  };

  return (
    <div className="space-y-7">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-[var(--border-default)]">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="font-mono text-xs font-bold text-[var(--accent-gold)] uppercase tracking-wider">
              Risk &amp; Fraud Assessment
            </span>
            <span className="text-[var(--border-strong)]">·</span>
            <StatusBadge tone="success" size="md">
              Active Evaluation Stream
            </StatusBadge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            Risk Events &amp; Policy Stream
          </h1>
          <p className="text-base text-[var(--text-secondary)] mt-1.5 max-w-3xl leading-relaxed">
            Real-time transaction evaluation, anomaly scores, velocity rules, and sanction checks
            evaluated by TAMVA before settlement finality.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button asChild variant="secondary" size="md" className="gap-2">
            <a href="/api/docs/" target="_blank" rel="noreferrer">
              <ExternalLink className="size-4 text-[var(--text-muted)]" />
              <span>API Specs</span>
            </a>
          </Button>
        </div>
      </div>

      {/* Risk Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-l-4 border-l-[#10b981]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#10b981]">
              Low Risk (0–30)
            </span>
            <span className="size-2.5 rounded-full bg-[#10b981]" />
          </div>
          <p className="mt-2.5 text-3xl font-extrabold text-[var(--text-primary)] font-tabular">98.4%</p>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">Auto-cleared transactions</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-[#d4a017]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#d4a017]">
              Medium Risk (31–70)
            </span>
            <span className="size-2.5 rounded-full bg-[#d4a017]" />
          </div>
          <p className="mt-2.5 text-3xl font-extrabold text-[var(--text-primary)] font-tabular">1.2%</p>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">Stepped up to 2FA / Review</p>
        </Card>

        <Card className="p-5 border-l-4 border-l-[#e11d48]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#e11d48]">
              Critical Risk (71–100)
            </span>
            <span className="size-2.5 rounded-full bg-[#e11d48]" />
          </div>
          <p className="mt-2.5 text-3xl font-extrabold text-[var(--text-primary)] font-tabular">0.4%</p>
          <p className="mt-1.5 text-sm text-[var(--text-secondary)]">Blocked &amp; SAR flagged</p>
        </Card>
      </div>

      {/* Visual Policy Distribution Chart */}
      <Card className="p-6 border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3 border-b border-[var(--border-default)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Policy Evaluation Band Distribution (24h)
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Aggregate distribution of evaluated transactions across rule bands, sanction filters, and velocity models.
            </p>
          </div>
          <span className="font-mono text-xs font-semibold text-[var(--accent-gold)]">
            TAMVA Risk Core v2.1
          </span>
        </div>
        <RiskDistributionChart />
      </Card>

      {/* Filter and Search Bar */}
      <Card className="p-4 border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search risk events by ID, customer name, institution, or reason code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] pl-10 pr-3.5 py-2.5 text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-gold)] focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto">
            {["ALL", "ALLOW", "REVIEW", "BLOCK"].map((decision) => (
              <button
                key={decision}
                onClick={() => setFilterDecision(decision)}
                className={`rounded-md px-3.5 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                  filterDecision === decision
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                    : "border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {decision}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Risk Events Table */}
      <Card className="overflow-hidden border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead className="border-b border-[var(--border-default)] bg-[var(--bg-surface-subtle)] font-mono uppercase tracking-wider text-[var(--text-muted)] text-xs">
              <tr>
                <th className="px-5 py-3.5">Event Reference</th>
                <th className="px-4 py-3.5">Customer / Institution</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Risk Score</th>
                <th className="px-4 py-3.5">Decision</th>
                <th className="px-4 py-3.5">Evaluated Reason Codes</th>
                <th className="px-5 py-3.5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.map((evt) => (
                <tr
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className="hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-gold)] transition-colors text-base">
                        {evt.id}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyId(evt.id);
                        }}
                        className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 cursor-pointer"
                        aria-label="Copy event ID"
                      >
                        <Copy className="size-3.5" />
                      </button>
                    </div>
                    <span className="text-xs font-mono text-[var(--text-muted)] mt-0.5 block">
                      {evt.timestamp}
                    </span>
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-bold text-[var(--text-primary)] text-base">{evt.customer}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{evt.institution}</p>
                  </td>

                  <td className="px-4 py-4 font-mono font-bold text-[var(--text-primary)] font-tabular text-base">
                    {evt.amount}
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 rounded-full bg-[var(--bg-surface-active)] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            evt.score > 70
                              ? "bg-[#e11d48]"
                              : evt.score > 30
                              ? "bg-[#d4a017]"
                              : "bg-[#10b981]"
                          }`}
                          style={{ width: `${evt.score}%` }}
                        />
                      </div>
                      <span className="font-mono font-bold text-[var(--text-primary)] font-tabular text-sm">
                        {evt.score}/100
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <StatusBadge tone={evt.tone} size="md">
                      {evt.decision}
                    </StatusBadge>
                  </td>

                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1.5 max-w-sm">
                      {evt.reasonCodes.map((rc) => (
                        <span
                          key={rc}
                          className="rounded-md border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] px-2.5 py-1 font-mono text-xs font-medium text-[var(--text-secondary)]"
                        >
                          {rc}
                        </span>
                      ))}
                    </div>
                  </td>

                  <td className="px-5 py-4 text-right">
                    <span className="font-semibold text-sm text-[var(--accent-gold)] group-hover:underline cursor-pointer">
                      Inspect →
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Risk Event Detail Drawer */}
      <DetailDrawer
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.id || "Risk Event"}
        subtitle={selectedEvent?.customer}
        badge={
          selectedEvent ? (
            <StatusBadge tone={selectedEvent.tone} size="md">{selectedEvent.decision}</StatusBadge>
          ) : null
        }
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="danger" size="md" onClick={handleOverride}>
              Override Policy Flag
            </Button>
            <Button variant="secondary" size="md" onClick={() => setSelectedEvent(null)}>
              Dismiss
            </Button>
          </div>
        }
      >
        {selectedEvent && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] p-5">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-[var(--text-muted)] font-semibold">Calculated Anomaly Score</span>
                <span className="text-2xl font-extrabold text-[var(--text-primary)] font-tabular">
                  {selectedEvent.score} / 100
                </span>
              </div>
              <div className="mt-3 h-2.5 rounded-full bg-[var(--bg-surface-active)] overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    selectedEvent.score > 70
                      ? "bg-[#e11d48]"
                      : selectedEvent.score > 30
                      ? "bg-[#d4a017]"
                      : "bg-[#10b981]"
                  }`}
                  style={{ width: `${selectedEvent.score}%` }}
                />
              </div>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2.5 font-bold">
                Transaction Attributes
              </p>
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] divide-y divide-[var(--border-subtle)] text-base">
                <div className="flex justify-between px-4 py-3">
                  <span className="text-[var(--text-muted)] text-sm">Evaluated Amount</span>
                  <span className="font-bold text-[var(--text-primary)] font-tabular text-base">
                    {selectedEvent.amount}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-3">
                  <span className="text-[var(--text-muted)] text-sm">Payment Channel</span>
                  <span className="text-[var(--text-primary)] font-medium">{selectedEvent.channel}</span>
                </div>
                <div className="flex justify-between px-4 py-3">
                  <span className="text-[var(--text-muted)] text-sm">IP Geolocation</span>
                  <span className="text-[var(--accent-gold)] font-mono text-sm font-medium">
                    {selectedEvent.ipLocation}
                  </span>
                </div>
                <div className="flex justify-between px-4 py-3">
                  <span className="text-[var(--text-muted)] text-sm">Originating Institution</span>
                  <span className="text-[var(--text-primary)] font-medium">{selectedEvent.institution}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2.5 font-bold">
                Evaluated Policy Violations
              </p>
              <div className="space-y-2.5">
                {selectedEvent.reasonCodes.map((rc) => (
                  <div
                    key={rc}
                    className="flex items-start gap-3 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] p-3.5 text-sm"
                  >
                    <AlertTriangle className="size-4.5 text-[var(--accent-gold)] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-mono font-bold text-[var(--text-primary)] text-sm">{rc}</p>
                      <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed">
                        Matched behavioral velocity rule from active risk policy matrix.
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}

