import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Clock,
  Copy,
  Cpu,
  ExternalLink,
  Eye,
  Globe2,
  Lock,
  Pause,
  Play,
  Search,
  Send,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Zap,
} from "lucide-react";
import { useEffect, useState } from "react";

import { StatusBadge, type StatusTone } from "../components/feedback/status-badge";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { DetailDrawer } from "../components/ui/detail-drawer";
import { useToast } from "../components/ui/toast";

interface RiskFactor {
  factor: string;
  weight: number;
  description: string;
}

interface RiskEvent {
  id: string;
  timestamp: string;
  institution: string;
  beneficiaryBank: string;
  customer: string;
  customerId: string;
  amount: string;
  amountRaw: number;
  score: number;
  decision: "ALLOW" | "REVIEW" | "BLOCK";
  tone: StatusTone;
  reasonCodes: string[];
  channel: "Wire Transfer" | "Mobile Money" | "Cross-Border" | "ATM Cash" | "POS Terminal";
  ipLocation: string;
  deviceFingerprint: string;
  factors: RiskFactor[];
  rawPayload: Record<string, unknown>;
}

const initialRiskEvents: RiskEvent[] = [
  {
    id: "RSK-99042",
    timestamp: "2026-09-17 02:04:12",
    institution: "Apex Bank Ghana PLC",
    beneficiaryBank: "Zenith Bank (Nigeria) PLC",
    customer: "Kofi Mensah",
    customerId: "GHA-89210-449",
    amount: "GH₵ 78,500.00",
    amountRaw: 78500,
    score: 88,
    decision: "BLOCK",
    tone: "danger",
    reasonCodes: ["GEO_IMPOSSIBLE_TRAVEL", "DEVICE_FINGERPRINT_MISMATCH", "RAPID_VELOCITY_5M"],
    channel: "Cross-Border",
    ipLocation: "Lagos, NG (Expected: Accra, GH)",
    deviceFingerprint: "fp_88a91b_linux_tor_exit",
    factors: [
      { factor: "Impossible Travel Velocity", weight: 45, description: "IP changed from Accra to Lagos in 8 minutes" },
      { factor: "Device Fingerprint Anomaly", weight: 28, description: "Unknown device with Tor exit relay headers" },
      { factor: "Threshold Violation", weight: 15, description: "Amount exceeds 30-day baseline by 820%" },
    ],
    rawPayload: {
      event_id: "RSK-99042",
      client_ip: "102.89.22.14",
      user_agent: "Mozilla/5.0 (X11; Linux x86_64)",
      geo_distance_km: 405,
      delta_seconds: 480,
      rule_matrix_version: "TAMVA-AML-v4.2",
      model_confidence: 0.962,
    },
  },
  {
    id: "RSK-99041",
    timestamp: "2026-09-17 02:01:45",
    institution: "Zenith Digital Trust",
    beneficiaryBank: "MTN MoMo Settlement",
    customer: "Abena Osei",
    customerId: "GHA-44120-901",
    amount: "GH₵ 12,300.00",
    amountRaw: 12300,
    score: 42,
    decision: "REVIEW",
    tone: "warning",
    reasonCodes: ["VELOCITY_SPIKE_1HR", "NEW_PAYEE_RECIPIENT"],
    channel: "Mobile Money",
    ipLocation: "Kumasi, GH",
    deviceFingerprint: "fp_33b82c_ios_safari",
    factors: [
      { factor: "1-Hour Velocity Anomaly", weight: 24, description: "4th transaction in 35 minutes" },
      { factor: "Unregistered Beneficiary", weight: 18, description: "First-time transfer to remote wallet ID" },
    ],
    rawPayload: {
      event_id: "RSK-99041",
      client_ip: "154.160.10.4",
      wallet_tier: "TIER_2_PROVISIONAL",
      step_up_policy: "MANDATORY_OTP_OR_BIOMETRIC",
      model_confidence: 0.814,
    },
  },
  {
    id: "RSK-99040",
    timestamp: "2026-09-17 01:58:30",
    institution: "Ecobank Regional Hub",
    beneficiaryBank: "Stanbic Bank Ghana",
    customer: "Kwame Asante",
    customerId: "GHA-78201-112",
    amount: "GH₵ 3,450.00",
    amountRaw: 3450,
    score: 12,
    decision: "ALLOW",
    tone: "success",
    reasonCodes: ["WHITELISTED_BENEFICIARY", "BIOMETRIC_MATCH_99"],
    channel: "POS Terminal",
    ipLocation: "Accra, GH",
    deviceFingerprint: "fp_90e11a_android_tamva",
    factors: [
      { factor: "Known Beneficiary Hash", weight: -10, description: "Recurring 12-month trusted merchant" },
      { factor: "Hardware Biometric Verification", weight: -15, description: "NIST Tier 1 Ghana Card match score 99.4%" },
    ],
    rawPayload: {
      event_id: "RSK-99040",
      terminal_id: "POS_ACC_AIRPORT_09",
      nist_match_ratio: 0.994,
      model_confidence: 0.998,
    },
  },
  {
    id: "RSK-99039",
    timestamp: "2026-09-17 01:54:10",
    institution: "Apex Bank Ghana PLC",
    beneficiaryBank: "Apex Bank Internal ATM",
    customer: "Esi Badu",
    customerId: "GHA-10934-883",
    amount: "GH₵ 500.00",
    amountRaw: 500,
    score: 8,
    decision: "ALLOW",
    tone: "success",
    reasonCodes: ["KNOWN_DEVICE", "NORMAL_TIME_WINDOW", "LOW_VALUE_CLEARANCE"],
    channel: "ATM Cash",
    ipLocation: "Takoradi, GH",
    deviceFingerprint: "fp_atm_takoradi_02",
    factors: [
      { factor: "Routine Cash Limit", weight: -12, description: "Within standard daily ATM ceiling" },
      { factor: "Geographic Consistency", weight: -8, description: "Matches home branch postal zone" },
    ],
    rawPayload: {
      event_id: "RSK-99039",
      atm_id: "ATM_TAK_HARBOUR_01",
      pin_retry_count: 0,
      model_confidence: 0.999,
    },
  },
  {
    id: "RSK-99038",
    timestamp: "2026-09-17 01:48:22",
    institution: "Zenith Digital Trust",
    beneficiaryBank: "Standard Chartered (UAE)",
    customer: "Musa Ibrahim",
    customerId: "GHA-66719-003",
    amount: "GH₵ 95,000.00",
    amountRaw: 95000,
    score: 94,
    decision: "BLOCK",
    tone: "danger",
    reasonCodes: ["SANCTION_NAME_MATCH_88", "HIGH_VALUE_THRESHOLD", "STRUCTURING_SUSPECT"],
    channel: "Cross-Border",
    ipLocation: "Dubai, UAE",
    deviceFingerprint: "fp_12a77f_vpn_mullvad",
    factors: [
      { factor: "Sanctions List Fuzzy Match", weight: 55, description: "OFAC / UN consolidated list name match score 88%" },
      { factor: "Cross-Border Capital Flight Trigger", weight: 25, description: "Maximum single outbound remittance ceiling reached" },
      { factor: "Commercial VPN Detected", weight: 14, description: "Mullvad exit node in UAE concealing origin" },
    ],
    rawPayload: {
      event_id: "RSK-99038",
      sanction_entity_id: "OFAC-SDN-49102",
      match_confidence: 0.884,
      fiu_notification_status: "AUTO_GENERATED",
      model_confidence: 0.988,
    },
  },
];

