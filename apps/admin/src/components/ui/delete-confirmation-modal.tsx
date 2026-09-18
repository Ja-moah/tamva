import { AlertTriangle, Trash2, X } from "lucide-react";
import { Button } from "./button";

interface DeleteConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  itemName?: string;
  itemCount?: number;
  isBulk?: boolean;
}

export function DeleteConfirmationModal({
  open,
  onClose,
  onConfirm,
  title = "Confirm Deletion",
  itemName,
  itemCount = 1,
  isBulk = false,
}: DeleteConfirmationModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-default)] p-6 shadow-2xl space-y-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-500 border border-rose-500/20 shrink-0">
              <AlertTriangle className="size-5.5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{title}</h3>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {isBulk
                  ? `Permanently remove ${itemCount} selected records`
                  : `Permanently remove this record`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)] cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="size-4.5" />
          </button>
        </div>

        <div className="rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] p-4 text-sm text-[var(--text-secondary)] space-y-2">
          <p>
            Are you sure you want to permanently delete{" "}
            {isBulk ? (
              <strong className="text-[var(--text-primary)] font-mono">{itemCount} selected items</strong>
            ) : (
              <strong className="text-[var(--text-primary)] font-mono">&ldquo;{itemName || "this item"}&rdquo;</strong>
            )}
            ?
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            This action is irreversible. An immutable audit trail entry will be recorded in the PostgreSQL compliance log.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onClose}
            className="rounded-xl font-semibold cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold gap-2 cursor-pointer shadow-md"
          >
            <Trash2 className="size-4" />
            <span>Confirm Delete</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
