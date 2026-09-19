import { X } from "lucide-react";
import React, { useEffect, useId, useRef } from "react";

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
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  // Move focus into the drawer when it opens and hand it back when it closes.
  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement;
    closeRef.current?.focus();
    return () => {
      if (opener instanceof HTMLElement) opener.focus();
    };
  }, [open]);

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
        className="fixed inset-0 bg-black/50 dark:bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          className="w-screen max-w-xl transform transition-transform duration-200 ease-out bg-[var(--bg-surface-elevated)] border-l border-[var(--border-default)] shadow-[var(--shadow-drawer)] flex flex-col"
        >
          <div className="relative flex items-center justify-between border-b border-[var(--border-default)] p-5 bg-[var(--bg-surface)]">
            <div className="min-w-0 pr-4">
              <div className="flex items-center gap-2 mb-1.5">
                {badge}
                <span className="text-xs font-mono font-semibold tracking-wider text-[var(--accent-gold)] uppercase">
                  Details
                </span>
              </div>
              <h2 id={titleId} className="text-lg font-bold text-[var(--text-primary)] tracking-tight truncate">
                {title}
              </h2>
              {subtitle && (
                <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-mono truncate">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              ref={closeRef}
              onClick={onClose}
              className="rounded-md p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] transition-colors cursor-pointer"
              aria-label="Close drawer"
            >
              <X className="size-4.5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">{children}</div>

          {footer && (
            <div className="border-t border-[var(--border-default)] p-4 bg-[var(--bg-surface-subtle)]">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
