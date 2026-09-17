import {
  CheckCircle2,
  Clock,
  Download,
  FileCheck2,
  FileText,
  Lock,
  Search,
  ShieldAlert,
  User,
} from "lucide-react";
import { useState } from "react";

import { StatusBadge, type StatusTone } from "../components/feedback/status-badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DetailDrawer } from "../components/ui/detail-drawer";
import { useToast } from "../components/ui/toast";

interface CaseItem {
  id: string;
  title: string;
  customer: string;
  institution: string;
  priority: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  status: "NEW" | "UNDER_REVIEW" | "ESCALATED" | "RESOLVED";
  tone: StatusTone;
  slaHoursRemaining: number;
  assignedTo: string;
  openedAt: string;
  evidenceCount: number;
  notes: string;
  evidenceFiles: { name: string; size: string; type: string }[];
}

const mockCases: CaseItem[] = [
  {
    id: "CAS-4029",
    title: "Mule Account Funneling Pattern",
    customer: "Kofi Mensah (ID: GHA-8921)",
    institution: "Apex Bank PLC",
    priority: "CRITICAL",
    status: "ESCALATED",
    tone: "danger",
    slaHoursRemaining: 2,
    assignedTo: "Ama Boateng (AML Lead)",
    openedAt: "2026-09-17 01:15",
    evidenceCount: 4,
    notes: "Sudden GH₵ 240,000 inflow dispersed in 18 micro-payments within 12 minutes.",
    evidenceFiles: [
      { name: "outward_transfer_batch_manifest.json", size: "48 KB", type: "JSON Ledger" },
      { name: "device_fingerprint_mismatch_report.pdf", size: "1.2 MB", type: "PDF Audit" },
      { name: "telecom_cell_tower_logs.csv", size: "320 KB", type: "CSV Telemetry" },
    ],
  },
  {
    id: "CAS-4028",
    title: "Biometric Liveness Verification Failure",
    customer: "Abena Osei (ID: GHA-4412)",
    institution: "Zenith Digital Trust",
    priority: "HIGH",
    status: "UNDER_REVIEW",
    tone: "warning",
    slaHoursRemaining: 6,
    assignedTo: "Kwesi Appiah",
    openedAt: "2026-09-16 22:40",
    evidenceCount: 2,
    notes: "Deepfake spoof detection triggered during Level 3 KYC passport upgrade.",
    evidenceFiles: [
      { name: "iris_scan_depth_map.png", size: "840 KB", type: "PNG Biometric" },
      { name: "nist_compliance_delta.json", size: "12 KB", type: "JSON Spec" },
    ],
  },
  {
    id: "CAS-4027",
    title: "Multiple Failed Geo-Location Authorizations",
    customer: "Kwame Asante (ID: GHA-7820)",
    institution: "Ecobank Regional Hub",
    priority: "MEDIUM",
    status: "NEW",
    tone: "info",
    slaHoursRemaining: 18,
    assignedTo: "Unassigned",
    openedAt: "2026-09-16 18:20",
    evidenceCount: 1,
    notes: "Simultaneous logins initiated from London and Accra within 4 minutes.",
    evidenceFiles: [
      { name: "ip_asn_hop_routing_trace.txt", size: "14 KB", type: "Log Trace" },
    ],
  },
  {
    id: "CAS-4026",
    title: "Sanction List Near-Match Clearance",
    customer: "Musa Ibrahim (ID: GHA-6671)",
    institution: "Apex Bank PLC",
    priority: "HIGH",
    status: "RESOLVED",
    tone: "success",
    slaHoursRemaining: 0,
    assignedTo: "Yaw Darko (Compliance)",
    openedAt: "2026-09-15 14:00",
    evidenceCount: 3,
    notes: "Verified secondary national ID; confirmed false positive against UN list.",
    evidenceFiles: [
      { name: "ghana_card_secondary_verification.pdf", size: "2.4 MB", type: "PDF Identity" },
      { name: "un_sanctions_fuzzy_match_score.json", size: "8 KB", type: "JSON Report" },
    ],
  },
];

