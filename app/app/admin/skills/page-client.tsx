"use client"

import Link from 'next/link'
import { LayersIcon, BookOpenIcon, ChevronRightIcon } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function AdminSkillsClient({
  packs,
  skillsByPackObj,
  totalSkills,
}: {
  packs: any[]
  skillsByPackObj: Record<string, any[]>
  totalSkills: number
}) {
  const totalPacks = packs.length

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Skill Library</h1>
        <p className="mt-1 text-sm text-neutral-500">
          {totalSkills} skill dalam {totalPacks} paket · playbook standar untuk setiap client
        </p>
      </motion.div>

      {totalPacks === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="border border-dashed border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl rounded-3xl shadow-sm"
        >
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-neutral-500">
            <LayersIcon className="size-10 text-neutral-300 dark:text-neutral-700" />
            <p className="text-center font-medium">Belum ada paket skill.</p>
            <p className="text-xs">Buat paket pertama lewat database atau CLI.</p>
          </div>
        </motion.div>
      ) : (
        <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {packs.map((p, index) => {
              const list = skillsByPackObj[p.id] || []
              return (
                <motion.div
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30, delay: index * 0.05 }}
                >
                  <Link href={`/admin/skills/${p.id}`} className="block group h-full">
                    <div className="h-full flex flex-col bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 rounded-3xl p-5 sm:p-6 transition-all duration-300 hover:shadow-lg hover:border-neutral-300 dark:hover:border-neutral-700 hover:-translate-y-0.5">
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                          <LayersIcon className="size-6" />
                        </div>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-100 dark:bg-neutral-800/50 text-xs font-medium text-neutral-600 dark:text-neutral-300 border border-neutral-200/50 dark:border-neutral-700/50 shadow-sm">
                          <BookOpenIcon className="size-3.5" />
                          {list.length} skill
                        </div>
                      </div>
                      <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50 group-hover:text-primary transition-colors">{p.name}</h2>
                      <p className="mt-2 line-clamp-2 text-sm text-neutral-500 flex-1">{p.description}</p>
                      
                      <div className="mt-6 flex items-center gap-2 text-sm font-medium text-primary">
                        <span>Lihat detail</span>
                        <ChevronRightIcon className="size-4 ml-auto group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
