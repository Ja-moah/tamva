import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Download,
  FileCheck,
  FilePlus,
  FileText,
  Filter,
  Plus,
  Search,
  Send,
  ShieldAlert,
  UserCheck,
  X,
} from "lucide-react";
import { useState } from "react";

import { CaseTriageChart } from "../components/charts/case-triage-chart";
import { StatusBadge, type StatusTone } from "../components/feedback/status-badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DetailDrawer } from "../components/ui/detail-drawer";
import { useToast } from "../components/ui/toast";

export interface CaseItem {
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
  auditLogs?: Array<{ timestamp: string; author: string; message: string }>;
}

const initialMockCases: CaseItem[] = [
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
    auditLogs: [
      { timestamp: "2026-09-17 01:15", author: "TAMVA Risk Engine", message: "Rule RSK-VELOCITY-09 breached" },
      { timestamp: "2026-09-17 01:30", author: "Ama Boateng", message: "Investigator assigned; account hold placed" },
      { timestamp: "2026-09-17 02:00", author: "Ama Boateng", message: "Dispatched SAR dossier draft for FIC regulatory review" },
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
    notes: "Deepfake spoof detection triggered during Level 3 KYC passport upgrade verification.",
    auditLogs: [
      { timestamp: "2026-09-16 22:40", author: "TAMVA Identity Engine", message: "Biometric hash mismatch on facial depth mesh" },
      { timestamp: "2026-09-16 23:10", author: "Kwesi Appiah", message: "Manual visual audit in progress with Ghana Card registry" },
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
    notes: "Simultaneous logins initiated from London IP (AS2856) and Accra cell tower within 4 minutes.",
    auditLogs: [
      { timestamp: "2026-09-16 18:20", author: "TAMVA Policy Mesh", message: "Impossible travel velocity alert flagged" },
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
    notes: "Verified secondary national ID; confirmed false positive against UN / OFAC SDN list.",
    auditLogs: [
      { timestamp: "2026-09-15 14:00", author: "Sanction Screener", message: "Name phonetic match 88% on OFAC SDN" },
      { timestamp: "2026-09-15 15:45", author: "Yaw Darko", message: "Secondary KYC biometric proof reconciled; false positive closed" },
    ],
  },
];

export function CasesPage() {
  const [cases, setCases] = useState<CaseItem[]>(initialMockCases);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newNoteInput, setNewNoteInput] = useState("");
  const { toast } = useToast();

  // New Case Form State
  const [newCaseForm, setNewCaseForm] = useState({
    title: "",
    customerName: "",
    nationalId: "",
    institution: "Apex Bank PLC",
    priority: "HIGH" as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
    assignedTo: "Ama Boateng (AML Lead)",
    notes: "",
    evidenceCount: 1,
  });

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
    const updatedCase: CaseItem = {
      ...selectedCase,
      status: "RESOLVED",
      tone: "success",
      slaHoursRemaining: 0,
      auditLogs: [
        ...(selectedCase.auditLogs || []),
        {
          timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
          author: "Current Officer",
          message: "Case investigated and formally resolved with compliant clearance.",
        },
      ],
    };

    setCases((prev) => prev.map((c) => (c.id === selectedCase.id ? updatedCase : c)));
    setSelectedCase(updatedCase);
    toast({
      title: "Case Resolved & Archived",
      description: `Investigation ${selectedCase.id} closed with compliance audit record.`,
      type: "success",
    });
  };

  const handleEscalateSAR = () => {
    if (!selectedCase) return;
    const updatedCase: CaseItem = {
      ...selectedCase,
      status: "ESCALATED",
      tone: "danger",
      priority: "CRITICAL",
      auditLogs: [
        ...(selectedCase.auditLogs || []),
        {
          timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
          author: "AML Officer",
          message: "Escalated Suspicious Activity Report (SAR) to FIC Ghana regulatory portal.",
        },
      ],
    };

    setCases((prev) => prev.map((c) => (c.id === selectedCase.id ? updatedCase : c)));
    setSelectedCase(updatedCase);
    toast({
      title: "SAR Dossier Escalated",
      description: `Suspicious Activity Report (SAR) officially filed for ${selectedCase.id} to FIC Ghana.`,
      type: "info",
    });
  };

  const handleStatusChange = (newStatus: "NEW" | "UNDER_REVIEW" | "ESCALATED" | "RESOLVED") => {
    if (!selectedCase) return;
    const toneMap: Record<string, StatusTone> = {
      NEW: "info",
      UNDER_REVIEW: "warning",
      ESCALATED: "danger",
      RESOLVED: "success",
    };
    const updatedCase: CaseItem = {
      ...selectedCase,
      status: newStatus,
      tone: toneMap[newStatus],
      slaHoursRemaining: newStatus === "RESOLVED" ? 0 : selectedCase.slaHoursRemaining,
      auditLogs: [
        ...(selectedCase.auditLogs || []),
        {
          timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
          author: "Investigation Officer",
          message: `Case status transitioned to ${newStatus.replace("_", " ")}`,
        },
      ],
    };

    setCases((prev) => prev.map((c) => (c.id === selectedCase.id ? updatedCase : c)));
    setSelectedCase(updatedCase);
    toast({
      title: "Case Status Updated",
      description: `${selectedCase.id} is now ${newStatus.replace("_", " ")}`,
      type: "success",
    });
  };

  const handleAddNote = () => {
    if (!selectedCase || !newNoteInput.trim()) return;
    const now = new Date().toISOString().replace("T", " ").substring(0, 16);
    const updatedCase: CaseItem = {
      ...selectedCase,
      notes: `${selectedCase.notes}\n[${now}] Note: ${newNoteInput.trim()}`,
      auditLogs: [
        ...(selectedCase.auditLogs || []),
        {
          timestamp: now,
          author: "Investigator",
          message: newNoteInput.trim(),
        },
      ],
    };

    setCases((prev) => prev.map((c) => (c.id === selectedCase.id ? updatedCase : c)));
    setSelectedCase(updatedCase);
    setNewNoteInput("");
    toast({
      title: "Note Added to Dossier",
      description: "Cryptographic timeline updated with investigator notes.",
      type: "info",
    });
  };

  const handleAddEvidence = () => {
    if (!selectedCase) return;
    const now = new Date().toISOString().replace("T", " ").substring(0, 16);
    const updatedCase: CaseItem = {
      ...selectedCase,
      evidenceCount: selectedCase.evidenceCount + 1,
      auditLogs: [
        ...(selectedCase.auditLogs || []),
        {
          timestamp: now,
          author: "Investigator",
          message: `Attached evidentiary document #${selectedCase.evidenceCount + 1}`,
        },
      ],
    };

    setCases((prev) => prev.map((c) => (c.id === selectedCase.id ? updatedCase : c)));
    setSelectedCase(updatedCase);
    toast({
      title: "Evidence Attached",
      description: `Uploaded artifact verified and locked to dossier ${selectedCase.id}.`,
      type: "success",
    });
  };

  const handleReassign = (assignee: string) => {
    if (!selectedCase) return;
    const now = new Date().toISOString().replace("T", " ").substring(0, 16);
    const updatedCase: CaseItem = {
      ...selectedCase,
      assignedTo: assignee,
      auditLogs: [
        ...(selectedCase.auditLogs || []),
        {
          timestamp: now,
          author: "Case Supervisor",
          message: `Lead investigator reassigned to ${assignee}`,
        },
      ],
    };

    setCases((prev) => prev.map((c) => (c.id === selectedCase.id ? updatedCase : c)));
    setSelectedCase(updatedCase);
    toast({
      title: "Investigator Reassigned",
      description: `${selectedCase.id} transferred to ${assignee}`,
      type: "info",
    });
  };

  const handleCreateNewCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseForm.title.trim() || !newCaseForm.customerName.trim()) {
      toast({
        title: "Incomplete Form",
        description: "Please provide case title and customer name.",
        type: "error",
      });
      return;
    }

    const randomNum = Math.floor(4030 + Math.random() * 500);
    const newId = `CAS-${randomNum}`;
    const toneMap: Record<string, StatusTone> = {
      CRITICAL: "danger",
      HIGH: "warning",
      MEDIUM: "info",
      LOW: "neutral",
    };

    const newCase: CaseItem = {
      id: newId,
      title: newCaseForm.title,
      customer: `${newCaseForm.customerName} (${newCaseForm.nationalId ? `ID: ${newCaseForm.nationalId}` : "ID: GHA-PENDING"})`,
      institution: newCaseForm.institution,
      priority: newCaseForm.priority,
      status: "NEW",
      tone: toneMap[newCaseForm.priority],
      slaHoursRemaining: newCaseForm.priority === "CRITICAL" ? 4 : newCaseForm.priority === "HIGH" ? 12 : 24,
      assignedTo: newCaseForm.assignedTo,
      openedAt: new Date().toISOString().replace("T", " ").substring(0, 16),
      evidenceCount: Number(newCaseForm.evidenceCount) || 1,
      notes: newCaseForm.notes || "Initial investigation opened via administrative compliance console.",
      auditLogs: [
        {
          timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
          author: newCaseForm.assignedTo,
          message: "Investigation opened and formal file initiated.",
        },
      ],
    };

    setCases((prev) => [newCase, ...prev]);
    setIsCreateModalOpen(false);
    setSelectedCase(newCase);
    setNewCaseForm({
      title: "",
      customerName: "",
      nationalId: "",
      institution: "Apex Bank PLC",
      priority: "HIGH",
      assignedTo: "Ama Boateng (AML Lead)",
      notes: "",
      evidenceCount: 1,
    });

    toast({
      title: "Case Created & Dispatched",
      description: `Case ${newId} registered with active SLA timer.`,
      type: "success",
    });
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filtered, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `tamva-cases-export-${new Date().toISOString().substring(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toast({
      title: "Audit Dossier Exported",
      description: `Downloaded ${filtered.length} investigations in ISO 20022 JSON format.`,
      type: "info",
    });
  };

  const handleExportSingleCase = (caseItem: CaseItem) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(caseItem, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `tamva-case-${caseItem.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toast({
      title: "Case Exported",
      description: `Exported complete dossier for ${caseItem.id}`,
      type: "info",
    });
  };

  const activeCount = cases.filter((c) => c.status !== "RESOLVED").length;
  const criticalCount = cases.filter((c) => c.priority === "CRITICAL" && c.status !== "RESOLVED").length;
  const resolvedCount = cases.filter((c) => c.status === "RESOLVED").length;

  return (
    <div className="space-y-8">
      {/* Header & Page Identification */}
      <div className="ios-hero-banner p-7 sm:p-9 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="font-mono text-xs font-extrabold text-[var(--accent-gold)] uppercase tracking-wider bg-[var(--bg-surface-elevated)] border border-[var(--accent-gold-border)] px-3 py-1 rounded-full shadow-xs">
                AML &amp; Fraud Investigation Desk
              </span>
              <span className="text-[var(--text-muted)]">·</span>
              <span className="font-mono text-xs font-bold text-[var(--accent-emerald)]">
                FIC Regulatory Gateway Active
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Case Management &amp; Triage
            </h1>
            <p className="mt-2.5 text-lg text-[var(--text-secondary)] max-w-3xl leading-relaxed font-medium">
              Review anomaly alerts dispatched by TAMVA risk policies, assemble evidentiary dossiers, manage officer assignments, and record binding compliance outcomes.
            </p>
          </div>

          <div className="flex items-center gap-3.5 shrink-0">
            <Button variant="secondary" size="lg" onClick={handleExport} className="gap-2.5 shadow-xs text-base font-bold rounded-xl">
              <Download className="size-4.5 text-[var(--text-muted)]" />
              <span>Export Dossiers</span>
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsCreateModalOpen(true)}
              className="gap-2.5 shadow-md font-bold text-base rounded-xl"
            >
              <Plus className="size-4.5" />
              <span>New Case Intake</span>
            </Button>
          </div>
        </div>
      </div>

      {/* KPI & Metrics Bar with iOS Glass Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-6 ios-glass-card">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Active Inquiries</p>
            <Clock className="size-5 text-[var(--accent-gold)]" />
          </div>
          <p className="mt-3 text-4xl font-extrabold text-[var(--text-primary)] font-tabular">{activeCount} Active</p>
          <p className="text-base text-[var(--accent-emerald)] mt-2 font-bold flex items-center gap-2">
            <UserCheck className="size-4.5" /> Real-time triage active
          </p>
        </Card>

        <Card className="p-6 ios-glass-card">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Critical SLA Window</p>
            <ShieldAlert className="size-5 text-[var(--risk-critical)]" />
          </div>
          <p className="mt-3 text-4xl font-extrabold text-[var(--risk-critical)] font-tabular">{criticalCount} Imminent</p>
          <p className="text-base text-[var(--text-muted)] mt-2 font-mono font-semibold">&lt; 2h regulatory window</p>
        </Card>

        <Card className="p-6 ios-glass-card">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Mean Time to Resolution</p>
            <Clock className="size-5 text-[var(--text-muted)]" />
          </div>
          <p className="mt-3 text-4xl font-extrabold text-[var(--text-primary)] font-tabular">3.8 Hours</p>
          <p className="text-base text-[var(--text-secondary)] mt-2 font-semibold">-22% vs 30d baseline</p>
        </Card>

        <Card className="p-6 ios-glass-card">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Weekly Resolution</p>
            <CheckCircle2 className="size-5 text-[var(--accent-emerald)]" />
          </div>
          <p className="mt-3 text-4xl font-extrabold text-[var(--accent-emerald)] font-tabular">{resolvedCount} Closed</p>
          <p className="text-base text-[var(--text-secondary)] mt-2 font-semibold">98.2% on-time clearance</p>
        </Card>
      </div>

      {/* Visual Analytics Chart: 7-Day Case Velocity & SLA Resolution */}
      <Card className="p-7 ios-glass-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Case Triage &amp; Resolution Throughput (7 Days)
            </h2>
            <p className="text-base text-[var(--text-secondary)] mt-1 font-medium">
              Daily comparative volume of new incident alerts vs resolved dossiers and regulatory SAR escalations.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent-gold)] font-bold px-3 py-1 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-default)]">
              FIC / AML SLA Engine
            </span>
          </div>
        </div>
        <CaseTriageChart />
      </Card>

      {/* Filter and Search Bar */}
      <Card className="p-5 ios-glass-card">
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
                    <p className="text-sm text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5 font-medium">
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

      {/* Interactive Case Detail Drawer */}
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
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                size="md"
                onClick={handleEscalateSAR}
                className="gap-2 font-semibold"
                disabled={selectedCase?.status === "RESOLVED"}
              >
                <AlertTriangle className="size-4" />
                <span>Escalate SAR to FIC</span>
              </Button>
              {selectedCase && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => handleExportSingleCase(selectedCase)}
                  className="gap-2"
                >
                  <Download className="size-4" />
                  <span>Export JSON</span>
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="emerald"
                size="md"
                onClick={handleResolveCase}
                className="gap-2 font-semibold"
              >
                <CheckCircle2 className="size-4" />
                <span>{selectedCase?.status === "RESOLVED" ? "Update Audit Clearance" : "Resolve & Close"}</span>
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
            {/* Quick Status Bar */}
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-4">
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold mb-2.5">
                Transition Investigation State
              </p>
              <div className="flex flex-wrap gap-2">
                {(["NEW", "UNDER_REVIEW", "ESCALATED", "RESOLVED"] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleStatusChange(st)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer border ${
                      selectedCase.status === st
                        ? "bg-[var(--accent-gold)] text-black border-[var(--accent-gold)] shadow-xs"
                        : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-default)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {st.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Narrative */}
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-5">
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--accent-gold)] font-bold">
                Investigation Trigger &amp; Case Narrative
              </p>
              <p className="mt-2 text-base text-[var(--text-primary)] leading-relaxed whitespace-pre-line font-medium">
                {selectedCase.notes}
              </p>
            </div>

            {/* Scope & Assignee */}
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2.5 font-bold">
                Operational Scope &amp; Assignee
              </p>
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] divide-y divide-[var(--border-subtle)] text-base">
                <div className="flex items-center justify-between px-4 py-3.5">
                  <span className="text-[var(--text-muted)] text-sm">Lead Investigator</span>
                  <select
                    value={selectedCase.assignedTo}
                    onChange={(e) => handleReassign(e.target.value)}
                    className="bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] rounded-md px-2.5 py-1 text-sm font-semibold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-gold)]"
                  >
                    <option value="Ama Boateng (AML Lead)">Ama Boateng (AML Lead)</option>
                    <option value="Kwesi Appiah">Kwesi Appiah</option>
                    <option value="Yaw Darko (Compliance)">Yaw Darko (Compliance)</option>
                    <option value="Unassigned">Unassigned</option>
                  </select>
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
                <div className="flex items-center justify-between px-4 py-3.5">
                  <span className="text-[var(--text-muted)] text-sm">Evidentiary Attachments</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[var(--accent-emerald)] font-bold font-tabular text-sm">
                      {selectedCase.evidenceCount} verified files
                    </span>
                    <button
                      onClick={handleAddEvidence}
                      className="px-2.5 py-1 rounded bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] text-xs font-mono font-bold text-[var(--accent-gold)] hover:bg-[var(--border-subtle)] transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <FilePlus className="size-3.5" /> + Attach File
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Audit Log Timeline */}
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2.5 font-bold">
                Immutable Audit Trail &amp; Evidence Timeline
              </p>
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] p-4 space-y-3">
                {selectedCase.auditLogs?.map((log, index) => (
                  <div key={index} className="border-l-2 border-[var(--accent-gold)] pl-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--text-primary)]">{log.author}</span>
                      <span className="font-mono text-xs text-[var(--text-muted)]">{log.timestamp}</span>
                    </div>
                    <p className="text-[var(--text-secondary)] mt-0.5">{log.message}</p>
                  </div>
                ))}

                {/* Add note input */}
                <div className="pt-2 flex gap-2">
                  <input
                    type="text"
                    placeholder="Add investigator note or evidence observation..."
                    value={newNoteInput}
                    onChange={(e) => setNewNoteInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddNote();
                    }}
                    className="flex-1 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent-gold)]"
                  />
                  <Button variant="primary" size="md" onClick={handleAddNote} className="gap-1.5 shrink-0">
                    <Send className="size-3.5" />
                    <span>Post</span>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Interactive New Case Intake Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-10 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={() => setIsCreateModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-2xl transform overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-6 shadow-[var(--shadow-lg)] transition-all z-10 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
              <div className="flex items-center gap-2.5">
                <FileCheck className="size-5 text-[var(--accent-gold)]" />
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  Open New Case Investigation
                </h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleCreateNewCase} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Case Title / Incident Type *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Unexplained High-Velocity Mobile Money Transfer"
                  value={newCaseForm.title}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, title: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-base text-[var(--text-primary)] focus:border-[var(--accent-gold)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Customer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kofi Mensah"
                    value={newCaseForm.customerName}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, customerName: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-base text-[var(--text-primary)] focus:border-[var(--accent-gold)] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Ghana Card / National ID
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GHA-89214012-9"
                    value={newCaseForm.nationalId}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, nationalId: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-base text-[var(--text-primary)] font-mono focus:border-[var(--accent-gold)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Financial Institution
                  </label>
                  <select
                    value={newCaseForm.institution}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, institution: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-gold)] focus:outline-none"
                  >
                    <option value="MTN Mobile Money">MTN Mobile Money</option>
                    <option value="Telecel Cash">Telecel Cash</option>
                    <option value="AirtelTigo Money">AirtelTigo Money</option>
                    <option value="Apex Bank PLC">Apex Bank PLC</option>
                    <option value="Zenith Digital Trust">Zenith Digital Trust</option>
                    <option value="Ecobank Regional Hub">Ecobank Regional Hub</option>
                    <option value="GhIPSS National Switch">GhIPSS National Switch</option>
                    <option value="Stanbic Bank Ghana">Stanbic Bank Ghana</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={newCaseForm.priority}
                    onChange={(e) =>
                      setNewCaseForm({
                        ...newCaseForm,
                        priority: e.target.value as "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
                      })
                    }
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-gold)] focus:outline-none"
                  >
                    <option value="CRITICAL">CRITICAL (&lt; 4h SLA)</option>
                    <option value="HIGH">HIGH (12h SLA)</option>
                    <option value="MEDIUM">MEDIUM (24h SLA)</option>
                    <option value="LOW">LOW (48h SLA)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Lead Assignee
                  </label>
                  <select
                    value={newCaseForm.assignedTo}
                    onChange={(e) => setNewCaseForm({ ...newCaseForm, assignedTo: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-gold)] focus:outline-none"
                  >
                    <option value="Ama Boateng (AML Lead)">Ama Boateng (AML Lead)</option>
                    <option value="Kwesi Appiah">Kwesi Appiah</option>
                    <option value="Yaw Darko (Compliance)">Yaw Darko (Compliance)</option>
                    <option value="Unassigned">Unassigned</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Initial Evidence &amp; Anomaly Narrative
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed notes explaining the trigger, velocity metrics, transaction IDs, or compliance suspicion..."
                  value={newCaseForm.notes}
                  onChange={(e) => setNewCaseForm({ ...newCaseForm, notes: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2 text-base text-[var(--text-primary)] focus:border-[var(--accent-gold)] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-default)]">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" className="gap-2 font-semibold">
                  <Plus className="size-4" />
                  <span>Create &amp; Dispatch Case</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
