import { useEffect, useId, useRef } from "react";
import type { FormEvent, ReactNode } from "react";

import { Button } from "./button";

/**
 * Confirmation dialog for sensitive actions: names the action, lets the
 * caller collect a reason, and keeps focus inside until dismissed.
 */
export function ActionDialog({
  open,
  title,
  description,
  confirmLabel,
  tone = "primary",
  busy = false,
  error,
  disabled = false,
  onConfirm,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  tone?: "primary" | "danger";
  busy?: boolean;
  error?: string | null;
  disabled?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const openerRef = useRef<Element | null>(null);

  useEffect(() => {
    if (!open) return;
    openerRef.current = document.activeElement;
    const dialog = dialogRef.current;
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? [],
      ).filter((element) => !element.hasAttribute("disabled"));
    (dialog?.querySelector<HTMLElement>("input, select, textarea") ?? focusable()[0])?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (openerRef.current instanceof HTMLElement) openerRef.current.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!busy && !disabled) onConfirm();
  };

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center p-4">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="relative w-full max-w-md rounded-2xl border border-[var(--border-default)] bg-[var(--bg-surface-elevated)] p-5 shadow-xl"
      >
        <form onSubmit={submit} className="space-y-4">
          <div>
            <h2 id={titleId} className="text-base font-extrabold text-[var(--text-primary)]">{title}</h2>
            {description ? (
              <p id={descriptionId} className="mt-1 text-xs text-[var(--text-secondary)]">{description}</p>
            ) : null}
          </div>
          {children}
          {error ? (
            <p role="alert" className="rounded-lg border border-[var(--risk-high-border)] bg-[var(--risk-high-bg)] px-3 py-2 text-xs text-[var(--risk-high-text)]">
              {error}
            </p>
          ) : null}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" variant={tone === "danger" ? "danger" : "primary"} loading={busy} disabled={disabled}>
              {confirmLabel}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export const dialogField =
  "mt-1 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--brand-primary)]";
