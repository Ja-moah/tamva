import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import React, { createContext, useContext, useState, useCallback } from "react";
import { cn } from "../../lib/utils/cn";

export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  type?: ToastType;
}

interface ToastContextType {
  toast: (message: Omit<ToastMessage, "id">) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback(({ title, description, type = "info" }: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, description, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        role="region"
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl p-3.5 shadow-[var(--shadow-lg)] border backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-3",
              t.type === "success" &&
                "bg-[var(--bg-surface-elevated)] border-[var(--risk-low-border)] text-[var(--text-primary)]",
              t.type === "error" &&
                "bg-[var(--bg-surface-elevated)] border-[var(--risk-critical-border)] text-[var(--text-primary)]",
              t.type === "warning" &&
                "bg-[var(--bg-surface-elevated)] border-[var(--risk-med-border)] text-[var(--text-primary)]",
              t.type === "info" &&
                "bg-[var(--bg-surface-elevated)] border-[var(--border-default)] text-[var(--text-primary)]",
            )}
          >
            {t.type === "success" && (
              <CheckCircle2 className="size-4.5 text-[var(--accent-emerald)] shrink-0 mt-0.5" />
            )}
            {t.type === "error" && (
              <AlertCircle className="size-4.5 text-[#ce1126] shrink-0 mt-0.5" />
            )}
            {t.type === "warning" && (
              <AlertCircle className="size-4.5 text-amber-500 shrink-0 mt-0.5" />
            )}
            {t.type === "info" && (
              <Info className="size-4.5 text-[var(--accent-gold)] shrink-0 mt-0.5" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight text-[var(--text-primary)]">{t.title}</p>
              {t.description && (
                <p className="text-xs text-[var(--text-secondary)] mt-1 leading-normal">
                  {t.description}
                </p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1 rounded-md transition-colors"
              aria-label="Close notification"
            >
              <X className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
