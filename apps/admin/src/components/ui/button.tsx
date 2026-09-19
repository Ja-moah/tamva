import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "../../lib/utils/cn";


const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-primary)] focus-visible:ring-offset-1 disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--brand-primary)] text-[var(--brand-on-primary)] hover:bg-[var(--brand-primary-hover)] font-semibold shadow-xs active:scale-[0.99]",
        gold:
          "bg-[var(--accent-gold)] text-black font-semibold hover:brightness-105 active:scale-[0.99] shadow-xs",
        emerald:
          "bg-[#10b981] text-white font-semibold hover:bg-[#059669] active:scale-[0.99] shadow-xs",
        secondary:
          "border border-[var(--border-default)] bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] active:bg-[var(--bg-surface-active)] shadow-xs",
        ghost:
          "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] active:bg-[var(--bg-surface-active)]",
        danger:
          "bg-[#e11d48] text-white font-semibold hover:bg-[#be123c] active:scale-[0.99] shadow-xs",
        destructive:
          "bg-[#e11d48] text-white font-semibold hover:bg-[#be123c] active:scale-[0.99] shadow-xs",
        outline:
          "border border-[var(--border-default)] hover:border-[var(--accent-gold)] bg-transparent text-[var(--text-primary)] hover:text-[var(--accent-gold)]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4 text-sm",
        lg: "h-10 px-5 text-sm",
        icon: "size-9 p-0",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  },
);


export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    loading?: boolean;
  };

export function Button({
  asChild = false,
  className,
  variant,
  size,
  loading = false,
  children,
  disabled,
  ...props
}: ButtonProps) {
  if (asChild) {
    return (
      <Slot
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      >
        {children}
      </Slot>
    );
  }

  return (
    <button
      className={cn(buttonVariants({ variant, size }), className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
      {children}
    </button>
  );
}