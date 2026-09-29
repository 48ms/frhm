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
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Icons } from '@/components/icons'
import { createClient } from "@/lib/supabase/client"

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
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
    router.refresh()
  }

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger>
            <button className="w-full mt-3 p-2.5 bg-white/80 dark:bg-zinc-950/80 rounded-2xl flex items-center gap-2.5 border border-white/60 shadow-sm transition-all hover:bg-white/90 active:scale-[0.98]">
              <Avatar className="size-8 rounded-full object-cover ring-2 ring-[#d4ff32]">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-[#d4ff32] text-[10px] font-bold text-[#5e7400]">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid min-w-0 flex-1 text-left">
                <p className="font-label-lg text-label-lg text-[#1a1b22] dark:text-white leading-tight truncate">
                  {user.name}
                </p>
                <p className="font-body-sm text-body-sm text-zinc-500 truncate">
                  Creative Director
                </p>
              </div>
            </button>
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
