import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";
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
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm w-full">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-2xl p-4 shadow-[0_20px_40px_rgba(0,0,0,0.7)] border backdrop-blur-2xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5",
              t.type === "success" && "bg-[#121814]/95 border-[#00C97A]/30 text-white",
              t.type === "error" && "bg-[#181212]/95 border-[#F26D6D]/30 text-white",
              t.type === "warning" && "bg-[#181510]/95 border-[#D4A017]/30 text-white",
              t.type === "info" && "bg-[#16161B]/95 border-white/10 text-white",
            )}
          >
            {t.type === "success" && <CheckCircle2 className="size-5 text-[#00C97A] shrink-0 mt-0.5" />}
            {t.type === "error" && <AlertCircle className="size-5 text-[#F26D6D] shrink-0 mt-0.5" />}
            {t.type === "warning" && <AlertTriangle className="size-5 text-[#FCD116] shrink-0 mt-0.5" />}
            {t.type === "info" && <Info className="size-5 text-[#D4A017] shrink-0 mt-0.5" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight">{t.title}</p>
              {t.description && (
                <p className="text-xs text-white/70 mt-1 leading-relaxed">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="text-white/40 hover:text-white p-1 rounded-lg transition-colors"
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
