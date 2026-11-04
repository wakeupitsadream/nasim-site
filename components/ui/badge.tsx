import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

// Status badges sit on soft backgrounds with dark ink (success/warning colours alone fail 4.5:1).
// `chip` is a tappable filter/tag (≥ 44px) — render it as a link or button via asChild.
const badgeVariants = cva(
  "group/badge inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden rounded-full border border-transparent font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background has-data-[icon=inline-end]:pe-2 has-data-[icon=inline-start]:ps-2 [&>svg]:pointer-events-none [&>svg]:size-3.5",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground [a]:hover:bg-primary-hover",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border-border bg-card text-foreground [a]:hover:bg-muted",
        highlight: "bg-highlight-soft text-primary",
        success: "bg-success-soft text-success-ink",
        warning: "bg-warning-soft text-warning-ink",
        destructive: "bg-destructive/10 text-destructive",
        chip: "bg-surface-2 text-foreground hover:bg-accent aria-[current=page]:bg-primary aria-[current=page]:text-primary-foreground aria-pressed:bg-primary aria-pressed:text-primary-foreground",
      },
      size: {
        default: "h-6 px-2.5 text-small",
        lg: "h-8 px-3 text-body",
      },
    },
    // chip sizing lives here: compound classes come last, so they win over `size`
    compoundVariants: [{ variant: "chip", className: "h-auto min-h-tap px-4 text-body" }],
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
