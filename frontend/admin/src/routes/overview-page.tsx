import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowUpRight,
  Briefcase,
  CheckCircle2,
  Clock,
  Code2,
  Database,
  ExternalLink,
  Flame,
  Globe2,
  Layers,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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
    uptime: "100.0%",
    latency: "14ms",
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
    uptime: "99.99%",
    latency: "8ms",
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
    uptime: "99.95%",
    latency: "18ms",
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
    uptime: "99.98%",
    latency: "22ms",
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
    uptime: "99.91%",
    latency: "31ms",
  },
];

const mockChartDataByRange: Record<
  string,
  { time: string; transactions: number; riskPassed: number; anomalies: number }[]
> = {
  "1h": [
    { time: "14:00", transactions: 1200, riskPassed: 1180, anomalies: 20 },
    { time: "14:10", transactions: 1850, riskPassed: 1810, anomalies: 40 },
    { time: "14:20", transactions: 2400, riskPassed: 2360, anomalies: 40 },
    { time: "14:30", transactions: 3100, riskPassed: 3040, anomalies: 60 },
    { time: "14:40", transactions: 2800, riskPassed: 2750, anomalies: 50 },
    { time: "14:50", transactions: 3600, riskPassed: 3520, anomalies: 80 },
    { time: "15:00", transactions: 4100, riskPassed: 4020, anomalies: 80 },
  ],
  "24h": [
    { time: "00:00", transactions: 8200, riskPassed: 8100, anomalies: 100 },
    { time: "04:00", transactions: 4500, riskPassed: 4450, anomalies: 50 },
    { time: "08:00", transactions: 24000, riskPassed: 23700, anomalies: 300 },
    { time: "12:00", transactions: 48000, riskPassed: 47400, anomalies: 600 },
    { time: "16:00", transactions: 62000, riskPassed: 61200, anomalies: 800 },
    { time: "20:00", transactions: 39000, riskPassed: 38600, anomalies: 400 },
  ],
  "7d": [
    { time: "Mon", transactions: 210000, riskPassed: 208000, anomalies: 2000 },
    { time: "Tue", transactions: 245000, riskPassed: 242000, anomalies: 3000 },
    { time: "Wed", transactions: 280000, riskPassed: 277000, anomalies: 3000 },
    { time: "Thu", transactions: 310000, riskPassed: 306000, anomalies: 4000 },
    { time: "Fri", transactions: 420000, riskPassed: 415000, anomalies: 5000 },
    { time: "Sat", transactions: 350000, riskPassed: 346000, anomalies: 4000 },
    { time: "Sun", transactions: 190000, riskPassed: 188000, anomalies: 2000 },
  ],
};

const initialAuditEvents = [
  {
    id: "EVT-89201",
    time: "Just now",
    type: "Risk Decision",
    desc: "Apex Bank GH₵ 45,000 MoMo transfer passed fraud check (Score: 12)",
    tone: "success" as const,
    institution: "Apex Bank PLC",
    hash: "0x7a8f...912e",
  },
  {
    id: "EVT-89200",
    time: "2m ago",
    type: "Velocity Alert",
    desc: "Zenith Trust flagged 3 rapid authentication attempts from new IP",
    tone: "warning" as const,
    institution: "Zenith Digital Trust",
    hash: "0x3e1c...b441",
  },
  {
    id: "EVT-89199",
    time: "4m ago",
    type: "Outbox Commit",
    desc: "1,200 transactional events dispatched to Celery worker cluster",
    tone: "info" as const,
    institution: "Ecobank Payment Gateway",
    hash: "0x992b...fa01",
  },
  {
    id: "EVT-89198",
    time: "7m ago",
    type: "Identity Verified",
    desc: "Customer GHA-908234-1 promoted to Tier 3 Passport status",
    tone: "success" as const,
    institution: "Apex Bank PLC",
    hash: "0x51c9...220b",
  },
];

