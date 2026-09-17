import {
  Building2,
  Copy,
  Fingerprint,
  KeyRound,
  Search,
  UserCheck,
} from "lucide-react";
import { useState } from "react";

import { StatusBadge, type StatusTone } from "../components/feedback/status-badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DetailDrawer } from "../components/ui/detail-drawer";
import { useToast } from "../components/ui/toast";

interface CustomerIdentity {
  id: string;
  name: string;
  avatar: string;
  nationalId: string;
  biometricHash: string;
  kycTier: "TIER_1" | "TIER_2" | "TIER_3_PASSPORT";
  trustScore: number;
  status: "VERIFIED" | "PENDING_CONSENT" | "RESTRICTED";
  tone: StatusTone;
  linkedInstitutions: { name: string; code: string; verifiedSince: string }[];
  activeConsents: string[];
  lastActive: string;
  phone: string;
  residence: string;
}

const mockCustomers: CustomerIdentity[] = [
  {
    id: "GHA-892014-A",
    name: "Kofi Mensah",
    avatar: "/assets/avatar-kofi.jpg",
    nationalId: "GHA-78291039-2",
    biometricHash: "0x892a...f70b (NIST 99.8% Match)",
    kycTier: "TIER_3_PASSPORT",
    trustScore: 94,
    status: "VERIFIED",
    tone: "success",
    linkedInstitutions: [
      { name: "Apex Bank PLC", code: "APEX-GH", verifiedSince: "2024-03" },
      { name: "Zenith Digital Trust", code: "ZNTH-AF", verifiedSince: "2025-01" },
    ],
    activeConsents: [
      "FINANCIAL_PROFILE_READ",
      "TRANSACTION_AUTHORIZATION",
      "CROSS_BORDER_CREDIT_SHARING",
    ],
    lastActive: "12m ago",
    phone: "+233 24 892 0149",
    residence: "Airport Residential Area, Accra, Ghana",
  },
  {
    id: "GHA-441209-B",
    name: "Abena Osei",
    avatar: "/assets/avatar-operator.jpg",
    nationalId: "GHA-10928374-9",
    biometricHash: "0x441b...a192 (Face & Iris match)",
    kycTier: "TIER_2",
    trustScore: 78,
    status: "PENDING_CONSENT",
    tone: "warning",
    linkedInstitutions: [
      { name: "Apex Bank PLC", code: "APEX-GH", verifiedSince: "2025-08" },
    ],
    activeConsents: ["IDENTITY_VERIFICATION_ONLY"],
    lastActive: "1h ago",
    phone: "+233 50 109 2837",
    residence: "Ahodwo, Kumasi, Ghana",
  },
  {
    id: "GHA-782011-C",
    name: "Kwame Asante",
    avatar: "/assets/avatar-kofi.jpg",
    nationalId: "GHA-66718290-3",
    biometricHash: "0x782c...3319 (Full Biometric Chip)",
    kycTier: "TIER_3_PASSPORT",
    trustScore: 98,
    status: "VERIFIED",
    tone: "success",
    linkedInstitutions: [
      { name: "Ecobank Regional Hub", code: "ECO-REG", verifiedSince: "2023-11" },
      { name: "Apex Bank PLC", code: "APEX-GH", verifiedSince: "2024-06" },
      { name: "Zenith Digital Trust", code: "ZNTH-AF", verifiedSince: "2025-02" },
    ],
    activeConsents: [
      "PAPSS_CROSS_BORDER_PASSPORT",
      "FINANCIAL_PROFILE_READ",
      "BENEFICIARY_DATA_SHARE",
    ],
    lastActive: "3m ago",
    phone: "+233 20 667 1829",
    residence: "East Legon Hills, Accra, Ghana",
  },
  {
    id: "GHA-109382-D",
    name: "Esi Badu",
    avatar: "/assets/avatar-operator.jpg",
    nationalId: "GHA-99201847-1",
    biometricHash: "0x109d...ee84 (Ghana Card OCR)",
    kycTier: "TIER_1",
    trustScore: 62,
    status: "VERIFIED",
    tone: "success",
    linkedInstitutions: [
      { name: "Zenith Digital Trust", code: "ZNTH-AF", verifiedSince: "2026-01" },
    ],
    activeConsents: ["BASIC_KYC_LOOKUP"],
    lastActive: "Yesterday",
    phone: "+233 27 992 0184",
    residence: "Market Circle, Takoradi, Ghana",
  },
  {
    id: "GHA-667190-E",
    name: "Musa Ibrahim",
    avatar: "/assets/avatar-kofi.jpg",
    nationalId: "GHA-33491827-0",
    biometricHash: "0x667e...0021 (Pending Review)",
    kycTier: "TIER_2",
    trustScore: 45,
    status: "RESTRICTED",
    tone: "danger",
    linkedInstitutions: [
      { name: "Apex Bank PLC", code: "APEX-GH", verifiedSince: "2026-04" },
    ],
    activeConsents: ["BLOCKED_BY_COMPLIANCE"],
    lastActive: "3 days ago",
    phone: "+233 54 334 9182",
    residence: "Tamale Central, Northern Region, Ghana",
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

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: `${label}: ${text}`,
      type: "info",
    });
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#D4A017] uppercase tracking-widest">
              Financial Identity Directory
            </span>
            <span className="text-white/30">·</span>
            <StatusBadge tone="success" size="sm">
              Ghana Card &amp; Biometric Bound
            </StatusBadge>
          </div>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Customer Financial Passports
          </h1>
          <p className="mt-2 text-sm text-white/60 max-w-2xl leading-relaxed">
            Cryptographic identity directory, trust ratings, verified biometric credentials, and
            active inter-bank consent scopes.
          </p>
        </div>
      </div>

      {/* Directory KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card glow="gold" className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
            Total Passports
          </p>
          <p className="mt-1 text-2xl font-black text-white font-tabular">148,920</p>
          <p className="text-[11px] text-[#00C97A] mt-1 font-semibold">+840 verified today</p>
        </Card>
        <Card glow="emerald" className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
            Tier 3 Full Passport
          </p>
          <p className="mt-1 text-2xl font-black text-[#FCD116] font-tabular">64.2%</p>
          <p className="text-[11px] text-white/50 mt-1">NIST Biometric verified</p>
        </Card>
        <Card glow="emerald" className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
            Avg Trust Rating
          </p>
          <p className="mt-1 text-2xl font-black text-[#00C97A] font-tabular">88 / 100</p>
          <p className="text-[11px] text-white/50 mt-1">High financial integrity</p>
        </Card>
        <Card glow="gold" className="p-4">
          <p className="font-mono text-[10px] uppercase tracking-wider text-white/40">
            Active Consents
          </p>
          <p className="mt-1 text-2xl font-black text-white font-tabular">412,800</p>
          <p className="text-[11px] text-white/50 mt-1">Inter-bank authorization grants</p>
        </Card>
      </div>

      {/* Filter & Search Bar (HCI Principle: immediate filter feedback) */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#D4A017]" />
            <input
              type="text"
              placeholder="Search by customer name, Passport ID, or Ghana Card National ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-10 pr-4 py-2 text-xs text-white placeholder-white/30 focus:border-[#D4A017]/60 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {[
              { label: "All Tiers", value: "ALL" },
              { label: "Tier 3 Passport", value: "TIER_3_PASSPORT" },
              { label: "Tier 2", value: "TIER_2" },
              { label: "Tier 1", value: "TIER_1" },
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setTierFilter(tab.value)}
                className={`rounded-lg px-3 py-1.5 text-xs font-mono transition-all shrink-0 ${
                  tierFilter === tab.value
                    ? "bg-[#D4A017]/20 text-[#FCD116] border border-[#D4A017]/40 font-bold"
                    : "text-white/50 hover:bg-white/[0.05] hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Customer Directory Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.08] bg-white/[0.02] font-mono uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-5 py-3.5">Customer &amp; Verified Passport</th>
                <th className="px-4 py-3.5">Ghana Card Number</th>
                <th className="px-4 py-3.5">KYC Level</th>
                <th className="px-4 py-3.5">Trust Score</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Linked Rail Nodes</th>
                <th className="px-4 py-3.5 text-right">Inspect</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedCustomer(c)}
                  className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={c.avatar}
                        alt={c.name}
                        className="size-10 rounded-xl object-cover border border-white/10 shrink-0"
                      />
                      <div>
                        <p className="font-bold text-white group-hover:text-[#FCD116] transition-colors">
                          {c.name}
                        </p>
                        <span className="text-[11px] font-mono text-white/40 block mt-0.5">
                          {c.id}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 font-mono text-white/80">{c.nationalId}</td>
                  <td className="px-4 py-4">
                    <span className="font-mono text-[10px] font-bold px-2.5 py-1 rounded-lg border border-[#D4A017]/30 bg-[#D4A017]/10 text-[#FCD116]">
                      {c.kycTier.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`font-mono font-bold font-tabular text-sm ${
                        c.trustScore > 80
                          ? "text-[#00C97A]"
                          : c.trustScore > 60
                            ? "text-[#FCD116]"
                            : "text-[#F26D6D]"
                      }`}
                    >
                      {c.trustScore} / 100
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <StatusBadge tone={c.tone} size="sm">
                      {c.status.replace("_", " ")}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="size-3.5 text-[#D4A017]" />
                      <span className="font-mono text-white/70">
                        {c.linkedInstitutions.length} Banks
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button className="font-semibold text-xs text-[#D4A017] group-hover:underline">
                      Passport →
                    </button>
                  </td>
                </tr>
              ))}
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
            <StatusBadge tone={selectedCustomer.tone}>
              {selectedCustomer.status.replace("_", " ")}
            </StatusBadge>
          ) : null
        }
        footer={
          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopy(selectedCustomer?.id || "", "Passport Ref")}
            >
              <Copy className="size-3.5 mr-1" /> Copy Ref
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setSelectedCustomer(null)}>
              Close
            </Button>
          </div>
        }
      >
        {selectedCustomer && (
          <div className="space-y-6">
            {/* Customer Profile Card */}
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <img
                src={selectedCustomer.avatar}
                alt={selectedCustomer.name}
                className="size-16 rounded-2xl object-cover border border-[#D4A017]/40 shadow-lg"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white truncate">
                    {selectedCustomer.name}
                  </h3>
                  <UserCheck className="size-4 text-[#00C97A]" />
                </div>
                <p className="text-xs text-white/50 mt-0.5">{selectedCustomer.residence}</p>
                <p className="text-[11px] font-mono text-[#D4A017] mt-1">
                  {selectedCustomer.phone}
                </p>
              </div>
            </div>

            {/* Trust Score & Biometric Verification Card */}
            <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase text-white/40">
                    Financial Trust Score
                  </p>
                  <p className="text-2xl font-black text-white font-tabular mt-0.5">
                    {selectedCustomer.trustScore} / 100
                  </p>
                </div>
                <span className="grid size-12 place-items-center rounded-2xl bg-[#00C97A]/15 text-[#00C97A] border border-[#00C97A]/30">
                  <Fingerprint className="size-6" />
                </span>
              </div>
              <div className="border-t border-white/[0.06] pt-3">
                <p className="text-[10px] font-mono text-white/40 uppercase">
                  Biometric Cryptographic Proof
                </p>
                <p className="text-xs font-mono text-[#00C97A] mt-0.5">
                  {selectedCustomer.biometricHash}
                </p>
              </div>
            </div>

            {/* Identity Credentials */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#D4A017]">
                Identity Credentials &amp; Verification
              </p>
              <div className="mt-2 space-y-2 text-xs">
                <div className="flex justify-between py-2 border-b border-white/[0.05]">
                  <span className="text-white/40">Ghana Card National ID</span>
                  <span className="font-mono font-bold text-white">
                    {selectedCustomer.nationalId}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/[0.05]">
                  <span className="text-white/40">KYC Verification Tier</span>
                  <span className="font-mono text-[#FCD116]">
                    {selectedCustomer.kycTier.replace("_", " ")}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-white/[0.05]">
                  <span className="text-white/40">Last Financial Operation</span>
                  <span className="text-white/80">{selectedCustomer.lastActive}</span>
                </div>
              </div>
            </div>

            {/* Linked Institutions */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#D4A017]">
                Linked Participating Bank Rails
              </p>
              <div className="mt-2 space-y-2">
                {selectedCustomer.linkedInstitutions.map((inst) => (
                  <div
                    key={inst.code}
                    className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <Building2 className="size-4 text-[#D4A017]" />
                      <div>
                        <p className="font-bold text-white">{inst.name}</p>
                        <p className="text-[10px] font-mono text-white/40">
                          Rail ID: {inst.code}
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-[#00C97A]">
                      Since {inst.verifiedSince}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Active Consents */}
            <div>
              <p className="font-mono text-[10px] uppercase tracking-widest text-[#D4A017]">
                Authorized Consent Scopes
              </p>
              <div className="mt-2 space-y-1.5">
                {selectedCustomer.activeConsents.map((consent) => (
                  <div
                    key={consent}
                    className="flex items-center gap-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] p-2.5 text-xs font-mono text-white/80"
                  >
                    <KeyRound className="size-3.5 text-[#D4A017]" />
                    <span>{consent}</span>
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

