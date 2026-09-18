import {
  Activity,
  CheckCircle2,
  Code2,
  Copy,
  Cpu,
  Key,
  Layers,
  Play,
  Plus,
  RefreshCw,
  Server,
  ShieldCheck,
  Terminal,
  Trash2,
  Webhook,
} from "lucide-react";
import { useState } from "react";

import { StatusBadge } from "../components/feedback/status-badge";
import { Button } from "../components/ui/button";
import { DeleteConfirmationModal } from "../components/ui/delete-confirmation-modal";
import { useToast } from "../components/ui/toast";
import { cn } from "../lib/utils/cn";

export interface ApiProduct {
  id: string;
  name: string;
  version: string;
  endpointsCount: number;
  status: "Operational" | "Degraded" | "Maintenance";
  description: string;
  basePath: string;
}

export interface ApiKeyItem {
  id: string;
  name: string;
  environment: "Sandbox" | "Production";
  keyPrefix: string;
  scopes: string[];
  lastUsed: string;
  created: string;
}

export interface WebhookEvent {
  id: string;
  time: string;
  event: string;
  status: "Delivered" | "Pending" | "Failed";
  retries: number;
  targetUrl: string;
}

export interface ApiLogEntry {
  id: string;
  time: string;
  endpoint: string;
  method: "POST" | "GET" | "PUT" | "DELETE";
  status: number;
  latencyMs: number;
  clientIp: string;
}

const apiProducts: ApiProduct[] = [
  {
    id: "risk",
    name: "Risk Evaluation API",
    version: "v1",
    endpointsCount: 5,
    status: "Operational",
    description: "Assess transaction, device, and user risk in real time across banking and mobile money rails.",
    basePath: "/api/v1/risk/evaluate",
  },
  {
    id: "profile",
    name: "Financial Profile API",
    version: "v1",
    endpointsCount: 6,
    status: "Operational",
    description: "Access consented financial-profile data, cash flow aggregates, and credit confidence insights.",
    basePath: "/api/v1/customers/profile",
  },
  {
    id: "consent",
    name: "Consent Management API",
    version: "v1",
    endpointsCount: 4,
    status: "Operational",
    description: "Manage customer consent tokens, purpose limitation scopes, and automated retention permissions.",
    basePath: "/api/v1/consent",
  },
  {
    id: "passport",
    name: "Financial Passport API",
    version: "v1",
    endpointsCount: 5,
    status: "Operational",
    description: "Create, issue, verify, and revoke portable Financial Passports across partner institutions.",
    basePath: "/api/v1/passport/verify",
  },
  {
    id: "case",
    name: "Case Management API",
    version: "v1",
    endpointsCount: 4,
    status: "Operational",
    description: "Create, update, ingest evidence, and track institutional risk investigation cases programmatically.",
    basePath: "/api/v1/cases",
  },
];

const initialApiKeys: ApiKeyItem[] = [
  {
    id: "key-1",
    name: "Sandbox Integration Key",
    environment: "Sandbox",
    keyPrefix: "tmv_sbx_9921a4...",
    scopes: ["Read", "Write", "Risk", "Profile"],
    lastUsed: "2 mins ago",
    created: "May 10, 2026",
  },
  {
    id: "key-2",
    name: "Production Live Key",
    environment: "Production",
    keyPrefix: "tmv_live_4472b8...",
    scopes: ["Read", "Write", "Consent", "Cases"],
    lastUsed: "Just now",
    created: "Apr 02, 2026",
  },
  {
    id: "key-3",
    name: "GhIPSS Interop Gateway Key",
    environment: "Production",
    keyPrefix: "tmv_live_8819c3...",
    scopes: ["Read", "Risk", "Network"],
    lastUsed: "12 mins ago",
    created: "Mar 18, 2026",
  },
];

