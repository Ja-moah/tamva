import {
  Network,
  RefreshCw,
  Server,
} from "lucide-react";
import { useState } from "react";

import { StatusBadge, type StatusTone } from "../components/feedback/status-badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DetailDrawer } from "../components/ui/detail-drawer";
import { useToast } from "../components/ui/toast";

interface TrustNode {
  id: string;
  name: string;
  region: string;
  type: "COMMERCIAL_BANK" | "FINTECH_RAIL" | "CENTRAL_SWITCH" | "REGIONAL_HUB";
  protocol: string;
  status: "ONLINE" | "SYNCHRONIZING" | "DEGRADED";
  tone: StatusTone;
  latencyMs: number;
  tps: number;
  dailyVolume: string;
  uptime: string;
  handshakeHash: string;
}

const mockNodes: TrustNode[] = [
  {
    id: "NODE-APEX-01",
    name: "Apex Bank PLC Core Rail",
    region: "Accra West, Ghana",
    type: "COMMERCIAL_BANK",
    protocol: "ISO 20022 / REST v2",
    status: "ONLINE",
    tone: "success",
    latencyMs: 14,
    tps: 340,
    dailyVolume: "GH₵ 142.5M",
    uptime: "99.99%",
    handshakeHash: "0x8f2a...109e",
  },
  {
    id: "NODE-ZNTH-02",
    name: "Zenith Digital Trust Gateway",
    region: "Accra Central, Ghana",
    type: "FINTECH_RAIL",
    protocol: "OpenBanking Africa v1.2",
    status: "ONLINE",
    tone: "success",
    latencyMs: 8,
    tps: 620,
    dailyVolume: "GH₵ 89.2M",
    uptime: "99.98%",
    handshakeHash: "0x334c...bb90",
  },
  {
    id: "NODE-ECO-03",
    name: "Ecobank Regional Settlement Hub",
    region: "Lomé Hub / West Africa",
    type: "REGIONAL_HUB",
    protocol: "PAPSS / ISO 20022",
    status: "ONLINE",
    tone: "success",
    latencyMs: 28,
    tps: 180,
    dailyVolume: "GH₵ 210.0M",
    uptime: "99.95%",
    handshakeHash: "0x91da...e552",
  },
  {
    id: "NODE-GHIPSS-04",
    name: "National Instant Pay Rail (GIP)",
    region: "GhIPSS Central Switch",
    type: "CENTRAL_SWITCH",
    protocol: "GhIPSS ISO Gateway",
    status: "ONLINE",
    tone: "success",
    latencyMs: 19,
    tps: 1250,
    dailyVolume: "GH₵ 540.8M",
    uptime: "100.0%",
    handshakeHash: "0x55ca...0011",
  },
  {
    id: "NODE-MOMO-05",
    name: "Cross-Network Mobile Money Bridge",
    region: "Ghana Interoperability Rail",
    type: "FINTECH_RAIL",
    protocol: "GSMA Mobile Money API",
    status: "SYNCHRONIZING",
    tone: "warning",
    latencyMs: 45,
    tps: 840,
    dailyVolume: "GH₵ 315.4M",
    uptime: "99.91%",
    handshakeHash: "0x11fa...c789",
  },
];

