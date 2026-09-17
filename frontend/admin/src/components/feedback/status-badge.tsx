import { cn } from "../../lib/utils/cn";

export type StatusTone = "neutral" | "success" | "warning" | "danger" | "info";

type StatusBadgeProps = {
  children: React.ReactNode;
  tone?: StatusTone;
  pulse?: boolean;
  className?: string;
  size?: "sm" | "md";
};

export function StatusBadge({
  children,
  tone = "neutral",
  pulse = false,
  className,
  size = "md",
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-mono font-semibold tracking-wider uppercase whitespace-nowrap select-none",
        size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]",
        tone === "success" &&
          "border-[#00C97A]/30 bg-[#00C97A]/10 text-[#00C97A] shadow-[0_0_12px_rgba(0,201,122,0.15)]",
        tone === "warning" &&
          "border-[#D4A017]/35 bg-[#D4A017]/10 text-[#FCD116] shadow-[0_0_12px_rgba(212,160,23,0.15)]",
        tone === "danger" &&
          "border-[#F26D6D]/35 bg-[#F26D6D]/10 text-[#F26D6D] shadow-[0_0_12px_rgba(242,109,109,0.15)]",
        tone === "info" &&
          "border-[#06B6D4]/35 bg-[#06B6D4]/10 text-[#22D3EE] shadow-[0_0_12px_rgba(6,182,212,0.15)]",
        tone === "neutral" && "border-white/10 bg-white/[0.04] text-white/70",
        className,
      )}
    >
      <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
        {pulse ? (
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping",
              tone === "success" && "bg-[#00C97A]",
              tone === "warning" && "bg-[#D4A017]",
              tone === "danger" && "bg-[#F26D6D]",
              tone === "info" && "bg-[#06B6D4]",
              tone === "neutral" && "bg-white/60",
            )}
          />
        ) : null}
        <span
          className={cn(
            "relative inline-flex h-1.5 w-1.5 rounded-full",
            tone === "success" && "bg-[#00C97A]",
            tone === "warning" && "bg-[#D4A017]",
            tone === "danger" && "bg-[#F26D6D]",
            tone === "info" && "bg-[#06B6D4]",
            tone === "neutral" && "bg-white/60",
          )}
        />
      </span>
      {children}
    </span>
  );
}