const initialWebhooks: WebhookEvent[] = [
  {
    id: "wh-1",
    time: "10:42:19",
    event: "risk.evaluated",
    status: "Delivered",
    retries: 0,
    targetUrl: "https://api.partnerbank.com.gh/v1/webhooks/tamva",
  },
  {
    id: "wh-2",
    time: "10:41:05",
    event: "risk.decisioned",
    status: "Delivered",
    retries: 0,
    targetUrl: "https://api.partnerbank.com.gh/v1/webhooks/tamva",
  },
  {
    id: "wh-3",
    time: "10:38:44",
    event: "case.created",
    status: "Delivered",
    retries: 0,
    targetUrl: "https://api.partnerbank.com.gh/v1/webhooks/tamva",
  },
  {
    id: "wh-4",
    time: "10:29:11",
    event: "passport.shared",
    status: "Delivered",
    retries: 0,
    targetUrl: "https://api.partnerbank.com.gh/v1/webhooks/tamva",
  },
  {
    id: "wh-5",
    time: "10:14:02",
    event: "consent.revoked",
    status: "Delivered",
    retries: 0,
    targetUrl: "https://api.partnerbank.com.gh/v1/webhooks/tamva",
  },
];

const initialLogs: ApiLogEntry[] = [
  {
    id: "log-1",
    time: "10:42:30",
    endpoint: "/v1/risk/evaluate",
    method: "POST",
    status: 200,
    latencyMs: 138,
    clientIp: "102.176.94.22",
  },
  {
    id: "log-2",
    time: "10:41:18",
    endpoint: "/v1/consent/create",
    method: "POST",
    status: 201,
    latencyMs: 142,
    clientIp: "102.176.94.22",
  },
  {
    id: "log-3",
    time: "10:39:50",
    endpoint: "/v1/profile/retrieve",
    method: "GET",
    status: 200,
    latencyMs: 112,
    clientIp: "41.215.160.8",
  },
  {
    id: "log-4",
    time: "10:38:04",
    endpoint: "/v1/case/create",
    method: "POST",
    status: 201,
    latencyMs: 156,
    clientIp: "102.176.94.22",
  },
  {
    id: "log-5",
    time: "10:35:12",
    endpoint: "/v1/passport/verify",
    method: "POST",
    status: 200,
    latencyMs: 98,
    clientIp: "154.160.22.91",
  },
];

