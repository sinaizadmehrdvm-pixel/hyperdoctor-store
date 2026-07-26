import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        primary: "bg-primary/10 text-primary",
        accent: "bg-accent/10 text-accent",
        muted: "bg-muted-bg text-muted",
        onNavy: "bg-white/10 text-navy-foreground border border-white/15",
        success: "bg-emerald-100 text-emerald-700",
      },
    },
    defaultVariants: { variant: "muted" },
  }
);

type BadgeProps = ComponentProps<"span"> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
