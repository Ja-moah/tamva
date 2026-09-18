import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  BriefcaseBusiness,
  CircleGauge,
  Coins,
  ExternalLink,
  Network,
  Search,
  Smartphone,
  Users,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

interface CommandMenuProps {
  open: boolean;
  onClose: () => void;
}

export function CommandMenu({ open, onClose }: CommandMenuProps) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const quickNav = [
    {
      title: "System Overview",
      desc: "Live operational telemetry, risk volume & domain contracts",
      icon: CircleGauge,
      action: () => {
        navigate({ to: "/" });
        onClose();
      },
    },
    {
      title: "Mobile Money & Telco Rails",
      desc: "MTN MoMo, Telecel Cash, and AirtelTigo Money network mesh",
      icon: Smartphone,
      action: () => {
        navigate({ to: "/network" });
        onClose();
      },
    },
    {
      title: "Live African Currency Converter",
      desc: "Instant GHS, USD, EUR, GBP, NGN, KES, XOF FX exchange matrix",
      icon: Coins,
      action: () => {
        navigate({ to: "/" });
        onClose();
      },
    },
    {
      title: "Risk Events & Rules Engine",
      desc: "Real-time fraud decisions, anomaly alerts & reason codes",
      icon: Activity,
      action: () => {
        navigate({ to: "/risk-events" });
        onClose();
      },
    },
    {
      title: "Case Management & Alerts",
      desc: "Investigator queue, evidence review & SAR filing workflows",
      icon: BriefcaseBusiness,
      action: () => {
        navigate({ to: "/cases" });
        onClose();
      },
    },
    {
      title: "Customer Financial Passports",
      desc: "Ghana Card biometric hashes, KYC tier boundaries & consent",
      icon: Users,
      action: () => {
        navigate({ to: "/customers" });
        onClose();
      },
    },
    {
      title: "Trust Network Rails",
      desc: "Inter-institution nodes, PAPSS routing & settlement health",
      icon: Network,
      action: () => {
        navigate({ to: "/network" });
        onClose();
      },
    },
    {
      title: "OpenAPI / Swagger Explorer",
      desc: "Authoritative Django backend endpoint contracts",
      icon: ExternalLink,
      action: () => {
        window.open("/api/docs/", "_blank");
        onClose();
      },
    },
  ];

  const filtered = quickNav.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.desc.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6 md:p-20">
      <div
        className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-xl transform overflow-hidden rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] shadow-[var(--shadow-lg)] transition-all animate-in fade-in zoom-in-98">
        <div className="relative flex items-center border-b border-[var(--border-default)] px-4">
          <Search className="size-4.5 text-[var(--accent-gold)] shrink-0" />
          <input
            type="text"
            className="w-full bg-transparent px-3.5 py-4 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none"
            placeholder="Type a command or search (e.g. MoMo, Currency, Risk, KYC)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <span className="hidden sm:inline-block rounded-md border border-[var(--border-default)] bg-[var(--bg-surface-subtle)] px-2 py-0.5 font-mono text-xs text-[var(--text-muted)] uppercase">
            ESC
          </span>
          <button
            onClick={onClose}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] sm:hidden cursor-pointer"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2.5 space-y-1">
          <p className="px-3 py-1.5 text-xs font-mono font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Operations &amp; Navigation
          </p>
          {filtered.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm font-semibold text-[var(--text-secondary)]">
                No matching operations found
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                Try searching for &quot;MoMo&quot;, &quot;Currency&quot;, &quot;Risk&quot;, or &quot;Passport&quot;
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  onClick={item.action}
                  className="w-full flex items-center gap-3 rounded-lg px-3.5 py-3 text-left transition-colors hover:bg-[var(--bg-surface-hover)] group cursor-pointer"
                >
                  <span className="grid size-9 place-items-center rounded-md bg-[var(--bg-surface-subtle)] border border-[var(--border-default)] text-[var(--text-secondary)] group-hover:text-[var(--accent-gold)] transition-colors shrink-0">
                    <Icon className="size-4.5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-gold)] transition-colors truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--border-default)] px-4 py-3 bg-[var(--bg-surface-subtle)] text-xs text-[var(--text-secondary)] font-mono">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[var(--accent-emerald)]" />
            TAMVA Operations
          </span>
          <span>Press ESC to exit</span>
        </div>
      </div>
    </div>
  );
}
