import {
  Activity,
  Download,
  Globe,
  Network,
  Plus,
  RefreshCw,
  Server,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { NetworkTelemetryChart } from "../components/charts/network-telemetry-chart";
import { StatusBadge, type StatusTone } from "../components/feedback/status-badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DetailDrawer } from "../components/ui/detail-drawer";
import { useToast } from "../components/ui/toast";

export interface TrustNode {
  id: string;
  name: string;
  type: "COMMERCIAL_BANK" | "FINTECH_RAIL" | "CENTRAL_SWITCH" | "REGIONAL_HUB";
  protocol: string;
  status: "ONLINE" | "SYNCHRONIZING" | "DEGRADED";
  tone: StatusTone;
  latencyMs: number;
  tps: number;
  dailyVolume: string;
  uptime: string;
  certFingerprint?: string;
}

const initialMockNodes: TrustNode[] = [
  {
    id: "NODE-APEX-01",
    name: "Apex Bank PLC Core Rail",
    type: "COMMERCIAL_BANK",
    protocol: "ISO 20022 / REST v2",
    status: "ONLINE",
    tone: "success",
    latencyMs: 14,
    tps: 340,
    dailyVolume: "GH₵ 142.5M",
    uptime: "99.99%",
    certFingerprint: "SHA256:7B:A2:89:FE:19:02:44:B8:31:AA",
  },
  {
    id: "NODE-ZNTH-02",
    name: "Zenith Digital Trust Gateway",
    type: "FINTECH_RAIL",
    protocol: "OpenBanking Africa v1.2",
    status: "ONLINE",
    tone: "success",
    latencyMs: 8,
    tps: 620,
    dailyVolume: "GH₵ 89.2M",
    uptime: "99.98%",
    certFingerprint: "SHA256:4C:91:EE:08:71:A1:52:19:90:CC",
  },
  {
    id: "NODE-ECO-03",
    name: "Ecobank Regional Settlement Hub",
    type: "REGIONAL_HUB",
    protocol: "PAPSS / ISO 20022",
    status: "ONLINE",
    tone: "success",
    latencyMs: 28,
    tps: 180,
    dailyVolume: "GH₵ 210.0M",
    uptime: "99.95%",
    certFingerprint: "SHA256:11:88:BB:33:DD:EE:FF:00:12:34",
  },
  {
    id: "NODE-GHIPSS-04",
    name: "National Instant Pay Rail (GIP)",
    type: "CENTRAL_SWITCH",
    protocol: "GhIPSS ISO Gateway",
    status: "ONLINE",
    tone: "success",
    latencyMs: 19,
    tps: 1250,
    dailyVolume: "GH₵ 540.8M",
    uptime: "100.0%",
    certFingerprint: "SHA256:AA:BB:CC:DD:EE:FF:00:11:22:33",
  },
  {
    id: "NODE-MOMO-05",
    name: "Cross-Network Mobile Money Bridge",
    type: "FINTECH_RAIL",
    protocol: "GSMA Mobile Money API",
    status: "SYNCHRONIZING",
    tone: "warning",
    latencyMs: 45,
    tps: 840,
    dailyVolume: "GH₵ 315.4M",
    uptime: "99.91%",
    certFingerprint: "SHA256:FF:EE:DD:CC:BB:AA:99:88:77:66",
  },
];

function calculateJitterLatency(base: number) {
  const delta = (Date.now() % 7) - 3;
  return Math.max(5, base + delta);
}

export function NetworkPage() {
  const [nodes, setNodes] = useState<TrustNode[]>(initialMockNodes);
  const [selectedNode, setSelectedNode] = useState<TrustNode | null>(null);
  const [isAddNodeModalOpen, setIsAddNodeModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const { toast } = useToast();

  const [newNodeForm, setNewNodeForm] = useState({
    name: "",
    type: "COMMERCIAL_BANK" as TrustNode["type"],
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
          latencyMs: Math.max(6, n.latencyMs - 2),
        })),
      );
      toast({
        title: "Mesh Quorum Synchronized",
        description: `Triggered state reconciliation across all ${nodes.length} network participants. All nodes operational.`,
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
      type: newNodeForm.type,
      protocol: newNodeForm.protocol,
      status: "ONLINE",
      tone: "success",
      latencyMs: Math.floor(10 + Math.random() * 20),
      tps: Math.floor(100 + Math.random() * 500),
      dailyVolume: newNodeForm.dailyVolume,
      uptime: "99.99%",
      certFingerprint: `SHA256:${Array.from({ length: 10 }, () => Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, "0")).join(":")}`,
    };

    setNodes((prev) => [...prev, newNode]);
    setIsAddNodeModalOpen(false);
    setSelectedNode(newNode);
    setNewNodeForm({
      name: "",
      type: "COMMERCIAL_BANK",
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
                {nodes.length} Active Mesh Nodes
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl lg:text-5xl">
              Inter-Institution Trust Rails
            </h1>
            <p className="mt-3 text-base sm:text-lg text-[var(--text-secondary)] max-w-3xl leading-relaxed font-medium">
              Real-time topology, settlement latency, throughput telemetry, and cryptographic handshakes across participant financial institutions, FinTech switches, and PAPSS regional rails.
            </p>
          </div>

          <div className="flex items-center gap-3.5 shrink-0">
            <Button
              variant="secondary"
              size="lg"
              onClick={handleMeshSync}
              loading={isSyncing}
              className="gap-2 shadow-xs"
            >
              <RefreshCw className="size-4.5 text-[var(--text-muted)]" />
              <span>Sync Quorum</span>
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsAddNodeModalOpen(true)}
              className="gap-2 shadow-md font-bold"
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
          <p className="mt-4 text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] font-tabular">GH₵ 1.30B</p>
          <p className="text-sm text-[var(--accent-emerald)] mt-2 font-bold">+18.4% volume flow</p>
        </div>

        <div className="ios-glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Avg Rail Latency</p>
            <Activity className="size-5 text-[var(--accent-emerald)]" />
          </div>
          <p className="mt-4 text-3xl sm:text-4xl font-extrabold text-[var(--accent-emerald)] font-tabular">18.2 ms</p>
          <p className="text-sm text-[var(--text-secondary)] mt-2 font-semibold">Sub-50ms target met</p>
        </div>

        <div className="ios-glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Peak Network TPS</p>
            <Zap className="size-5 text-[var(--accent-gold)]" />
          </div>
          <p className="mt-4 text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] font-tabular">3,230 TPS</p>
          <p className="text-sm text-[var(--text-secondary)] mt-2 font-medium">GhIPSS switch high</p>
        </div>

        <div className="ios-glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Consensus Health</p>
            <Globe className="size-5 text-[var(--accent-emerald)]" />
          </div>
          <p className="mt-4 text-3xl sm:text-4xl font-extrabold text-[var(--text-primary)] font-tabular">100.0%</p>
          <p className="text-sm text-[var(--accent-emerald)] mt-2 font-bold">Zero forks in 90d</p>
        </div>
      </div>

      {/* Network Telemetry Chart */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Cross-Institution Rail Latency &amp; Settlement Velocity
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Live round-trip response times (ms) across commercial banks, FinTech gateways, and regional clearing switches.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={handleExportTopology} className="gap-1.5 font-mono text-xs">
            <Download className="size-3.5" />
            <span>Export Topology</span>
          </Button>
        </div>
        <NetworkTelemetryChart />
      </Card>

      {/* Trust Nodes Table */}
      <Card className="overflow-hidden border-[var(--border-default)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead className="border-b border-[var(--border-default)] bg-[var(--bg-surface-elevated)] font-mono uppercase tracking-wider text-[var(--text-muted)] text-xs">
              <tr>
                <th className="px-5 py-3.5">Node ID</th>
                <th className="px-4 py-3.5">Rail Node Name</th>
                <th className="px-4 py-3.5">Node Class</th>
                <th className="px-4 py-3.5">Protocol Interface</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Latency (ms)</th>
                <th className="px-4 py-3.5">24h Settlement</th>
                <th className="px-5 py-3.5 text-right">Handshake</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {nodes.map((node) => (
                <tr
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className="hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-4 font-mono font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-gold)] transition-colors">
                    {node.id}
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-[var(--text-primary)] text-base">{node.name}</p>
                    <p className="text-xs font-mono text-[var(--text-muted)] mt-0.5">{node.uptime} Uptime</p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] text-[var(--text-secondary)]">
                      {node.type.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-mono text-sm text-[var(--text-secondary)] font-medium">
                    {node.protocol}
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge tone={node.tone} size="md">
                      {node.status}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-4 font-mono font-bold text-[var(--accent-emerald)]">
                    {node.latencyMs} ms
                  </td>
                  <td className="px-4 py-4 font-mono font-bold text-[var(--text-primary)]">
                    {node.dailyVolume}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePingNode(node);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] hover:border-[var(--accent-gold)] text-xs font-mono font-bold text-[var(--accent-gold)] transition-colors cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                    >
                      <Activity className="size-3.5" /> Ping
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Node Detail Drawer */}
      <DetailDrawer
        open={Boolean(selectedNode)}
        onClose={() => setSelectedNode(null)}
        title={selectedNode?.name || "Rail Node Telemetry"}
        subtitle={`Node Reference: ${selectedNode?.id}`}
        badge={
          selectedNode ? (
            <StatusBadge tone={selectedNode.tone} size="md">
              {selectedNode.status}
            </StatusBadge>
          ) : null
        }
        footer={
          <div className="flex items-center justify-between w-full">
            {selectedNode && (
              <Button
                variant="primary"
                size="md"
                onClick={() => handlePingNode(selectedNode)}
                className="gap-2 font-semibold"
              >
                <Activity className="size-4" />
                <span>Test Cryptographic Handshake</span>
              </Button>
            )}
            <Button variant="secondary" size="md" onClick={() => setSelectedNode(null)}>
              Dismiss
            </Button>
          </div>
        }
      >
        {selectedNode && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-5">
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--accent-gold)] font-bold">
                Cryptographic Identity &amp; Mutual TLS
              </p>
              <p className="mt-2 font-mono text-xs text-[var(--text-primary)] break-all bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[var(--border-default)]">
                {selectedNode.certFingerprint || "SHA256:7B:A2:89:FE:19:02:44:B8:31:AA:99:81:CC:DD"}
              </p>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2.5 font-bold">
                Operational Telemetry
              </p>
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] divide-y divide-[var(--border-subtle)] text-base">
                <div className="flex justify-between px-4 py-3.5">
                  <span className="text-[var(--text-muted)] text-sm">Active Latency</span>
                  <span className="font-mono font-bold text-[var(--accent-emerald)]">{selectedNode.latencyMs} ms</span>
                </div>
                <div className="flex justify-between px-4 py-3.5">
                  <span className="text-[var(--text-muted)] text-sm">Peak Throughput</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">{selectedNode.tps} TPS</span>
                </div>
                <div className="flex justify-between px-4 py-3.5">
                  <span className="text-[var(--text-muted)] text-sm">24h Settlement Volume</span>
                  <span className="font-mono font-extrabold text-[var(--text-primary)]">{selectedNode.dailyVolume}</span>
                </div>
                <div className="flex justify-between px-4 py-3.5">
                  <span className="text-[var(--text-muted)] text-sm">SLA Uptime Ratio</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">{selectedNode.uptime}</span>
                </div>
                <div className="flex justify-between px-4 py-3.5">
                  <span className="text-[var(--text-muted)] text-sm">Protocol Standard</span>
                  <span className="font-mono text-sm text-[var(--text-secondary)]">{selectedNode.protocol}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Connect Node Modal */}
      {isAddNodeModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-10 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={() => setIsAddNodeModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-xl transform overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-6 shadow-[var(--shadow-lg)] transition-all z-10 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
              <div className="flex items-center gap-2.5">
                <Network className="size-5 text-[var(--accent-gold)]" />
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  Connect Inter-Bank Rail Node
                </h2>
              </div>
              <button
                onClick={() => setIsAddNodeModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleAddNode} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Node / Institution Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Standard Chartered Pan-Africa Gateway"
                  value={newNodeForm.name}
                  onChange={(e) => setNewNodeForm({ ...newNodeForm, name: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-base text-[var(--text-primary)] focus:border-[var(--accent-gold)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Node Category
                  </label>
                  <select
                    value={newNodeForm.type}
                    onChange={(e) =>
                      setNewNodeForm({
                        ...newNodeForm,
                        type: e.target.value as TrustNode["type"],
                      })
                    }
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-gold)] focus:outline-none"
                  >
                    <option value="COMMERCIAL_BANK">Commercial Bank</option>
                    <option value="FINTECH_RAIL">FinTech Rail</option>
                    <option value="CENTRAL_SWITCH">Central Switch</option>
                    <option value="REGIONAL_HUB">Regional Settlement Hub</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Protocol Specification
                  </label>
                  <select
                    value={newNodeForm.protocol}
                    onChange={(e) => setNewNodeForm({ ...newNodeForm, protocol: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-gold)] focus:outline-none"
                  >
                    <option value="ISO 20022 / REST v2">ISO 20022 / REST v2</option>
                    <option value="PAPSS / ISO 20022">PAPSS / ISO 20022</option>
                    <option value="OpenBanking Africa v1.2">OpenBanking Africa v1.2</option>
                    <option value="GSMA Mobile Money API">GSMA Mobile Money API</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-default)]">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setIsAddNodeModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" className="gap-2 font-semibold">
                  <Plus className="size-4" />
                  <span>Onboard &amp; Handshake</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
