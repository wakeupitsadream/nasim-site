"use client"

import * as React from "react"
import { useTranslations } from "next-intl"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react"
import { useDirection } from "@/components/ui/direction"

// No next-themes: there is no dark theme in v1 (CLAUDE.md rule 13). top-center avoids both RTL
// mirroring and the mobile sticky bar. Mount only on pages that show toasts (rule 10).
function Toaster(props: ToasterProps) {
  const dir = useDirection() === "rtl" ? "rtl" : "ltr"
  const t = useTranslations("Common")

  return (
    <Sonner
      theme="light"
      dir={dir}
      position="top-center"
      containerAriaLabel={t("notifications")}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
