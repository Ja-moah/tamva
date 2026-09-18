import {
  AlertTriangle,
  FileCheck,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useToast } from "../components/ui/toast";

const consentDistribution = [
  { name: "Active", value: 78, count: 1284, color: "#10b981" },
  { name: "Expiring Soon", value: 13, count: 214, color: "#f59e0b" },
  { name: "Revoked", value: 9, count: 148, color: "#f43f5e" },
];

const securityAlerts = [
  {
    id: "SEC-01",
    title: "Multiple Failed Login Attempts",
    desc: "5 consecutive failed MFA attempts on Administrator account (Ama Mensah) from unrecognized IP",
    time: "10 mins ago",
    severity: "High",
  },
  {
    id: "SEC-02",
    title: "Login from New Device",
    desc: "Analyst logged in via Linux Chrome from Kumasi tower; verified via biometric challenge",
    time: "1 hour ago",
    severity: "Medium",
  },
  {
    id: "SEC-03",
    title: "API Key Rotation Required",
    desc: "Production PAPSS Bridge API key has been active for 88 days (90-day max lifecycle)",
    time: "4 hours ago",
    severity: "Low",
  },
];

const auditTrail = [
  { time: "2026-09-18 21:40", actor: "Ama Mensah", action: "User Role Modified", resource: "usr-02 (Kwame Owusu)", result: "Success" },
  { time: "2026-09-18 20:15", actor: "TAMVA Policy", action: "Consent State Evaluated", resource: "GHA-7820 (Kwame Asante)", result: "Success" },
  { time: "2026-09-18 19:30", actor: "API Gateway", action: "Token Introspection", resource: "client-id: mtn-momo-bridge", result: "Success" },
  { time: "2026-09-18 18:00", actor: "Security Officer", action: "mTLS Certificate Checked", resource: "NODE-APEX-04 Core", result: "Success" },
];

const incidents = [
  { id: "INC-892", name: "Suspicious API velocity pattern", severity: "High", status: "Investigating", detected: "2 hours ago" },
  { id: "INC-891", name: "Unusual data export request", severity: "Medium", status: "Resolved", detected: "Yesterday" },
  { id: "INC-890", name: "Multiple failed operator logins", severity: "Low", status: "Resolved", detected: "3 days ago" },
];