export function IntegrationsPage() {
  const [activeTab, setActiveTab] = useState<
    "apis" | "keys" | "webhooks" | "logs" | "sandbox" | "docs"
  >("apis");
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>(initialApiKeys);
  const [selectedKeyIds, setSelectedKeyIds] = useState<string[]>([]);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [singleKeyId, setSingleKeyId] = useState<string | null>(null);

  // Sandbox state
  const [sandboxEndpoint, setSandboxEndpoint] = useState("/v1/risk/evaluate");
  const [sandboxSampleUser, setSandboxSampleUser] = useState("Elijah Dery (GHA-66718290-3)");
  const [sandboxResponse, setSandboxResponse] = useState<string | null>(null);
  const [sandboxLoading, setSandboxLoading] = useState(false);

  const { toast } = useToast();

  const handleRunSandbox = () => {
    setSandboxLoading(true);
    setTimeout(() => {
      setSandboxResponse(
        JSON.stringify(
          {
            risk_event_id: "RSK-2026-9921",
            risk_score: 94,
            decision: "HOLD",
            reasons: [
              "New Device (iPhone 15 Pro, iOS 18.2)",
              "New Beneficiary (Kofi Mensah)",
              "Amount 4.2x above historical 90d average",
              "Unusual login geolocation mismatch",
            ],
            recommended_action: "STEP-UP AUTHENTICATION",
            transaction: {
              customer_id: "GHA-66718290-3",
              amount: 25000.0,
              currency: "GHS",
              channel: "Internet Banking",
              timestamp: new Date().toISOString(),
            },
            compliance: {
              data_residency: "Ghana (Primary)",
              consent_token: "GHA-CONSENT-8842",
            },
          },
          null,
          2,
        ),
      );
      setSandboxLoading(false);
      toast({
        title: "Sandbox Request Executed",
        description: "200 OK returned in 142ms via mock risk execution node.",
        type: "success",
      });
    }, 450);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: "Content copied successfully.",
      type: "info",
    });
  };

  const handleRotateKey = (id: string) => {
    setApiKeys((prev) =>
      prev.map((k) =>
        k.id === id
          ? {
              ...k,
              keyPrefix: `tmv_${k.environment.toLowerCase()}_${Math.random().toString(36).substring(2, 8)}...`,
              lastUsed: "Just now",
            }
          : k,
      ),
    );
    toast({
      title: "API Key Rotated",
      description: "Generated a new secret key token. Update your server environment variables.",
      type: "success",
    });
  };

  const confirmDeleteKey = () => {
    if (singleKeyId) {
      setApiKeys((prev) => prev.filter((k) => k.id !== singleKeyId));
      setSelectedKeyIds((prev) => prev.filter((id) => id !== singleKeyId));
      toast({
        title: "API Key Revoked",
        description: "Credentials permanently revoked from gateway access.",
        type: "warning",
      });
    } else if (selectedKeyIds.length > 0) {
      setApiKeys((prev) => prev.filter((k) => !selectedKeyIds.includes(k.id)));
      toast({
        title: "Bulk Keys Revoked",
        description: `Revoked ${selectedKeyIds.length} API keys.`,
        type: "warning",
      });
      setSelectedKeyIds([]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSingleKeyId(null);
        }}
        onConfirm={confirmDeleteKey}
        title={singleKeyId ? "Revoke API Key" : "Bulk Revoke API Keys"}
        itemName={singleKeyId ? apiKeys.find((k) => k.id === singleKeyId)?.name : undefined}
        itemCount={singleKeyId ? 1 : selectedKeyIds.length}
        isBulk={!singleKeyId}
      />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent-gold)] uppercase tracking-wider font-bold">
            <Cpu className="size-3.5" />
            <span>Developer &amp; Infrastructure Portal</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight mt-1">
            API &amp; Integration Console
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5 font-medium">
            Build, test, and monitor your financial trust infrastructure. Open infrastructure for a stronger Africa.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="px-3 py-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-xs font-mono font-bold flex items-center gap-2">
            <Server className="size-3.5 text-[var(--accent-emerald)]" />
            <span>Sandbox Mode</span>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setActiveTab("sandbox")}
            className="text-xs font-bold gap-1.5 rounded-xl cursor-pointer shadow-md bg-slate-900 text-white dark:bg-white dark:text-slate-900"
          >
            <Play className="size-3.5" />
            <span>Try in Sandbox</span>
          </Button>
        </div>
      </div>

      {/* Top API Performance KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] shadow-xs space-y-1">
          <span className="text-xs font-mono text-[var(--text-muted)] uppercase">API Requests</span>
          <p className="text-2xl font-extrabold text-[var(--text-primary)] font-tabular">1.84M</p>
          <span className="text-xs font-bold text-[var(--accent-emerald)]">+12% vs last mo</span>
        </div>

        <div className="p-4.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] shadow-xs space-y-1">
          <span className="text-xs font-mono text-[var(--text-muted)] uppercase">Success Rate</span>
          <p className="text-2xl font-extrabold text-[var(--text-primary)] font-tabular">99.97%</p>
          <span className="text-xs font-bold text-[var(--accent-emerald)]">+0.2% uptime</span>
        </div>

        <div className="p-4.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] shadow-xs space-y-1">
          <span className="text-xs font-mono text-[var(--text-muted)] uppercase">Avg Latency</span>
          <p className="text-2xl font-extrabold text-[var(--text-primary)] font-tabular">142 ms</p>
          <span className="text-xs font-bold text-[var(--accent-emerald)]">-18ms p95 latency</span>
        </div>

        <div className="p-4.5 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] shadow-xs space-y-1">
          <span className="text-xs font-mono text-[var(--text-muted)] uppercase">Webhooks Delivered</span>
          <p className="text-2xl font-extrabold text-[var(--text-primary)] font-tabular">98.9%</p>
          <span className="text-xs font-bold text-[var(--accent-emerald)]">+1.4% reliability</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] p-2 rounded-2xl shadow-xs">
        {(
          [
            { id: "apis", label: "APIs & Products", icon: Layers },
            { id: "keys", label: "API Keys", icon: Key },
            { id: "sandbox", label: "Interactive Sandbox", icon: Play },
            { id: "webhooks", label: "Webhooks", icon: Webhook },
            { id: "logs", label: "Traffic Logs", icon: Activity },
            { id: "docs", label: "Code & SDKs", icon: Code2 },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0",
                activeTab === tab.id
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]",
              )}
            >
              <Icon className="size-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: APIs & Products */}
      {activeTab === "apis" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {apiProducts.map((prod) => (
            <div
              key={prod.id}
              className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-5 space-y-3 shadow-xs hover:border-[var(--border-strong)] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[var(--text-primary)]">{prod.name}</h3>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[var(--bg-surface-subtle)] text-[var(--accent-gold)] border border-[var(--border-subtle)]">
                      {prod.version}
                    </span>
                  </div>
                  <StatusBadge tone="success" size="sm">
                    {prod.status}
                  </StatusBadge>
                </div>
                <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-medium leading-relaxed">
                  {prod.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-mono text-[var(--text-muted)]">
                <span>{prod.endpointsCount} Endpoints Available</span>
                <span className="text-[var(--accent-gold)] font-bold">{prod.basePath}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab: API Keys */}
      {activeTab === "keys" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[var(--text-primary)]">
              Institutional API Credentials
            </h3>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                const newKey: ApiKeyItem = {
                  id: `key-${Date.now()}`,
                  name: "New Integration Key",
                  environment: "Sandbox",
                  keyPrefix: `tmv_sbx_${Math.random().toString(36).substring(2, 8)}...`,
                  scopes: ["Read", "Risk"],
                  lastUsed: "Never",
                  created: "Today",
                };
                setApiKeys((prev) => [newKey, ...prev]);
                toast({
                  title: "Key Generated",
                  description: "Created new sandbox credentials.",
                  type: "success",
                });
              }}
              className="text-xs font-bold gap-1.5 rounded-xl cursor-pointer bg-slate-900 text-white dark:bg-white dark:text-slate-900"
            >
              <Plus className="size-3.5" />
              <span>Create API Key</span>
            </Button>
          </div>

          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-canvas)] border-b border-[var(--border-default)] font-mono text-[var(--text-muted)] uppercase">
                  <tr>
                    <th className="p-3.5">Name</th>
                    <th className="p-3.5">Environment</th>
                    <th className="p-3.5">Token Prefix</th>
                    <th className="p-3.5">Scopes</th>
                    <th className="p-3.5">Last Used</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {apiKeys.map((key) => (
                    <tr key={key.id} className="hover:bg-[var(--bg-surface-hover)] transition-colors">
                      <td className="p-3.5 font-bold text-[var(--text-primary)]">{key.name}</td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                            key.environment === "Production"
                              ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                              : "bg-blue-500/10 text-blue-600 border border-blue-500/30"
                          }`}
                        >
                          {key.environment}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-[var(--text-secondary)]">
                        {key.keyPrefix}
                      </td>
                      <td className="p-3.5">
                        <div className="flex items-center gap-1 flex-wrap">
                          {key.scopes.map((s) => (
                            <span
                              key={s}
                              className="px-1.5 py-0.2 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] font-mono text-[10px]"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="p-3.5 font-mono text-[var(--text-muted)]">{key.lastUsed}</td>
                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleRotateKey(key.id)}
                            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-surface-subtle)] cursor-pointer"
                            title="Rotate Key"
                          >
                            <RefreshCw className="size-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setSingleKeyId(key.id);
                              setDeleteModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                            title="Revoke Key"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Interactive Sandbox */}
      {activeTab === "sandbox" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Request Form */}
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <span className="text-sm font-bold text-[var(--text-primary)]">
                Sandbox Request Runner
              </span>
              <span className="text-xs font-mono text-[var(--accent-gold)] font-bold">
                MOCK BACKEND NODE
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] uppercase mb-1">
                  API Target Endpoint
                </label>
                <select
                  value={sandboxEndpoint}
                  onChange={(e) => setSandboxEndpoint(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-primary)] font-mono font-bold"
                >
                  <option value="/v1/risk/evaluate">POST /v1/risk/evaluate (Real-time screening)</option>
                  <option value="/v1/profile/retrieve">GET /v1/profile/retrieve (Customer profile)</option>
                  <option value="/v1/passport/verify">POST /v1/passport/verify (Trust passport)</option>
                  <option value="/v1/consent/verify">POST /v1/consent/verify (Token check)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] uppercase mb-1">
                  Sample Subject Profile
                </label>
                <select
                  value={sandboxSampleUser}
                  onChange={(e) => setSandboxSampleUser(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-primary)] font-mono font-bold"
                >
                  <option value="Elijah Dery (GHA-66718290-3)">Elijah Dery (GHA-66718290-3, GH₵ 25,000 Transfer)</option>
                  <option value="Ama Mensah (GHA-88192014-1)">Ama Mensah (GHA-88192014-1, MTN MoMo Flow)</option>
                  <option value="Kofi Boateng (GHA-11928472-9)">Kofi Boateng (GHA-11928472-9, Standard Payroll)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-mono text-[var(--text-muted)] uppercase mb-1">
                  Payload Preview (JSON)
                </label>
                <pre className="p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-default)] font-mono text-xs text-[var(--text-secondary)] overflow-x-auto">
{`{
  "customer_id": "GHA-66718290-3",
  "amount": 25000.00,
  "currency": "GHS",
  "channel": "Internet Banking",
  "device_id": "DEV-IPHONE-15-GH",
  "location": "Accra, Ghana",
  "recipient_account": "2048819201"
}`}
                </pre>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={handleRunSandbox}
                disabled={sandboxLoading}
                className="w-full text-xs font-bold gap-2 rounded-xl cursor-pointer bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md"
              >
                {sandboxLoading ? (
                  <RefreshCw className="size-4 animate-spin" />
                ) : (
                  <Play className="size-4" />
                )}
                <span>Run Test Request</span>
              </Button>
            </div>
          </div>

          {/* Response Form */}
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <span className="text-sm font-bold text-[var(--text-primary)]">Response Output</span>
              {sandboxResponse && (
                <button
                  onClick={() => handleCopy(sandboxResponse)}
                  className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                  title="Copy JSON"
                >
                  <Copy className="size-3.5" />
                </button>
              )}
            </div>

            {sandboxResponse ? (
              <pre className="p-4 rounded-xl bg-slate-950 text-emerald-400 border border-slate-800 font-mono text-xs overflow-x-auto leading-relaxed">
                {sandboxResponse}
              </pre>
            ) : (
              <div className="h-72 rounded-xl border border-dashed border-[var(--border-default)] flex flex-col items-center justify-center text-[var(--text-muted)] text-xs">
                <Terminal className="size-8 mb-2 opacity-40" />
                <span>Click &ldquo;Run Test Request&rdquo; to simulate live payload execution</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab: Webhooks */}
      {activeTab === "webhooks" && (
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-canvas)] border-b border-[var(--border-default)] font-mono text-[var(--text-muted)] uppercase">
                <tr>
                  <th className="p-3.5">Time</th>
                  <th className="p-3.5">Event Type</th>
                  <th className="p-3.5">Target Webhook URL</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Retries</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {initialWebhooks.map((wh) => (
                  <tr key={wh.id} className="hover:bg-[var(--bg-surface-hover)]">
                    <td className="p-3.5 font-mono text-[var(--text-muted)]">{wh.time}</td>
                    <td className="p-3.5 font-bold text-[var(--accent-gold)] font-mono">
                      {wh.event}
                    </td>
                    <td className="p-3.5 font-mono text-[var(--text-secondary)]">{wh.targetUrl}</td>
                    <td className="p-3.5">
                      <StatusBadge tone="success" size="sm">
                        {wh.status}
                      </StatusBadge>
                    </td>
                    <td className="p-3.5 text-right font-mono">{wh.retries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Traffic Logs */}
      {activeTab === "logs" && (
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[var(--bg-canvas)] border-b border-[var(--border-default)] font-mono text-[var(--text-muted)] uppercase">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Method</th>
                  <th className="p-3.5">Endpoint</th>
                  <th className="p-3.5">Client IP</th>
                  <th className="p-3.5">HTTP Status</th>
                  <th className="p-3.5 text-right">Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {initialLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--bg-surface-hover)]">
                    <td className="p-3.5 font-mono text-[var(--text-muted)]">{log.time}</td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] font-extrabold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                        {log.method}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-[var(--text-primary)]">
                      {log.endpoint}
                    </td>
                    <td className="p-3.5 font-mono text-[var(--text-muted)]">{log.clientIp}</td>
                    <td className="p-3.5 font-mono font-bold text-[var(--accent-emerald)]">
                      {log.status}
                    </td>
                    <td className="p-3.5 text-right font-mono text-[var(--text-muted)]">
                      {log.latencyMs} ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Code & SDKs */}
      {activeTab === "docs" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <span className="text-sm font-bold text-[var(--text-primary)]">cURL Example</span>
              <button
                onClick={() =>
                  handleCopy(
                    `curl -X POST https://api.tamva.com/v1/risk/evaluate \\\n  -H "Authorization: Bearer tmv_live_..." \\\n  -H "Content-Type: application/json" \\\n  -d '{"customer_id":"GHA-66718290-3","amount":25000}'`,
                  )
                }
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <Copy className="size-3.5" />
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed">
{`curl -X POST https://api.tamva.com/v1/risk/evaluate \\
  -H "Authorization: Bearer tmv_live_4472b8..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "customer_id": "GHA-66718290-3",
    "amount": 25000.00,
    "currency": "GHS",
    "channel": "Internet Banking"
  }'`}
            </pre>
          </div>

          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
              <span className="text-sm font-bold text-[var(--text-primary)]">Python SDK Example</span>
              <button
                onClick={() =>
                  handleCopy(
                    `from tamva import TamvaClient\n\nclient = TamvaClient(api_key="tmv_live_...")\nrisk = client.risk.evaluate(customer_id="GHA-66718290-3", amount=25000)`,
                  )
                }
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <Copy className="size-3.5" />
              </button>
            </div>
            <pre className="p-3.5 rounded-xl bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto leading-relaxed">
{`from tamva import TamvaClient

client = TamvaClient(api_key="tmv_live_4472b8...")

risk = client.risk.evaluate(
    customer_id="GHA-66718290-3",
    amount=25000.00,
    currency="GHS",
    channel="Internet Banking"
)

if risk.decision == "HOLD":
    print("Action Required: Step-up authentication needed")`}
            </pre>
          </div>
        </div>
      )}

      {/* Security & Compliance Footer */}
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-5 space-y-3 shadow-xs">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-[var(--accent-emerald)]" />
          <h3 className="text-sm font-bold text-[var(--text-primary)]">
            Security &amp; Regulatory Compliance
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 text-xs">
          {[
            "OAuth 2.0 / API Key",
            "IP Allowlist & Access",
            "HMAC Webhook Signing",
            "AES-256 Encryption",
            "Immutable Audit Logs",
            "Ghana Data Act (2012)",
          ].map((item) => (
            <div
              key={item}
              className="p-2.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center gap-2 font-medium"
            >
              <CheckCircle2 className="size-3.5 text-[var(--accent-emerald)] shrink-0" />
              <span className="text-[11px] truncate">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
