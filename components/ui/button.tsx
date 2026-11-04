import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { Slot } from "radix-ui"

// Brand variants (BRIEF §15). Channel buttons use ink text: white on #25D366 / #2AABEE fails contrast.
// Marketing sizes are ≥ 44px tall (--nasim-tap-min); `sm`/`xs` are for dense admin UI only.
const primary = "bg-primary text-primary-foreground hover:bg-primary-hover"

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-body font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:ring-3 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        // `default` stays as an alias so registry components that pass variant="default" keep working
        default: primary,
        primary,
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-[color-mix(in_oklch,var(--secondary),var(--foreground)_6%)] aria-expanded:bg-secondary",
        outline:
          "border-primary/25 bg-background text-primary hover:bg-accent aria-expanded:bg-accent",
        ghost: "hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        whatsapp: "bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp-hover",
        telegram: "bg-telegram text-telegram-foreground hover:bg-telegram-hover",
        destructive:
          "bg-danger-soft text-danger-ink hover:bg-[color-mix(in_oklch,var(--color-danger-soft),var(--color-danger-ink)_10%)] focus-visible:ring-danger-ink",
        link: "text-primary underline underline-offset-4 hover:no-underline",
      },
      size: {
        default:
          "h-tap gap-2 px-5 has-data-[icon=inline-end]:pe-4 has-data-[icon=inline-start]:ps-4",
        lg: "h-12 gap-2 px-6 text-lead has-data-[icon=inline-end]:pe-5 has-data-[icon=inline-start]:ps-5",
        sm: "h-9 gap-1.5 px-3 text-small has-data-[icon=inline-end]:pe-2.5 has-data-[icon=inline-start]:ps-2.5 [&_svg:not([class*='size-'])]:size-4",
        xs: "h-6 gap-1 rounded-[min(var(--radius-md),10px)] px-2 text-xs has-data-[icon=inline-end]:pe-1.5 has-data-[icon=inline-start]:ps-1.5 [&_svg:not([class*='size-'])]:size-3",
        icon: "size-tap",
        "icon-lg": "size-12",
        "icon-sm": "size-9 [&_svg:not([class*='size-'])]:size-4",
        "icon-xs":
          "size-6 rounded-[min(var(--radius-md),10px)] [&_svg:not([class*='size-'])]:size-3",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "primary",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