export function SecurityPage() {
  const { toast } = useToast();

  const handleRunAccessReview = () => {
    toast({
      title: "Access Review Completed",
      description: "Validated 24 active institutional accounts against least-privilege RBAC policies.",
      type: "success",
    });
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[var(--border-subtle)]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[var(--text-primary)]">
            Security &amp; Governance Center
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5 font-medium">
            Protect financial data. Govern access. Prove compliance. Trust is built through responsible data stewardship.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={handleRunAccessReview}
            className="gap-2 font-bold text-xs cursor-pointer shadow-sm"
          >
            <ShieldCheck className="size-3.5" />
            <span>Run Access Review</span>
          </Button>
        </div>
      </div>

      {/* Top 4 Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4.5 bg-[var(--bg-surface-elevated)] border-[var(--border-default)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Security Posture
            </span>
            <ShieldCheck className="size-4 text-emerald-500" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-emerald-500 font-mono">98%</p>
          <p className="text-xs text-emerald-500 font-bold mt-1">+2% health score</p>
        </Card>

        <Card className="p-4.5 bg-[var(--bg-surface-elevated)] border-[var(--border-default)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Active Consents
            </span>
            <FileCheck className="size-4 text-[var(--accent-gold)]" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-[var(--text-primary)] font-mono">1,284</p>
          <p className="text-xs text-emerald-500 font-bold mt-1">+12% compliance verified</p>
        </Card>

        <Card className="p-4.5 bg-[var(--bg-surface-elevated)] border-[var(--border-default)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Access Reviews
            </span>
            <UserCheck className="size-4 text-sky-500" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-[var(--text-primary)] font-mono">24</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Completed this month</p>
        </Card>

        <Card className="p-4.5 bg-[var(--bg-surface-elevated)] border-[var(--border-default)]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Open Incidents
            </span>
            <AlertTriangle className="size-4 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-extrabold text-rose-500 font-mono">2</p>
          <p className="text-xs text-emerald-500 font-bold mt-1">-50% reduction</p>
        </Card>
      </div>

      {/* Data Access & Consent + Privacy Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5 bg-[var(--bg-surface-elevated)] border-[var(--border-default)]">
          <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)] mb-4">
            <div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">
                Customer Data Access &amp; Consent
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Granular consent boundaries active across 1,284 customer passports
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-emerald-500">1,284 Active</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={consentDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {consentDistribution.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2.5">
              {consentDistribution.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2">
                    <span className="size-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-xs font-bold text-[var(--text-primary)]">{item.name}</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-[var(--text-primary)]">
                    {item.value}% ({item.count})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Privacy & Compliance Governance Checklist */}
        <Card className="p-5 bg-[var(--bg-surface-elevated)] border-[var(--border-default)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Privacy &amp; Data Governance Controls
            </h3>
            <span className="text-xs font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              87% Compliance
            </span>
          </div>

          <div className="space-y-2 text-xs">
            {[
              { name: "Purpose Limitation", desc: "Data used only for explicitly approved lending/AML purposes", status: "Enforced" },
              { name: "Data Minimization", desc: "Only necessary attributes collected and retained in database", status: "Enforced" },
              { name: "Automated Retention Controls", desc: "Automated purge of expired consent logs after statutory period", status: "Enforced" },
              { name: "Data Residency (Ghana)", desc: "Primary transactional data stored in Ghana region", status: "Compliant" },
              { name: "Encryption at Rest (AES-256)", desc: "All sensitive passport hashes encrypted with KMS", status: "Active" },
            ].map((item) => (
              <div key={item.name} className="flex items-center justify-between p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                <div>
                  <span className="font-bold text-[var(--text-primary)] block">{item.name}</span>
                  <span className="text-[11px] text-[var(--text-muted)]">{item.desc}</span>
                </div>
                <span className="font-mono text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 shrink-0 ml-2">
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Security Alerts & Incident Response */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-5 bg-[var(--bg-surface-elevated)] border-[var(--border-default)] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Recent Security Alerts</h3>
            <span className="text-xs font-mono text-[var(--text-muted)]">Live Stream</span>
          </div>

          <div className="space-y-2.5">
            {securityAlerts.map((alert) => (
              <div key={alert.id} className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-primary)]">{alert.title}</span>
                  <span
                    className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      alert.severity === "High"
                        ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                        : alert.severity === "Medium"
                          ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                          : "bg-slate-500/10 text-slate-400"
                    }`}
                  >
                    {alert.severity}
                  </span>
                </div>
                <p className="text-xs text-[var(--text-secondary)]">{alert.desc}</p>
                <span className="text-[10px] text-[var(--text-muted)] font-mono block">{alert.time}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Audit Trail Table */}
        <Card className="overflow-hidden bg-[var(--bg-surface-elevated)] border-[var(--border-default)]">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Immutable Audit Trail</h3>
            <span className="text-xs font-mono text-emerald-500">PostgreSQL Outbox Sync</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border-default)] bg-[var(--bg-canvas)] font-mono uppercase text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-3">Timestamp</th>
                  <th className="px-3 py-3">Actor</th>
                  <th className="px-3 py-3">Action</th>
                  <th className="px-3 py-3 text-right">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {auditTrail.map((log, idx) => (
                  <tr key={idx} className="hover:bg-[var(--bg-canvas)]">
                    <td className="px-4 py-3 font-mono text-[var(--text-muted)]">{log.time}</td>
                    <td className="px-3 py-3 font-semibold text-[var(--text-primary)]">{log.actor}</td>
                    <td className="px-3 py-3 text-[var(--text-secondary)]">{log.action}</td>
                    <td className="px-3 py-3 text-right">
                      <span className="text-emerald-500 font-mono font-bold text-[10px]">{log.result}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Incident Response Section */}
        <Card className="overflow-hidden bg-[var(--bg-surface-elevated)] border-[var(--border-default)]">
          <div className="p-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--text-primary)]">Incident Response &amp; Triage</h3>
            <span className="text-xs font-mono text-[var(--accent-gold)]">3 Recorded Incidents</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-[var(--border-default)] bg-[var(--bg-canvas)] font-mono uppercase text-[var(--text-muted)]">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-3 py-3">Incident</th>
                  <th className="px-3 py-3">Severity</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3 text-right">Detected</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {incidents.map((inc) => (
                  <tr key={inc.id} className="hover:bg-[var(--bg-canvas)]">
                    <td className="px-4 py-3 font-mono font-bold text-[var(--text-primary)]">{inc.id}</td>
                    <td className="px-3 py-3 font-semibold text-[var(--text-primary)]">{inc.name}</td>
                    <td className="px-3 py-3">
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                          inc.severity === "High"
                            ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                            : inc.severity === "Medium"
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              : "bg-slate-500/10 text-slate-400"
                        }`}
                      >
                        {inc.severity}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-mono font-bold text-[var(--text-secondary)]">{inc.status}</td>
                    <td className="px-3 py-3 text-right font-mono text-[var(--text-muted)]">{inc.detected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
