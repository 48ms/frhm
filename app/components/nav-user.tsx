"use client"

import { useRouter } from "next/navigation"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/animate-ui/components/radix/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Icons } from '@/components/icons'
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"

export function NavUser({
  user,
}: {
  user: {
    name: string
    email: string
    avatar: string
  }
}) {
  const { isMobile } = useSidebar()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
    } catch {
      // signOut gagal (mis. offline) tetap arahkan ke login agar session tidak nyangkut
    }
    router.push("/auth/login")
    router.refresh()
  }

  const initials =
    user.name
      .split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U"

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              type="button"
              className="w-full mt-3 p-2.5 h-auto bg-card/80 rounded-2xl flex items-center gap-2.5 border border-border/60 shadow-sm transition-all hover:bg-card/90 active:scale-[0.98] cursor-pointer whitespace-normal font-normal justify-start text-left"
            >
              <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs ring-2 ring-primary/20 shrink-0">
                {initials}
              </div>
              <div className="grid min-w-0 flex-1 text-left">
                <p className="font-label-lg text-label-lg text-foreground leading-tight truncate">
                  {user.name}
                </p>
                <p className="font-body-sm text-body-sm text-muted-foreground truncate">
                  Creative Director
                </p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <Icons.logout className="mr-2 size-4" />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
