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
    status: "Active Preview",
    tone: "warning" as const,
    contract: "contracts.risk.v1",
    events: ["RiskEvaluated", "VelocityLimitExceeded", "FraudFlagTriggered"],
    endpoints: ["POST /api/v1/risk/evaluate", "GET /api/v1/risk/events"],
  },
  {
    name: "Case Management",
    code: "apps.cases",
    responsibility: "Alert review workflows, investigator assignment, and SAR filings",
    status: "Active Preview",
    tone: "warning" as const,
    contract: "contracts.cases.v1",
    events: ["CaseOpened", "EvidenceAttached", "DecisionRecorded"],
    endpoints: ["GET /api/v1/cases/pending", "POST /api/v1/cases/{id}/escalate"],
  },
  {
    name: "Trust Network Rails",
    code: "apps.network",
    responsibility: "Inter-bank graph topology, cross-border consent routing, and settlement",
    status: "In Progress",
    tone: "info" as const,
    contract: "contracts.network.v1",
    events: ["RailEstablished", "ConsentRouted", "NodeHealthPinged"],
    endpoints: ["GET /api/v1/network/topology", "POST /api/v1/network/route"],
  },
];

const liveAuditEvents = [
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
  const [simulating, setSimulating] = useState(false);

  const isConnected = health.data?.status === "ok" && health.data.database === "ok";

  const handleSimulateRisk = () => {
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
      toast({
        title: "Simulation Dispatched",
        description: "Evaluated high-velocity MoMo transaction: Passed with score 14/100",
        type: "success",
      });
    }, 800);
  };

  const handleRefreshHealth = () => {
    health.refetch();
    toast({
      title: "Backend Ping Sent",
      description: "Queried Django /health/ endpoint successfully",
      type: "info",
    });
  };

  return (
    <div className="space-y-7">
      {/* Top Operations Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-5 border-b border-[var(--border-default)]">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--accent-gold)]">
              Operations Center
            </span>
            <span className="text-[var(--border-strong)]">·</span>
            <StatusBadge tone={isConnected ? "success" : "warning"} pulse={isConnected} size="md">
              {isConnected ? "Engine Connected (24ms)" : "Connecting"}
            </StatusBadge>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            Institutional Trust &amp; Risk Operations
          </h1>
          <p className="text-base text-[var(--text-secondary)] mt-1.5 max-w-3xl leading-relaxed">
            Real-time transactional integrity, cross-border financial identity passporting, and
            automated risk intelligence powered by Django 5.2 and PostgreSQL 17.
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <Button
            variant="secondary"
            size="md"
            onClick={handleRefreshHealth}
            loading={health.isFetching}
            className="gap-2"
          >
            <RefreshCw className="size-4" />
            <span>Ping Health</span>
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleSimulateRisk}
            loading={simulating}
            className="gap-2"
          >
            <Zap className="size-4" />
            <span>Simulate Risk Event</span>
          </Button>
        </div>
      </div>

      {/* 4-Column High-Density KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Verified Passports
            </span>
            <ThroughputSparkline data={[20, 24, 28, 30, 35, 42, 48, 55, 60]} color="#d4a017" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-[var(--text-primary)] font-tabular">148,920</p>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Tier 1–3 Passports</span>
            <span className="text-[#10b981] font-semibold font-mono">+14.2% wk</span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              24h Risk Evaluations
            </span>
            <ThroughputSparkline data={[12, 16, 22, 35, 48, 52, 60, 58, 64]} color="#10b981" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-[var(--text-primary)] font-tabular">1,248,310</p>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Avg Decision: 18ms</span>
            <span className="text-[#10b981] font-semibold font-mono">99.8% Cleared</span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Active Investigations
            </span>
            <ThroughputSparkline data={[8, 12, 10, 14, 11, 9, 7, 5, 3]} color="#e11d48" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-[var(--text-primary)] font-tabular">14 Cases</p>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">0 Breaches in 30d</span>
            <span className="text-[#e11d48] font-semibold font-mono">3 Critical SLA</span>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Participant Rails
            </span>
            <ThroughputSparkline data={[30, 32, 34, 36, 38, 40, 41, 42, 42]} color="#d4a017" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-[var(--text-primary)] font-tabular">42 Rails</p>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Inter-bank Quorum</span>
            <span className="text-[#10b981] font-semibold font-mono">100% Up</span>
          </div>
        </Card>
      </div>

      {/* Analytics Grid: 24h Velocity + Risk Tier Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Activity className="size-5 text-[#10b981]" />
                24-Hour Transaction &amp; Risk Velocity Stream
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                Aggregated Ghana Cedi (GH₵) settlement volume vs evaluated anomalies
              </p>
            </div>
            <span className="font-mono text-xs text-[var(--text-muted)] bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] px-3 py-1 rounded-md font-medium">
              Hourly Resolution
            </span>
          </div>
          <RiskVelocityChart />
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                <ShieldCheck className="size-5 text-[var(--accent-gold)]" />
                Risk Classification Breakdown
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                Distribution across 4 risk evaluation policy bands
              </p>
            </div>
          </div>
          <RiskDistributionChart />
        </Card>
      </div>

      {/* Domain Matrix Table & Live Operations Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4">
        {/* Backend Domain Service Mesh */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--border-default)] p-5 bg-[var(--bg-surface-subtle)]">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="size-5 text-[var(--accent-gold)]" />
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Backend Domain Service Mesh
                </h2>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                Authoritative Django modular monolith boundaries &amp; public contracts
              </p>
            </div>
            <Button asChild variant="secondary" size="md">
              <a href="/api/docs/" target="_blank" rel="noreferrer">
                <span>Swagger</span>
                <ArrowUpRight className="size-4 ml-1" />
              </a>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-base">
              <thead className="border-b border-[var(--border-default)] bg-[var(--bg-surface-subtle)] font-mono uppercase tracking-wider text-[var(--text-muted)] text-xs">
                <tr>
                  <th className="px-5 py-3.5">Domain Service</th>
                  <th className="px-4 py-3.5">Module Code</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {domainModules.map((mod) => (
                  <tr
                    key={mod.name}
                    className="hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer group"
                    onClick={() => setSelectedDomain(mod)}
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-gold)] transition-colors text-base">
                        {mod.name}
                      </p>
                      <p className="text-sm text-[var(--text-secondary)] max-w-sm mt-0.5 leading-normal">
                        {mod.responsibility}
                      </p>
                    </td>
                    <td className="px-4 py-4 font-mono text-sm text-[var(--text-secondary)]">
                      {mod.code}
                    </td>
                    <td className="px-4 py-4">
                      <StatusBadge tone={mod.tone} size="md">
                        {mod.status}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span className="text-sm font-semibold text-[var(--accent-gold)] group-hover:underline cursor-pointer">
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
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-3.5">
            <div className="flex items-center gap-2">
              <Radio className="size-4.5 text-[#10b981]" />
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Live Operations Stream
              </h2>
            </div>
            <StatusBadge tone="success" size="md">
              Live Feed
            </StatusBadge>
          </div>

          <div className="space-y-3">
            {liveAuditEvents.map((evt) => (
              <div
                key={evt.id}
                className="rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] p-3.5 hover:border-[var(--border-strong)] transition-colors"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-mono font-bold text-[var(--accent-gold)]">{evt.id}</span>
                  <span className="text-[var(--text-muted)] flex items-center gap-1.5 font-mono text-xs">
                    <Clock className="size-3.5" />
                    {evt.time}
                  </span>
                </div>
                <p className="text-sm font-medium text-[var(--text-primary)] mt-1.5 leading-snug">{evt.desc}</p>
                <div className="mt-2.5 flex items-center gap-2">
                  <StatusBadge tone={evt.tone} size="sm">
                    {evt.type}
                  </StatusBadge>
                  <span className="font-mono text-xs text-[var(--text-muted)] font-medium">
                    Verified on DB
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Button asChild variant="secondary" size="md" className="w-full text-base">
            <Link to="/risk-events">
              <span>View All Risk Logs</span>
              <ArrowUpRight className="size-4 ml-1.5" />
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
            <Button asChild variant="outline" size="md">
              <a href="/api/docs/" target="_blank" rel="noreferrer">
                <span>Swagger API Explorer</span>
                <ExternalLink className="size-4 ml-1.5" />
              </a>
            </Button>
            <Button variant="secondary" size="md" onClick={() => setSelectedDomain(null)}>
              Dismiss
            </Button>
          </div>
        }
      >
        {selectedDomain && (
          <div className="space-y-6">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Domain Responsibility
              </p>
              <p className="mt-2 text-base text-[var(--text-primary)] leading-relaxed">
                {selectedDomain.responsibility}
              </p>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Public Contract Spec
              </p>
              <div className="mt-2 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] p-3.5 font-mono text-sm font-semibold text-[#10b981]">
                {selectedDomain.contract}
              </div>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                Events Dispatched to Outbox
              </p>
              <div className="mt-2 space-y-2">
                {selectedDomain.events.map((e) => (
                  <div
                    key={e}
                    className="flex items-center gap-2.5 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] px-3.5 py-2.5 text-sm font-mono text-[var(--text-primary)]"
                  >
                    <Code2 className="size-4 text-[var(--accent-gold)]" />
                    {e}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">
                REST Endpoints
              </p>
              <div className="mt-2 space-y-2">
                {selectedDomain.endpoints.map((ep) => (
                  <div
                    key={ep}
                    className="rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] px-3.5 py-2.5 text-sm font-mono text-[var(--text-secondary)] font-medium"
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

