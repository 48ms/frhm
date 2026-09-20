"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard } from "@/components/icon/registry/icons/layout-dashboard"
import { WorkflowIcon, CalendarIcon, FileTextIcon, CheckCircle2Icon } from "lucide-react"

export type NavItem = {
  title: string
  url: string
  icon?: React.ReactNode
  badge?: string
}

const clientNav: NavItem[] = [
  {
    title: "Dashboard",
    url: "/client/dashboard",
    icon: <LayoutDashboard className="size-5" />,
  },
  {
    title: "Progres",
    url: "/client/pipeline",
    icon: <WorkflowIcon className="size-5" />,
  },
  {
    title: "Kalender",
    url: "/client/calendar",
    icon: <CalendarIcon className="size-5" />,
  },
  {
    title: "Deliverable",
    url: "/client/deliverables",
    icon: <FileTextIcon className="size-5" />,
  },
  {
    title: "Approvals",
    url: "/client/approvals",
    icon: <CheckCircle2Icon className="size-5" />,
  },
  {
    title: "Akun",
    url: "/client/settings",
    icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  },
]

export function BottomNav({ pendingCount = 0 }: { pendingCount?: number }) {
  const pathname = usePathname()

  const items = clientNav.map((item) => ({
    ...item,
    isActive: pathname === item.url || pathname.startsWith(item.url + "/"),
    ...(item.url === "/client/deliverables" && pendingCount > 0
      ? { badge: String(pendingCount) }
      : {}),
  }))

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full h-16 bg-white border-t border-gray-200 dark:bg-zinc-900 dark:border-zinc-800 flex md:hidden pb-safe">
      <div className="grid h-full w-full grid-cols-6 font-medium">
        {items.map((item) => (
          <Link
            key={item.title}
            href={item.url}
            className={`inline-flex flex-col items-center justify-center relative transition-colors duration-200 ${
              item.isActive 
                ? "text-primary" 
                : "text-zinc-500 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-semibold mt-1">{item.title}</span>
            {item.badge && (
              <span className="absolute top-1 right-[20%] inline-flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white dark:ring-zinc-900">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </div>
    </nav>
  )
}
