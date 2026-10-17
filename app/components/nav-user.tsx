"use client"

import { useRouter } from "next/navigation"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/animate-ui/components/radix/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Icons } from "@/components/icons"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export interface NavUserProps {
  user: {
    name: string
    email: string
    avatar?: string
    role?: string
  }
}

export function NavUser({ user }: NavUserProps) {
  const { isMobile, state, open } = useSidebar()
  const router = useRouter()
  const isCollapsed = !isMobile && (state === "collapsed" || !open)

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {
      // signOut failure fallback
    }
    window.location.href = "/auth/signout"
  }

  const initials =
    user.name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U"

  const roleLabel =
    user.role === "admin"
      ? "Agency Administrator"
      : user.role === "client"
        ? "Client Partner"
        : user.role
          ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
          : "Platform User"

  const settingsHref = user.role === "client" ? "/client/dashboard" : "/admin/settings"
  const settingsTitle = user.role === "client" ? "Workspace Brand" : "Pengaturan Workspace"
  const supportHref = user.role === "client" ? "/client/support" : "/admin/support"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              type="button"
              aria-label={`Menu Akun: ${user.name}`}
              className={cn(
                "w-full transition-all duration-200 border border-border/60 shadow-sm cursor-pointer whitespace-normal font-normal text-left group",
                isCollapsed
                  ? "size-10 p-0 rounded-full justify-center bg-card/80 hover:bg-card/90 mx-auto"
                  : "mt-3 p-2.5 h-auto bg-card/80 rounded-2xl flex items-center gap-2.5 hover:bg-card/90 active:scale-[0.98] justify-start"
              )}
            >
              <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs ring-2 ring-primary/20 shrink-0">
                {initials}
              </div>
              {!isCollapsed && (
                <>
                  <div className="grid min-w-0 flex-1 text-left">
                    <p className="font-label-lg text-label-lg text-foreground leading-tight truncate">
                      {user.name}
                    </p>
                    <p className="font-body-sm text-body-sm text-muted-foreground truncate">
                      {roleLabel}
                    </p>
                  </div>
                  <Icons.chevronsUpDown className="ml-auto size-4 text-muted-foreground transition-transform group-hover:text-foreground shrink-0" />
                </>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-64 p-2 rounded-2xl border border-border/60 bg-popover/95 backdrop-blur-md shadow-xl"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-2 font-normal">
              <div className="flex items-center gap-3">
                <div className="size-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs ring-2 ring-primary/20 shrink-0">
                  {initials}
                </div>
                <div className="grid min-w-0 flex-1 text-left leading-tight">
                  <span className="font-semibold text-foreground text-sm truncate">{user.name}</span>
                  <span className="text-xs text-muted-foreground truncate">{user.email}</span>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary border border-primary/20">
                      <Icons.shieldCheck className="size-3" />
                      {roleLabel}
                    </span>
                  </div>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1 border-t border-border/40" />
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={() => router.push(settingsHref)}
                className="cursor-pointer gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-colors hover:bg-muted"
              >
                <Icons.settings className="size-4 text-muted-foreground" />
                <span>{settingsTitle}</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => router.push(supportHref)}
                className="cursor-pointer gap-2.5 px-2.5 py-2 rounded-xl text-sm transition-colors hover:bg-muted"
              >
                <Icons.help className="size-4 text-muted-foreground" />
                <span>Bantuan & Dukungan</span>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="my-1 border-t border-border/40" />
            <DropdownMenuItem
              onClick={handleLogout}
              variant="destructive"
              className="cursor-pointer gap-2.5 px-2.5 py-2 rounded-xl text-sm text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:text-destructive transition-colors"
            >
              <Icons.logout className="size-4 text-destructive" />
              <span>Keluar (Sign Out)</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
