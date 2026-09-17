import { X } from "lucide-react";
import React, { useEffect } from "react";

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function DetailDrawer({
  open,
  onClose,
  title,
  subtitle,
  badge,
  children,
  footer,
}: DetailDrawerProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && open) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div className="w-screen max-w-xl transform transition-transform duration-300 ease-in-out bg-[#101014] border-l border-white/10 shadow-[0_0_60px_rgba(0,0,0,0.8)] flex flex-col">
          <div className="relative flex items-center justify-between border-b border-white/[0.08] p-6 bg-[#141419]/90 backdrop-blur-md">
            <div className="min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-1.5">
                {badge}
                <span className="text-[10px] font-mono tracking-widest text-[#D4A017] uppercase">
                  TAMVA Inspector
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight truncate">{title}</h2>
              {subtitle && <p className="text-xs text-white/50 mt-0.5 truncate">{subtitle}</p>}
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2.5 text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close drawer"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">{children}</div>

          {footer && (
            <div className="border-t border-white/[0.08] p-5 bg-[#141419]/80 backdrop-blur-md">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
