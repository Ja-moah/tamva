import {
  Activity,
  ArrowUpRight,
  ChevronDown,
  Download,
  FileText,
  Globe,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
} from "lucide-react";
import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Line,
  Pie,
  PieChart as RePieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useToast } from "../components/ui/toast";

const volumeTrendData = [
  { day: "01 Jun", totalVolume: 42000, flagged: 420, riskRate: 1.0 },
  { day: "05 Jun", totalVolume: 48000, flagged: 510, riskRate: 1.06 },
  { day: "10 Jun", totalVolume: 56000, flagged: 680, riskRate: 1.21 },
  { day: "15 Jun", totalVolume: 62000, flagged: 920, riskRate: 1.48 },
  { day: "20 Jun", totalVolume: 71000, flagged: 1140, riskRate: 1.6 },
  { day: "25 Jun", totalVolume: 84000, flagged: 1420, riskRate: 1.69 },
  { day: "30 Jun", totalVolume: 96000, flagged: 1680, riskRate: 1.75 },
];

const riskDistributionData = [
  { name: "High Risk", value: 38, count: 4882, color: "#f43f5e" },
  { name: "Medium Risk", value: 42, count: 5395, color: "#f59e0b" },
  { name: "Low Risk", value: 20, count: 2570, color: "#10b981" },
];

const customerRiskData = [
  { name: "High Risk", value: 2.4, count: "11.5K", color: "#f43f5e" },
  { name: "Medium Risk", value: 8.6, count: "41.4K", color: "#f59e0b" },
  { name: "Low Risk", value: 89.0, count: "429.1K", color: "#10b981" },
];

const topRiskCategories = [
  { name: "Unusual Transaction Pattern", count: 4230, percentage: 33, color: "bg-rose-500" },
  { name: "New Device / Location Anomaly", count: 3120, percentage: 24, color: "bg-amber-500" },
  { name: "High-Risk Beneficiary", count: 2450, percentage: 19, color: "bg-amber-400" },
  { name: "Multiple Failed Logins", count: 1840, percentage: 14, color: "bg-sky-500" },
  { name: "Structuring / Smurfing Pattern", count: 820, percentage: 6, color: "bg-indigo-500" },
  { name: "Velocity Anomaly (1hr Burst)", count: 387, percentage: 4, color: "bg-purple-500" },
];

const geographicRiskGhana = [
  { region: "Greater Accra", riskIndex: "42%", count: "5,395 events", rank: 1, tone: "High" },
  { region: "Ashanti (Kumasi)", riskIndex: "26%", count: "3,340 events", rank: 2, tone: "High" },
  { region: "Western (Takoradi)", riskIndex: "14%", count: "1,798 events", rank: 3, tone: "Medium" },
  { region: "Eastern (Koforidua)", riskIndex: "11%", count: "1,413 events", rank: 4, tone: "Medium" },
  { region: "Central (Cape Coast)", riskIndex: "7%", count: "899 events", rank: 5, tone: "Low" },
];

const institutionComparison = [
  { name: "Partner Bank (You)", transactions: "412,800", flagged: "4,120", riskRate: "1.00%", tone: "success" },
  { name: "GCB Bank PLC", transactions: "380,400", flagged: "4,945", riskRate: "1.30%", tone: "neutral" },
  { name: "Stanbic Bank Ghana", transactions: "294,100", flagged: "3,529", riskRate: "1.20%", tone: "neutral" },
  { name: "MTN Mobile Money Switch", transactions: "1,850,000", flagged: "14,800", riskRate: "0.80%", tone: "success" },
  { name: "Telecel Cash Gateway", transactions: "620,000", flagged: "6,820", riskRate: "1.10%", tone: "neutral" },
  { name: "Savings & Loans Clearing", transactions: "94,200", flagged: "2,072", riskRate: "2.20%", tone: "warning" },
];

