import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

const buttonVariants = cva(
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border text-sm font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98]",
  {
    variants: {
      size: {
        md: "px-5 py-3",
        lg: "px-6 py-3.5",
      },
      variant: {
        primary:
          "border-brand-500 bg-brand-500 text-white hover:bg-brand-600 hover:border-[rgb(var(--color-brand-600))]",
        secondary:
          "border-white/10 bg-[rgb(var(--color-surface-0)/0.80)] text-surface-950 hover:border-[rgb(var(--color-brand-500)/0.30)] hover:bg-surface-50",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "primary",
    },
  },
);

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({ asChild = false, className, size, variant, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return <Comp className={cn(buttonVariants({ className, size, variant }))} {...props} />;
}
