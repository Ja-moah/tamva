import {
  Copy,
  Download,
  Filter,
  Search,
  ShieldCheck,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { RiskDistributionChart } from "../components/charts/risk-distribution-chart";
import { StatusBadge, type StatusTone } from "../components/feedback/status-badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DetailDrawer } from "../components/ui/detail-drawer";
import { useToast } from "../components/ui/toast";

export interface RiskEvent {
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
  overrideNote?: string;
}

const initialMockRiskEvents: RiskEvent[] = [
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
  const [events, setEvents] = useState<RiskEvent[]>(initialMockRiskEvents);
  const [filterDecision, setFilterDecision] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<RiskEvent | null>(null);
  const [isSimulateModalOpen, setIsSimulateModalOpen] = useState(false);
  const { toast } = useToast();

  // Simulation form
  const [simForm, setSimForm] = useState({
    customer: "Kofi Mensah",
    institution: "Apex Bank PLC",
    amount: "45000",
    channel: "Instant Inter-Bank Wire",
    location: "London, UK",
  });

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
    const updated: RiskEvent = {
      ...selectedEvent,
      decision: "ALLOW",
      tone: "success",
      overrideNote: "Manually authorized by senior risk officer via console override.",
    };

    setEvents((prev) => prev.map((e) => (e.id === selectedEvent.id ? updated : e)));
    setSelectedEvent(updated);
    toast({
      title: "Decision Overridden",
      description: `Event ${selectedEvent.id} cleared and logged to immutable audit ledger.`,
      type: "success",
    });
  };

  const handleSimulateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Math.floor(99043 + Math.random() * 200);
    const newId = `RSK-${num}`;
    const parsedAmount = parseFloat(simForm.amount) || 1000;

    let score = 15;
    let decision: "ALLOW" | "REVIEW" | "BLOCK" = "ALLOW";
    let tone: StatusTone = "success";
    const reasons: string[] = [];

    if (simForm.location.includes("UK") || simForm.location.includes("UAE") || simForm.location.includes("NG")) {
      score += 45;
      reasons.push("GEO_IMPOSSIBLE_TRAVEL");
    }
    if (parsedAmount > 50000) {
      score += 35;
      reasons.push("HIGH_VALUE_THRESHOLD");
    } else if (parsedAmount > 10000) {
      score += 20;
      reasons.push("VELOCITY_SPIKE_1HR");
    }

    if (score >= 70) {
      decision = "BLOCK";
      tone = "danger";
    } else if (score >= 35) {
      decision = "REVIEW";
      tone = "warning";
    } else {
      reasons.push("KNOWN_DEVICE", "NORMAL_TIME_WINDOW");
    }

    const formattedAmount = `GH₵ ${parsedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;

    const newEvt: RiskEvent = {
      id: newId,
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      institution: simForm.institution,
      customer: `${simForm.customer} (ID: GHA-${Math.floor(1000 + Math.random() * 9000)})`,
      amount: formattedAmount,
      score,
      decision,
      tone,
      reasonCodes: reasons,
      channel: simForm.channel,
      ipLocation: simForm.location,
    };

    setEvents((prev) => [newEvt, ...prev]);
    setIsSimulateModalOpen(false);
    setSelectedEvent(newEvt);

    toast({
      title: "Simulation Evaluated",
      description: `${newId} assessed: Score ${score}/100 [${decision}]`,
      type: decision === "BLOCK" ? "error" : "success",
    });
  };

  const handleExportEvents = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filtered, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `tamva-risk-events-${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toast({
      title: "Risk Events Exported",
      description: `Downloaded ${filtered.length} risk evaluation records (.json)`,
      type: "info",
    });
  };

  const handleDownloadForensicPacket = (evt: RiskEvent) => {
    const forensicPayload = {
      header: {
        spec: "TAMVA_FORENSIC_AUDIT_v1",
        eventId: evt.id,
        timestamp: evt.timestamp,
        signature: `0x${Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`,
      },
      evaluation: evt,
      telemetry: {
        mlModel: "TAMVA-GBoost-v4.2-WestAfrica",
        inferenceLatencyMs: 14.8,
        postgresOutboxPartition: "outbox_2026_09",
      },
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(forensicPayload, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `forensic-packet-${evt.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toast({
      title: "Forensic Packet Downloaded",
      description: `Cryptographic audit packet for ${evt.id} saved.`,
      type: "info",
    });
  };

  const blockedCount = events.filter((e) => e.decision === "BLOCK").length;
  const reviewCount = events.filter((e) => e.decision === "REVIEW").length;
  const allowCount = events.filter((e) => e.decision === "ALLOW").length;

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="ios-hero-banner p-7 sm:p-9 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="font-mono text-xs font-extrabold text-[var(--accent-gold)] uppercase tracking-wider bg-[var(--bg-surface-elevated)] border border-[var(--accent-gold-border)] px-3 py-1 rounded-full shadow-xs">
                Risk &amp; Fraud Assessment
              </span>
              <span className="text-[var(--text-muted)]">·</span>
              <StatusBadge tone="success" size="md">
                Active Policy Stream
              </StatusBadge>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Risk Events &amp; Policy Stream
            </h1>
            <p className="text-lg text-[var(--text-secondary)] mt-2.5 max-w-3xl leading-relaxed font-medium">
              Real-time transaction evaluation, anomaly scores, velocity rules, and sanction checks
              evaluated by TAMVA before settlement finality across participating financial institutions.
            </p>
          </div>

          <div className="flex items-center gap-3.5 shrink-0">
            <Button variant="secondary" size="lg" onClick={handleExportEvents} className="gap-2.5 shadow-xs text-base font-bold rounded-xl">
              <Download className="size-4.5 text-[var(--text-muted)]" />
              <span>Export Stream</span>
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsSimulateModalOpen(true)}
              className="gap-2.5 shadow-md font-bold text-base rounded-xl"
            >
              <Zap className="size-4.5" />
              <span>Evaluate Transaction</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Band */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-6 ios-glass-card">
          <p className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Evaluated Events</p>
          <p className="mt-3 text-4xl font-extrabold text-[var(--text-primary)] font-tabular">{events.length}</p>
          <p className="text-base text-[var(--text-secondary)] mt-2 font-medium">Active operational window</p>
        </Card>

        <Card className="p-6 ios-glass-card">
          <p className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Auto-Blocked</p>
          <p className="mt-3 text-4xl font-extrabold text-[var(--risk-critical)] font-tabular">{blockedCount} Blocked</p>
          <p className="text-base text-[var(--text-muted)] mt-2 font-mono font-semibold">High confidence fraud</p>
        </Card>

        <Card className="p-6 ios-glass-card">
          <p className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Pending Review</p>
          <p className="mt-3 text-4xl font-extrabold text-[var(--risk-high)] font-tabular">{reviewCount} In Review</p>
          <p className="text-base text-[var(--text-secondary)] mt-2 font-medium">Compliance triage required</p>
        </Card>

        <Card className="p-6 ios-glass-card">
          <p className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Cleared / Allowed</p>
          <p className="mt-3 text-4xl font-extrabold text-[var(--accent-emerald)] font-tabular">{allowCount} Allowed</p>
          <p className="text-base text-[var(--accent-emerald)] mt-2 font-bold">Low anomaly threshold</p>
        </Card>
      </div>

      {/* Risk Distribution Chart */}
      <Card className="p-7 ios-glass-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Real-Time Decision &amp; Severity Distribution
            </h2>
            <p className="text-base text-[var(--text-secondary)] mt-1 font-medium">
              Live ratio of automatic approvals, secondary manual reviews, and hard policy blocks.
            </p>
          </div>
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent-gold)] font-bold px-3 py-1 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-default)]">
            Policy Engine v4.2
          </span>
        </div>
        <RiskDistributionChart />
      </Card>

      {/* Filter and Search Bar */}
      <Card className="p-5 ios-glass-card">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by Event Reference, Customer Name, Bank, or Reason Code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] pl-10 pr-3.5 py-2.5 text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-gold)] focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="size-4 text-[var(--text-muted)]" />
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold mr-1">
              Decision:
            </span>
            {["ALL", "BLOCK", "REVIEW", "ALLOW"].map((decision) => (
              <button
                key={decision}
                onClick={() => setFilterDecision(decision)}
                className={`rounded-md px-3.5 py-2 text-xs font-mono font-bold transition-colors cursor-pointer ${
                  filterDecision === decision
                    ? "bg-[var(--accent-gold)] text-black shadow-xs"
                    : "border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {decision}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Events Stream Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead className="border-b border-[var(--border-default)] bg-[var(--bg-surface-elevated)] font-mono uppercase tracking-wider text-[var(--text-muted)] text-xs">
              <tr>
                <th className="px-5 py-3.5">Event ID</th>
                <th className="px-4 py-3.5">Timestamp</th>
                <th className="px-4 py-3.5">Customer &amp; Institution</th>
                <th className="px-4 py-3.5">Amount</th>
                <th className="px-4 py-3.5">Score</th>
                <th className="px-4 py-3.5">Decision</th>
                <th className="px-4 py-3.5">Triggered Reason Codes</th>
                <th className="px-5 py-3.5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.map((evt) => (
                <tr
                  key={evt.id}
                  onClick={() => setSelectedEvent(evt)}
                  className="hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-4 font-mono font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-gold)] transition-colors">
                    {evt.id}
                  </td>
                  <td className="px-4 py-4 font-mono text-sm text-[var(--text-secondary)] whitespace-nowrap">
                    {evt.timestamp}
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-[var(--text-primary)] text-base">{evt.customer}</p>
                    <p className="text-sm text-[var(--text-muted)]">{evt.institution}</p>
                  </td>
                  <td className="px-4 py-4 font-mono font-extrabold text-[var(--text-primary)] font-tabular whitespace-nowrap">
                    {evt.amount}
                  </td>
                  <td className="px-4 py-4 font-mono font-extrabold text-base">
                    <span
                      className={
                        evt.score >= 70
                          ? "text-[var(--risk-critical)]"
                          : evt.score >= 35
                          ? "text-[var(--risk-high)]"
                          : "text-[var(--accent-emerald)]"
                      }
                    >
                      {evt.score}/100
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge tone={evt.tone} size="md">
                      {evt.decision}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                      {evt.reasonCodes.map((code) => (
                        <span
                          key={code}
                          className="rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] px-2 py-0.5 font-mono text-xs text-[var(--text-secondary)] font-medium"
                        >
                          {code}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-mono text-sm text-[var(--accent-gold)] font-bold group-hover:underline">
                      Audit →
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-base text-[var(--text-muted)]">
                    No risk events match the specified filter or query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Risk Event Detail Drawer */}
      <DetailDrawer
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent ? `Risk Audit: ${selectedEvent.id}` : "Event Audit"}
        subtitle={selectedEvent?.institution}
        badge={
          selectedEvent ? (
            <StatusBadge tone={selectedEvent.tone} size="md">
              {selectedEvent.decision}
            </StatusBadge>
          ) : null
        }
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2">
              {selectedEvent && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => handleDownloadForensicPacket(selectedEvent)}
                  className="gap-2"
                >
                  <Download className="size-4" />
                  <span>Forensic Packet</span>
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedEvent?.decision === "BLOCK" || selectedEvent?.decision === "REVIEW" ? (
                <Button variant="emerald" size="md" onClick={handleOverride} className="gap-2 font-semibold">
                  <ShieldCheck className="size-4" />
                  <span>Override &amp; Allow</span>
                </Button>
              ) : null}
              <Button variant="secondary" size="md" onClick={() => setSelectedEvent(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        }
      >
        {selectedEvent && (
          <div className="space-y-6">
            {/* Risk Score Hero Card */}
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Anomaly &amp; Fraud Score
                  </p>
                  <p className="mt-1 text-3xl font-extrabold text-[var(--text-primary)] font-tabular">
                    {selectedEvent.score}{" "}
                    <span className="text-base font-normal text-[var(--text-secondary)]">/ 100</span>
                  </p>
                </div>
                <StatusBadge tone={selectedEvent.tone} size="md">
                  {selectedEvent.decision}
                </StatusBadge>
              </div>

              {selectedEvent.overrideNote && (
                <div className="mt-3.5 rounded-lg border border-[var(--risk-low-border)] bg-[var(--risk-low-bg)] p-3 text-sm text-[var(--risk-low-text)] font-medium">
                  {selectedEvent.overrideNote}
                </div>
              )}
            </div>

            {/* Event Specification */}
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2.5 font-bold">
                Transaction Telemetry
              </p>
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] divide-y divide-[var(--border-subtle)] text-base">
                <div className="flex justify-between px-4 py-3.5">
                  <span className="text-[var(--text-muted)] text-sm">Settlement Value</span>
                  <span className="font-mono font-extrabold text-[var(--text-primary)]">{selectedEvent.amount}</span>
                </div>
                <div className="flex justify-between px-4 py-3.5">
                  <span className="text-[var(--text-muted)] text-sm">Target Customer</span>
                  <span className="font-bold text-[var(--text-primary)]">{selectedEvent.customer}</span>
                </div>
                <div className="flex justify-between px-4 py-3.5">
                  <span className="text-[var(--text-muted)] text-sm">Payment Channel</span>
                  <span className="font-semibold text-[var(--text-primary)]">{selectedEvent.channel}</span>
                </div>
                <div className="flex justify-between px-4 py-3.5">
                  <span className="text-[var(--text-muted)] text-sm">IP / Geolocation Node</span>
                  <span className="font-mono text-[var(--text-secondary)] text-sm">{selectedEvent.ipLocation}</span>
                </div>
                <div className="flex justify-between px-4 py-3.5">
                  <span className="text-[var(--text-muted)] text-sm">Evaluated At</span>
                  <span className="font-mono text-[var(--text-secondary)] text-sm">{selectedEvent.timestamp}</span>
                </div>
              </div>
            </div>

            {/* Triggered Policy Rules */}
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2.5 font-bold">
                Triggered TAMVA Policy Rules
              </p>
              <div className="space-y-2">
                {selectedEvent.reasonCodes.map((rc) => (
                  <div
                    key={rc}
                    className="flex items-center justify-between rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-3"
                  >
                    <span className="font-mono text-sm font-bold text-[var(--accent-gold)]">{rc}</span>
                    <span className="text-xs text-[var(--text-muted)] font-mono">Weight: +35</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="pt-2 flex gap-3">
              <Button
                variant="secondary"
                size="md"
                onClick={() => handleCopyId(selectedEvent.id)}
                className="flex-1 gap-2"
              >
                <Copy className="size-4" />
                <span>Copy Event ID</span>
              </Button>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Transaction Evaluation Simulation Modal */}
      {isSimulateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-10 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={() => setIsSimulateModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-xl transform overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-6 shadow-[var(--shadow-lg)] transition-all z-10 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
              <div className="flex items-center gap-2.5">
                <Zap className="size-5 text-[var(--accent-gold)]" />
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  Simulate Risk Policy Evaluation
                </h2>
              </div>
              <button
                onClick={() => setIsSimulateModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSimulateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Customer Subject Name
                </label>
                <input
                  type="text"
                  required
                  value={simForm.customer}
                  onChange={(e) => setSimForm({ ...simForm, customer: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-base text-[var(--text-primary)] focus:border-[var(--accent-gold)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Amount (GH₵)
                  </label>
                  <input
                    type="number"
                    required
                    value={simForm.amount}
                    onChange={(e) => setSimForm({ ...simForm, amount: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-base text-[var(--text-primary)] font-mono focus:border-[var(--accent-gold)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Originating Bank
                  </label>
                  <select
                    value={simForm.institution}
                    onChange={(e) => setSimForm({ ...simForm, institution: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-gold)] focus:outline-none"
                  >
                    <option value="MTN Mobile Money">MTN Mobile Money</option>
                    <option value="Telecel Cash">Telecel Cash</option>
                    <option value="AirtelTigo Money">AirtelTigo Money</option>
                    <option value="Apex Bank PLC">Apex Bank PLC</option>
                    <option value="Zenith Digital Trust">Zenith Digital Trust</option>
                    <option value="Ecobank Regional Hub">Ecobank Regional Hub</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Payment Channel
                  </label>
                  <select
                    value={simForm.channel}
                    onChange={(e) => setSimForm({ ...simForm, channel: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-gold)] focus:outline-none"
                  >
                    <option value="Instant Inter-Bank Wire">Instant Inter-Bank Wire</option>
                    <option value="Mobile Money Outward">Mobile Money Outward</option>
                    <option value="Cross-Border Remittance">Cross-Border Remittance</option>
                    <option value="POS Card Payment">POS Card Payment</option>
                    <option value="ATM Cash Out">ATM Cash Out</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Originating Geolocation
                  </label>
                  <select
                    value={simForm.location}
                    onChange={(e) => setSimForm({ ...simForm, location: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-gold)] focus:outline-none"
                  >
                    <option value="Accra, GH">Accra, GH (Expected Local)</option>
                    <option value="Kumasi, GH">Kumasi, GH (Domestic)</option>
                    <option value="Lagos, NG (Expected: Accra, GH)">Lagos, NG (Anomaly Travel)</option>
                    <option value="London, UK (Unknown IP)">London, UK (Cross-Border IP)</option>
                    <option value="Dubai, UAE (Sanction High Risk)">Dubai, UAE (High Value)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-default)]">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setIsSimulateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" className="gap-2 font-semibold">
                  <Zap className="size-4" />
                  <span>Run Risk Rules Engine</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
