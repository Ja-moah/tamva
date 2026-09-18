import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  Clock,
  Code2,
  ExternalLink,
  Layers,
  Radio,
  RefreshCw,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { RiskDistributionChart } from "../components/charts/risk-distribution-chart";
import { RiskVelocityChart } from "../components/charts/risk-velocity-chart";
import { ThroughputSparkline } from "../components/charts/throughput-sparkline";
import { StatusBadge } from "../components/feedback/status-badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DetailDrawer } from "../components/ui/detail-drawer";
import { useToast } from "../components/ui/toast";
import { useSystemHealth } from "../features/system/use-system-health";

const domainModules = [
  {
    name: "Identity & Passport",
    code: "apps.identity",
    responsibility: "Customer identity verification, biometric hashes, and KYC tier boundaries",
    status: "Operational",
    tone: "success" as const,
    contract: "contracts.identity.v1",
    events: ["IdentityCreated", "KycTierPromoted", "CredentialRevoked"],
    endpoints: ["POST /api/v1/identity/verify", "GET /api/v1/identity/{id}/passport"],
  },
  {
    name: "Partner & Tenancy",
    code: "apps.partner",
    responsibility: "Institution isolation, multi-tenant scopes, and RBAC memberships",
    status: "Operational",
    tone: "success" as const,
    contract: "contracts.partner.v1",
    events: ["InstitutionOnboarded", "ScopeActivated", "ApiKeyRotated"],
    endpoints: ["GET /api/v1/partners/institutions", "POST /api/v1/partners/scope"],
  },
  {
    name: "Risk Engine & Scoring",
    code: "apps.risk",
    responsibility: "Real-time fraud detection, AML reason codes, and velocity limit evaluation",
    status: "Operational",
    tone: "success" as const,
    contract: "contracts.risk.v1",
    events: ["RiskEvaluated", "VelocityLimitExceeded", "FraudFlagTriggered"],
    endpoints: ["POST /api/v1/risk/evaluate", "GET /api/v1/risk/events"],
  },
  {
    name: "Case Management",
    code: "apps.cases",
    responsibility: "Alert review workflows, investigator assignment, and SAR filings",
    status: "Operational",
    tone: "success" as const,
    contract: "contracts.cases.v1",
    events: ["CaseOpened", "EvidenceAttached", "DecisionRecorded"],
    endpoints: ["GET /api/v1/cases/pending", "POST /api/v1/cases/{id}/escalate"],
  },
  {
    name: "Trust Network Rails",
    code: "apps.network",
    responsibility: "Inter-bank graph topology, cross-border consent routing, and settlement",
    status: "Operational",
    tone: "success" as const,
    contract: "contracts.network.v1",
    events: ["RailEstablished", "ConsentRouted", "NodeHealthPinged"],
    endpoints: ["GET /api/v1/network/topology", "POST /api/v1/network/route"],
  },
];

const initialLiveAuditEvents = [
  {
    id: "EVT-89201",
    time: "Just now",
    type: "Risk Decision",
    desc: "Apex Bank GH₵ 45,000 MoMo transfer passed fraud check (Score: 12/100)",
    tone: "success" as const,
  },
  {
    id: "EVT-89200",
    time: "2m ago",
    type: "Velocity Alert",
    desc: "Zenith Trust flagged 3 rapid authentication attempts from unrecognized IP",
    tone: "warning" as const,
  },
  {
    id: "EVT-89199",
    time: "4m ago",
    type: "Outbox Commit",
    desc: "1,200 transactional audit events committed to PostgreSQL outbox partition",
    tone: "info" as const,
  },
  {
    id: "EVT-89198",
    time: "7m ago",
    type: "Identity Verified",
    desc: "Customer GHA-908234-1 promoted to Tier 3 Passport status with biometric proof",
    tone: "success" as const,
  },
];

