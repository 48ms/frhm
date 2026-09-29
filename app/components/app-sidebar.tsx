"use client"

import * as React from "react"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { NavUser } from "@/components/nav-user"
import { PostDialog } from "@/components/calendar/post-dialog"
import { Icons } from "@/components/icons"
import { isActiveFor } from "@/hooks/use-nav"

export type AppUser = {
  name: string
  email: string
  avatar: string
}

export type ClientOption = { id: string; name: string }

const NAV_ITEMS = [
  { title: "Overview", url: "/admin/dashboard", icon: "dashboard" as const },
  { title: "Social Accounts", url: "/admin/social-accounts", icon: "hub" as const },
  { title: "Campaigns", url: "/admin/campaigns", icon: "campaign" as const },
  { title: "Content Calendar", url: "/admin/calendar", icon: "calendar_month" as const },
  { title: "Analytics", url: "/admin/analytics", icon: "monitoring" as const },
]

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase()
}

export function AppSidebar({
  user,
  clients = [],
  ...props
}: React.ComponentProps<"aside"> & {
  user: AppUser
  clients?: ClientOption[]
}) {
  const pathname = usePathname()
  const [clientsOpen, setClientsOpen] = React.useState(false)
  const [activeClientId, setActiveClientId] = React.useState<string | null>(null)
  const [postDialogOpen, setPostDialogOpen] = React.useState(false)

  // Default active client = first client (prototype: activeClientId = client-shell)
  const activeClient = React.useMemo(() => {
    if (clients.length === 0) return null
    return clients.find((c) => c.id === activeClientId) ?? clients[0]
  }, [clients, activeClientId])

  // If URL targets a client, prefer that
  React.useEffect(() => {
    const uuid = pathname.split("/").find((p) => p.length === 36)
    if (uuid && clients.some((c) => c.id === uuid)) setActiveClientId(uuid)
  }, [pathname, clients])

  function renderIcon(icon: keyof typeof Icons) {
    const IconCmp = Icons[icon]
    return IconCmp ? <IconCmp className="size-5" /> : null
  }

  return (
    <>
      <aside
        className="fixed left-0 top-0 h-screen w-64 z-30 backdrop-blur-2xl border-r hidden md:block overflow-y-auto"
        style={{
          background: "rgba(251,248,255,0.85)",
          borderColor: "rgba(197,201,173,0.4)",
        }}
        {...props}
      >
        <div className="flex flex-col justify-between h-full p-4">
          
          <div>
            {/* Brand capsule */}
            <div className="flex items-center gap-3 px-3 py-2.5 mb-5 bg-white/90 backdrop-blur-md rounded-2xl shadow-sm border border-white/80">
              <div className="w-9 h-9 rounded-xl bg-[#4353ff] flex items-center justify-center shadow-inner">
                <Image
                  src="/logo-frhm.png"
                  alt="Frhm Logo"
                  width={22}
                  height={22}
                  className="object-contain"
                  unoptimized
                />
              </div>
              <div className="leading-none overflow-hidden">
                <span className="block font-bold tracking-tight text-base text-[#1a1b22]">FRHM</span>
                <span className="block text-xs text-[#757961] mt-0.5">Campaign Hub</span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="space-y-1" aria-label="Main Navigation">
              {NAV_ITEMS.map((item) => {
                const active = isActiveFor(pathname, item.url)
                return (
                  <a
                    key={item.title}
                    href={item.url}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-full text-sm cursor-pointer transition-all ${
                      active
                        ? "bg-[#d4ff32] text-[#5e7400] font-semibold shadow-sm"
                        : "text-[#757961] font-medium hover:text-[#1a1b22] hover:bg-[#e8e7f1]/60"
                    }`}
                  >
                    <span className="flex items-center justify-center">{renderIcon(item.icon)}</span>
                    <span>{item.title}</span>
                  </a>
                )
              })}

              
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setClientsOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white/80 border border-[#c5c9ad]/40 hover:border-[#4353ff] text-[#1a1b22] transition-all cursor-pointer group shadow-sm"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex items-center justify-center text-[#4353ff]">
                      <Icons.business className="size-5" />
                    </span>
                    <div className="text-left leading-tight">
                      <span className="block text-xs font-bold text-[#1a1b22]">Client</span>
                      <span className="block text-[10px] text-[#757961] truncate max-w-[8rem]">
                        {activeClient?.name ?? "Select Client"}
                      </span>
                    </div>
                  </div>
                  <Icons.chevronDown
                    className={`size-[18px] text-[#757961] transition-transform ${clientsOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown: MANAGED CLIENTS */}
                {clientsOpen && (
                  <div className="mt-1.5 p-2 bg-white/95 backdrop-blur-md rounded-2xl border border-white/80 shadow-md space-y-1">
                    <div className="px-2 py-1 flex items-center justify-between text-[10px] font-bold text-[#757961] border-b border-[#c5c9ad]/30 pb-1 mb-1">
                      <span>MANAGED CLIENTS</span>
                      <span className="text-[#5e7400] font-bold">{clients.length} ACTIVE</span>
                    </div>
                    <div className="space-y-1">
                      {clients.length === 0 && (
                        <p className="px-2 py-1.5 text-xs text-[#757961]">No clients yet</p>
                      )}
                      {clients.map((c) => {
                        const isActive = activeClient?.id === c.id
                        return (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              setActiveClientId(c.id)
                              setClientsOpen(false)
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all text-left ${
                              isActive
                                ? "bg-[#d4ff32] text-[#5e7400] font-bold"
                                : "hover:bg-[#e8e7f1]/60 text-[#1a1b22]"
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <div
                                className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-[10px] shrink-0 ${
                                  isActive
                                    ? "bg-[#1a1b22] text-[#fbf8ff]"
                                    : "bg-[#eeedf7] text-[#1a1b22]"
                                }`}
                              >
                                {initials(c.name)}
                              </div>
                              <span className="text-xs truncate">{c.name}</span>
                            </div>
                            {isActive && (
                              <span className="w-2 h-2 rounded-full bg-[#526600] animate-pulse shrink-0" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* New Post CTA → opens PostDialog for the active client */}
            <div className="mt-5">
              <button
                type="button"
                disabled={!activeClient}
                onClick={() => setPostDialogOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-[#4353ff] text-white font-semibold text-xs tracking-wider shadow-md hover:bg-[#2333e7] active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Icons.add className="size-4" />
                New Post
              </button>
            </div>
          </div>

          
          <div className="pt-3 border-t border-[#c5c9ad]/30 space-y-1">
            <a
              href="/admin/settings"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-[#757961] hover:text-[#1a1b22] hover:bg-[#e8e7f1] text-xs cursor-pointer transition-all"
            >
              <Icons.settings className="size-[18px]" />
              <span>Settings</span>
            </a>
            <a
              href="/admin/audit"
              className="flex items-center gap-3 px-3 py-2 rounded-xl text-[#757961] hover:text-[#1a1b22] hover:bg-[#e8e7f1] text-xs cursor-pointer transition-all"
            >
              <Icons.help className="size-[18px]" />
              <span>Support</span>
            </a>
            <NavUser user={user} />
          </div>
        </div>
      </aside>

      {/* PostDialog wired to the active client (prototype: openPostModal('create')) */}
      {activeClient && (
        <PostDialog
          isOpen={postDialogOpen}
          onClose={() => setPostDialogOpen(false)}
          clientId={activeClient.id}
          onSave={() => setPostDialogOpen(false)}
        />
      )}
    </>
  )
}