export function RiskPage() {
  const [events, setEvents] = useState<RiskEvent[]>(initialRiskEvents);
  const [filterDecision, setFilterDecision] = useState<string>("ALL");
  const [filterChannel, setFilterChannel] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<RiskEvent | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "factors" | "payload">("overview");
  const [isSimulating, setIsSimulating] = useState(true);
  const [overrideReason, setOverrideReason] = useState("");
  const { toast } = useToast();

  // Simulated live risk event stream every 12 seconds if active
  useEffect(() => {
    if (!isSimulating) return;

    const interval = setInterval(() => {
      const randomScore = Math.floor(Math.random() * 95) + 5;
      const isBlock = randomScore > 75;
      const isReview = randomScore > 35 && !isBlock;
      const decision: RiskEvent["decision"] = isBlock ? "BLOCK" : isReview ? "REVIEW" : "ALLOW";
      const tone: StatusTone = isBlock ? "danger" : isReview ? "warning" : "success";

      const channels: RiskEvent["channel"][] = [
        "Wire Transfer",
        "Mobile Money",
        "Cross-Border",
        "ATM Cash",
        "POS Terminal",
      ];
      const selectedChannel = channels[Math.floor(Math.random() * channels.length)];

      const institutions = [
        "Apex Bank Ghana PLC",
        "Zenith Digital Trust",
        "Ecobank Regional Hub",
        "Stanbic Bank Ghana",
      ];
      const selectedInst = institutions[Math.floor(Math.random() * institutions.length)];

      const newId = `RSK-${Math.floor(10000 + Math.random() * 90000)}`;
      const now = new Date();
      const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
        now.getDate(),
      ).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes(),
      ).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;

      const amountVal = (Math.random() * 45000 + 200).toFixed(2);

      const newEvt: RiskEvent = {
        id: newId,
        timestamp: timeStr,
        institution: selectedInst,
        beneficiaryBank: "GhIPSS Interoperable Switch",
        customer: ["Kwabena Darko", "Yaa Asantewaa", "Emmanuel Boakye", "Akosua Mensah"][
          Math.floor(Math.random() * 4)
        ],
        customerId: `GHA-${Math.floor(10000 + Math.random() * 90000)}-${Math.floor(
          100 + Math.random() * 900,
        )}`,
        amount: `GH₵ ${Number(amountVal).toLocaleString("en-US", {
          minimumFractionDigits: 2,
        })}`,
        amountRaw: Number(amountVal),
        score: randomScore,
        decision,
        tone,
        reasonCodes: isBlock
          ? ["ANOMALOUS_OUTFLOW", "RISK_SCORE_ELEVATED"]
          : isReview
            ? ["VELOCITY_STEP_UP"]
            : ["STANDARD_RULE_PASS"],
        channel: selectedChannel,
        ipLocation: isBlock ? "London, UK (VPN Detected)" : "Accra, GH",
        deviceFingerprint: `fp_${Math.random().toString(36).substring(2, 8)}_tamva_id`,
        factors: [
          {
            factor: isBlock ? "High Anomaly Score" : "Baseline Conformity",
            weight: isBlock ? 42 : -15,
            description: isBlock
              ? "Multi-feature deviation in transaction geometry"
              : "Matches expected customer spending profile",
          },
        ],
        rawPayload: {
          event_id: newId,
          simulated: true,
          scoring_latency_ms: (Math.random() * 12 + 6).toFixed(1),
          rule_engine_ver: "TAMVA-AML-v4.2",
        },
      };

      setEvents((prev) => [newEvt, ...prev.slice(0, 14)]);
    }, 14000);

    return () => clearInterval(interval);
  }, [isSimulating]);

  const filtered = events.filter((evt) => {
    const matchesDecision = filterDecision === "ALL" || evt.decision === filterDecision;
    const matchesChannel = filterChannel === "ALL" || evt.channel === filterChannel;
    const matchesSearch =
      evt.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.institution.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.reasonCodes.some((rc) => rc.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDecision && matchesChannel && matchesSearch;
  });

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: `${label}: ${text}`,
      type: "info",
    });
  };

  const handleOverride = () => {
    if (!selectedEvent) return;
    if (!overrideReason.trim()) {
      toast({
        title: "Compliance Note Required",
        description: "Please enter a justification note before overriding this risk decision.",
        type: "warning",
      });
      return;
    }

    setEvents((prev) =>
      prev.map((e) =>
        e.id === selectedEvent.id
          ? { ...e, decision: "ALLOW" as const, tone: "success" as const }
          : e,
      ),
    );

    toast({
      title: "Risk Flag Overridden",
      description: `Event ${selectedEvent.id} approved. Logged to Bank of Ghana audit trail.`,
      type: "success",
    });
    setOverrideReason("");
    setSelectedEvent(null);
  };

  const handleEscalateSAR = (evt: RiskEvent) => {
    toast({
      title: "Suspicious Activity Report (SAR) Initiated",
      description: `Dossier ${evt.id} for ${evt.customer} dispatched to FIU compliance queue.`,
      type: "warning",
    });
  };

  // Metrics computation
  const totalEvents = events.length;
  const allowCount = events.filter((e) => e.decision === "ALLOW").length;
  const reviewCount = events.filter((e) => e.decision === "REVIEW").length;
  const blockCount = events.filter((e) => e.decision === "BLOCK").length;
  const avgScore = totalEvents
    ? Math.round(events.reduce((acc, e) => acc + e.score, 0) / totalEvents)
    : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Engine Status Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-white/[0.08] pb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#D4A017]/30 bg-[#D4A017]/10 px-2.5 py-1 font-mono text-[10px] font-bold text-[#FCD116] uppercase tracking-wider">
              <Zap className="size-3 text-[#D4A017]" />
              AML Domain Intelligence
            </span>
            <span className="text-white/20">/</span>
            <span className="font-mono text-xs text-white/50">GhIPSS Inter-Bank Gateway</span>
            <span className="text-white/20">·</span>
            <StatusBadge tone="success" pulse size="sm">
              Model TAMVA-XGB-4.2
            </StatusBadge>
          </div>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Real-Time Risk &amp; Fraud Matrix
          </h1>
          <p className="mt-2 text-sm text-white/60 max-w-3xl leading-relaxed">
            Autonomous decision engine evaluating cryptographic Ghana Card credentials, impossible
            velocity anomalies, and cross-border sanctions before funds settle across GhIPSS and
            PAPSS corridors.
          </p>
        </div>

        {/* Action Controls & Live Stream Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsSimulating(!isSimulating)}
            className={`inline-flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-mono font-semibold transition-all ${
              isSimulating
                ? "border-[#00C97A]/40 bg-[#00C97A]/10 text-[#00C97A] shadow-[0_0_15px_rgba(0,201,122,0.2)]"
                : "border-white/10 bg-white/[0.03] text-white/50 hover:text-white"
            }`}
          >
            {isSimulating ? (
              <>
                <span className="size-2 rounded-full bg-[#00C97A] animate-ping" />
                <Pause className="size-3.5" />
                Live Stream: Active
              </>
            ) : (
              <>
                <Play className="size-3.5" />
                Live Stream: Paused
              </>
            )}
          </button>

          <Button asChild variant="secondary" size="sm">
            <a href="/api/docs/" target="_blank" rel="noreferrer">
              <Cpu className="size-3.5 mr-1.5 text-[#D4A017]" />
              Model Specs
              <ExternalLink className="size-3 ml-1 text-white/40" />
            </a>
          </Button>
        </div>
      </div>

      {/* Primary KPI Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Low Risk / Auto-Clear Card */}
        <Card glow="emerald" className="p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-[#00C97A]/10 border border-[#00C97A]/30 text-[#00C97A]">
                <ShieldCheck className="size-4" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#00C97A]">
                Auto-Cleared
              </span>
            </div>
            <span className="font-mono text-xs text-white/40">Score &le; 30</span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-black text-white font-tabular">
              {totalEvents ? ((allowCount / totalEvents) * 100).toFixed(1) : "0.0"}%
            </p>
            <span className="font-mono text-xs text-[#00C97A] font-bold">
              {allowCount} / {totalEvents} tx
            </span>
          </div>
          <p className="mt-1.5 text-xs text-white/50">Cleared &lt; 18ms without friction</p>
          <div className="mt-3 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-[#00C97A] rounded-full transition-all duration-500"
              style={{ width: `${totalEvents ? (allowCount / totalEvents) * 100 : 0}%` }}
            />
          </div>
        </Card>

        {/* Medium Risk / Stepped Up Card */}
        <Card glow="gold" className="p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-[#D4A017]/10 border border-[#D4A017]/30 text-[#FCD116]">
                <AlertTriangle className="size-4" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#FCD116]">
                Step-Up / 2FA
              </span>
            </div>
            <span className="font-mono text-xs text-white/40">Score 31-70</span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-black text-white font-tabular">
              {totalEvents ? ((reviewCount / totalEvents) * 100).toFixed(1) : "0.0"}%
            </p>
            <span className="font-mono text-xs text-[#FCD116] font-bold">
              {reviewCount} flagged
            </span>
          </div>
          <p className="mt-1.5 text-xs text-white/50">Challenged via Ghana Card / OTP</p>
          <div className="mt-3 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-[#D4A017] rounded-full transition-all duration-500"
              style={{ width: `${totalEvents ? (reviewCount / totalEvents) * 100 : 0}%` }}
            />
          </div>
        </Card>

        {/* Critical Risk / Intercepted Card */}
        <Card glow="crimson" className="p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-[#F26D6D]/10 border border-[#F26D6D]/30 text-[#F26D6D]">
                <ShieldAlert className="size-4" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#F26D6D]">
                Blocked / SAR
              </span>
            </div>
            <span className="font-mono text-xs text-white/40">Score &gt; 70</span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-black text-white font-tabular">
              {totalEvents ? ((blockCount / totalEvents) * 100).toFixed(1) : "0.0"}%
            </p>
            <span className="font-mono text-xs text-[#F26D6D] font-bold">
              {blockCount} intercepted
            </span>
          </div>
          <p className="mt-1.5 text-xs text-white/50">Dispatched to BoG FIU ledger</p>
          <div className="mt-3 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-[#F26D6D] rounded-full transition-all duration-500"
              style={{ width: `${totalEvents ? (blockCount / totalEvents) * 100 : 0}%` }}
            />
          </div>
        </Card>

        {/* Average Composite Risk Score Card */}
        <Card glow="cyan" className="p-5 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-[#00E5FF]">
                <Activity className="size-4" />
              </span>
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#00E5FF]">
                Composite Risk
              </span>
            </div>
            <span className="font-mono text-xs text-white/40">Real-Time Avg</span>
          </div>
          <div className="mt-4 flex items-baseline justify-between">
            <p className="text-3xl font-black text-white font-tabular">{avgScore}</p>
            <span className="font-mono text-xs text-[#00E5FF] font-bold">/ 100 scale</span>
          </div>
          <p className="mt-1.5 text-xs text-white/50">Overall corridor health: Nominal</p>
          <div className="mt-3 h-1.5 w-full rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-[#00E5FF] rounded-full transition-all duration-500"
              style={{ width: `${avgScore}%` }}
            />
          </div>
        </Card>
      </div>

      {/* Multi-Facet Interactive Search & Filter Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#D4A017]" />
            <input
              type="text"
              placeholder="Search by event ID, customer name, Ghana Card ID, institution, or rule..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/40 pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:border-[#D4A017]/60 focus:outline-none focus:ring-1 focus:ring-[#D4A017]/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs font-mono"
              >
                Clear
              </button>
            )}
          </div>

          {/* Decision Pill Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { id: "ALL", label: `All (${events.length})` },
              { id: "ALLOW", label: `Allow (${allowCount})` },
              { id: "REVIEW", label: `Review (${reviewCount})` },
              { id: "BLOCK", label: `Block (${blockCount})` },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterDecision(tab.id)}
                className={`rounded-xl px-3.5 py-2 text-xs font-mono font-semibold uppercase tracking-wider whitespace-nowrap transition-all ${
                  filterDecision === tab.id
                    ? "bg-[#D4A017] text-black font-bold shadow-[0_0_14px_rgba(212,160,23,0.35)]"
                    : "border border-white/10 bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Secondary Channel Filter Strip */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="size-3.5 text-[#D4A017]" />
            <span className="font-mono text-[11px] text-white/40 uppercase">Channel Rail:</span>
            <div className="flex items-center gap-1">
              {[
                "ALL",
                "Cross-Border",
                "Mobile Money",
                "Wire Transfer",
                "ATM Cash",
                "POS Terminal",
              ].map((channel) => (
                <button
                  key={channel}
                  onClick={() => setFilterChannel(channel)}
                  className={`rounded-lg px-2.5 py-1 font-mono text-[10px] transition-colors ${
                    filterChannel === channel
                      ? "bg-white/15 text-white font-bold border border-white/20"
                      : "text-white/40 hover:text-white"
                  }`}
                >
                  {channel}
                </button>
              ))}
            </div>
          </div>

          <span className="font-mono text-[11px] text-white/40">
            Showing <strong className="text-white">{filtered.length}</strong> of {events.length} risk
            records
          </span>
        </div>
      </Card>

      {/* Forensic Risk Records Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.08] bg-white/[0.02] font-mono uppercase tracking-wider text-white/40">
              <tr>
                <th className="px-5 py-4">Transaction / Time</th>
                <th className="px-4 py-4">Customer &amp; Identity</th>
                <th className="px-4 py-4">Amount</th>
                <th className="px-4 py-4">Risk Meter</th>
                <th className="px-4 py-4">Decision</th>
                <th className="px-4 py-4">Channel &amp; Geo</th>
                <th className="px-4 py-4">Rule Violations</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <AlertOctagon className="size-8 text-white/30 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-white/70">No risk events found</p>
                    <p className="text-xs text-white/40 mt-1">
                      Try adjusting your search criteria or resetting filters
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((evt) => (
                  <tr
                    key={evt.id}
                    onClick={() => {
                      setSelectedEvent(evt);
                      setActiveTab("overview");
                    }}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer group"
                  >
                    {/* Event ID & Timestamp */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white group-hover:text-[#FCD116] transition-colors">
                          {evt.id}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopy(evt.id, "Risk Event ID");
                          }}
                          className="text-white/30 hover:text-white p-1"
                          aria-label="Copy event reference"
                        >
                          <Copy className="size-3" />
                        </button>
                      </div>
                      <span className="text-[11px] font-mono text-white/40 mt-0.5 block flex items-center gap-1">
                        <Clock className="size-3 text-white/30" />
                        {evt.timestamp}
                      </span>
                    </td>

                    {/* Customer Info */}
                    <td className="px-4 py-4">
                      <p className="font-bold text-white/90 group-hover:text-white">
                        {evt.customer}
                      </p>
                      <p className="text-[11px] font-mono text-white/40">{evt.customerId}</p>
                      <p className="text-[10px] text-white/30 truncate max-w-[140px]">
                        {evt.institution}
                      </p>
                    </td>

                    {/* Amount */}
                    <td className="px-4 py-4 font-mono font-bold text-white font-tabular whitespace-nowrap">
                      {evt.amount}
                    </td>

                    {/* Risk Score Progress Bar */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-16 h-2 rounded-full bg-white/10 overflow-hidden shrink-0">
                          <div
                            className={`h-full rounded-full ${
                              evt.score > 70
                                ? "bg-gradient-to-r from-orange-500 to-[#F26D6D]"
                                : evt.score > 30
                                  ? "bg-gradient-to-r from-yellow-500 to-[#D4A017]"
                                  : "bg-gradient-to-r from-emerald-500 to-[#00C97A]"
                            }`}
                            style={{ width: `${evt.score}%` }}
                          />
                        </div>
                        <span
                          className={`font-mono font-extrabold font-tabular text-xs ${
                            evt.score > 70
                              ? "text-[#F26D6D]"
                              : evt.score > 30
                                ? "text-[#FCD116]"
                                : "text-[#00C97A]"
                          }`}
                        >
                          {evt.score}
                          <span className="text-[10px] font-normal text-white/40">/100</span>
                        </span>
                      </div>
                    </td>

                    {/* Decision Badge */}
                    <td className="px-4 py-4">
                      <StatusBadge tone={evt.tone} size="sm">
                        {evt.decision}
                      </StatusBadge>
                    </td>

                    {/* Channel & Location */}
                    <td className="px-4 py-4">
                      <p className="font-medium text-white/80">{evt.channel}</p>
                      <p className="text-[11px] font-mono text-white/40 flex items-center gap-1 mt-0.5">
                        <Globe2 className="size-3 text-[#D4A017]" />
                        {evt.ipLocation.split("(")[0]}
                      </p>
                    </td>

                    {/* Reason Codes */}
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {evt.reasonCodes.map((rc) => (
                          <span
                            key={rc}
                            className={`rounded-md border px-1.5 py-0.5 font-mono text-[9px] font-semibold ${
                              rc.includes("SANCTION") || rc.includes("IMPOSSIBLE")
                                ? "border-[#F26D6D]/40 bg-[#F26D6D]/10 text-[#F26D6D]"
                                : rc.includes("VELOCITY")
                                  ? "border-[#D4A017]/40 bg-[#D4A017]/10 text-[#FCD116]"
                                  : "border-white/10 bg-white/[0.04] text-white/70"
                            }`}
                          >
                            {rc}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedEvent(evt);
                          }}
                          className="rounded-lg border border-white/10 bg-white/[0.03] p-1.5 text-[#D4A017] hover:bg-[#D4A017]/10 hover:border-[#D4A017]/40 transition-colors"
                          title="Inspect Forensic Dossier"
                          aria-label="Inspect dossier"
                        >
                          <Eye className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Forensic Detail Drawer with Rich HCI Tabs */}
      <DetailDrawer
        open={Boolean(selectedEvent)}
        onClose={() => {
          setSelectedEvent(null);
          setOverrideReason("");
        }}
        title={selectedEvent?.id || "Risk Dossier"}
        subtitle={selectedEvent?.customer}
        badge={
          selectedEvent ? (
            <StatusBadge tone={selectedEvent.tone} size="md">
              DECISION: {selectedEvent.decision}
            </StatusBadge>
          ) : null
        }
        footer={
          <div className="flex items-center justify-between gap-3 w-full">
            {selectedEvent && selectedEvent.decision !== "ALLOW" ? (
              <Button variant="danger" size="sm" onClick={handleOverride}>
                <Lock className="size-3.5 mr-1.5" />
                Override &amp; Clear Flag
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => selectedEvent && handleEscalateSAR(selectedEvent)}
              >
                <Send className="size-3.5 mr-1.5 text-[#FCD116]" />
                Dispatch FIU Notice
              </Button>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setSelectedEvent(null);
                setOverrideReason("");
              }}
            >
              Dismiss
            </Button>
          </div>
        }
      >
        {selectedEvent && (
          <div className="space-y-6">
            {/* Drawer Sub-Navigation Tabs */}
            <div className="flex items-center border-b border-white/10 pb-2 gap-2">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-3 py-1.5 font-mono text-xs font-bold uppercase transition-colors ${
                  activeTab === "overview"
                    ? "text-[#FCD116] border-b-2 border-[#D4A017] pb-2 -mb-2"
                    : "text-white/50 hover:text-white"
                }`}
              >
                Risk Analysis
              </button>
              <button
                onClick={() => setActiveTab("factors")}
                className={`px-3 py-1.5 font-mono text-xs font-bold uppercase transition-colors ${
                  activeTab === "factors"
                    ? "text-[#FCD116] border-b-2 border-[#D4A017] pb-2 -mb-2"
                    : "text-white/50 hover:text-white"
                }`}
              >
                Feature Weights ({selectedEvent.factors.length})
              </button>
              <button
                onClick={() => setActiveTab("payload")}
                className={`px-3 py-1.5 font-mono text-xs font-bold uppercase transition-colors ${
                  activeTab === "payload"
                    ? "text-[#FCD116] border-b-2 border-[#D4A017] pb-2 -mb-2"
                    : "text-white/50 hover:text-white"
                }`}
              >
                Audit JSON
              </button>
            </div>

            {/* TAB 1: OVERVIEW */}
            {activeTab === "overview" && (
              <div className="space-y-6 animate-in fade-in duration-150">
                {/* Score Dial & Level Box */}
                <div
                  className={`rounded-2xl border p-4 ${
                    selectedEvent.score > 70
                      ? "border-[#F26D6D]/30 bg-[#F26D6D]/[0.05]"
                      : selectedEvent.score > 30
                        ? "border-[#D4A017]/30 bg-[#D4A017]/[0.05]"
                        : "border-[#00C97A]/30 bg-[#00C97A]/[0.05]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs text-white/50 uppercase tracking-wider">
                        Composite Machine Score
                      </span>
                      <p className="text-2xl font-black text-white font-tabular mt-0.5">
                        {selectedEvent.score}{" "}
                        <span className="text-sm font-normal text-white/40">/ 100</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-white/40">
                        Engine Verdict
                      </span>
                      <p
                        className={`text-sm font-bold font-mono ${
                          selectedEvent.decision === "BLOCK"
                            ? "text-[#F26D6D]"
                            : selectedEvent.decision === "REVIEW"
                              ? "text-[#FCD116]"
                              : "text-[#00C97A]"
                        }`}
                      >
                        {selectedEvent.decision === "BLOCK"
                          ? "SETTLEMENT REJECTED"
                          : selectedEvent.decision === "REVIEW"
                            ? "STEP-UP 2FA CHALLENGE"
                            : "IMMEDIATE SETTLEMENT"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 h-2.5 rounded-full bg-black/50 overflow-hidden p-0.5 border border-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        selectedEvent.score > 70
                          ? "bg-[#F26D6D]"
                          : selectedEvent.score > 30
                            ? "bg-[#D4A017]"
                            : "bg-[#00C97A]"
                      }`}
                      style={{ width: `${selectedEvent.score}%` }}
                    />
                  </div>
                </div>

                {/* Transaction Metadata Grid */}
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#D4A017] mb-2 font-bold">
                    Transaction &amp; Routing Geometry
                  </p>
                  <div className="space-y-2 rounded-2xl border border-white/10 bg-black/40 p-4 text-xs">
                    <div className="flex justify-between py-1 border-b border-white/[0.06]">
                      <span className="text-white/40">Amount</span>
                      <span className="font-mono font-bold text-white font-tabular">
                        {selectedEvent.amount}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/[0.06]">
                      <span className="text-white/40">Originating Institution</span>
                      <span className="text-white font-medium">{selectedEvent.institution}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/[0.06]">
                      <span className="text-white/40">Beneficiary Rail</span>
                      <span className="text-white/80">{selectedEvent.beneficiaryBank}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/[0.06]">
                      <span className="text-white/40">Payment Channel</span>
                      <span className="text-white/80 font-mono">{selectedEvent.channel}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-white/[0.06]">
                      <span className="text-white/40">IP &amp; Telemetry</span>
                      <span className="text-[#FCD116] font-mono">{selectedEvent.ipLocation}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-white/40">Device Signature</span>
                      <span className="text-white/70 font-mono text-[11px]">
                        {selectedEvent.deviceFingerprint}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Reason Codes Breakdown */}
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-[#D4A017] mb-2 font-bold">
                    Triggered Risk Policies
                  </p>
                  <div className="space-y-2">
                    {selectedEvent.reasonCodes.map((rc) => (
                      <div
                        key={rc}
                        className="flex items-start gap-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] p-3 text-xs"
                      >
                        <AlertTriangle className="size-4 text-[#FCD116] shrink-0 mt-0.5" />
                        <div>
                          <p className="font-mono font-bold text-white">{rc}</p>
                          <p className="text-[11px] text-white/50 mt-0.5">
                            Evaluated against Bank of Ghana AML/CFT directive rule repository.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Override Compliance Input */}
                {selectedEvent.decision !== "ALLOW" && (
                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4 space-y-2">
                    <label className="block font-mono text-[10px] uppercase tracking-widest text-[#FCD116] font-bold">
                      Compliance Officer Justification
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Enter rationale for override (e.g. Verified customer via direct Ghana Card biometric phone challenge)..."
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-black/60 p-2.5 text-xs text-white placeholder-white/30 focus:border-[#D4A017] focus:outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: FACTORS */}
            {activeTab === "factors" && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <p className="text-xs text-white/60">
                  SHAP feature contribution weights computed by the ML inference engine during
                  evaluation:
                </p>
                <div className="space-y-3">
                  {selectedEvent.factors.map((f) => (
                    <div
                      key={f.factor}
                      className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-xs">{f.factor}</span>
                        <span
                          className={`font-mono text-xs font-bold ${
                            f.weight > 0 ? "text-[#F26D6D]" : "text-[#00C97A]"
                          }`}
                        >
                          {f.weight > 0 ? `+${f.weight}` : f.weight} pts
                        </span>
                      </div>
                      <p className="text-xs text-white/50">{f.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: AUDIT JSON */}
            {activeTab === "payload" && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#D4A017]">
                    Cryptographic Receipt
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(
                        JSON.stringify(selectedEvent.rawPayload, null, 2),
                        "Audit Payload",
                      )
                    }
                    className="inline-flex items-center gap-1 font-mono text-[10px] text-white/50 hover:text-white"
                  >
                    <Copy className="size-3" />
                    Copy JSON
                  </button>
                </div>
                <pre className="rounded-2xl border border-white/10 bg-black/80 p-4 font-mono text-[11px] text-emerald-400 overflow-x-auto">
                  {JSON.stringify(selectedEvent.rawPayload, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
