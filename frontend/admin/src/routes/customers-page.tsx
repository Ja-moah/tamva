import {
  Award,
  Copy,
  Download,
  Filter,
  KeyRound,
  Plus,
  Search,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

import { CustomerTierDistributionChart } from "../components/charts/customer-risk-distribution-chart";
import { StatusBadge, type StatusTone } from "../components/feedback/status-badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DetailDrawer } from "../components/ui/detail-drawer";
import { useToast } from "../components/ui/toast";

export interface CustomerIdentity {
  id: string;
  name: string;
  nationalId: string;
  kycTier: "TIER_1" | "TIER_2" | "TIER_3_PASSPORT";
  trustScore: number;
  status: "VERIFIED" | "PENDING_CONSENT" | "RESTRICTED";
  tone: StatusTone;
  linkedInstitutions: string[];
  activeConsents: string[];
  lastActive: string;
}

const initialMockCustomers: CustomerIdentity[] = [
  {
    id: "GHA-892014-A",
    name: "Kofi Mensah",
    nationalId: "GHA-78291039-2",
    kycTier: "TIER_3_PASSPORT",
    trustScore: 94,
    status: "VERIFIED",
    tone: "success",
    linkedInstitutions: ["Apex Bank PLC", "Zenith Digital Trust"],
    activeConsents: ["FINANCIAL_PROFILE_READ", "TRANSACTION_AUTHORIZATION", "CREDIT_SHARING"],
    lastActive: "12m ago",
  },
  {
    id: "GHA-441209-B",
    name: "Abena Osei",
    nationalId: "GHA-10928374-9",
    kycTier: "TIER_2",
    trustScore: 78,
    status: "PENDING_CONSENT",
    tone: "warning",
    linkedInstitutions: ["Apex Bank PLC"],
    activeConsents: ["IDENTITY_VERIFICATION_ONLY"],
    lastActive: "1h ago",
  },
  {
    id: "GHA-782011-C",
    name: "Kwame Asante",
    nationalId: "GHA-66718290-3",
    kycTier: "TIER_3_PASSPORT",
    trustScore: 98,
    status: "VERIFIED",
    tone: "success",
    linkedInstitutions: ["Ecobank Regional Hub", "Apex Bank PLC", "Zenith Digital Trust"],
    activeConsents: ["CROSS_BORDER_PASSPORT", "FINANCIAL_PROFILE_READ", "BENEFICIARY_DATA"],
    lastActive: "3m ago",
  },
  {
    id: "GHA-109382-D",
    name: "Esi Badu",
    nationalId: "GHA-99201847-1",
    kycTier: "TIER_1",
    trustScore: 62,
    status: "VERIFIED",
    tone: "success",
    linkedInstitutions: ["Zenith Digital Trust"],
    activeConsents: ["BASIC_KYC_LOOKUP"],
    lastActive: "Yesterday",
  },
  {
    id: "GHA-667190-E",
    name: "Musa Ibrahim",
    nationalId: "GHA-33491827-0",
    kycTier: "TIER_2",
    trustScore: 45,
    status: "RESTRICTED",
    tone: "danger",
    linkedInstitutions: ["Apex Bank PLC"],
    activeConsents: ["BLOCKED_BY_COMPLIANCE"],
    lastActive: "3 days ago",
  },
];

const allAvailableConsents = [
  "FINANCIAL_PROFILE_READ",
  "TRANSACTION_AUTHORIZATION",
  "CREDIT_SHARING",
  "CROSS_BORDER_PASSPORT",
  "BIOMETRIC_DATA",
  "IDENTITY_VERIFICATION_ONLY",
];

export function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerIdentity[]>(initialMockCustomers);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerIdentity | null>(null);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const { toast } = useToast();

  // New Customer Form State
  const [newCustForm, setNewCustForm] = useState({
    name: "",
    nationalId: "",
    kycTier: "TIER_2" as "TIER_1" | "TIER_2" | "TIER_3_PASSPORT",
    trustScore: 85,
    institution: "Apex Bank PLC",
    consents: ["FINANCIAL_PROFILE_READ", "TRANSACTION_AUTHORIZATION"],
  });

  const filtered = customers.filter((c) => {
    const matchesTier = tierFilter === "ALL" || c.kycTier === tierFilter;
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nationalId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTier && matchesSearch;
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: text,
      type: "info",
    });
  };

  const handleUpgradeTier = (tier: "TIER_1" | "TIER_2" | "TIER_3_PASSPORT") => {
    if (!selectedCustomer) return;
    const updated: CustomerIdentity = {
      ...selectedCustomer,
      kycTier: tier,
      trustScore: tier === "TIER_3_PASSPORT" ? Math.max(90, selectedCustomer.trustScore) : selectedCustomer.trustScore,
      status: "VERIFIED",
      tone: "success",
    };

    setCustomers((prev) => prev.map((c) => (c.id === selectedCustomer.id ? updated : c)));
    setSelectedCustomer(updated);
    toast({
      title: "KYC Passport Promoted",
      description: `${selectedCustomer.name} promoted to ${tier.replace("_", " ")}`,
      type: "success",
    });
  };

  const handleToggleConsent = (consent: string) => {
    if (!selectedCustomer) return;
    const exists = selectedCustomer.activeConsents.includes(consent);
    const newConsents = exists
      ? selectedCustomer.activeConsents.filter((c) => c !== consent)
      : [...selectedCustomer.activeConsents, consent];

    const updated: CustomerIdentity = {
      ...selectedCustomer,
      activeConsents: newConsents,
    };

    setCustomers((prev) => prev.map((c) => (c.id === selectedCustomer.id ? updated : c)));
    setSelectedCustomer(updated);
    toast({
      title: exists ? "Consent Revoked" : "Consent Granted",
      description: `Scope ${consent} updated for ${selectedCustomer.name}`,
      type: "info",
    });
  };

  const handleToggleStatus = (status: "VERIFIED" | "PENDING_CONSENT" | "RESTRICTED") => {
    if (!selectedCustomer) return;
    const toneMap: Record<string, StatusTone> = {
      VERIFIED: "success",
      PENDING_CONSENT: "warning",
      RESTRICTED: "danger",
    };

    const updated: CustomerIdentity = {
      ...selectedCustomer,
      status,
      tone: toneMap[status],
    };

    setCustomers((prev) => prev.map((c) => (c.id === selectedCustomer.id ? updated : c)));
    setSelectedCustomer(updated);
    toast({
      title: "Status Updated",
      description: `${selectedCustomer.name} status marked as ${status.replace("_", " ")}`,
      type: "success",
    });
  };

  const handleRegisterPassport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustForm.name.trim() || !newCustForm.nationalId.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide customer name and Ghana Card ID.",
        type: "error",
      });
      return;
    }

    const randomId = `GHA-${Math.floor(100000 + Math.random() * 900000)}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
    const newCust: CustomerIdentity = {
      id: randomId,
      name: newCustForm.name,
      nationalId: newCustForm.nationalId,
      kycTier: newCustForm.kycTier,
      trustScore: Number(newCustForm.trustScore) || 80,
      status: "VERIFIED",
      tone: "success",
      linkedInstitutions: [newCustForm.institution],
      activeConsents: newCustForm.consents,
      lastActive: "Just now",
    };

    setCustomers((prev) => [newCust, ...prev]);
    setIsRegisterModalOpen(false);
    setSelectedCustomer(newCust);
    setNewCustForm({
      name: "",
      nationalId: "",
      kycTier: "TIER_2",
      trustScore: 85,
      institution: "Apex Bank PLC",
      consents: ["FINANCIAL_PROFILE_READ", "TRANSACTION_AUTHORIZATION"],
    });

    toast({
      title: "Passport Issued",
      description: `Cryptographic Financial Passport ${randomId} registered successfully.`,
      type: "success",
    });
  };

  const handleExport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Passport ID,Customer Name,Ghana National ID,KYC Tier,Trust Score,Status,Institutions\n" +
      filtered
        .map(
          (c) =>
            `"${c.id}","${c.name}","${c.nationalId}","${c.kycTier}",${c.trustScore},"${c.status}","${c.linkedInstitutions.join("; ")}"`,
        )
        .join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `tamva-customer-passports-${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();

    toast({
      title: "Passport Registry Exported",
      description: `Downloaded ${filtered.length} customer records (.csv)`,
      type: "info",
    });
  };

  const handleExportSingleCustomer = (cust: CustomerIdentity) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(cust, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `passport-${cust.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    toast({
      title: "KYC Dossier Downloaded",
      description: `Exported biometric dossier for ${cust.name}`,
      type: "info",
    });
  };

  return (
    <div className="space-y-8">
      {/* Header & Page Title */}
      <div className="ios-hero-banner p-7 sm:p-9 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2.5">
              <span className="font-mono text-xs font-extrabold text-[var(--accent-gold)] uppercase tracking-wider bg-[var(--bg-surface-elevated)] border border-[var(--accent-gold-border)] px-3 py-1 rounded-full shadow-xs">
                Identity &amp; Financial Passports
              </span>
              <span className="text-[var(--text-muted)]">·</span>
              <span className="font-mono text-xs font-bold text-[var(--accent-emerald)]">
                National ID Biometric Grid
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Customer Financial Passports
            </h1>
            <p className="mt-2.5 text-lg text-[var(--text-secondary)] max-w-3xl leading-relaxed font-medium">
              Authorized customer identity registry, trust score ratings, verified Ghana Card biometric credentials, and active cross-institution data sharing consent scopes.
            </p>
          </div>

          <div className="flex items-center gap-3.5 shrink-0">
            <Button variant="secondary" size="lg" onClick={handleExport} className="gap-2.5 shadow-xs text-base font-bold rounded-xl">
              <Download className="size-4.5 text-[var(--text-muted)]" />
              <span>Export Registry</span>
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={() => setIsRegisterModalOpen(true)}
              className="gap-2.5 shadow-md font-bold text-base rounded-xl"
            >
              <Plus className="size-4.5" />
              <span>Issue Passport</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Directory KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="p-6 ios-glass-card">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Active Passports</p>
            <Users className="size-5 text-[var(--accent-gold)]" />
          </div>
          <p className="mt-3 text-4xl font-extrabold text-[var(--text-primary)] font-tabular">148,920</p>
          <p className="text-base text-[var(--accent-emerald)] mt-2 font-bold">+840 issued today</p>
        </Card>

        <Card className="p-6 ios-glass-card">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Tier 3 Verified</p>
            <Award className="size-5 text-[var(--accent-emerald)]" />
          </div>
          <p className="mt-3 text-4xl font-extrabold text-[var(--accent-emerald)] font-tabular">64.2%</p>
          <p className="text-base text-[var(--text-secondary)] mt-2 font-semibold">Biometric Ghana Card verified</p>
        </Card>

        <Card className="p-6 ios-glass-card">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Avg Trust Score</p>
            <ShieldCheck className="size-5 text-[var(--accent-gold)]" />
          </div>
          <p className="mt-3 text-4xl font-extrabold text-[var(--text-primary)] font-tabular">88 / 100</p>
          <p className="text-base text-[var(--text-secondary)] mt-2 font-semibold">High network integrity</p>
        </Card>

        <Card className="p-6 ios-glass-card">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-extrabold uppercase tracking-wider text-[var(--text-muted)]">Consent Grants</p>
            <KeyRound className="size-5 text-[var(--text-muted)]" />
          </div>
          <p className="mt-3 text-4xl font-extrabold text-[var(--text-primary)] font-tabular">412,800</p>
          <p className="text-base text-[var(--text-secondary)] mt-2 font-semibold">Active data authorizations</p>
        </Card>
      </div>

      {/* Visual Analytics Chart: Tier Distribution */}
      <Card className="p-7 ios-glass-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 pb-4 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              Customer KYC Tier &amp; Compliance Distribution
            </h2>
            <p className="text-base text-[var(--text-secondary)] mt-1 font-medium">
              Breakdown of registered financial passports by identity validation depth and due diligence scope.
            </p>
          </div>
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent-gold)] font-bold px-3 py-1 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-default)]">
            National ID Engine
          </span>
        </div>
        <CustomerTierDistributionChart />
      </Card>

      {/* Filter and Search Bar */}
      <Card className="p-5 ios-glass-card">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4.5 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Search verified customers by Passport ID, name, or Ghana Card National ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] pl-10 pr-3.5 py-2.5 text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-gold)] focus:outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="size-4 text-[var(--text-muted)]" />
            <span className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold mr-1">
              KYC Level:
            </span>
            {["ALL", "TIER_1", "TIER_2", "TIER_3_PASSPORT"].map((tier) => (
              <button
                key={tier}
                onClick={() => setTierFilter(tier)}
                className={`rounded-md px-3.5 py-2 text-xs font-mono font-bold transition-colors cursor-pointer ${
                  tierFilter === tier
                    ? "bg-[var(--accent-gold)] text-black shadow-xs"
                    : "border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {tier.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Customer Registry Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead className="border-b border-[var(--border-default)] bg-[var(--bg-surface-elevated)] font-mono uppercase tracking-wider text-[var(--text-muted)] text-xs">
              <tr>
                <th className="px-5 py-3.5">Passport Identifier</th>
                <th className="px-4 py-3.5">Customer Name &amp; Ghana ID</th>
                <th className="px-4 py-3.5">KYC Tier</th>
                <th className="px-4 py-3.5">Trust Score</th>
                <th className="px-4 py-3.5">Consent Status</th>
                <th className="px-4 py-3.5">Active Institutions</th>
                <th className="px-5 py-3.5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.map((cust) => (
                <tr
                  key={cust.id}
                  onClick={() => setSelectedCustomer(cust)}
                  className="hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-4 font-mono font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-gold)] transition-colors">
                    {cust.id}
                  </td>
                  <td className="px-4 py-4">
                    <p className="font-bold text-[var(--text-primary)] text-base">{cust.name}</p>
                    <p className="text-sm font-mono text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                      {cust.nationalId}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`font-mono text-xs font-bold px-3 py-1.5 rounded-md ${
                        cust.kycTier === "TIER_3_PASSPORT"
                          ? "bg-[var(--risk-low-bg)] text-[var(--risk-low-text)] border border-[var(--risk-low-border)]"
                          : cust.kycTier === "TIER_2"
                          ? "bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-500/30"
                          : "bg-[var(--bg-surface-elevated)] text-[var(--text-secondary)] border border-[var(--border-default)]"
                      }`}
                    >
                      {cust.kycTier.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-4 font-mono text-base font-bold">
                    <span
                      className={
                        cust.trustScore >= 80
                          ? "text-[var(--accent-emerald)]"
                          : cust.trustScore >= 60
                          ? "text-[var(--accent-gold)]"
                          : "text-[var(--risk-critical)]"
                      }
                    >
                      {cust.trustScore}/100
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge tone={cust.tone} size="md">
                      {cust.status.replace("_", " ")}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-4 text-sm text-[var(--text-secondary)]">
                    <p className="font-medium truncate max-w-xs">{cust.linkedInstitutions.join(", ")}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5 font-mono">
                      {cust.activeConsents.length} active consent scopes
                    </p>
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
                    No customers found matching search parameters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Customer Detail Drawer */}
      <DetailDrawer
        open={Boolean(selectedCustomer)}
        onClose={() => setSelectedCustomer(null)}
        title={selectedCustomer?.name || "Customer Passport"}
        subtitle={`Passport Ref: ${selectedCustomer?.id}`}
        badge={
          selectedCustomer ? (
            <StatusBadge tone={selectedCustomer.tone} size="md">
              {selectedCustomer.status.replace("_", " ")}
            </StatusBadge>
          ) : null
        }
        footer={
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2">
              {selectedCustomer && (
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => handleExportSingleCustomer(selectedCustomer)}
                  className="gap-2"
                >
                  <Download className="size-4" />
                  <span>Download Dossier</span>
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="md" onClick={() => setSelectedCustomer(null)}>
                Dismiss
              </Button>
            </div>
          </div>
        }
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Quick Actions & KYC Upgrade */}
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-4 space-y-3">
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold">
                Manage KYC Passport Level
              </p>
              <div className="flex flex-wrap gap-2">
                {(["TIER_1", "TIER_2", "TIER_3_PASSPORT"] as const).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => handleUpgradeTier(tier)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-colors cursor-pointer border ${
                      selectedCustomer.kycTier === tier
                        ? "bg-[var(--accent-gold)] text-black border-[var(--accent-gold)] shadow-xs"
                        : "bg-[var(--bg-surface)] text-[var(--text-secondary)] border-[var(--border-default)] hover:text-[var(--text-primary)]"
                    }`}
                  >
                    {tier.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Passport Identity Attributes */}
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2.5 font-bold">
                Verified Credentials
              </p>
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] divide-y divide-[var(--border-subtle)] text-base">
                <div className="flex items-center justify-between px-4 py-3.5">
                  <span className="text-[var(--text-muted)] text-sm">Full Name</span>
                  <span className="font-bold text-[var(--text-primary)]">{selectedCustomer.name}</span>
                </div>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <span className="text-[var(--text-muted)] text-sm">Ghana National ID</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[var(--accent-gold)]">{selectedCustomer.nationalId}</span>
                    <button
                      onClick={() => handleCopy(selectedCustomer.nationalId)}
                      className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors rounded cursor-pointer"
                      title="Copy National ID"
                    >
                      <Copy className="size-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <span className="text-[var(--text-muted)] text-sm">Trust Score</span>
                  <span className="font-mono font-extrabold text-[var(--accent-emerald)] text-lg">
                    {selectedCustomer.trustScore} / 100
                  </span>
                </div>
                <div className="flex items-center justify-between px-4 py-3.5">
                  <span className="text-[var(--text-muted)] text-sm">Status Compliance</span>
                  <div className="flex items-center gap-1.5">
                    {(["VERIFIED", "PENDING_CONSENT", "RESTRICTED"] as const).map((st) => (
                      <button
                        key={st}
                        onClick={() => handleToggleStatus(st)}
                        className={`text-xs px-2 py-0.5 rounded font-mono font-semibold transition-colors cursor-pointer ${
                          selectedCustomer.status === st
                            ? "bg-[var(--border-strong)] text-[var(--text-primary)]"
                            : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
                        }`}
                      >
                        {st.replace("_", " ")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Active Data Sharing Consents */}
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2.5 font-bold">
                Consent Scopes (Click to Toggle)
              </p>
              <div className="space-y-2">
                {allAvailableConsents.map((consent) => {
                  const active = selectedCustomer.activeConsents.includes(consent);
                  return (
                    <div
                      key={consent}
                      onClick={() => handleToggleConsent(consent)}
                      className={`flex items-center justify-between rounded-lg p-3 border transition-colors cursor-pointer ${
                        active
                          ? "bg-[var(--risk-low-bg)] border-[var(--risk-low-border)] text-[var(--risk-low-text)]"
                          : "bg-[var(--bg-surface-elevated)] border-[var(--border-default)] text-[var(--text-secondary)]"
                      }`}
                    >
                      <span className="font-mono text-xs font-bold">{consent}</span>
                      <span className="text-xs font-semibold">{active ? "✓ Authorized" : "✕ Disabled"}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Interactive Issue Passport Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-10 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs transition-opacity"
            onClick={() => setIsRegisterModalOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-w-xl transform overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-6 shadow-[var(--shadow-lg)] transition-all z-10 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-default)] pb-4">
              <div className="flex items-center gap-2.5">
                <UserCheck className="size-5 text-[var(--accent-gold)]" />
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  Issue Customer Financial Passport
                </h2>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterPassport} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                  Customer Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ama Serwaa Boateng"
                  value={newCustForm.name}
                  onChange={(e) => setNewCustForm({ ...newCustForm, name: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-base text-[var(--text-primary)] focus:border-[var(--accent-gold)] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Ghana Card National ID *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. GHA-90823412-4"
                    value={newCustForm.nationalId}
                    onChange={(e) => setNewCustForm({ ...newCustForm, nationalId: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-base text-[var(--text-primary)] font-mono focus:border-[var(--accent-gold)] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Initial Trust Score (0-100)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newCustForm.trustScore}
                    onChange={(e) => setNewCustForm({ ...newCustForm, trustScore: parseInt(e.target.value, 10) || 85 })}
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3.5 py-2.5 text-base text-[var(--text-primary)] font-mono focus:border-[var(--accent-gold)] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    KYC Tier Level
                  </label>
                  <select
                    value={newCustForm.kycTier}
                    onChange={(e) =>
                      setNewCustForm({
                        ...newCustForm,
                        kycTier: e.target.value as "TIER_1" | "TIER_2" | "TIER_3_PASSPORT",
                      })
                    }
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-gold)] focus:outline-none"
                  >
                    <option value="TIER_1">Tier 1 (Basic Identity)</option>
                    <option value="TIER_2">Tier 2 (Verified Ghana Card)</option>
                    <option value="TIER_3_PASSPORT">Tier 3 (Biometric Passport Verified)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-1.5">
                    Primary Banking Partner
                  </label>
                  <select
                    value={newCustForm.institution}
                    onChange={(e) => setNewCustForm({ ...newCustForm, institution: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2.5 text-sm text-[var(--text-primary)] focus:border-[var(--accent-gold)] focus:outline-none"
                  >
                    <option value="Apex Bank PLC">Apex Bank PLC</option>
                    <option value="Zenith Digital Trust">Zenith Digital Trust</option>
                    <option value="Ecobank Regional Hub">Ecobank Regional Hub</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--border-default)]">
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setIsRegisterModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" className="gap-2 font-semibold">
                  <Plus className="size-4" />
                  <span>Issue &amp; Hash Passport</span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
