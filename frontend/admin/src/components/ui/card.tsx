import type { HTMLAttributes } from "react";

import { cn } from "../../lib/utils/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  glow?: "gold" | "emerald" | "crimson" | "cyan" | "none";
  interactive?: boolean;
}

export function Card({
  className,
  glow = "none",
  interactive = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "relative rounded-2xl border border-white/[0.08] bg-[#121216]/90 backdrop-blur-xl shadow-[0_16px_40px_-12px_rgba(0,0,0,0.5)] transition-all duration-300",
        interactive &&
          "hover:border-white/20 hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.7)] cursor-pointer",
        glow === "gold" &&
          "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#D4A017]/60 before:to-transparent",
        glow === "emerald" &&
          "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#00C97A]/60 before:to-transparent",
        glow === "crimson" &&
          "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#F26D6D]/60 before:to-transparent",
        glow === "cyan" &&
          "before:absolute before:inset-x-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#00E5FF]/60 before:to-transparent",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
