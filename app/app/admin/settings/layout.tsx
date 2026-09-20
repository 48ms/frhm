"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"

const tabs = [
  { name: "Bridge", href: "/admin/settings/bridge" },
  { name: "Telegram", href: "/admin/settings/telegram" },
  { name: "Manajemen User", href: "/admin/settings/users" },
  { name: "Audit Log", href: "/admin/settings/audit" },
  { name: "Pengaturan AI", href: "/admin/settings/ai" },
]

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-4rem)] max-w-7xl mx-auto w-full p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex-none mb-6"
      >
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Pengaturan Sistem</h1>
        <p className="mt-1 text-sm text-neutral-500">Kelola integrasi, pengguna, dan keamanan platform</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
        className="flex-none mb-8"
      >
        <nav className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md border border-neutral-200/50 dark:border-neutral-800/50 shadow-sm" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href || pathname.startsWith(tab.href + "/")
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`relative px-4 py-2 text-sm font-medium rounded-xl transition-colors ${
                  isActive
                    ? "text-neutral-900 dark:text-white"
                    : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="settings-tab-active"
                    className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-xl shadow-sm border border-neutral-200/50 dark:border-neutral-700/50"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{tab.name}</span>
              </Link>
            )
          })}
        </nav>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
        className="flex-1 overflow-y-auto"
      >
        <div className="max-w-4xl bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 rounded-3xl p-6 sm:p-8 shadow-sm">
          {children}
        </div>
      </motion.div>
    </div>
  )
}
