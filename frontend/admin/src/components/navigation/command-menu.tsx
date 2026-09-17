import { useNavigate } from "@tanstack/react-router";
import {
  Activity,
  BriefcaseBusiness,
  CircleGauge,
  ExternalLink,
  Network,
  Search,
  Sparkles,
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
        if (open) onClose();
        else onClose(); // parent handles toggle
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
      desc: "Live health, telemetry & domain readiness",
      icon: CircleGauge,
      action: () => {
        navigate({ to: "/" });
        onClose();
      },
    },
    {
      title: "Risk Events & Rules Engine",
      desc: "Inspect live fraud decisions & reason codes",
      icon: Activity,
      action: () => {
        navigate({ to: "/risk-events" });
        onClose();
      },
    },
    {
      title: "Case Management & Investigations",
      desc: "Review flagged alerts and AML workflows",
      icon: BriefcaseBusiness,
      action: () => {
        navigate({ to: "/cases" });
        onClose();
      },
    },
    {
      title: "Customer & Identity Profiles",
      desc: "Verified financial passports & consent scopes",
      icon: Users,
      action: () => {
        navigate({ to: "/customers" });
        onClose();
      },
    },
    {
      title: "Trust Network Rails",
      desc: "Inter-institution nodes & settlement gateways",
      icon: Network,
      action: () => {
        navigate({ to: "/network" });
        onClose();
      },
    },
    {
      title: "OpenAPI / Swagger Explorer",
      desc: "Authoritative Django backend API schema",
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
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-2xl transform overflow-hidden rounded-3xl border border-white/10 bg-[#121217] shadow-[0_32px_80px_rgba(0,0,0,0.8)] transition-all animate-in fade-in zoom-in-95">
        <div className="relative flex items-center border-b border-white/[0.08] px-4">
          <Search className="size-5 text-[#D4A017] shrink-0" />
          <input
            type="text"
            className="w-full bg-transparent px-4 py-4 text-sm text-white placeholder-white/30 focus:outline-none"
            placeholder="Type a command, route, or search entities (e.g. Risk, AML, Cases)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <span className="hidden sm:inline-block rounded-md border border-white/10 px-2 py-0.5 font-mono text-[10px] text-white/40 uppercase">
            ESC
          </span>
          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white sm:hidden"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="max-h-96 overflow-y-auto p-3 space-y-1">
          <p className="px-3 py-1.5 text-[10px] font-mono font-semibold uppercase tracking-widest text-white/40">
            Navigation &amp; Operations
          </p>
          {filtered.length === 0 ? (
            <div className="p-8 text-center">
              <Sparkles className="size-8 text-[#D4A017]/40 mx-auto mb-2" />
              <p className="text-sm font-semibold text-white/70">No matching operations</p>
              <p className="text-xs text-white/40 mt-1">
                Try searching for "Risk", "Case", "Identity", or "API"
              </p>
            </div>
          ) : (
            filtered.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  onClick={item.action}
                  className="w-full flex items-center gap-3.5 rounded-2xl px-3.5 py-3 text-left transition-all duration-150 hover:bg-white/[0.06] hover:border-white/10 group"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-white/[0.04] border border-white/8 text-[#D4A017] group-hover:border-[#D4A017]/40 group-hover:bg-[#D4A017]/10 transition-colors">
                    <Icon className="size-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white group-hover:text-[#FCD116] transition-colors truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-white/50 truncate mt-0.5">{item.desc}</p>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/[0.08] px-4 py-3 bg-white/[0.02] text-[11px] text-white/40">
          <span className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-[#00C97A]" />
            TAMVA Operational Console v2.0
          </span>
          <span className="font-mono">Use ↑↓ to navigate, ↵ to select</span>
        </div>
      </div>
    </div>
  );
}
