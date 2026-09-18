import {
  Activity,
  CheckCircle2,
  Globe,
  Network,
  RefreshCw,
  Server,
  Zap,
} from "lucide-react";
import { useState } from "react";

import { NetworkTelemetryChart } from "../components/charts/network-telemetry-chart";
import { StatusBadge, type StatusTone } from "../components/feedback/status-badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DetailDrawer } from "../components/ui/detail-drawer";
import { useToast } from "../components/ui/toast";

interface TrustNode {
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
}

const mockNodes: TrustNode[] = [
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
  },
];

export function NetworkPage() {
  const [nodes] = useState<TrustNode[]>(mockNodes);
  const [selectedNode, setSelectedNode] = useState<TrustNode | null>(null);
  const { toast } = useToast();

  const handlePingNode = (node: TrustNode) => {
    toast({
      title: "Rail Handshake Verified",
      description: `Cryptographic challenge signed with ${node.name} (${node.latencyMs}ms)`,
      type: "success",
    });
  };

  const handleMeshSync = () => {
    toast({
      title: "Mesh Quorum Synchronized",
      description: "Triggered state reconciliation across all 42 network participants.",
      type: "info",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-[var(--accent-gold)] uppercase tracking-wider">
              Trust Rails &amp; Network Mesh
            </span>
            <span className="text-[var(--text-muted)]">·</span>
            <span className="font-mono text-sm font-semibold text-[var(--text-secondary)]">
              42 Active Mesh Nodes
            </span>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            Inter-Institution Trust Rails
          </h1>
          <p className="mt-2 text-base text-[var(--text-secondary)] max-w-3xl leading-relaxed font-normal">
            Real-time topology, settlement latency, throughput telemetry, and cryptographic handshakes across participant financial institutions and national payment switches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="lg" onClick={handleMeshSync} className="gap-2.5 text-base font-medium px-5 py-2.5">
            <RefreshCw className="size-4 text-[var(--text-muted)]" />
            <span>Sync Quorum</span>
          </Button>
        </div>
      </div>

      {/* Network KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-5 border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">24h Settlement</p>
            <Globe className="size-5 text-[var(--accent-gold)]" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-[var(--text-primary)] font-tabular">GH₵ 1.29B</p>
          <p className="text-sm text-[var(--accent-emerald)] mt-2 font-semibold">+18.4% 24h volume</p>
        </Card>

        <Card className="p-5 border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Peak Throughput</p>
            <Zap className="size-5 text-[var(--accent-emerald)]" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-[var(--accent-emerald)] font-tabular">3,230 TPS</p>
          <p className="text-sm text-[var(--text-secondary)] mt-2 font-mono">Sub-second finality</p>
        </Card>

        <Card className="p-5 border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Avg Mesh Latency</p>
            <Activity className="size-5 text-[var(--accent-gold)]" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-[var(--text-primary)] font-tabular">16.8 ms</p>
          <p className="text-sm text-[var(--accent-emerald)] mt-2 font-semibold">Direct GhIPSS fiber peering</p>
        </Card>

        <Card className="p-5 border-[var(--border-default)] bg-[var(--bg-surface)]">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">Consensus Health</p>
            <CheckCircle2 className="size-5 text-[var(--accent-emerald)]" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-[var(--accent-emerald)] font-tabular">100.0%</p>
          <p className="text-sm text-[var(--text-secondary)] mt-2 font-medium">All participant quorums synced</p>
        </Card>
      </div>

      {/* Visual Analytics Chart: Real-time Throughput (TPS) */}
      <Card className="p-6 border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6 pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Switch &amp; Core Rail Throughput Telemetry (TPS)
            </h2>
            <p className="text-base text-[var(--text-secondary)] mt-1 font-normal">
              Live transaction load partitioned across Mobile Money Switch, GhIPSS Instant Pay, and PAPSS Regional Hub.
            </p>
          </div>
          <span className="font-mono text-sm uppercase tracking-wider text-[var(--accent-gold)] font-bold">
            PAPSS / ISO 20022 Switch
          </span>
        </div>
        <NetworkTelemetryChart />
      </Card>

      {/* Trust Rails Table */}
      <Card className="overflow-hidden border-[var(--border-default)] bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between border-b border-[var(--border-default)] bg-[var(--bg-surface-elevated)] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <Network className="size-5 text-[var(--accent-gold)]" />
            <h2 className="text-sm font-bold uppercase tracking-wider font-mono text-[var(--text-primary)]">
              Participant Financial Nodes &amp; Switch Gateways
            </h2>
          </div>
          <span className="font-mono text-sm font-medium text-[var(--text-secondary)]">ISO 20022 / PAPSS Compliant</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead className="border-b border-[var(--border-default)] bg-[var(--bg-surface-elevated)] font-mono uppercase tracking-wider text-[var(--text-muted)] text-xs font-semibold">
              <tr>
                <th className="px-6 py-4">Rail Node</th>
                <th className="px-6 py-4">Protocol Interface</th>
                <th className="px-6 py-4">Throughput</th>
                <th className="px-6 py-4">Latency</th>
                <th className="px-6 py-4">Daily Cleared</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {nodes.map((node) => (
                <tr
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className="hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer group"
                >
                  <td className="px-6 py-4">
                    <p className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-gold)] transition-colors text-base">
                      {node.name}
                    </p>
                    <span className="text-sm font-mono text-[var(--text-muted)] mt-1 block">{node.id}</span>
                  </td>

                  <td className="px-6 py-4 font-mono text-sm text-[var(--text-secondary)]">{node.protocol}</td>

                  <td className="px-6 py-4 font-mono font-bold text-[var(--text-primary)] font-tabular text-base">
                    {node.tps} TPS
                  </td>

                  <td className="px-6 py-4 font-mono text-base">
                    <span
                      className={`font-bold font-tabular ${
                        node.latencyMs < 20 ? "text-[var(--accent-emerald)]" : "text-[var(--accent-gold)]"
                      }`}
                    >
                      {node.latencyMs} ms
                    </span>
                  </td>

                  <td className="px-6 py-4 font-mono font-bold text-[var(--text-primary)] font-tabular text-base">
                    {node.dailyVolume}
                  </td>

                  <td className="px-6 py-4">
                    <StatusBadge tone={node.tone} size="md">
                      {node.status}
                    </StatusBadge>
                  </td>

                  <td className="px-6 py-4 text-right">
                    <span className="font-mono text-sm text-[var(--accent-gold)] font-bold group-hover:underline">
                      Inspect →
                    </span>
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
        title={selectedNode?.name || "Node Inspector"}
        subtitle={`Node ID: ${selectedNode?.id}`}
        badge={
          selectedNode ? (
            <StatusBadge tone={selectedNode.tone}>{selectedNode.status}</StatusBadge>
          ) : null
        }
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="md"
              onClick={() => selectedNode && handlePingNode(selectedNode)}
              className="gap-2 text-base font-semibold"
            >
              <RefreshCw className="size-4" />
              <span>Ping Handshake</span>
            </Button>
            <Button variant="secondary" size="md" onClick={() => setSelectedNode(null)} className="text-base font-semibold">
              Dismiss
            </Button>
          </div>
        }
      >
        {selectedNode && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] font-semibold">Verified Uptime</p>
                  <p className="text-4xl font-extrabold text-[var(--text-primary)] font-tabular mt-1.5">
                    {selectedNode.uptime}
                  </p>
                </div>
                <span className="grid size-12 place-items-center rounded-xl bg-[var(--accent-gold)]/15 text-[var(--accent-gold)] border border-[var(--accent-gold)]/30">
                  <Server className="size-6" />
                </span>
              </div>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] mb-3 font-semibold">
                Rail Specifications &amp; Telemetry
              </p>
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] divide-y divide-[var(--border-subtle)] text-base">
                <div className="flex justify-between px-5 py-3.5">
                  <span className="text-[var(--text-muted)]">Participant Classification</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">{selectedNode.type}</span>
                </div>
                <div className="flex justify-between px-5 py-3.5">
                  <span className="text-[var(--text-muted)]">Communication Interface</span>
                  <span className="font-mono text-[var(--accent-gold)] font-medium">{selectedNode.protocol}</span>
                </div>
                <div className="flex justify-between px-5 py-3.5">
                  <span className="text-[var(--text-muted)]">24h Settlement Throughput</span>
                  <span className="font-mono text-[var(--text-primary)] font-bold">{selectedNode.dailyVolume}</span>
                </div>
                <div className="flex justify-between px-5 py-3.5">
                  <span className="text-[var(--text-muted)]">Latency Response</span>
                  <span className="text-[var(--accent-emerald)] font-bold font-mono">{selectedNode.latencyMs} ms</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}

