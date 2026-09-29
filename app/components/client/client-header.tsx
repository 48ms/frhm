"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Icons } from '@/components/icons'
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ThemeSelector } from "@/components/theme-selector"
import { NotificationCenter } from "@/components/notification-center"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { createClient } from "@/lib/supabase/client"

interface ClientHeaderProps {
  brandName: string
  userName: string
  userEmail: string
  pendingCount?: number
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase() || "C"
}

export function ClientHeader({
  brandName,
  userName,
  userEmail,
  pendingCount = 0,
}: ClientHeaderProps) {
  const router = useRouter()
  const [open, setOpen] = React.useState(false)
  const initials = getInitials(userName || userEmail)

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <header className="bg-background/80 sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b px-4 backdrop-blur-md md:px-6">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1 size-8" />
        <Separator orientation="vertical" className="mr-2 h-4 opacity-50" />
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm tracking-tight text-foreground">{brandName}</span>
          <Badge variant="outline" className="hidden sm:inline-flex text-[10px] font-normal py-0 px-1.5 h-4.5 text-muted-foreground border-border/60">
            Portal Klien
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {pendingCount > 0 && (
          <Link href="/client/approvals">
            <Button
              variant="outline"
              size="sm"
              className="h-8 border-warning/40 bg-warning/10 text-warning-foreground hover:bg-warning/20 font-medium text-xs gap-1.5 px-2.5"
            >
              <Icons.circleCheck className="size-3.5 text-warning" />
              <span>{pendingCount} Menunggu</span>
            </Button>
          </Link>
        )}

        <NotificationCenter role="client" initialCount={pendingCount} />
        <ThemeSelector />

        <DropdownMenu open={open} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            render={
              <button
                className="overflow-hidden rounded-full bg-primary/10 border border-primary/20 focus:outline-none focus:ring-2 focus:ring-ring"
                aria-label="Menu akun"
              >
                <div className="flex h-8 w-8 items-center justify-center">
                  <span className="text-xs font-semibold text-primary">{initials}</span>
                </div>
              </button>
            }
          />
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName || "Klien"}</p>
                <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/client/settings")}>
              <Icons.settings className="mr-2 h-4 w-4" /> Pengaturan Akun
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive">
              <Icons.logout className="mr-2 h-4 w-4" /> Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
