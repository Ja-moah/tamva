import {
  Activity,
  Download,
  Globe,
  Layers,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
  Smartphone,
  X,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";

import { NetworkTelemetryChart } from "../components/charts/network-telemetry-chart";
import { CurrencyConverterUnavailable } from "../components/features/currency-converter-unavailable";
import { StatusBadge, type StatusTone } from "../components/feedback/status-badge";
import { BrandLogo, type BrandType } from "../components/ui/brand-logo";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DetailDrawer } from "../components/ui/detail-drawer";
import { useToast } from "../components/ui/toast";

export interface TrustNode {
  id: string;
  name: string;
  brand: BrandType;
  type: "MOBILE_MONEY" | "COMMERCIAL_BANK" | "FINTECH_RAIL" | "CENTRAL_SWITCH" | "REGIONAL_HUB";
  protocol: string;
  status: "ONLINE" | "SYNCHRONIZING" | "DEGRADED";
  tone: StatusTone;
  latencyMs: number;
  tps: number;
  dailyVolume: string;
  uptime: string;
  certFingerprint?: string;
  floatBalance?: string;
  simSwapSignal?: string;
  clearingMechanism?: string;
}

const initialMockNodes: TrustNode[] = [
  {
    id: "NODE-MTN-01",
    name: "MTN Mobile Money Core Rail",
    brand: "mtn",
    type: "MOBILE_MONEY",
    protocol: "GhIPSS MMAPI / GSMA v2.1",
    status: "ONLINE",
    tone: "success",
    latencyMs: 6,
    tps: 2850,
    dailyVolume: "GH₵ 1.85B",
    uptime: "99.99%",
    certFingerprint: "SHA256:99:AA:88:BB:77:CC:66:DD:55:EE",
    floatBalance: "GH₵ 420.0M",
    simSwapSignal: "Active (Real-time telemetry)",
    clearingMechanism: "Instant RTGS / Mobile Switch",
  },
  {
    id: "NODE-TELE-02",
    name: "Telecel Cash Financial Rail",
    brand: "telecel",
    type: "MOBILE_MONEY",
    protocol: "Telecel Open Gateway v3",
    status: "ONLINE",
    tone: "success",
    latencyMs: 11,
    tps: 1140,
    dailyVolume: "GH₵ 620.4M",
    uptime: "99.96%",
    certFingerprint: "SHA256:33:44:55:66:77:88:99:00:AA:BB",
    floatBalance: "GH₵ 185.2M",
    simSwapSignal: "Active (Sub-10ms hook)",
    clearingMechanism: "National Switch Inter-MoMo",
  },
  {
    id: "NODE-AT-03",
    name: "AirtelTigo Money (ATMoney) Mesh",
    brand: "airteltigo",
    type: "MOBILE_MONEY",
    protocol: "ISO 20022 / MMAPI v2.0",
    status: "ONLINE",
    tone: "success",
    latencyMs: 14,
    tps: 580,
    dailyVolume: "GH₵ 245.8M",
    uptime: "99.92%",
    certFingerprint: "SHA256:55:66:77:88:99:AA:BB:CC:DD:EE",
    floatBalance: "GH₵ 82.5M",
    simSwapSignal: "Active (Biometric verification)",
    clearingMechanism: "GhIPSS Bilateral Switch",
  },
  {
    id: "NODE-APEX-04",
    name: "Apex Bank PLC Core Rail",
    brand: "apex",
    type: "COMMERCIAL_BANK",
    protocol: "ISO 20022 / REST v2",
    status: "ONLINE",
    tone: "success",
    latencyMs: 14,
    tps: 420,
    dailyVolume: "GH₵ 182.5M",
    uptime: "99.99%",
    certFingerprint: "SHA256:7B:A2:89:FE:19:02:44:B8:31:AA",
    clearingMechanism: "Bank of Ghana ACH / GIS",
  },
  {
    id: "NODE-ECO-05",
    name: "Ecobank Regional Settlement Hub",
    brand: "ecobank",
    type: "REGIONAL_HUB",
    protocol: "PAPSS / ISO 20022",
    status: "ONLINE",
    tone: "success",
    latencyMs: 24,
    tps: 290,
    dailyVolume: "GH₵ 310.0M",
    uptime: "99.95%",
    certFingerprint: "SHA256:11:88:BB:33:DD:EE:FF:00:12:34",
    clearingMechanism: "Pan-African Payment Settlement (PAPSS)",
  },
  {
    id: "NODE-ZNTH-06",
    name: "Zenith Digital Trust Gateway",
    brand: "zenith",
    type: "COMMERCIAL_BANK",
    protocol: "OpenBanking Africa v1.2",
    status: "ONLINE",
    tone: "success",
    latencyMs: 8,
    tps: 620,
    dailyVolume: "GH₵ 129.2M",
    uptime: "99.98%",
    certFingerprint: "SHA256:4C:91:EE:08:71:A1:52:19:90:CC",
    clearingMechanism: "Inter-Bank Direct API Gateway",
  },
  {
    id: "NODE-GHIPSS-07",
    name: "National Instant Pay Rail (GhIPSS GIP)",
    brand: "ghipss",
    type: "CENTRAL_SWITCH",
    protocol: "GhIPSS ISO Gateway",
    status: "ONLINE",
    tone: "success",
    latencyMs: 12,
    tps: 3450,
    dailyVolume: "GH₵ 1.24B",
    uptime: "100.0%",
    certFingerprint: "SHA256:AA:BB:CC:DD:EE:FF:00:11:22:33",
    clearingMechanism: "Central National Clearing Switch",
  },
];