export function OverviewPage() {
  const health = useSystemHealth();
  const { toast } = useToast();
  const [selectedDomain, setSelectedDomain] = useState<typeof domainModules[0] | null>(null);
  const [liveEvents, setLiveEvents] = useState(initialLiveAuditEvents);
  const [simulating, setSimulating] = useState(false);

  const isConnected = health.data?.status === "ok" && health.data.database === "ok";

  const handleSimulateRisk = () => {
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
      const randomEventId = `EVT-${Math.floor(89202 + Math.random() * 500)}`;
      const newEvent = {
        id: randomEventId,
        time: "Just now",
        type: "Risk Evaluated",
        desc: "Simulated MoMo inter-bank settlement: Cleared with trust score 92/100",
        tone: "success" as const,
      };

      setLiveEvents((prev) => [newEvent, ...prev.slice(0, 5)]);

      toast({
        title: "Simulation Dispatched",
        description: `Dispatched ${randomEventId}: Score 14/100 (Clean AML clearance)`,
        type: "success",
      });
    }, 600);
  };

  const handleRefreshHealth = () => {
    health.refetch();
    toast({
      title: "Backend Ping Sent",
      description: "Queried backend /health/ verification endpoint successfully",
      type: "info",
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Operations Header Bar with iOS Glass Hero */}
      <div className="ios-hero-banner p-7 sm:p-9 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--accent-gold)] bg-[var(--bg-surface-elevated)] border border-[var(--accent-gold-border)] px-3 py-1 rounded-full shadow-xs">
                Pan-African Operations Center
              </span>
              <span className="text-[var(--text-muted)]">·</span>
              <StatusBadge tone={isConnected ? "success" : "warning"} pulse={isConnected} size="md">
                {isConnected ? "Engine Active (18ms)" : "Connecting Engine"}
              </StatusBadge>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Institutional Trust &amp; Risk Operations
            </h1>
            <p className="text-lg text-[var(--text-secondary)] mt-2.5 max-w-3xl leading-relaxed font-medium">
              Real-time transactional integrity, cross-border financial identity passporting, and
              automated risk intelligence across West Africa and PAPSS regional payment rails.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <Button
              variant="secondary"
              size="lg"
              onClick={handleRefreshHealth}
              loading={health.isFetching}
              className="gap-2.5 shadow-sm text-base font-bold rounded-xl"
            >
              <RefreshCw className="size-4.5" />
              <span>Ping Health</span>
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleSimulateRisk}
              loading={simulating}
              className="gap-2.5 shadow-md text-base font-bold rounded-xl"
            >
              <Zap className="size-4.5" />
              <span>Simulate Risk Event</span>
            </Button>
          </div>
        </div>
      </div>

      {/* 4-Column High-Density KPI Strip with Apple Glass Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-6 ios-glass-card">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
              Verified Passports
            </span>
            <ThroughputSparkline data={[20, 24, 28, 30, 35, 42, 48, 55, 60]} color="#d4a017" />
          </div>
          <p className="mt-3 text-4xl font-extrabold text-[var(--text-primary)] font-tabular">148,920</p>
          <div className="mt-2.5 flex items-center justify-between text-base">
            <span className="text-[var(--text-secondary)] font-medium">Tier 1–3 Passports</span>
            <span className="text-[#10b981] font-bold font-mono">+14.2% wk</span>
          </div>
        </Card>

        <Card className="p-6 ios-glass-card">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
              24h Risk Evaluations
            </span>
            <ThroughputSparkline data={[12, 16, 22, 35, 48, 52, 60, 58, 64]} color="#10b981" />
          </div>
          <p className="mt-3 text-4xl font-extrabold text-[var(--text-primary)] font-tabular">1,248,310</p>
          <div className="mt-2.5 flex items-center justify-between text-base">
            <span className="text-[var(--text-secondary)] font-medium">Avg Decision: 18ms</span>
            <span className="text-[#10b981] font-bold font-mono">99.8% Cleared</span>
          </div>
        </Card>

        <Card className="p-6 ios-glass-card">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
              Active Investigations
            </span>
            <ThroughputSparkline data={[8, 12, 10, 14, 11, 9, 7, 5, 3]} color="#e11d48" />
          </div>
          <p className="mt-3 text-4xl font-extrabold text-[var(--text-primary)] font-tabular">4 Cases</p>
          <div className="mt-2.5 flex items-center justify-between text-base">
            <span className="text-[var(--text-secondary)] font-medium">0 Breaches in 30d</span>
            <span className="text-[#e11d48] font-bold font-mono">1 Critical SLA</span>
          </div>
        </Card>

        <Card className="p-6 ios-glass-card">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">
              Participant Rails
            </span>
            <ThroughputSparkline data={[30, 32, 34, 36, 38, 40, 41, 42, 42]} color="#d4a017" />
          </div>
          <p className="mt-3 text-4xl font-extrabold text-[var(--text-primary)] font-tabular">42 Rails</p>
          <div className="mt-2.5 flex items-center justify-between text-base">
            <span className="text-[var(--text-secondary)] font-medium">Inter-bank Quorum</span>
            <span className="text-[#10b981] font-bold font-mono">100% Up</span>
          </div>
        </Card>
      </div>

      {/* Analytics Grid: 24h Velocity + Risk Tier Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
        <Card className="p-7 ios-glass-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2.5">
                <Activity className="size-6 text-[#10b981]" />
                24-Hour Transaction &amp; Risk Velocity Stream
              </h2>
              <p className="text-base text-[var(--text-secondary)] mt-1 font-medium">
                Aggregated Ghana Cedi (GH₵) settlement volume vs evaluated anomalies
              </p>
            </div>
            <span className="font-mono text-xs text-[var(--text-muted)] bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] px-3 py-1.5 rounded-lg font-bold">
              Hourly Resolution
            </span>
          </div>
          <RiskVelocityChart />
        </Card>

        <Card className="p-7 ios-glass-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] flex items-center gap-2.5">
                <ShieldCheck className="size-6 text-[var(--accent-gold)]" />
                Risk Classification Breakdown
              </h2>
              <p className="text-base text-[var(--text-secondary)] mt-1 font-medium">
                Distribution across 4 risk evaluation policy bands
              </p>
            </div>
          </div>
          <RiskDistributionChart />
        </Card>
      </div>

      {/* Domain Matrix Table & Live Operations Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6">
        {/* Backend Domain Service Mesh */}
        <Card className="overflow-hidden ios-glass-card">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] p-6 bg-[var(--bg-surface-subtle)]">
            <div>
              <div className="flex items-center gap-2.5">
                <Layers className="size-6 text-[var(--accent-gold)]" />
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  Backend Domain Service Mesh
                </h2>
              </div>
              <p className="text-base text-[var(--text-secondary)] mt-1 font-medium">
                Authoritative Django modular monolith boundaries &amp; public contracts
              </p>
            </div>
            <Button asChild variant="secondary" size="md" className="rounded-xl font-bold">
              <a href="/api/docs/" target="_blank" rel="noreferrer">
                <span>Swagger</span>
                <ArrowUpRight className="size-4 ml-1" />
              </a>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-base">
              <thead className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface-subtle)] font-mono uppercase tracking-wider text-[var(--text-muted)] text-xs font-bold">
                <tr>
                  <th className="px-6 py-4">Domain Service</th>
                  <th className="px-5 py-4">Module Code</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {domainModules.map((mod) => (
                  <tr
                    key={mod.name}
                    className="hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer group"
                    onClick={() => setSelectedDomain(mod)}
                  >
                    <td className="px-6 py-5">
                      <p className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-gold)] transition-colors text-lg">
                        {mod.name}
                      </p>
                      <p className="text-base text-[var(--text-secondary)] max-w-sm mt-1 leading-normal font-medium">
                        {mod.responsibility}
                      </p>
                    </td>
                    <td className="px-5 py-5 font-mono text-base text-[var(--text-secondary)] font-medium">
                      {mod.code}
                    </td>
                    <td className="px-5 py-5">
                      <StatusBadge tone={mod.tone} size="md">
                        {mod.status}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className="text-base font-bold text-[var(--accent-gold)] group-hover:underline cursor-pointer">
                        Inspect →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Live Event Stream */}
        <Card className="p-6 space-y-5 ios-glass-card">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
            <div className="flex items-center gap-2.5">
              <Radio className="size-5 text-[#10b981]" />
              <h2 className="text-xl font-bold text-[var(--text-primary)]">
                Live Operations Stream
              </h2>
            </div>
            <StatusBadge tone="success" size="md">
              Live Feed
            </StatusBadge>
          </div>

          <div className="space-y-3.5">
            {liveEvents.map((evt) => (
              <div
                key={evt.id}
                className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] p-4 hover:border-[var(--border-strong)] transition-all shadow-xs"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono font-bold text-[var(--accent-gold)] text-base">{evt.id}</span>
                  <span className="text-[var(--text-muted)] flex items-center gap-1.5 font-mono text-xs font-semibold">
                    <Clock className="size-4" />
                    {evt.time}
                  </span>
                </div>
                <p className="text-base font-semibold text-[var(--text-primary)] mt-2 leading-snug">{evt.desc}</p>
                <div className="mt-3 flex items-center gap-2.5">
                  <StatusBadge tone={evt.tone} size="sm">
                    {evt.type}
                  </StatusBadge>
                  <span className="font-mono text-xs text-[var(--text-muted)] font-semibold">
                    Verified on DB
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Button asChild variant="secondary" size="lg" className="w-full text-base font-bold rounded-xl">
            <Link to="/risk-events">
              <span>View All Risk Logs</span>
              <ArrowUpRight className="size-5 ml-2" />
            </Link>
          </Button>
        </Card>
      </div>

      {/* Domain Inspector Detail Drawer */}
      <DetailDrawer
        open={Boolean(selectedDomain)}
        onClose={() => setSelectedDomain(null)}
        title={selectedDomain?.name || "Domain Inspector"}
        subtitle={selectedDomain?.code}
        badge={
          selectedDomain ? (
            <StatusBadge tone={selectedDomain.tone}>{selectedDomain.status}</StatusBadge>
          ) : null
        }
        footer={
          <div className="flex items-center justify-between w-full">
            <Button asChild variant="outline" size="md" className="rounded-xl font-bold">
              <a href="/api/docs/" target="_blank" rel="noreferrer">
                <span>Swagger API Explorer</span>
                <ExternalLink className="size-4 ml-1.5" />
              </a>
            </Button>
            <Button variant="secondary" size="md" onClick={() => setSelectedDomain(null)} className="rounded-xl font-bold">
              Dismiss
            </Button>
          </div>
        }
      >
        {selectedDomain && (
          <div className="space-y-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] font-extrabold">
                Domain Responsibility
              </p>
              <p className="mt-2 text-lg text-[var(--text-primary)] leading-relaxed font-medium">
                {selectedDomain.responsibility}
              </p>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] font-extrabold">
                Public Contract Spec
              </p>
              <div className="mt-2 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] p-4 font-mono text-base font-bold text-[#10b981]">
                {selectedDomain.contract}
              </div>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] font-extrabold">
                Events Dispatched to Outbox
              </p>
              <div className="mt-2 space-y-2.5">
                {selectedDomain.events.map((e) => (
                  <div
                    key={e}
                    className="flex items-center gap-3 rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] px-4 py-3 text-base font-mono text-[var(--text-primary)] font-semibold"
                  >
                    <Code2 className="size-4.5 text-[var(--accent-gold)]" />
                    {e}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] font-extrabold">
                REST Endpoints
              </p>
              <div className="mt-2 space-y-2.5">
                {selectedDomain.endpoints.map((ep) => (
                  <div
                    key={ep}
                    className="rounded-xl bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] px-4 py-3 text-base font-mono text-[var(--text-secondary)] font-semibold"
                  >
                    {ep}
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