export function CasesPage() {
  const [cases, setCases] = useState<CaseItem[]>(mockCases);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const { toast } = useToast();

  const filtered = cases.filter((c) => {
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.institution.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleResolveCase = () => {
    if (!selectedCase) return;
    setCases((prev) =>
      prev.map((c) =>
        c.id === selectedCase.id ? { ...c, status: "RESOLVED", tone: "success", slaHoursRemaining: 0 } : c,
      ),
    );
    toast({
      title: "Case Resolved & Signed Off",
      description: `Investigation ${selectedCase.id} closed with compliance audit record.`,
      type: "success",
    });
    setSelectedCase(null);
  };

  const handleEscalateSAR = () => {
    if (!selectedCase) return;
    setCases((prev) =>
      prev.map((c) =>
        c.id === selectedCase.id ? { ...c, status: "ESCALATED", tone: "danger" } : c,
      ),
    );
    toast({
      title: "Escalated to Financial Intelligence Centre",
      description: `Suspicious Activity Report (SAR) docket compiled and queued for ${selectedCase.id}.`,
      type: "error",
    });
    setSelectedCase(null);
  };

  const handleFreezeAccount = () => {
    if (!selectedCase) return;
    toast({
      title: "Account Freeze Lock Dispatched",
      description: `Cryptographic freeze hold applied to ${selectedCase.customer} across partner rails.`,
      type: "warning",
    });
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#D4A017] uppercase tracking-widest">
              AML &amp; Fraud Desk
            </span>
            <span className="text-white/30">·</span>
            <StatusBadge tone="warning" size="sm">
              Triage &amp; Investigations Queue
            </StatusBadge>
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Investigation Cases &amp; AML Triage
          </h1>
          <p className="mt-2 text-sm text-white/60 max-w-2xl leading-relaxed">
            Review alerts generated by the Risk Domain, gather evidence documents, manage
            investigator assignments, and record compliance decisions with full auditability.
          </p>
        </div>
      </div>

      {/* Case KPI Strips */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card glow="gold" className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">Open Cases</p>
          <p className="mt-1 text-2xl font-black text-white font-tabular">3 Active</p>
          <p className="text-[11px] text-[#00C97A] mt-1 font-semibold">1 Assigned today</p>
        </Card>
        <Card glow="crimson" className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
            Critical SLA
          </p>
          <p className="mt-1 text-2xl font-black text-[#F26D6D] font-tabular">1 Imminent</p>
          <p className="text-[11px] text-[#F26D6D] mt-1 font-mono">&lt; 2h SLA deadline</p>
        </Card>
        <Card glow="emerald" className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">Avg Resolution</p>
          <p className="mt-1 text-2xl font-black text-white font-tabular">4.2 Hours</p>
          <p className="text-[11px] text-white/50 mt-1">Investigation turnaround</p>
        </Card>
        <Card glow="gold" className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
            Weekly Cleared
          </p>
          <p className="mt-1 text-2xl font-black text-[#00C97A] font-tabular">28 Cases</p>
          <p className="text-[11px] text-[#00C97A] mt-1 font-semibold">100% compliant</p>
        </Card>
      </div>

      {/* Filter and Search */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#D4A017]" />
            <input
              type="text"
              placeholder="Search by Case ID, customer name, title, or assignee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-4 py-2 text-xs text-white placeholder-white/30 focus:border-[#D4A017]/60 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto">
            {["ALL", "NEW", "UNDER_REVIEW", "ESCALATED", "RESOLVED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`rounded-xl px-3 py-1.5 text-xs font-mono font-semibold uppercase tracking-wider transition-colors shrink-0 ${
                  statusFilter === status
                    ? "bg-[#D4A017] text-black font-bold shadow-[0_0_12px_rgba(212,160,23,0.3)]"
                    : "border border-white/10 bg-white/[0.03] text-white/60 hover:text-white"
                }`}
              >
                {status.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Case List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.08] bg-white/[0.02] font-mono uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-5 py-3.5">Case Reference</th>
                <th className="px-4 py-3.5">Investigation Subject &amp; Title</th>
                <th className="px-4 py-3.5">Target Institution</th>
                <th className="px-4 py-3.5">Priority</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">SLA Countdown</th>
                <th className="px-4 py-3.5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-4 font-mono font-bold text-white group-hover:text-[#FCD116] transition-colors">
                    {c.id}
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-white/95">{c.title}</p>
                    <p className="text-[11px] text-white/50 flex items-center gap-1.5 mt-0.5">
                      <span className="text-white/80">{c.customer}</span> ·{" "}
                      <FileText className="size-3 text-[#D4A017]" />
                      {c.evidenceCount} evidence files
                    </p>
                  </td>
                  <td className="px-4 py-4 font-mono text-white/70">{c.institution}</td>
                  <td className="px-4 py-4">
                    <span
                      className={`font-mono text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                        c.priority === "CRITICAL"
                          ? "bg-[#F26D6D]/20 text-[#F26D6D] border border-[#F26D6D]/40 animate-pulse"
                          : c.priority === "HIGH"
                            ? "bg-[#D4A017]/20 text-[#FCD116] border border-[#D4A017]/40"
                            : "bg-white/10 text-white/70"
                      }`}
                    >
                      {c.priority}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge tone={c.tone} size="sm">
                      {c.status.replace("_", " ")}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-4 font-mono">
                    {c.status === "RESOLVED" ? (
                      <span className="text-[#00C97A] flex items-center gap-1">
                        <CheckCircle2 className="size-3.5" /> Closed
                      </span>
                    ) : (
                      <span
                        className={`flex items-center gap-1 font-bold ${
                          c.slaHoursRemaining <= 2 ? "text-[#F26D6D]" : "text-white/70"
                        }`}
                      >
                        <Clock className="size-3.5" />
                        {c.slaHoursRemaining}h remaining
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button className="font-semibold text-xs text-[#D4A017] group-hover:underline">
                      Review →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Case Detail Drawer */}
      <DetailDrawer
        open={Boolean(selectedCase)}
        onClose={() => setSelectedCase(null)}
        title={selectedCase?.title || "Case Detail"}
        subtitle={`Case ID: ${selectedCase?.id} · ${selectedCase?.institution}`}
        badge={
          selectedCase ? (
            <StatusBadge tone={selectedCase.tone}>
              {selectedCase.status.replace("_", " ")}
            </StatusBadge>
          ) : null
        }
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="danger" size="sm" onClick={handleEscalateSAR}>
                <ShieldAlert className="size-3.5 mr-1" /> Escalate SAR
              </Button>
              <Button variant="outline" size="sm" onClick={handleFreezeAccount}>
                <Lock className="size-3.5 mr-1" /> Freeze Account
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="emerald" size="sm" onClick={handleResolveCase}>
                <CheckCircle2 className="size-3.5 mr-1" /> Sign-off &amp; Resolve
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setSelectedCase(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        }
      >
        {selectedCase && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#D4A017]">
                Investigation Summary &amp; Forensic Reason
              </p>
              <p className="mt-2 text-sm text-white/95 leading-relaxed">{selectedCase.notes}</p>
            </div>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#D4A017]">
                Assignment &amp; Case Audit Metadata
              </p>
              <div className="mt-2 space-y-2 text-xs">
                <div className="flex justify-between py-2 border-b border-white/[0.05]">
                  <span className="text-white/40">Lead Investigator</span>
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <User className="size-3.5 text-[#D4A017]" />
                    {selectedCase.assignedTo}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/[0.05]">
                  <span className="text-white/40">Target Entity</span>
                  <span className="text-white font-mono">{selectedCase.customer}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/[0.05]">
                  <span className="text-white/40">Timestamp Opened</span>
                  <span className="font-mono text-white/70">{selectedCase.openedAt}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/[0.05]">
                  <span className="text-white/40">SLA Commitment</span>
                  <span className="text-[#FCD116] font-mono font-bold">
                    {selectedCase.slaHoursRemaining} Hours remaining
                  </span>
                </div>
              </div>
            </div>

            {/* Evidence Attachments */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#D4A017]">
                Evidence Dockets &amp; Forensic Logs ({selectedCase.evidenceFiles?.length || 0})
              </p>
              <div className="mt-2.5 space-y-2">
                {selectedCase.evidenceFiles?.map((doc) => (
                  <div
                    key={doc.name}
                    className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileCheck2 className="size-4 text-[#00C97A]" />
                      <div>
                        <p className="font-bold text-white font-mono text-[11px]">{doc.name}</p>
                        <p className="text-[10px] text-white/40">
                          {doc.type} · {doc.size}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        toast({
                          title: "Evidence Downloaded",
                          description: `Saved ${doc.name} to local encrypted vault.`,
                          type: "info",
                        })
                      }
                      className="p-1.5 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                      aria-label="Download document"
                    >
                      <Download className="size-3.5" />
                    </button>
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