export function NetworkPage() {
  const [nodes, setNodes] = useState<TrustNode[]>(mockNodes);
  const [selectedNode, setSelectedNode] = useState<TrustNode | null>(null);
  const [pinging, setPinging] = useState(false);
  const { toast } = useToast();

  const handlePingAll = () => {
    setPinging(true);
    setTimeout(() => {
      setPinging(false);
      setNodes((prev) =>
        prev.map((n) => ({
          ...n,
          latencyMs: Math.max(6, Math.floor(n.latencyMs + (Math.random() * 6 - 3))),
        })),
      );
      toast({
        title: "All 5 Rails Handshaked",
        description: "Zero packet loss across all ISO 20022 participant switches.",
        type: "success",
      });
    }, 900);
  };

  const handlePingNode = (node: TrustNode) => {
    toast({
      title: "Rail Handshake Verified",
      description: `Cryptographic challenge completed with ${node.name} (${node.latencyMs}ms latency)`,
      type: "success",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#D4A017] uppercase tracking-widest">
              Inter-Bank Trust Rails
            </span>
            <span className="text-white/30">·</span>
            <StatusBadge tone="success" pulse size="sm">
              PAPSS &amp; GhIPSS Connected
            </StatusBadge>
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Cross-Institution Trust Network
          </h1>
          <p className="mt-2 text-sm text-white/60 max-w-2xl leading-relaxed">
            Real-time topology, inter-bank cryptographic handshake health, settlement throughput,
            and cross-border payment gateway monitoring.
          </p>
        </div>

        <Button
          variant="secondary"
          size="md"
          onClick={handlePingAll}
          loading={pinging}
          className="self-start sm:self-auto"
        >
          <RefreshCw className="size-3.5 mr-1.5 text-[#D4A017]" /> Ping All Rails
        </Button>
      </div>

      {/* Network Topology Visual Showcase with Real Generated Graphic */}
      <Card className="overflow-hidden p-0 border border-white/10 bg-[#0B0B10]">
        <div className="relative h-72 sm:h-96 w-full overflow-hidden">
          <img
            src="/assets/network-nodes.jpg"
            alt="TAMVA Inter-Bank Trust Mesh"
            className="h-full w-full object-cover object-center filter brightness-90 contrast-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F13] via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0F0F13]/80 via-transparent to-transparent" />

          {/* Interactive Floating Topology Badges */}
          <div className="absolute top-6 left-6 max-w-sm rounded-2xl border border-white/10 bg-black/75 p-4 backdrop-blur-xl shadow-2xl">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#00C97A] animate-ping" />
              <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
                Pan-African Settlement Mesh
              </span>
            </div>
            <p className="text-xs text-white/70 mt-1.5 leading-relaxed">
              Active peer-to-peer verification tunnels connected between Accra, Lagos, Lomé, and
              Nairobi regional settlement hubs.
            </p>
          </div>

          <div className="absolute bottom-6 right-6 hidden sm:flex items-center gap-3 rounded-2xl border border-white/10 bg-black/75 px-4 py-3 backdrop-blur-xl">
            <div>
              <p className="text-[10px] font-mono uppercase text-white/40">Settlement Finality</p>
              <p className="text-sm font-bold text-[#00C97A] font-mono">0.42s (Instant)</p>
            </div>
            <div className="h-6 w-px bg-white/10" />
            <div>
              <p className="text-[10px] font-mono uppercase text-white/40">Consensus Health</p>
              <p className="text-sm font-bold text-[#FCD116] font-mono">100% Quorum</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Network KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card glow="gold" className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
            24h Total Settlement
          </p>
          <p className="mt-1 text-2xl font-black text-white font-tabular">GH₵ 1.29B</p>
          <p className="text-[11px] text-[#00C97A] mt-1 font-semibold">+18.4% daily surge</p>
        </Card>
        <Card glow="emerald" className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
            Aggregate Throughput
          </p>
          <p className="mt-1 text-2xl font-black text-[#00C97A] font-tabular">3,230 TPS</p>
          <p className="text-[11px] text-white/50 mt-1">Direct ISO 20022 parsing</p>
        </Card>
        <Card glow="emerald" className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
            Average Mesh Latency
          </p>
          <p className="mt-1 text-2xl font-black text-white font-tabular">16.8 ms</p>
          <p className="text-[11px] text-[#00C97A] mt-1">Direct dark fiber peerings</p>
        </Card>
        <Card glow="gold" className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
            Active Participating Banks
          </p>
          <p className="mt-1 text-2xl font-black text-white font-tabular">42 Rails</p>
          <p className="text-[11px] text-white/50 mt-1">Universal KYC Passporting</p>
        </Card>
      </div>

      {/* Trust Rails Table */}
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.08] p-5">
          <div className="flex items-center gap-2">
            <Network className="size-4 text-[#D4A017]" />
            <h2 className="text-base font-bold text-white">
              Participant Financial Nodes &amp; Rail Gateways
            </h2>
          </div>
          <span className="font-mono text-xs text-white/40">ISO 20022 / PAPSS Standardized</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.08] bg-white/[0.02] font-mono uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-5 py-3.5">Institution Rail &amp; Region</th>
                <th className="px-4 py-3.5">Protocol Interface</th>
                <th className="px-4 py-3.5">Throughput</th>
                <th className="px-4 py-3.5">Latency</th>
                <th className="px-4 py-3.5">Daily Volume</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {nodes.map((node) => (
                <tr
                  key={node.id}
                  onClick={() => setSelectedNode(node)}
                  className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-4">
                    <p className="font-bold text-white group-hover:text-[#FCD116] transition-colors">
                      {node.name}
                    </p>
                    <span className="text-[11px] font-mono text-white/40 mt-0.5 block">
                      {node.id} · {node.region}
                    </span>
                  </td>

                  <td className="px-4 py-4 font-mono text-white/70">{node.protocol}</td>

                  <td className="px-4 py-4 font-mono font-bold text-white font-tabular">
                    {node.tps} TPS
                  </td>

                  <td className="px-4 py-4 font-mono">
                    <span
                      className={`font-bold ${
                        node.latencyMs < 20 ? "text-[#00C97A]" : "text-[#FCD116]"
                      }`}
                    >
                      {node.latencyMs} ms
                    </span>
                  </td>

                  <td className="px-4 py-4 font-mono font-bold text-white font-tabular">
                    {node.dailyVolume}
                  </td>

                  <td className="px-4 py-4">
                    <StatusBadge tone={node.tone} size="sm">
                      {node.status}
                    </StatusBadge>
                  </td>

                  <td className="px-4 py-4 text-right">
                    <button className="font-semibold text-xs text-[#D4A017] group-hover:underline">
                      Inspect →
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
        title={selectedNode?.name || "Node Inspector"}
        subtitle={`Node ID: ${selectedNode?.id} (${selectedNode?.region})`}
        badge={
          selectedNode ? (
            <StatusBadge tone={selectedNode.tone}>{selectedNode.status}</StatusBadge>
          ) : null
        }
        footer={
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => selectedNode && handlePingNode(selectedNode)}
            >
              <RefreshCw className="size-3.5 mr-1" /> Ping Handshake
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setSelectedNode(null)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedNode && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase text-white/40">Verified Uptime</p>
                  <p className="text-2xl font-black text-white font-tabular mt-0.5">
                    {selectedNode.uptime}
                  </p>
                </div>
                <span className="grid size-12 place-items-center rounded-2xl bg-[#D4A017]/15 text-[#D4A017] border border-[#D4A017]/30">
                  <Server className="size-6" />
                </span>
              </div>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#D4A017]">
                Rail Specifications &amp; Telemetry
              </p>
              <div className="mt-2 space-y-2 text-xs">
                <div className="flex justify-between py-2 border-b border-white/[0.05]">
                  <span className="text-white/40">Participant Classification</span>
                  <span className="font-mono font-bold text-white">{selectedNode.type}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/[0.05]">
                  <span className="text-white/40">Protocol &amp; Payload Interface</span>
                  <span className="font-mono text-[#FCD116]">{selectedNode.protocol}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/[0.05]">
                  <span className="text-white/40">24h Settlement Throughput</span>
                  <span className="font-mono text-white font-bold">{selectedNode.dailyVolume}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/[0.05]">
                  <span className="text-white/40">Round-Trip Latency</span>
                  <span className="text-[#00C97A] font-bold font-mono">
                    {selectedNode.latencyMs} ms
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/[0.05]">
                  <span className="text-white/40">TLS 1.3 Cryptographic Proof</span>
                  <span className="font-mono text-[#06B6D4]">{selectedNode.handshakeHash}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}

