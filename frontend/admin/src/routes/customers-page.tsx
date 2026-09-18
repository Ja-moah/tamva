import {
  Award,
  Copy,
  Download,
  Filter,
  KeyRound,
  Plus,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
import { useState } from "react";

import { CustomerTierDistributionChart } from "../components/charts/customer-risk-distribution-chart";
import { StatusBadge, type StatusTone } from "../components/feedback/status-badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DetailDrawer } from "../components/ui/detail-drawer";
import { useToast } from "../components/ui/toast";

interface CustomerIdentity {
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

const mockCustomers: CustomerIdentity[] = [
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

export function CustomersPage() {
  const [customers] = useState<CustomerIdentity[]>(mockCustomers);
  const [searchQuery, setSearchQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerIdentity | null>(null);
  const { toast } = useToast();

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

  const handleExport = () => {
    toast({
      title: "Passport Directory Exported",
      description: "Encrypted KYC registry summary downloaded (.csv)",
      type: "info",
    });
  };

  return (
    <div className="space-y-7">
      {/* Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[var(--border-subtle)] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-xs font-bold text-[var(--accent-gold)] uppercase tracking-wider">
              Identity &amp; Financial Passports
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-4xl">
            Customer Financial Passports
          </h1>
          <p className="mt-1.5 text-base text-[var(--text-secondary)] max-w-3xl leading-relaxed">
            Authorized customer identity registry, trust score ratings, verified Ghana Card biometric credentials, and active cross-institution data sharing consent scopes.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="secondary" size="md" onClick={handleExport} className="gap-2">
            <Download className="size-4 text-[var(--text-muted)]" />
            <span>Export Registry</span>
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={() =>
              toast({
                title: "Passport Provisioning",
                description: "Manual customer onboarding wizard triggered",
                type: "info",
              })
            }
            className="gap-2"
          >
            <Plus className="size-4" />
            <span>Issue Passport</span>
          </Button>
        </div>
      </div>

      {/* Directory KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Active Passports</p>
            <Users className="size-4.5 text-[var(--accent-gold)]" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-[var(--text-primary)] font-tabular">148,920</p>
          <p className="text-sm text-[var(--accent-emerald)] mt-1.5 font-semibold">+840 issued today</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Tier 3 Verified</p>
            <Award className="size-4.5 text-[var(--accent-emerald)]" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-[var(--accent-emerald)] font-tabular">64.2%</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1.5">Biometric Ghana Card verified</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Avg Trust Score</p>
            <ShieldCheck className="size-4.5 text-[var(--accent-gold)]" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-[var(--text-primary)] font-tabular">88 / 100</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1.5">High network integrity</p>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs font-bold uppercase tracking-wider text-[var(--text-muted)]">Consent Grants</p>
            <KeyRound className="size-4.5 text-[var(--text-muted)]" />
          </div>
          <p className="mt-3 text-3xl font-extrabold text-[var(--text-primary)] font-tabular">412,800</p>
          <p className="text-sm text-[var(--text-secondary)] mt-1.5">Active data authorizations</p>
        </Card>
      </div>

      {/* Visual Analytics Chart: Tier Distribution */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--text-primary)]">
              Customer KYC Tier &amp; Compliance Distribution
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-0.5">
              Breakdown of registered financial passports by identity validation depth and due diligence scope.
            </p>
          </div>
          <span className="font-mono text-xs uppercase tracking-wider text-[var(--accent-gold)] font-bold">
            National ID Engine
          </span>
        </div>
        <CustomerTierDistributionChart />
      </Card>

      {/* Filter and Search Bar */}
      <Card className="p-4">
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
                {tier === "TIER_3_PASSPORT" ? "Tier 3 Passport" : tier.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Customer Directory Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-base">
            <thead className="border-b border-[var(--border-default)] bg-[var(--bg-surface-elevated)] font-mono uppercase tracking-wider text-[var(--text-muted)] text-xs">
              <tr>
                <th className="px-5 py-3.5">Customer &amp; Passport ID</th>
                <th className="px-4 py-3.5">National ID Hash</th>
                <th className="px-4 py-3.5">KYC Tier</th>
                <th className="px-4 py-3.5">Trust Score</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Linked Banks</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  className="hover:bg-[var(--bg-surface-elevated)] transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-4">
                    <p className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-gold)] transition-colors text-base">
                      {c.name}
                    </p>
                    <span className="text-xs font-mono text-[var(--text-muted)] mt-0.5 block">{c.id}</span>
                  </td>
                  <td className="px-4 py-4 font-mono text-sm text-[var(--text-secondary)]">{c.nationalId}</td>
                  <td className="px-4 py-4">
                    <span className="font-mono text-xs font-bold px-3 py-1.5 rounded-md border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-[var(--text-primary)]">
                      {c.kycTier.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`font-mono font-bold font-tabular text-base ${
                        c.trustScore > 80
                          ? "text-[var(--accent-emerald)]"
                          : c.trustScore > 60
                          ? "text-[var(--accent-gold)]"
                          : "text-[var(--risk-critical)]"
                      }`}
                    >
                      {c.trustScore}/100
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge tone={c.tone} size="md">
                      {c.status.replace("_", " ")}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-md bg-[var(--bg-surface-elevated)] px-3 py-1 font-mono text-xs text-[var(--text-secondary)] border border-[var(--border-default)] font-medium">
                      {c.linkedInstitutions.length} Institutions
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <span className="font-mono text-sm text-[var(--accent-gold)] font-bold group-hover:underline">
                      Passport →
                    </span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-base text-[var(--text-muted)]">
                    No verified customer passports match the criteria.
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
        subtitle={`Passport: ${selectedCustomer?.id}`}
        badge={
          selectedCustomer ? (
            <StatusBadge tone={selectedCustomer.tone} size="md">
              {selectedCustomer.status.replace("_", " ")}
            </StatusBadge>
          ) : null
        }
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              size="md"
              onClick={() => handleCopy(selectedCustomer?.id || "")}
              className="gap-2"
            >
              <Copy className="size-4" />
              <span>Copy Passport Ref</span>
            </Button>
            <Button variant="secondary" size="md" onClick={() => setSelectedCustomer(null)}>
              Dismiss
            </Button>
          </div>
        }
      >
        {selectedCustomer && (
          <div className="space-y-6">
            <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] font-bold">Financial Trust Score</p>
                  <p className="text-4xl font-extrabold text-[var(--text-primary)] font-tabular mt-1.5">
                    {selectedCustomer.trustScore} / 100
                  </p>
                </div>
                <span className="grid size-12 place-items-center rounded-xl bg-[var(--accent-emerald)]/15 text-[var(--accent-emerald)] border border-[var(--accent-emerald)]/30">
                  <ShieldCheck className="size-7" />
                </span>
              </div>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2.5 font-bold">
                Identity Credentials &amp; Verification
              </p>
              <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] divide-y divide-[var(--border-subtle)] text-base">
                <div className="flex justify-between px-4 py-3.5">
                  <span className="text-[var(--text-muted)] text-sm">National ID (Ghana Card)</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">{selectedCustomer.nationalId}</span>
                </div>
                <div className="flex justify-between px-4 py-3.5">
                  <span className="text-[var(--text-muted)] text-sm">KYC Tier Level</span>
                  <span className="font-mono text-[var(--accent-gold)] font-bold">{selectedCustomer.kycTier}</span>
                </div>
                <div className="flex justify-between px-4 py-3.5">
                  <span className="text-[var(--text-muted)] text-sm">Last Financial Event</span>
                  <span className="text-[var(--text-secondary)] font-medium">{selectedCustomer.lastActive}</span>
                </div>
              </div>
            </div>

            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[var(--text-muted)] mb-2.5 font-bold">
                Active Cross-Institution Consent Authorizations
              </p>
              <div className="space-y-2.5">
                {selectedCustomer.activeConsents.map((consent) => (
                  <div
                    key={consent}
                    className="flex items-center gap-3 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] p-3.5 text-sm font-mono text-[var(--text-secondary)]"
                  >
                    <KeyRound className="size-4.5 text-[var(--accent-gold)] shrink-0" />
                    <span className="font-semibold">{consent}</span>
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