export function OverviewPage() {
  const health = useSystemHealth();
  const { toast } = useToast();
  const [selectedDomain, setSelectedDomain] = useState<typeof domainModules[0] | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<typeof initialAuditEvents[0] | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [timeRange, setTimeRange] = useState<"1h" | "24h" | "7d">("24h");
  const [liveStreamActive, setLiveStreamActive] = useState(true);
  const [auditEvents, setAuditEvents] = useState(initialAuditEvents);

  const isConnected = health.data?.status === "ok" && health.data.database === "ok";

  // Simulate incoming live telemetry stream (HCI real-time affordance)
  useEffect(() => {
    if (!liveStreamActive) return;
    const interval = setInterval(() => {
      const idNum = Math.floor(89202 + Math.random() * 100);
      const newEvt = {
        id: `EVT-${idNum}`,
        time: "Just now",
        type: Math.random() > 0.3 ? ("Risk Decision" as const) : ("Outbox Commit" as const),
        desc: `Verified cryptographic challenge on PAPSS settlement node #${Math.floor(Math.random() * 8 + 1)}`,
        tone: "success" as const,
        institution: "Apex Bank PLC",
        hash: `0x${Math.random().toString(16).substring(2, 6)}...${Math.random().toString(16).substring(2, 6)}`,
      };
      setAuditEvents((prev) => [newEvt, ...prev.slice(0, 5)]);
    }, 12000);
    return () => clearInterval(interval);
  }, [liveStreamActive]);

  const handleSimulateRisk = () => {
    setSimulating(true);
    setTimeout(() => {
      setSimulating(false);
      const newEvt = {
        id: `EVT-${Math.floor(89300 + Math.random() * 50)}`,
        time: "Just now",
        type: "Risk Evaluated" as const,
        desc: "Simulated GH₵ 120,000 inter-bank settlement: Risk Score 14/100 (ALLOW)",
        tone: "success" as const,
        institution: "Apex Bank PLC",
        hash: `0x${Math.random().toString(16).substring(2, 6)}...f801`,
      };
      setAuditEvents((prev) => [newEvt, ...prev]);
      toast({
        title: "Simulation Dispatched to Engine",
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
    <div className="space-y-8">
      {/* Hero Showcase Banner with Real Visual Graphic Overlay */}
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0C0C12] shadow-[0_30px_70px_rgba(0,0,0,0.7)] group">
        {/* Background Graphic with gradient scrim */}
        <div className="absolute inset-0 z-0">
          <img
            src="/assets/security-hero.jpg"
            alt="TAMVA Security Module"
            className="h-full w-full object-cover object-center opacity-25 filter blur-[1px] transition-transform duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#070709] via-[#070709]/90 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#070709] via-transparent to-transparent" />
        </div>

        <div className="relative z-10 p-6 sm:p-9">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#D4A017]/40 bg-[#D4A017]/15 px-3 py-1 font-mono text-xs font-bold text-[#FCD116]">
                  <Sparkles className="size-3.5 text-[#D4A017]" />
                  INSTITUTIONAL TRUST CORE v2.4
                </span>
                <StatusBadge tone={isConnected ? "success" : "warning"} pulse={isConnected}>
                  {isConnected ? "Engine Operational · 14ms Latency" : "Awaiting Backend"}
                </StatusBadge>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Institutional Financial Trust &amp; Risk Intelligence
              </h1>
              <p className="text-sm sm:text-base text-white/70 leading-relaxed">
                Real-time transactional integrity, cross-border biometric identity passporting,
                and transactional outbox audit guarantees across Ghana and West African banking rails.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Button
                variant="secondary"
                size="md"
                onClick={handleRefreshHealth}
                loading={health.isFetching}
              >
                <RefreshCw className="size-3.5 mr-1 text-[#D4A017]" />
                Ping Health
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleSimulateRisk}
                loading={simulating}
              >
                <Zap className="size-4 mr-1.5" />
                Simulate Risk Check
              </Button>
            </div>
          </div>

          {/* Real-time System Telemetry Strip */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 border-t border-white/[0.08] pt-6">
            <div className="rounded-xl bg-white/[0.02] p-3 border border-white/[0.04]">
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                Core Monolith API
              </p>
              <p className="mt-1 text-base font-bold text-white font-tabular">Django 5.2</p>
              <span className="text-[11px] text-[#00C97A] font-semibold flex items-center gap-1 mt-0.5">
                <CheckCircle2 className="size-3" /> REST v1 &amp; ISO 20022
              </span>
            </div>
            <div className="rounded-xl bg-white/[0.02] p-3 border border-white/[0.04]">
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                System of Record
              </p>
              <p className="mt-1 text-base font-bold text-white font-tabular">PostgreSQL 17</p>
              <span className="text-[11px] text-[#00C97A] font-semibold flex items-center gap-1 mt-0.5">
                <Database className="size-3" /> ACID Provenance
              </span>
            </div>
            <div className="rounded-xl bg-white/[0.02] p-3 border border-white/[0.04]">
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                Transactional Outbox
              </p>
              <p className="mt-1 text-base font-bold text-white font-tabular">Redis 7 + Celery</p>
              <span className="text-[11px] text-[#FCD116] font-semibold flex items-center gap-1 mt-0.5">
                <Flame className="size-3" /> Guaranteed At-Least-Once
              </span>
            </div>
            <div className="rounded-xl bg-white/[0.02] p-3 border border-white/[0.04]">
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/40">
                Biometric Fidelity
              </p>
              <p className="mt-1 text-base font-bold text-white font-tabular">99.4% Match Rate</p>
              <span className="text-[11px] text-[#06B6D4] font-semibold flex items-center gap-1 mt-0.5">
                <ShieldCheck className="size-3" /> Ghana Card NIST Validated
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Core Financial KPI Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card glow="gold" interactive className="p-5">
          <div className="flex items-center justify-between">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#D4A017]/15 text-[#D4A017] border border-[#D4A017]/30 shadow-inner">
              <Users className="size-5" />
            </span>
            <span className="rounded-full bg-[#00C97A]/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#00C97A]">
              +14.2% wk
            </span>
          </div>
          <p className="mt-5 font-mono text-xs uppercase tracking-wider text-white/40">
            Verified Passports
          </p>
          <p className="mt-1 text-2xl font-black text-white font-tabular">148,920</p>
          <p className="mt-2 text-xs text-white/50">Tier 1–3 Biometric Passports</p>
        </Card>

        <Card glow="emerald" interactive className="p-5">
          <div className="flex items-center justify-between">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#00C97A]/15 text-[#00C97A] border border-[#00C97A]/30 shadow-inner">
              <Activity className="size-5" />
            </span>
            <span className="rounded-full bg-[#00C97A]/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#00C97A]">
              99.8% Cleared
            </span>
          </div>
          <p className="mt-5 font-mono text-xs uppercase tracking-wider text-white/40">
            Risk Evaluations / 24h
          </p>
          <p className="mt-1 text-2xl font-black text-white font-tabular">1,248,310</p>
          <p className="mt-2 text-xs text-white/50">Avg decision speed: 18ms</p>
        </Card>

        <Card glow="crimson" interactive className="p-5">
          <div className="flex items-center justify-between">
            <span className="grid size-11 place-items-center rounded-2xl bg-[#F26D6D]/15 text-[#F26D6D] border border-[#F26D6D]/30 shadow-inner">
              <Briefcase className="size-5" />
            </span>
            <span className="rounded-full bg-[#F26D6D]/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-[#F26D6D]">
              3 Escalated
            </span>
          </div>
          <p className="mt-5 font-mono text-xs uppercase tracking-wider text-white/40">
            Active Investigations
          </p>
          <p className="mt-1 text-2xl font-black text-white font-tabular">14 Cases</p>
          <p className="mt-2 text-xs text-white/50">Zero SLA Breaches (30d)</p>
        </Card>

        <Card glow="gold" interactive className="p-5">
          <div className="flex items-center justify-between">
            <span className="grid size-11 place-items-center rounded-2xl bg-cyan-400/15 text-cyan-400 border border-cyan-400/30 shadow-inner">
              <Globe2 className="size-5" />
            </span>
            <span className="rounded-full bg-cyan-400/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-cyan-300">
              4 Regional Hubs
            </span>
          </div>
          <p className="mt-5 font-mono text-xs uppercase tracking-wider text-white/40">
            Active Bank Rails
          </p>
          <p className="mt-1 text-2xl font-black text-white font-tabular">42 Institutions</p>
          <p className="mt-2 text-xs text-white/50">Cross-border settlement mesh</p>
        </Card>
      </div>

      {/* Interactive Telemetry Throughput Chart (HCI Data Visualization) */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-6 border-b border-white/[0.08] gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <TrendingUp className="size-5 text-[#D4A017]" />
              <h2 className="text-lg font-bold text-white">
                Transaction Throughput &amp; Risk Decisions
              </h2>
            </div>
            <p className="text-xs text-white/50 mt-1">
              Live evaluations processed across Bank of Ghana sandbox and participating partner rails
            </p>
          </div>

          {/* Time range switcher */}
          <div className="flex items-center gap-1 rounded-xl bg-black/40 border border-white/10 p-1 self-start sm:self-auto">
            {(["1h", "24h", "7d"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`rounded-lg px-3 py-1 text-xs font-mono font-semibold transition-all ${
                  timeRange === r
                    ? "bg-[#D4A017] text-black shadow-sm"
                    : "text-white/50 hover:text-white hover:bg-white/[0.05]"
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mockChartDataByRange[timeRange]}>
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#D4A017" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#D4A017" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00C97A" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00C97A" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="time" stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#121217",
                  border: "1px solid rgba(255,255,255,0.15)",
                  borderRadius: "12px",
                  fontSize: "12px",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.8)",
                }}
              />
              <Area
                type="monotone"
                dataKey="transactions"
                name="Total Operations"
                stroke="#D4A017"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#goldGradient)"
              />
              <Area
                type="monotone"
                dataKey="riskPassed"
                name="Cleared &amp; Passed"
                stroke="#00C97A"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#emeraldGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Main Grid: Domain Service Mesh Matrix & Live Event Audit Feed */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Domain Architecture & Readiness */}
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.08] p-5">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="size-4 text-[#D4A017]" />
                <h2 className="text-base font-bold text-white">Backend Domain Service Mesh</h2>
              </div>
              <p className="text-xs text-white/50 mt-1">
                Authoritative Django modular monolith boundaries &amp; public contracts
              </p>
            </div>
            <Button asChild variant="ghost" size="sm">
              <a href="/api/docs/" target="_blank" rel="noreferrer">
                OpenAPI Swagger <ArrowUpRight className="size-3.5 ml-1" />
              </a>
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-white/[0.06] bg-white/[0.02] font-mono uppercase tracking-wider text-white/40">
                <tr>
                  <th className="px-5 py-3.5">Domain Module</th>
                  <th className="px-4 py-3.5">Contract Code</th>
                  <th className="px-4 py-3.5">Latency</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {domainModules.map((mod) => (
                  <tr
                    key={mod.name}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                    onClick={() => setSelectedDomain(mod)}
                  >
                    <td className="px-5 py-4">
                      <p className="font-bold text-white group-hover:text-[#FCD116] transition-colors">
                        {mod.name}
                      </p>
                      <p className="text-[11px] text-white/50 truncate max-w-xs mt-0.5">
                        {mod.responsibility}
                      </p>
                    </td>
                    <td className="px-4 py-4 font-mono text-white/60">{mod.code}</td>
                    <td className="px-4 py-4 font-mono text-[#00C97A]">{mod.latency}</td>
                    <td className="px-4 py-4">
                      <StatusBadge tone={mod.tone} size="sm">
                        {mod.status}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <button className="text-xs font-semibold text-[#D4A017] hover:underline">
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Live Event & Audit Ticker with Live Toggle */}
        <Card className="p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
            <div className="flex items-center gap-2">
              <Radio
                className={`size-4 ${liveStreamActive ? "text-[#00C97A] animate-pulse" : "text-white/30"}`}
              />
              <h2 className="text-base font-bold text-white">Live Operations Stream</h2>
            </div>
            <button
              onClick={() => setLiveStreamActive(!liveStreamActive)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-mono font-bold transition-all ${
                liveStreamActive
                  ? "bg-[#00C97A]/20 text-[#00C97A] border border-[#00C97A]/40"
                  : "bg-white/10 text-white/40"
              }`}
            >
              {liveStreamActive ? "STREAM LIVE" : "PAUSED"}
            </button>
          </div>

          <div className="space-y-3">
            {auditEvents.map((evt) => (
              <div
                key={evt.id}
                onClick={() => setSelectedEvent(evt)}
                className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3.5 hover:border-white/20 hover:bg-white/[0.04] transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-mono font-bold text-[#D4A017] group-hover:underline">
                    {evt.id}
                  </span>
                  <span className="text-white/40 flex items-center gap-1 font-mono">
                    <Clock className="size-3" />
                    {evt.time}
                  </span>
                </div>
                <p className="text-xs font-semibold text-white/90 mt-1 leading-relaxed">
                  {evt.desc}
                </p>
                <div className="mt-2.5 flex items-center justify-between">
                  <StatusBadge tone={evt.tone} size="sm">
                    {evt.type}
                  </StatusBadge>
                  <span className="font-mono text-[10px] text-white/30 truncate max-w-[120px]">
                    {evt.hash}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <Button asChild variant="secondary" className="w-full text-xs">
            <Link to="/risk-events">
              View All Operational Logs <ArrowUpRight className="size-3.5 ml-1" />
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
          <div className="flex items-center justify-between">
            <Button asChild variant="outline" size="sm">
              <a href="/api/docs/" target="_blank" rel="noreferrer">
                OpenAPI Spec <ExternalLink className="size-3.5 ml-1" />
              </a>
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setSelectedDomain(null)}>
              Dismiss
            </Button>
          </div>
        }
      >
        {selectedDomain && (
          <div className="space-y-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#D4A017]">
                Domain Responsibility
              </p>
              <p className="mt-2 text-sm text-white/80 leading-relaxed">
                {selectedDomain.responsibility}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-white/[0.03] p-3 border border-white/[0.05]">
                <p className="text-[10px] font-mono text-white/40 uppercase">Module Uptime</p>
                <p className="text-base font-bold text-white mt-1">{selectedDomain.uptime}</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] p-3 border border-white/[0.05]">
                <p className="text-[10px] font-mono text-white/40 uppercase">Avg Response</p>
                <p className="text-base font-bold text-[#00C97A] mt-1">
                  {selectedDomain.latency}
                </p>
              </div>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#D4A017]">
                Public Contract Specification
              </p>
              <div className="mt-2 rounded-xl bg-black/50 border border-white/10 p-3 font-mono text-xs text-[#00C97A]">
                {selectedDomain.contract}
              </div>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#D4A017]">
                Domain Events Dispatched to Outbox
              </p>
              <div className="mt-2 space-y-1.5">
                {selectedDomain.events.map((e) => (
                  <div
                    key={e}
                    className="flex items-center gap-2 rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-2 text-xs font-mono text-white/80"
                  >
                    <Code2 className="size-3.5 text-[#FCD116]" />
                    {e}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#D4A017]">
                Authoritative REST Endpoints
              </p>
              <div className="mt-2 space-y-1.5">
                {selectedDomain.endpoints.map((ep) => (
                  <div
                    key={ep}
                    className="rounded-lg bg-white/[0.03] border border-white/[0.05] px-3 py-2 text-xs font-mono text-white/70"
                  >
                    {ep}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Audit Event Inspector Drawer */}
      <DetailDrawer
        open={Boolean(selectedEvent)}
        onClose={() => setSelectedEvent(null)}
        title={selectedEvent?.id || "Audit Event"}
        subtitle={selectedEvent?.type}
        badge={
          selectedEvent ? (
            <StatusBadge tone={selectedEvent.tone}>{selectedEvent.type}</StatusBadge>
          ) : null
        }
        footer={
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (selectedEvent) {
                  navigator.clipboard.writeText(selectedEvent.hash);
                  toast({
                    title: "Hash Copied to Clipboard",
                    description: `Transaction hash ${selectedEvent.hash} ready for blockchain/audit verification.`,
                    type: "success",
                  });
                }
              }}
            >
              Copy Hash
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setSelectedEvent(null)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedEvent && (
          <div className="space-y-6">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#D4A017]">
                Event Summary
              </p>
              <p className="mt-2 text-sm text-white leading-relaxed">{selectedEvent.desc}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-white/40">Event ID:</span>
                <span className="text-white font-bold">{selectedEvent.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Institution Scope:</span>
                <span className="text-[#FCD116]">{selectedEvent.institution}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">Timestamp:</span>
                <span className="text-white">{selectedEvent.time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/40">DB Commit Hash:</span>
                <span className="text-[#00C97A]">{selectedEvent.hash}</span>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}

