import type { HTMLAttributes } from "react";

import { cn } from "../../lib/utils/cn";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
}

export function Card({
  className,
  interactive = false,
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--border-default)] bg-[var(--bg-surface)] backdrop-blur-md text-[var(--text-primary)] shadow-sm transition-all",
        interactive &&
          "hover:border-[var(--border-strong)] hover:bg-[var(--bg-surface-hover)] hover:shadow-md cursor-pointer",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
