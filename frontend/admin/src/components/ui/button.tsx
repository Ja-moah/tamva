import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "../../lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-xl text-xs font-semibold uppercase tracking-[0.14em] transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017]/60 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-40 cursor-pointer select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-r from-[#D4A017] to-[#FCD116] text-[#120F08] shadow-[0_12px_24px_-6px_rgba(212,160,23,0.4)] hover:shadow-[0_16px_32px_-6px_rgba(212,160,23,0.6)] hover:brightness-105 active:brightness-95",
        emerald:
          "bg-gradient-to-r from-[#006B3F] to-[#00C97A] text-white shadow-[0_12px_24px_-6px_rgba(0,201,122,0.4)] hover:shadow-[0_16px_32px_-6px_rgba(0,201,122,0.6)] hover:brightness-105 active:brightness-95",
        secondary:
          "border border-white/10 bg-white/[0.04] text-white backdrop-blur-md hover:bg-white/[0.08] hover:border-white/20 active:bg-white/[0.03]",
        ghost:
          "text-white/60 hover:text-white hover:bg-white/[0.06] active:bg-white/[0.03]",
        danger:
          "bg-gradient-to-r from-[#CE1126] to-[#F26D6D] text-white shadow-[0_12px_24px_-6px_rgba(242,109,109,0.35)] hover:brightness-105 active:brightness-95",
        outline:
          "border border-[#D4A017]/40 bg-[#D4A017]/5 text-[#D4A017] hover:bg-[#D4A017]/15 hover:border-[#D4A017]/70",
      },
      size: {
        sm: "h-8 px-3 text-[10px]",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-sm tracking-[0.16em]",
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