const recentReports = [
  { title: "Monthly Risk & AML Report – June 2026", type: "PDF Dossier", size: "4.8 MB", date: "2026-07-01", code: "REP-2026-06" },
  { title: "Customer Risk Assessment & PEP Summary", type: "PDF Audit", size: "2.3 MB", date: "2026-06-24", code: "REP-2026-05" },
  { title: "Transaction Anomaly & Velocity Diagnostics", type: "PDF Telemetry", size: "3.1 MB", date: "2026-06-18", code: "REP-2026-04" },
  { title: "Pan-African Network Intelligence Briefing", type: "PDF Executive", size: "5.4 MB", date: "2026-06-10", code: "REP-2026-03" },
];

export function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<string>("Overview");
  const [dateRange, setDateRange] = useState<string>("Last 30 Days");
  const { toast } = useToast();

  const handleDownloadReport = (title: string) => {
    toast({
      title: "Report Download Started",
      description: `Generating signed cryptographic PDF report: ${title}`,
      type: "success",
    });
  };

  return (
    <div className="space-y-7">
      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
            Analytics &amp; Insights
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5 font-medium">
            Turning data into safer financial decisions across African banking and mobile money rails.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="appearance-none rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] py-2 pl-3 pr-8 text-xs font-bold text-[var(--text-primary)] hover:border-[var(--accent-gold)] focus:outline-none cursor-pointer"
            >
              <option value="Last 24 Hours">Last 24 Hours</option>
              <option value="Last 7 Days">Last 7 Days</option>
              <option value="Last 30 Days">Last 30 Days (01 Jun – 30 Jun)</option>
              <option value="This Quarter">This Quarter (Q2 2026)</option>
              <option value="Year to Date">Year to Date (2026)</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-[var(--text-muted)]" />
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => handleDownloadReport("TAMVA Institutional Executive Summary")}
            className="gap-2 font-bold text-xs cursor-pointer shadow-sm"
          >
            <Download className="size-3.5" />
            <span>Download Report</span>
          </Button>
        </div>
      </div>

      {/* Analytics Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[var(--border-subtle)] pb-2 text-xs font-bold">
        {[
          "Overview",
          "Risk Trends",
          "Customer Insights",
          "Transaction Intelligence",
          "Network Analytics",
          "Reports",
        ].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === tab
                ? "bg-[var(--accent-gold)] text-black font-extrabold shadow-xs"
                : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Top 5 KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4.5 bg-[var(--bg-surface-elevated)] border-[var(--border-default)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Total Transactions
            </span>
            <Activity className="size-4 text-[var(--accent-gold)]" />
          </div>
          <p className="mt-2.5 text-2xl font-extrabold text-[var(--text-primary)] font-mono">1.24M</p>
          <p className="text-xs text-emerald-500 font-bold mt-1 flex items-center gap-1">
            <ArrowUpRight className="size-3.5" /> +18.2% vs last period
          </p>
        </Card>

        <Card className="p-4.5 bg-[var(--bg-surface-elevated)] border-[var(--border-default)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Flagged Transactions
            </span>
            <ShieldAlert className="size-4 text-rose-500" />
          </div>
          <p className="mt-2.5 text-2xl font-extrabold text-rose-500 font-mono">12,847</p>
          <p className="text-xs text-rose-500 font-bold mt-1 flex items-center gap-1">
            <ArrowUpRight className="size-3.5" /> +42% flagged rate
          </p>
        </Card>

        <Card className="p-4.5 bg-[var(--bg-surface-elevated)] border-[var(--border-default)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              High-Risk Customers
            </span>
            <Users className="size-4 text-amber-500" />
          </div>
          <p className="mt-2.5 text-2xl font-extrabold text-[var(--text-primary)] font-mono">3,291</p>
          <p className="text-xs text-amber-500 font-bold mt-1 flex items-center gap-1">
            <ArrowUpRight className="size-3.5" /> +27% under watch
          </p>
        </Card>

        <Card className="p-4.5 bg-[var(--bg-surface-elevated)] border-[var(--border-default)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              New Beneficiaries
            </span>
            <UserCheck className="size-4 text-sky-500" />
          </div>
          <p className="mt-2.5 text-2xl font-extrabold text-[var(--text-primary)] font-mono">18,402</p>
          <p className="text-xs text-emerald-500 font-bold mt-1 flex items-center gap-1">
            <ArrowUpRight className="size-3.5" /> +15% expansion
          </p>
        </Card>

        <Card className="p-4.5 bg-[var(--bg-surface-elevated)] border-[var(--border-default)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Fraud Prevented
            </span>
            <TrendingUp className="size-4 text-emerald-500" />
          </div>
          <p className="mt-2.5 text-2xl font-extrabold text-emerald-500 font-mono">1,076</p>
          <p className="text-xs text-emerald-500 font-bold mt-1 flex items-center gap-1">
            <ArrowUpRight className="size-3.5" /> +36% avoided loss
          </p>
        </Card>
      </div>

      {/* Transaction Volume & Risk Trend Chart */}
      <Card className="p-5 bg-[var(--bg-surface-elevated)] border-[var(--border-default)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4 pb-3 border-b border-[var(--border-subtle)]">
          <div>
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Transaction Volume &amp; Risk Trend
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Daily total transaction screening throughput vs flagged risk anomalies (GH₵ volume flow)
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-[var(--accent-gold)] bg-[var(--accent-gold-subtle)] px-2.5 py-1 rounded-lg border border-[var(--accent-gold-border)]">
            30-Day Aggregated Stream
          </span>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={volumeTrendData}>
              <defs>
                <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#d4a017" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#d4a017" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
              <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--bg-surface-elevated)",
                  borderColor: "var(--border-default)",
                  borderRadius: "12px",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="totalVolume"
                name="Total Volume (Txns)"
                stroke="#d4a017"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorVolume)"
              />
              <Line
                type="monotone"
                dataKey="flagged"
                name="Flagged Risk Txns"
                stroke="#f43f5e"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Donut Grid: Risk Distribution + Customer Segmentation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5 bg-[var(--bg-surface-elevated)] border-[var(--border-default)]">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-4">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Risk Distribution
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Breakdown of 12,847 flagged transactions by severity band
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
              12,847 Flagged
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={riskDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {riskDistributionData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {riskDistributionData.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2.5">
                    <span className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-bold text-[var(--text-primary)]">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-[var(--text-primary)]">{item.value}%</span>
                    <span className="text-[10px] text-[var(--text-muted)] block font-mono">({item.count})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-5 bg-[var(--bg-surface-elevated)] border-[var(--border-default)]">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-4">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Customer Risk Segmentation
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                482,000 enrolled customer accounts across KYC tiers
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              482K Enrolled
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie
                    data={customerRiskData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {customerRiskData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RePieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-3">
              {customerRiskData.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2.5">
                    <span className="size-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-bold text-[var(--text-primary)]">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-[var(--text-primary)]">{item.value}%</span>
                    <span className="text-[10px] text-[var(--text-muted)] block font-mono">({item.count})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* Top Risk Categories & Geographic Heatmap of Ghana */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5 bg-[var(--bg-surface-elevated)] border-[var(--border-default)]">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-4">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Top Risk Categories
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Ranked frequency of fraud reasons and rule triggers
              </p>
            </div>
            <Button variant="secondary" size="sm" className="text-xs font-bold cursor-pointer">
              View All
            </Button>
          </div>

          <div className="space-y-3.5">
            {topRiskCategories.map((cat) => (
              <div key={cat.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-[var(--text-primary)]">{cat.name}</span>
                  <span className="font-mono font-bold text-[var(--text-primary)]">
                    {cat.count.toLocaleString()} ({cat.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[var(--bg-canvas)] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${cat.color}`}
                    style={{ width: `${cat.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Geographic Risk Heatmap for Ghana */}
        <Card className="p-5 bg-[var(--bg-surface-elevated)] border-[var(--border-default)]">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-4">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Globe className="size-4 text-[var(--accent-gold)]" />
                Geographic Risk Heatmap (Ghana)
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Regional concentration of anomalous transactions across Ghana
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-500">
              5 Key Hubs
            </span>
          </div>

          <div className="space-y-2.5">
            {geographicRiskGhana.map((g) => (
              <div
                key={g.region}
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[var(--accent-gold-border)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="flex size-6 items-center justify-center rounded-full bg-[var(--bg-surface-elevated)] font-mono text-xs font-bold text-[var(--accent-gold)]">
                    #{g.rank}
                  </span>
                  <div>
                    <span className="text-xs font-bold text-[var(--text-primary)]">{g.region}</span>
                    <span className="text-[10px] text-[var(--text-muted)] block font-mono">{g.count}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-[var(--text-primary)]">{g.riskIndex}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      g.tone === "High"
                        ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                        : g.tone === "Medium"
                          ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                    }`}
                  >
                    {g.tone} Risk
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Peer Institution Comparison Table */}
      <Card className="overflow-hidden bg-[var(--bg-surface-elevated)] border-[var(--border-default)]">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Peer Institution &amp; Rail Comparison
            </h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Benchmark transaction volumes and risk rates against network participants
            </p>
          </div>
          <Button variant="secondary" size="sm" className="text-xs font-bold cursor-pointer">
            View All
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-[var(--border-default)] bg-[var(--bg-canvas)] font-mono uppercase text-[var(--text-muted)]">
              <tr>
                <th className="px-5 py-3">Institution Rail</th>
                <th className="px-4 py-3">Total Screened</th>
                <th className="px-4 py-3">Flagged Events</th>
                <th className="px-4 py-3">Risk Rate (%)</th>
                <th className="px-4 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]">
              {institutionComparison.map((inst) => (
                <tr key={inst.name} className="hover:bg-[var(--bg-canvas)] transition-colors">
                  <td className="px-5 py-3.5 font-bold text-[var(--text-primary)]">
                    {inst.name}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[var(--text-primary)]">
                    {inst.transactions}
                  </td>
                  <td className="px-4 py-3.5 font-mono text-rose-500 font-bold">
                    {inst.flagged}
                  </td>
                  <td className="px-4 py-3.5 font-mono font-bold text-[var(--text-primary)]">
                    {inst.riskRate}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <span
                      className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        inst.tone === "success"
                          ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                          : inst.tone === "warning"
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                      }`}
                    >
                      Benchmarked
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* AI-Powered Insights & Key Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5 bg-[var(--bg-surface-elevated)] border-[var(--border-default)] space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-[var(--border-subtle)]">
            <Sparkles className="size-4.5 text-[var(--accent-gold)]" />
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              AI-Powered Risk Signals (Beta)
            </h3>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-500">Emerging Fraud Pattern Detected</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">2h ago</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Increased dormant-account activation followed by high-value transfers (GH₵ 20k+) to new mobile money beneficiaries.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-500">Policy Recommendation</span>
              <span className="text-[10px] font-mono text-[var(--text-muted)]">Active</span>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Implement step-up OTP and biometric verification for transactions exceeding GH₵ 10,000 to first-time recipients.
            </p>
          </div>
        </Card>

        {/* Recent Reports Download List */}
        <Card className="p-5 bg-[var(--bg-surface-elevated)] border-[var(--border-default)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <FileText className="size-4.5 text-[var(--accent-gold)]" />
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Recent Regulatory &amp; Audit Reports
              </h3>
            </div>
            <Button variant="secondary" size="sm" className="text-xs font-bold cursor-pointer">
              View All
            </Button>
          </div>

          <div className="space-y-2">
            {recentReports.map((rep) => (
              <div
                key={rep.code}
                className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[var(--accent-gold-border)] transition-colors"
              >
                <div>
                  <h4 className="text-xs font-bold text-[var(--text-primary)]">{rep.title}</h4>
                  <p className="text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
                    {rep.code} &bull; {rep.size} &bull; {rep.date}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadReport(rep.title)}
                  className="gap-1.5 text-xs font-bold cursor-pointer"
                >
                  <Download className="size-3" />
                  <span>PDF</span>
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
