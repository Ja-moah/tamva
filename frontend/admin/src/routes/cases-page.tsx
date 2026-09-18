import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Filter,
  Plus,
  Search,
  ShieldAlert,
  UserCheck,
} from "lucide-react";
import { useState } from "react";

import { CaseTriageChart } from "../components/charts/case-triage-chart";
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
    notes: "Sudden GH₵ 240,000 inflow dispersed in 18 micro-payments within 12 minutes via MoMo switch.",
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
    notes: "Deepfake spoof detection triggered during Level 3 KYC passport upgrade verification.",
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
    notes: "Simultaneous logins initiated from London IP (AS2856) and Accra cell tower within 4 minutes.",
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
    notes: "Verified secondary national ID; confirmed false positive against UN / OFAC SDN list.",
  },
];

export function CasesPage() {
  const [cases, setCases] = useState<CaseItem[]>(mockCases);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const { toast } = useToast();

  const filtered = cases.filter((c) => {
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    const matchesPriority = priorityFilter === "ALL" || c.priority === priorityFilter;
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.institution.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const handleResolveCase = () => {
    if (!selectedCase) return;
    setCases((prev) =>
      prev.map((c) =>
        c.id === selectedCase.id ? { ...c, status: "RESOLVED", tone: "success" } : c,
      ),
    );
    toast({
      title: "Case Resolved & Archived",
      description: `Investigation ${selectedCase.id} closed with compliance audit record.`,
      type: "success",
    });
    setSelectedCase(null);
  };

  const handleEscalateSAR = () => {
    if (!selectedCase) return;
    toast({
      title: "Escalated to FIC Ghana",
      description: `Suspicious Activity Report (SAR) draft generated for ${selectedCase.id}.`,
      type: "error",
    });
  };

  const handleExport = () => {
    toast({
      title: "Audit Dossier Exported",
      description: "Downloaded ISO 20022 compliant investigation archive (.json)",
      type: "info",
    });
  };

  return (
    <div className="space-y-7">
      {/* Header & Page Identification */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs font-bold text-[var(--accent-gold)] uppercase tracking-wider">
              AML &amp; Fraud Investigation Desk
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            Case Management &amp; Triage
          </h1>
          <p className="mt-1.5 text-base text-[var(--text-secondary)] max-w-3xl leading-relaxed">
            Review anomaly alerts dispatched by TAMVA risk policies, assemble evidentiary dossiers, manage officer assignments, and record binding compliance outcomes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" onClick={handleExport} className="gap-2">
            <Download className="size-4 text-[var(--text-muted)]" />
            <span>Export Dossier</span>
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() =>
              toast({
                title: "Manual Case Creation",
                description: "New investigation intake form opened",
                type: "info",
              })
            }
            className="gap-2"
          >
            <Plus className="size-4" />
            <span>New Case</span>
          </Button>
        </div>
      </div>

      {/* KPI & Metrics Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Active Inquiries</p>
            <Clock className="size-4.5 text-[var(--accent-gold)]" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-[var(--text-primary)] font-tabular">3 Active</p>
          <p className="text-sm text-[var(--accent-emerald)] mt-1.5 font-semibold flex items-center gap-1.5">
            <UserCheck className="size-4" /> 1 assigned today
          </p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Critical SLA Breach</p>
            <ShieldAlert className="size-4.5 text-[var(--risk-critical)]" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-[var(--risk-critical)] font-tabular">1 Imminent</p>
          <p className="text-sm text-[var(--text-muted)] mt-1.5 font-mono font-medium">&lt; 2h remaining window</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Mean Time to Resolution</p>
            <Clock className="size-4.5 text-[var(--text-muted)]" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-[var(--text-primary)] font-tabular">4.2 Hours</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1.5 font-medium">-18% vs 30d baseline</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Weekly Resolution Rate</p>
            <CheckCircle2 className="size-4.5 text-[var(--accent-emerald)]" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-[var(--accent-emerald)] font-tabular">28 Closed</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1.5 font-semibold">96.4% on-time clearance</p>
        </Card>
      </div>

      {/* Visual Analytics Chart: 7-Day Case Velocity & SLA Resolution */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Case Triage &amp; Resolution Throughput (7 Days)
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Daily comparative volume of new incident alerts vs resolved dossiers and regulatory SAR escalations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent-gold)] font-bold">
              FIC / AML SLA Engine
            </span>
          </div>
        </div>
        <CaseTriageChart />
      </Card>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search by Case ID, customer name, Ghana Card ID, or institution..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] pl-10 pr-3.5 py-2.5 text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-gold)] focus:outline-none transition-colors"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5">
              <Filter className="size-4 text-[var(--text-muted)]" />
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold mr-1">
                Status:
              </span>
              {["ALL", "NEW", "UNDER_REVIEW", "ESCALATED", "RESOLVED"].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`rounded-md px-3.5 py-2 text-xs font-mono font-bold transition-colors cursor-pointer ${
                    statusFilter === status
                      ? "bg-[var(--accent-gold)] text-black shadow-xs"
                      : "border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {status.replace("_", " ")}
                </button>
              ))}
            </div>

            <div className="h-5 w-px bg-[var(--border-subtle)] hidden sm:block" />

            <div className="flex items-center gap-1.5">
              <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold mr-1">
                Priority:
              </span>
              {["ALL", "CRITICAL", "HIGH", "MEDIUM"].map((p) => (
                <button
                  key={p}
                  onClick={() => setPriorityFilter(p)}
                  className={`rounded-md px-3 py-2 text-xs font-mono font-bold transition-colors cursor-pointer ${
                    priorityFilter === p
                      ? "bg-[var(--border-strong)] text-[var(--text-primary)]"
                      : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Case List Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead className="border-b border-[var(--border-default)] bg-[var(--bg-surface-elevated)] font-mono uppercase tracking-wider text-[var(--text-muted)] text-xs">
              <tr>
                <th className="px-5 py-3.5">Case Reference</th>
                <th className="px-4 py-3.5">Investigation Context</th>
                <th className="px-4 py-3.5">Subject &amp; Institution</th>
                <th className="px-4 py-3.5">Priority</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">SLA Window</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedCase(c)}
                  className="hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-4 font-mono font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-gold)] transition-colors text-base">
                    {c.id}
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-[var(--text-primary)] text-base">{c.title}</p>
                    <p className="text-sm text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                      <FileText className="size-4 text-[var(--accent-gold)]" />
                      {c.evidenceCount} evidentiary items attached
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-[var(--text-primary)] font-bold text-base">{c.customer}</p>
                    <p className="text-sm text-[var(--text-muted)]">{c.institution}</p>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`font-mono text-xs font-bold px-3 py-1.5 rounded-md ${
                        c.priority === "CRITICAL"
                          ? "bg-red-500/15 text-[var(--risk-critical)] border border-red-500/30"
                          : c.priority === "HIGH"
                          ? "bg-amber-500/15 text-[var(--risk-high)] border border-amber-500/30"
                          : "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)]"
                      }`}
                    >
                      {c.priority}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge tone={c.tone} size="md">
                      {c.status.replace("_", " ")}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-4 font-mono text-base">
                    {c.status === "RESOLVED" ? (
                      <span className="text-[var(--accent-emerald)] flex items-center gap-1.5 font-bold">
                        <CheckCircle2 className="size-4.5" /> Closed
                      </span>
                    ) : (
                      <span
                        className={`flex items-center gap-1.5 font-tabular ${
                          c.slaHoursRemaining <= 2
                            ? "text-[var(--risk-critical)] font-bold"
                            : "text-[var(--text-secondary)] font-medium"
                        }`}
                      >
                        <Clock className="size-4.5" />
                        {c.slaHoursRemaining}h remaining
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-mono text-sm text-[var(--accent-gold)] font-bold group-hover:underline">
                      Inspect →
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-base text-[var(--text-muted)]">
                    No cases match the selected search or filter criteria.
                  </td>
                </tr>
              )}
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
            <StatusBadge tone={selectedCase.tone} size="md">
              {selectedCase.status.replace("_", " ")}
            </StatusBadge>
          ) : null
        }
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            <Button variant="danger" size="md" onClick={handleEscalateSAR} className="gap-2">
              <AlertTriangle className="size-4" />
              <span>Escalate to FIC</span>
            </Button>
            <div className="flex items-center gap-2">
              <Button variant="emerald" size="md" onClick={handleResolveCase} className="gap-2">
                <CheckCircle2 className="size-4" />
                <span>Resolve &amp; Close</span>
              </Button>
              <Button variant="secondary" size="md" onClick={() => setSelectedCase(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        }
      >
        {selectedCase && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-5">
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--accent-gold)] font-bold">
                Investigation Trigger &amp; Case Narrative
              </p>
              <p className="mt-2 text-base text-[var(--text-primary)] leading-relaxed">{selectedCase.notes}</p>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2.5 font-bold">
                Operational Scope &amp; Assignee
              </p>
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] divide-y divide-[var(--border-subtle)] text-base">
                <div className="flex justify-between px-4 py-3.5">
                  <span className="text-[var(--text-muted)] text-sm">Lead Investigator</span>
                  <span className="font-bold text-[var(--text-primary)]">{selectedCase.assignedTo}</span>
                </div>
                <div className="flex justify-between px-4 py-3.5">
                  <span className="text-[var(--text-muted)] text-sm">Target Subject</span>
                  <span className="text-[var(--text-primary)] font-bold">{selectedCase.customer}</span>
                </div>
                <div className="flex justify-between px-4 py-3.5">
                  <span className="text-[var(--text-muted)] text-sm">Participating Bank</span>
                  <span className="text-[var(--text-primary)] font-medium">{selectedCase.institution}</span>
                </div>
                <div className="flex justify-between px-4 py-3.5">
                  <span className="text-[var(--text-muted)] text-sm">Opened Timestamp</span>
                  <span className="font-mono text-[var(--text-secondary)] text-sm font-medium">{selectedCase.openedAt}</span>
                </div>
                <div className="flex justify-between px-4 py-3.5">
                  <span className="text-[var(--text-muted)] text-sm">Evidentiary Attachments</span>
                  <span className="text-[var(--accent-emerald)] font-bold font-tabular text-base">
                    {selectedCase.evidenceCount} verified documents
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}

