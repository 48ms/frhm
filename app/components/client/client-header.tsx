"use client"

import * as React from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { ThemeSelector } from "@/components/theme-selector"
import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Icons } from "@/components/icons"

interface ClientHeaderProps {
  clientName: string
  clientId: string
  userName: string
}

export function ClientHeader({
  clientName,
  clientId,
  userName,
}: ClientHeaderProps) {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 px-4 w-full md:h-14 md:px-6 border-b border-border/40 bg-background/85 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1 h-9 w-9 cursor-pointer" />
        <Separator orientation="vertical" className="h-4 opacity-50 data-[orientation=vertical]:self-center" />
        <div className="flex items-center gap-2">
          <span className="font-bold text-base tracking-tight text-foreground">{clientName}</span>
          <span className="text-2xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
            Partner Portal
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <a
          href={`/client/review?clientId=${clientId}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold rounded-full border border-border/50 hover:bg-muted"
          )}
        >
          <Icons.layers className="size-3.5 text-primary" />
          <span>Review Deliverable</span>
        </a>

        <a
          href={`/client/support?clientId=${clientId}`}
          className={cn(
            buttonVariants({ variant: "default", size: "sm" }),
            "items-center gap-1.5 text-xs font-semibold rounded-full shadow-xs bg-primary text-primary-foreground hover:bg-primary/90"
          )}
        >
          <Icons.message className="size-3.5" />
          <span>Hotline Support</span>
        </a>

        <ThemeSelector />
      </div>
    </header>
  )
}
