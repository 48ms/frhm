"use client"

import { Icons } from "@/components/icons"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { useKBar } from "kbar"
import { NotificationCenter } from "@/components/notification-center"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { AdminCommandSearch } from "@/components/admin-command-search"
import { ThemeSelector } from "@/components/theme-selector"
import { InfobarTrigger } from "@/components/ui/infobar"
import { Button } from "@/components/ui/button"

interface AdminHeaderProps {
  userName: string
  unreadCount?: number
  onSignOut?: () => void
  extraActions?: React.ReactNode
}

export function AdminHeader({
  userName,
  unreadCount = 0,
  onSignOut,
  extraActions,
}: AdminHeaderProps) {
  const router = useRouter()
  const { query } = useKBar()
  const initials = (userName?.charAt(0) || "A").toUpperCase()

  // Quick Export: navigasi ke kalender dengan modal export terbuka (backing nyata
  // = CalendarExportModal yang men-download CSV/TSV dari data scheduled_posts).
  const handleQuickExport = () => {
    router.push("/admin/calendar?export=1")
    toast.info("Buka ekspor kalender", {
      description: "Pilih rentang dan format di halaman Kalender.",
    })
  }

  // Create Campaign: buka modal pembuatan kampanye di halaman Campaigns.
  const handleCreateCampaign = () => {
    router.push("/admin/campaigns?new=1")
  }

  // Apps launcher: buka command palette (kbar) yang sudah terdaftar global.
  const handleOpenApps = () => {
    query.toggle()
  }

  return (
    <header className="admin-header sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-2 px-4 w-full md:h-14 md:px-6 border-b border-border/40">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-1 h-9 w-9" />
        <Separator orientation="vertical" className="h-4 opacity-50 data-[orientation=vertical]:self-center" />
        <div className="hidden items-center gap-2 lg:flex">
          <span className="admin-wordmark text-lg tracking-tight text-foreground">FRHM</span>
          <span className="admin-badge admin-badge-lime">Studio</span>
        </div>
        <div className="hidden md:block">
          <AdminCommandSearch className="w-72" />
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={handleQuickExport}
          className="admin-pill admin-pill-ghost hidden items-center gap-1.5 px-4 py-2 lg:flex h-auto cursor-pointer"
        >
          <Icons.ios_share className="size-4" />
          Quick Export
        </Button>
        <Button
          type="button"
          onClick={handleCreateCampaign}
          className="admin-pill admin-pill-lime flex items-center gap-2 px-5 py-2.5 h-auto cursor-pointer"
        >
          <Icons.add_circle className="size-[18px]" />
          Create Campaign
        </Button>

        <ThemeSelector />
        <InfobarTrigger />
        {extraActions}
        <NotificationCenter role="admin" initialCount={unreadCount} />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Apps"
          onClick={handleOpenApps}
          className="hidden p-2 rounded-full text-foreground transition-all hover:bg-[hsl(var(--admin-surface-high))]/60 active:scale-95 sm:inline-flex cursor-pointer"
        >
          <Icons.apps className="size-[22px]" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onSignOut}
          className="admin-avatar flex size-8 shrink-0 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
          aria-label="Sign out"
        >
          <span className="text-xs font-bold">{initials}</span>
        </Button>
      </div>
    </header>
  )
}
