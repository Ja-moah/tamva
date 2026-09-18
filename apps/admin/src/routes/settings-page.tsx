import {
  Bell,
  Mail,
  MessageSquare,
  Moon,
  Save,
  Shield,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";

import { StatusBadge } from "../components/feedback/status-badge";
import { Button } from "../components/ui/button";
import { DeleteConfirmationModal } from "../components/ui/delete-confirmation-modal";
import { useToast } from "../components/ui/toast";

export function SettingsPage() {
  const { toast } = useToast();

  // Notification Preferences State
  const [preferences, setPreferences] = useState({
    securityAlerts: true,
    transactionAlerts: true,
    consentPassport: true,
    financialInsights: false,
  });

  // Delivery Channels State
  const [channels, setChannels] = useState({
    inApp: true,
    email: true,
    sms: true,
  });

  // Quiet Hours State
  const [quietHours, setQuietHours] = useState({
    enabled: true,
    startTime: "22:00",
    endTime: "07:00",
  });

  // Clear confirmation modal state
  const [clearModalOpen, setClearModalOpen] = useState(false);

  const handleTogglePreference = (key: keyof typeof preferences) => {
    setPreferences((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      toast({
        title: "Preference Updated",
        description: `Notification settings updated for ${key}.`,
        type: "info",
      });
      return updated;
    });
  };

  const handleToggleChannel = (key: keyof typeof channels) => {
    setChannels((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      toast({
        title: "Channel Configured",
        description: `${key.toUpperCase()} notifications ${updated[key] ? "enabled" : "disabled"}.`,
        type: "info",
      });
      return updated;
    });
  };

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Institutional alert preferences synchronized with PostgreSQL 17 policy vault.",
      type: "success",
    });
  };

  const handleConfirmClearAll = () => {
    toast({
      title: "All Notifications Cleared",
      description: "Purged all 5 cached alerts and logs across all delivery rails.",
      type: "warning",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Clear Confirmation Dialog */}
      <DeleteConfirmationModal
        open={clearModalOpen}
        onClose={() => setClearModalOpen(false)}
        onConfirm={handleConfirmClearAll}
        title="Clear All Notifications"
        itemCount={5}
        isBulk={true}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[var(--accent-gold)] uppercase tracking-wider font-bold">
            <Shield className="size-3.5" />
            <span>Operational Governance</span>
          </div>
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-tight mt-1">
            Notification Settings
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-0.5 font-medium">
            Configure institutional alert dispatching, multi-channel gateways, and quiet hours.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/notifications"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] text-xs font-bold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer shadow-xs"
          >
            <Bell className="size-3.5" />
            <span>Back to Alerts</span>
          </Link>

          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveSettings}
            className="text-xs font-bold gap-1.5 rounded-xl cursor-pointer shadow-md bg-slate-900 text-white dark:bg-white dark:text-slate-900"
          >
            <Save className="size-3.5" />
            <span>Save Preferences</span>
          </Button>
        </div>
      </div>

      {/* Highlight Brand Card */}
      <div className="rounded-2xl border border-[var(--accent-gold-border)] bg-[var(--accent-gold-subtle)] p-5 flex items-start gap-4">
        <div className="size-10 rounded-xl bg-[var(--accent-gold)] text-black font-extrabold flex items-center justify-center shrink-0 shadow-xs">
          <Sparkles className="size-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            Timely Alerts. A Safer Financial Ecosystem.
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed font-medium">
            TAMVA routes high-severity risk signals across Ghana&apos;s commercial banks, Mobile Money Operators (MTN, Telecel, AirtelTigo), and GhIPSS rails in real time.
          </p>
        </div>
      </div>

      {/* Notification Preferences */}
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-5 space-y-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            Notification Preferences
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Choose what category of events you want to be alerted on.
          </p>
        </div>

        <div className="divide-y divide-[var(--border-subtle)]">
          {/* Security Alerts */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  Security Alerts
                </span>
                <StatusBadge tone="danger" size="sm">
                  Crucial
                </StatusBadge>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                Suspicious activity, account takeovers, new device sign-ins, and high-risk flags.
              </p>
            </div>
            <button
              onClick={() => handleTogglePreference("securityAlerts")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                preferences.securityAlerts ? "bg-slate-900 dark:bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
              }`}
              role="switch"
              aria-checked={preferences.securityAlerts}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  preferences.securityAlerts ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Transaction Alerts */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-[var(--text-primary)]">
                  Transaction Alerts
                </span>
                <StatusBadge tone="warning" size="sm">
                  Recommended
                </StatusBadge>
              </div>
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                Incoming/outgoing transfers, large amount anomalies, and high velocity breaches.
              </p>
            </div>
            <button
              onClick={() => handleTogglePreference("transactionAlerts")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                preferences.transactionAlerts ? "bg-slate-900 dark:bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
              }`}
              role="switch"
              aria-checked={preferences.transactionAlerts}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  preferences.transactionAlerts ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Consent & Passport */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-[var(--text-primary)]">
                Consent &amp; Passport Sharing
              </span>
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                Data-sharing requests, consent renewals, and Financial Passport verifications.
              </p>
            </div>
            <button
              onClick={() => handleTogglePreference("consentPassport")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                preferences.consentPassport ? "bg-slate-900 dark:bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
              }`}
              role="switch"
              aria-checked={preferences.consentPassport}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  preferences.consentPassport ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Financial Insights */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-[var(--text-primary)]">
                Financial Insights &amp; Digests
              </span>
              <p className="text-xs text-[var(--text-secondary)] font-medium">
                Weekly risk analytics summaries, network clustering trends, and ecosystem updates.
              </p>
            </div>
            <button
              onClick={() => handleTogglePreference("financialInsights")}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                preferences.financialInsights ? "bg-slate-900 dark:bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
              }`}
              role="switch"
              aria-checked={preferences.financialInsights}
            >
              <span
                className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                  preferences.financialInsights ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Delivery Channels */}
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-5 space-y-4 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            Delivery Channels
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Choose how institutional operators receive real-time notifications.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* In-App */}
          <div
            onClick={() => handleToggleChannel("inApp")}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
              channels.inApp
                ? "border-[var(--accent-gold)] bg-[var(--bg-canvas)]"
                : "border-[var(--border-default)] bg-[var(--bg-surface-subtle)] opacity-70"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Bell className="size-4" />
              </div>
              <span className="text-xs font-mono font-bold text-[var(--accent-emerald)]">
                {channels.inApp ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">In-App Banner</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Real-time web &amp; mobile stream</p>
            </div>
          </div>

          {/* Email */}
          <div
            onClick={() => handleToggleChannel("email")}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
              channels.email
                ? "border-[var(--accent-gold)] bg-[var(--bg-canvas)]"
                : "border-[var(--border-default)] bg-[var(--bg-surface-subtle)] opacity-70"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Mail className="size-4" />
              </div>
              <span className="text-xs font-mono font-bold text-[var(--accent-emerald)]">
                {channels.email ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Email Dispatch</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Encrypted institutional SMTP</p>
            </div>
          </div>

          {/* SMS */}
          <div
            onClick={() => handleToggleChannel("sms")}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
              channels.sms
                ? "border-[var(--accent-gold)] bg-[var(--bg-canvas)]"
                : "border-[var(--border-default)] bg-[var(--bg-surface-subtle)] opacity-70"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <MessageSquare className="size-4" />
              </div>
              <span className="text-xs font-mono font-bold text-[var(--accent-emerald)]">
                {channels.sms ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">SMS Gateway</p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">MTN / Telecel / AT Direct Rail</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-5 space-y-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Moon className="size-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">Quiet Hours</h2>
              <p className="text-xs text-[var(--text-muted)]">
                Pause non-critical notifications during designated off-peak hours.
              </p>
            </div>
          </div>

          <button
            onClick={() => setQuietHours((prev) => ({ ...prev, enabled: !prev.enabled }))}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
              quietHours.enabled ? "bg-slate-900 dark:bg-emerald-500" : "bg-slate-300 dark:bg-slate-700"
            }`}
            role="switch"
            aria-checked={quietHours.enabled}
          >
            <span
              className={`pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                quietHours.enabled ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>

        {quietHours.enabled && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[var(--border-subtle)]">
            <div>
              <label className="block text-xs font-mono text-[var(--text-muted)] uppercase mb-1">
                Start Time
              </label>
              <input
                type="time"
                value={quietHours.startTime}
                onChange={(e) => setQuietHours((prev) => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-primary)] font-mono font-bold"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-[var(--text-muted)] uppercase mb-1">
                End Time
              </label>
              <input
                type="time"
                value={quietHours.endTime}
                onChange={(e) => setQuietHours((prev) => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[var(--border-default)] bg-[var(--bg-canvas)] text-[var(--text-primary)] font-mono font-bold"
              />
            </div>
          </div>
        )}
      </div>

      {/* Purge & Clean Actions */}
      <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-rose-700 dark:text-rose-400">
            Clear Local Alert History
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
            Permanently clear all cached notifications. Backend compliance audit trail remains preserved.
          </p>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={() => setClearModalOpen(true)}
          className="text-xs font-bold gap-1.5 rounded-xl cursor-pointer shadow-xs shrink-0"
        >
          <Trash2 className="size-3.5" />
          <span>Clear All Notifications</span>
        </Button>
      </div>
    </div>
  );
}