function calculateJitterLatency(base: number) {
  const delta = (Date.now() % 7) - 3;
  return Math.max(4, base + delta);
}

export function NetworkPage() {
  const [nodes, setNodes] = useState<TrustNode[]>(initialMockNodes);
  const [selectedNode, setSelectedNode] = useState<TrustNode | null>(null);
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const { toast } = useToast();

  const [newNodeForm, setNewNodeForm] = useState({
    name: "",
    type: "COMMERCIAL_BANK" as TrustNode["type"],
    brand: "bank_generic" as BrandType,
    protocol: "ISO 20022 / REST v2",
    dailyVolume: "GH₵ 50.0M",
  });

  const handlePingNode = (node: TrustNode) => {
    const jitterLatency = calculateJitterLatency(node.latencyMs);
    const updatedNode: TrustNode = {
      ...node,
      latencyMs: jitterLatency,
      status: "ONLINE",
      tone: "success",
    };

    setNodes((prev) => prev.map((n) => (n.id === node.id ? updatedNode : n)));
    if (selectedNode?.id === node.id) setSelectedNode(updatedNode);

    toast({
      title: "Rail Handshake Verified",
      description: `Cryptographic challenge signed with ${node.name} (${jitterLatency}ms round-trip)`,
      type: "success",
    });
  };

  const handleMeshSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setNodes((prev) =>
        prev.map((n) => ({
          ...n,
          status: "ONLINE",
          tone: "success",
          latencyMs: Math.max(4, n.latencyMs - 2),
        })),
      );
      toast({
        title: "Mesh Quorum Synchronized",
        description: `Triggered state reconciliation across all ${nodes.length} network participants. All Mobile Money and Bank rails operational.`,
        type: "info",
      });
    }, 600);
  };

  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeForm.name.trim()) return;

    const randomId = `NODE-${newNodeForm.name.substring(0, 4).toUpperCase()}-${Math.floor(10 + Math.random() * 90)}`;
    const newNode: TrustNode = {
      id: randomId,
      name: newNodeForm.name,
      brand: newNodeForm.brand,
      type: newNodeForm.type,
      protocol: newNodeForm.protocol,
      status: "ONLINE",
      tone: "success",
      latencyMs: Math.floor(8 + Math.random() * 15),
      tps: Math.floor(300 + Math.random() * 800),
      dailyVolume: newNodeForm.dailyVolume,
      uptime: "99.99%",
      certFingerprint: `SHA256:${Array.from({ length: 10 }, () => Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, "0")).join(":")}`,
      clearingMechanism: "Inter-institution direct clearing",
    };

    setNodes((prev) => [...prev, newNode]);
    setIsAddNodeModalOpen(false);
    setSelectedNode(newNode);
    setNewNodeForm({
      name: "",
      type: "COMMERCIAL_BANK",
      brand: "bank_generic",
      protocol: "ISO 20022 / REST v2",
      dailyVolume: "GH₵ 50.0M",
    });

    toast({
      title: "Rail Participant Connected",
      description: `${newNode.name} onboarded to inter-bank trust mesh.`,
      type: "success",
    });
  };

  const handleExportTopology = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(nodes, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `tamva-network-topology-${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toast({
      title: "Topology Exported",
      description: `Exported ${nodes.length} participant nodes specification (.json)`,
      type: "info",
    });
  };

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    if (categoryFilter === "MOBILE_MONEY") return nodes.filter((n) => n.type === "MOBILE_MONEY");
    if (categoryFilter === "COMMERCIAL_BANK") return nodes.filter((n) => n.type === "COMMERCIAL_BANK");
    if (categoryFilter === "SWITCHES") return nodes.filter((n) => n.type === "CENTRAL_SWITCH" || n.type === "REGIONAL_HUB");
    return nodes;
  }, [nodes, categoryFilter]);

  const momoNodes = useMemo(() => nodes.filter((n) => n.type === "MOBILE_MONEY"), [nodes]);
  const bankNodes = useMemo(() => nodes.filter((n) => n.type === "COMMERCIAL_BANK"), [nodes]);

  return (
    <div className="space-y-8">
      {/* Header & Page Title */}
      <div className="ios-hero-banner rounded-3xl p-7 sm:p-9 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-xs font-bold text-[var(--accent-gold)] uppercase tracking-wider bg-[var(--bg-surface-elevated)] border border-[var(--accent-gold-border)] px-3 py-1 rounded-full shadow-xs">
                Trust Rails &amp; Network Mesh
              </span>
              <span className="text-[var(--text-muted)]">·</span>
              <span className="font-mono text-xs font-bold text-[var(--accent-emerald)]">
                {nodes.length} Active Nodes (MoMo &amp; Banks)
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
              Inter-Institution Trust Rails
            </h1>
            <p className="mt-3 text-base sm:text-lg text-[var(--text-secondary)] max-w-3xl leading-relaxed font-medium">
              Real-time topology, settlement latency, throughput telemetry, and cryptographic handshakes across Mobile Money operators (MTN MoMo, Telecel Cash, ATMoney), commercial banks, and regional PAPSS switches.
            </p>
          </div>

          <div className="flex items-center gap-3.5 shrink-0">
            <Button
              variant="secondary"
              size="lg"
              onClick={handleMeshSync}
              loading={isSyncing}
              className="gap-2 shadow-xs cursor-pointer"
            >
              <RefreshCw className="size-4.5 text-[var(--text-muted)]" />
              <span>Sync Quorum</span>
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsAddNodeModalOpen(true)}
              className="gap-2 shadow-md font-bold cursor-pointer"
            >
              <Plus className="size-5" />
              <span>Connect Rail Node</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Network KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="ios-glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">24h Settlement</p>
            <Server className="size-5 text-[var(--accent-gold)]" />
          </div>
          <p className="mt-4 text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] font-tabular">GH₵ 4.58B</p>
          <p className="text-sm text-[var(--accent-emerald)] mt-2 font-bold">+24.6% MoMo &amp; Bank flow</p>
        </div>

        <div className="ios-glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Avg Rail Latency</p>
            <Activity className="size-5 text-[var(--accent-emerald)]" />
          </div>
          <p className="mt-4 text-3xl sm:text-4xl font-extrabold text-[var(--accent-emerald)] font-tabular">12.4 ms</p>
          <p className="text-sm text-[var(--text-secondary)] mt-2 font-semibold">Sub-20ms MoMo handshake</p>
        </div>

        <div className="ios-glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Peak Network TPS</p>
            <Zap className="size-5 text-[var(--accent-gold)]" />
          </div>
          <p className="mt-4 text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] font-tabular">5,890 TPS</p>
          <p className="text-sm text-[var(--text-secondary)] mt-2 font-medium">MTN MoMo + GhIPSS peak</p>
        </div>

        <div className="ios-glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Consensus Health</p>
            <Globe className="size-5 text-[var(--accent-emerald)]" />
          </div>
          <p className="mt-4 text-3xl sm:text-4xl font-extrabold text-[var(--accent-emerald)] font-tabular">100.0%</p>
          <p className="text-sm text-[var(--accent-emerald)] mt-2 font-bold">Zero forks &bull; All 7 Rails Live</p>
        </div>
      </div>

      {/* DEDICATED MOBILE MONEY SPACE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
              <Smartphone className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[var(--text-primary)]">
                Mobile Money Operators &amp; Telco Rails
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                Direct integration with Ghana&apos;s leading MNOs for instant wallet transfers, SIM-swap validation, and float settlement.
              </p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500 animate-ping" />
            Live MoMo Switch
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {momoNodes.map((momo) => (
            <div
              key={momo.id}
              onClick={() => setSelectedNode(momo)}
              className="ios-glass-card rounded-2xl p-5 hover:border-[var(--accent-gold-border)] transition-all cursor-pointer group relative overflow-hidden"
            >
              <div className="flex items-start justify-between gap-3">
                <BrandLogo brand={momo.brand} size="lg" />
                <StatusBadge tone={momo.tone}>{momo.status}</StatusBadge>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-extrabold text-[var(--text-primary)] group-hover:text-[var(--accent-gold)] transition-colors">
                  {momo.name}
                </h3>
                <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">{momo.protocol}</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-[var(--border-subtle)] text-xs">
                <div>
                  <span className="text-[var(--text-muted)] block font-medium">Daily Volume</span>
                  <span className="font-mono font-bold text-sm text-[var(--text-primary)]">{momo.dailyVolume}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block font-medium">Throughput</span>
                  <span className="font-mono font-bold text-sm text-emerald-500">{momo.tps} TPS</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block font-medium">Latency</span>
                  <span className="font-mono font-bold text-sm text-[var(--accent-gold-text)] dark:text-[var(--accent-gold)]">
                    {momo.latencyMs} ms
                  </span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block font-medium">Float Reserve</span>
                  <span className="font-mono font-bold text-sm text-[var(--text-primary)]">{momo.floatBalance}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-emerald-500 font-bold">
                  <ShieldCheck className="size-3.5" />
                  <span>SIM-Swap Hook Live</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePingNode(momo);
                  }}
                  className="rounded-lg px-2.5 py-1 text-xs font-bold bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] hover:border-[var(--accent-gold)] text-[var(--text-primary)] transition-all cursor-pointer"
                >
                  Ping Rail
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* DEDICATED COMMERCIAL BANKS SPACE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
              <Server className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-[var(--text-primary)]">
                Commercial Bank Clearing Rails
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mt-0.5">
                Core banking networks, ISO 20022 messaging, and inter-bank ACH clearing rails.
              </p>
            </div>
          </div>
          <span className="font-mono text-xs font-bold text-[var(--text-muted)]">
            {bankNodes.length} Tier-1 Banks Connected
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {bankNodes.map((bank) => (
            <div
              key={bank.id}
              onClick={() => setSelectedNode(bank)}
              className="ios-glass-card rounded-2xl p-5 hover:border-[var(--accent-gold-border)] transition-all cursor-pointer group"
            >
              <div className="flex items-start justify-between gap-3">
                <BrandLogo brand={bank.brand} size="lg" />
                <StatusBadge tone={bank.tone}>{bank.status}</StatusBadge>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-extrabold text-[var(--text-primary)] group-hover:text-[var(--accent-gold)] transition-colors">
                  {bank.name}
                </h3>
                <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">{bank.protocol}</p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 pt-3 border-t border-[var(--border-subtle)] text-xs">
                <div>
                  <span className="text-[var(--text-muted)] block font-medium">Daily Settlement</span>
                  <span className="font-mono font-bold text-sm text-[var(--text-primary)]">{bank.dailyVolume}</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block font-medium">Throughput</span>
                  <span className="font-mono font-bold text-sm text-emerald-500">{bank.tps} TPS</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block font-medium">Latency</span>
                  <span className="font-mono font-bold text-sm text-[var(--text-primary)]">{bank.latencyMs} ms</span>
                </div>
                <div>
                  <span className="text-[var(--text-muted)] block font-medium">Uptime</span>
                  <span className="font-mono font-bold text-sm text-emerald-500">{bank.uptime}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
                <span className="text-xs text-[var(--text-muted)] truncate max-w-[170px]">{bank.clearingMechanism}</span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePingNode(bank);
                  }}
                  className="rounded-lg px-2.5 py-1 text-xs font-bold bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] hover:border-[var(--accent-gold)] text-[var(--text-primary)] transition-all cursor-pointer"
                >
                  Ping Node
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* LIVE CURRENCY CONVERTER EMBEDDED */}
      <CurrencyConverterUnavailable />

      {/* Network Telemetry Chart */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Cross-Institution Rail Latency &amp; Settlement Velocity
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Live round-trip response times (ms) across MTN MoMo, Telecel Cash, ATMoney, commercial banks, and regional clearing switches.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleExportTopology} className="gap-1.5 font-mono text-xs cursor-pointer">
            <Download className="size-3.5" />
            <span>Export Topology</span>
          </Button>
        </div>
        <NetworkTelemetryChart />
      </Card>

      {/* All Trust Nodes Table with Category Filter Tabs */}
      <Card className="overflow-hidden border-[var(--border-default)]">
        <div className="p-5 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Layers className="size-5 text-[var(--accent-gold)]" />
            <h3 className="text-base font-extrabold text-[var(--text-primary)]">
              Complete Network Participant Directory
            </h3>
          </div>

          <div className="flex items-center gap-1.5 bg-[var(--bg-canvas)] p-1 rounded-xl border border-[var(--border-default)] text-xs font-bold">
            <button
              onClick={() => setCategoryFilter("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                categoryFilter === "ALL"
                  ? "bg-[var(--accent-gold)] text-black font-extrabold shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              All Rails ({nodes.length})
            </button>
            <button
              onClick={() => setCategoryFilter("MOBILE_MONEY")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                categoryFilter === "MOBILE_MONEY"
                  ? "bg-[var(--accent-gold)] text-black font-extrabold shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Mobile Money (3)
            </button>
            <button
              onClick={() => setCategoryFilter("COMMERCIAL_BANK")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                categoryFilter === "COMMERCIAL_BANK"
                  ? "bg-[var(--accent-gold)] text-black font-extrabold shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Banks (2)
            </button>
            <button
              onClick={() => setCategoryFilter("SWITCHES")}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                categoryFilter === "SWITCHES"
                  ? "bg-[var(--accent-gold)] text-black font-extrabold shadow-xs"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Switches &amp; Hubs (2)
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead className="border-b border-[var(--border-default)] bg-[var(--bg-surface-elevated)] font-mono uppercase tracking-wider text-[var(--text-muted)] text-xs">
              <tr>
                <th className="px-5 py-3.5">Rail Node</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5">Protocol Interface</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Latency</th>
                <th className="px-4 py-3.5">Throughput</th>
                <th className="px-4 py-3.5">24h Settlement</th>
                <th className="px-5 py-3.5 text-right">Handshake</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filteredNodes.map((node) => (
                <tr
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className="hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <BrandLogo brand={node.brand} size="md" />
                      <div>
                        <p className="font-bold text-[var(--text-primary)] text-sm group-hover:text-[var(--accent-gold)] transition-colors">
                          {node.name}
                        </p>
                        <p className="text-xs font-mono text-[var(--text-muted)]">{node.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] text-[var(--text-secondary)]">
                      {node.type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-mono text-xs text-[var(--text-secondary)]">
                    {node.protocol}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge tone={node.tone}>{node.status}</StatusBadge>
                  </td>
                  <td className="px-4 py-4 font-mono font-bold text-sm text-[var(--text-primary)]">
                    <span className={node.latencyMs < 20 ? "text-emerald-500" : "text-amber-500"}>
                      {node.latencyMs} ms
                    </span>
                  </td>
                  <td className="px-4 py-4 font-mono text-sm text-[var(--text-secondary)]">
                    {node.tps} TPS
                  </td>
                  <td className="px-4 py-4 font-mono font-bold text-sm text-[var(--text-primary)]">
                    {node.dailyVolume}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePingNode(node);
                      }}
                      className="font-mono text-xs cursor-pointer"
                    >
                      Ping
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Connect Rail Node Modal */}
      {isAddNodeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-[var(--bg-surface)] border border-[var(--border-default)] p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[var(--border-subtle)]">
              <div>
                <h3 className="text-xl font-bold text-[var(--text-primary)]">
                  Connect Rail Participant
                </h3>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Onboard a new Mobile Money operator, commercial bank, or FinTech switch.
                </p>
              </div>
              <button
                onClick={() => setIsAddNodeModalOpen(false)}
                className="p-2 rounded-xl text-[var(--text-muted)] hover:bg-[var(--bg-surface-elevated)] cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddNode} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[var(--text-muted)] mb-1.5">
                  Participant Rail Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., CalBank Instant Rail or GCB Core Switch"
                  value={newNodeForm.name}
                  onChange={(e) => setNewNodeForm({ ...newNodeForm, name: e.target.value })}
                  className="w-full rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-[var(--text-muted)] mb-1.5">
                    Rail Classification
                  </label>
                  <select
                    value={newNodeForm.type}
                    onChange={(e) =>
                      setNewNodeForm({ ...newNodeForm, type: e.target.value as TrustNode["type"] })
                    }
                    className="w-full rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                  >
                    <option value="MOBILE_MONEY">Mobile Money Operator</option>
                    <option value="COMMERCIAL_BANK">Commercial Bank</option>
                    <option value="FINTECH_RAIL">FinTech Gateway</option>
                    <option value="CENTRAL_SWITCH">Central Switch</option>
                    <option value="REGIONAL_HUB">Regional Hub (PAPSS)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-[var(--text-muted)] mb-1.5">
                    Brand Icon
                  </label>
                  <select
                    value={newNodeForm.brand}
                    onChange={(e) =>
                      setNewNodeForm({ ...newNodeForm, brand: e.target.value as BrandType })
                    }
                    className="w-full rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                  >
                    <option value="mtn">MTN MoMo</option>
                    <option value="telecel">Telecel Cash</option>
                    <option value="airteltigo">AirtelTigo Money</option>
                    <option value="apex">Apex Bank</option>
                    <option value="ecobank">Ecobank</option>
                    <option value="zenith">Zenith Bank</option>
                    <option value="ghipss">GhIPSS Switch</option>
                    <option value="bank_generic">Generic Bank</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-[var(--text-muted)] mb-1.5">
                  Protocol Interface &amp; API
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., ISO 20022 / REST v2 or OpenBanking Africa v1.2"
                  value={newNodeForm.protocol}
                  onChange={(e) => setNewNodeForm({ ...newNodeForm, protocol: e.target.value })}
                  className="w-full rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border-subtle)]">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setIsAddNodeModalOpen(false)}
                  className="cursor-pointer"
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" className="font-bold cursor-pointer">
                  Authenticate &amp; Connect Rail
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Selected Node Detail Drawer */}
      <DetailDrawer
        open={Boolean(selectedNode)}
        onClose={() => setSelectedNode(null)}
        title={selectedNode?.name || "Rail Node Detail"}
        subtitle={`Participant Node ID: ${selectedNode?.id || ""}`}
      >
        {selectedNode && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-[var(--bg-canvas)] border border-[var(--border-default)] flex items-center justify-between gap-3">
              <BrandLogo brand={selectedNode.brand} size="lg" showLabel />
              <StatusBadge tone={selectedNode.tone}>{selectedNode.status}</StatusBadge>
            </div>

            <div className="space-y-3">
              <h4 className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold">
                Rail Telemetry &amp; Performance
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                  <span className="text-xs text-[var(--text-muted)] block">Round-Trip Latency</span>
                  <span className="font-mono font-bold text-base text-[var(--accent-gold-text)] dark:text-[var(--accent-gold)]">
                    {selectedNode.latencyMs} ms
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                  <span className="text-xs text-[var(--text-muted)] block">Throughput Rate</span>
                  <span className="font-mono font-bold text-base text-emerald-500">
                    {selectedNode.tps} TPS
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                  <span className="text-xs text-[var(--text-muted)] block">24h Settlement Flow</span>
                  <span className="font-mono font-bold text-base text-[var(--text-primary)]">
                    {selectedNode.dailyVolume}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                  <span className="text-xs text-[var(--text-muted)] block">Uptime SLA</span>
                  <span className="font-mono font-bold text-base text-emerald-500">
                    {selectedNode.uptime}
                  </span>
                </div>
              </div>
            </div>

            {selectedNode.floatBalance && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                    MoMo Escrow &amp; Float Balance
                  </span>
                  <span className="font-mono font-bold text-sm text-[var(--text-primary)]">
                    {selectedNode.floatBalance}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  Reconciled with Bank of Ghana Central Trust Escrow account.
                </p>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold">
                Cryptographic Credentials &amp; Interface
              </h4>
              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                  <span className="text-[var(--text-muted)] block mb-1">Protocol Standard</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">{selectedNode.protocol}</span>
                </div>
                {selectedNode.certFingerprint && (
                  <div className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                    <span className="text-[var(--text-muted)] block mb-1">mTLS Certificate SHA-256</span>
                    <span className="font-mono text-[11px] text-[var(--accent-gold-text)] dark:text-[var(--accent-gold)] break-all">
                      {selectedNode.certFingerprint}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)] flex gap-3">
              <Button
                variant="primary"
                className="w-full font-bold cursor-pointer"
                onClick={() => handlePingNode(selectedNode)}
              >
                Dispatch Live Handshake Ping
              </Button>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
