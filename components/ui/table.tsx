import * as React from "react"
import { cn } from "@/lib/utils"

// Server component (no "use client"). The scroll container is a focusable named region so
// keyboard users can scroll wide price tables (axe: scrollable-region-focusable). Pass either
// `labelledBy` (id of the <TableCaption>) or `label`.
function Table({
  className,
  label,
  labelledBy,
  stickyFirstColumn = false,
  ...props
}: React.ComponentProps<"table"> & {
  label?: string
  labelledBy?: string
  stickyFirstColumn?: boolean
}) {
  return (
    <div
      data-slot="table-container"
      role="region"
      tabIndex={0}
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      className="relative w-full overflow-x-auto rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring"
    >
      <table
        data-slot="table"
        data-sticky-first={stickyFirstColumn || undefined}
        className={cn(
          "w-full caption-bottom text-body",
          stickyFirstColumn &&
            "[&_tr>*:first-child]:sticky [&_tr>*:first-child]:inset-s-0 [&_tr>*:first-child]:z-10 [&_tr>*:first-child]:bg-card",
          className
        )}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("[&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-11 px-3 text-start align-middle text-small font-medium whitespace-nowrap text-muted-foreground [&:has([role=checkbox])]:pe-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-3 py-3 align-middle [&:has([role=checkbox])]:pe-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-3 text-small text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
