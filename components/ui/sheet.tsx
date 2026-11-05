"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Dialog as SheetPrimitive } from "radix-ui"

import { Button } from "@/components/ui/button"
import { useDirection } from "@/components/ui/direction"
import { XIcon } from "lucide-react"

function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}

function SheetTrigger({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Trigger>) {
  return <SheetPrimitive.Trigger data-slot="sheet-trigger" {...props} />
}

function SheetClose({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Close>) {
  return <SheetPrimitive.Close data-slot="sheet-close" {...props} />
}

function SheetPortal({
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Portal>) {
  return <SheetPrimitive.Portal data-slot="sheet-portal" {...props} />
}

function SheetOverlay({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Overlay>) {
  return (
    <SheetPrimitive.Overlay
      data-slot="sheet-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-black/10 duration-100 supports-backdrop-filter:backdrop-blur-xs data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
        className
      )}
      {...props}
    />
  )
}

type SheetSide = "top" | "bottom" | "inline-start" | "inline-end"

/** Physical sides are accepted as aliases (shadcn sidebar passes them) and mapped by text direction. */
function toLogicalSide(
  side: SheetSide | "left" | "right",
  dir: "ltr" | "rtl"
): SheetSide {
  if (side === "left") return dir === "rtl" ? "inline-end" : "inline-start"
  if (side === "right") return dir === "rtl" ? "inline-start" : "inline-end"
  return side
}

function SheetContent({
  className,
  children,
  side = "inline-end",
  closeLabel,
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: SheetSide | "left" | "right"
  /** Accessible name of the close button, from messages (no hard-coded UI strings). */
  closeLabel: string
  showCloseButton?: boolean
}) {
  // Portals render under <body>; pass the direction explicitly (CLAUDE.md rule 2).
  const dir = useDirection() === "rtl" ? "rtl" : "ltr"
  const logicalSide = toLogicalSide(side, dir)
  return (
    <SheetPortal>
      <SheetOverlay />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        data-side={logicalSide}
        dir={dir}
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-popover bg-clip-padding text-body text-popover-foreground shadow-lg transition duration-200 ease-in-out data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0",
          "data-[side=bottom]:inset-x-0 data-[side=bottom]:bottom-0 data-[side=bottom]:h-auto data-[side=bottom]:border-t data-[side=bottom]:data-open:slide-in-from-bottom-10 data-[side=bottom]:data-closed:slide-out-to-bottom-10",
          "data-[side=top]:inset-x-0 data-[side=top]:top-0 data-[side=top]:h-auto data-[side=top]:border-b data-[side=top]:data-open:slide-in-from-top-10 data-[side=top]:data-closed:slide-out-to-top-10",
          "data-[side=inline-start]:inset-y-0 data-[side=inline-start]:inset-s-0 data-[side=inline-start]:h-full data-[side=inline-start]:w-3/4 data-[side=inline-start]:border-e data-[side=inline-start]:sm:max-w-sm data-[side=inline-start]:data-open:slide-in-from-start-10 data-[side=inline-start]:data-closed:slide-out-to-start-10",
          "data-[side=inline-end]:inset-y-0 data-[side=inline-end]:inset-e-0 data-[side=inline-end]:h-full data-[side=inline-end]:w-3/4 data-[side=inline-end]:border-s data-[side=inline-end]:sm:max-w-sm data-[side=inline-end]:data-open:slide-in-from-end-10 data-[side=inline-end]:data-closed:slide-out-to-end-10",
          className
        )}
        {...props}
      >
        {children}
        {showCloseButton && (
          <SheetPrimitive.Close data-slot="sheet-close" asChild>
            <Button variant="ghost" size="icon" className="absolute top-2 inset-e-2">
              <XIcon />
              <span className="sr-only">{closeLabel}</span>
            </Button>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPortal>
  )
}

function SheetHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-header"
      className={cn("flex flex-col gap-0.5 p-4", className)}
      {...props}
    />
  )
}

function SheetFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn("mt-auto flex flex-col gap-2 p-4", className)}
      {...props}
    />
  )
}

function SheetTitle({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return (
    <SheetPrimitive.Title
      data-slot="sheet-title"
      className={cn(
        "text-lead font-semibold text-foreground",
        className
      )}
      {...props}
    />
  )
}

function SheetDescription({
  className,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return (
    <SheetPrimitive.Description
      data-slot="sheet-description"
      className={cn("text-small text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Sheet,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
