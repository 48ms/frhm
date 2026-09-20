"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { PlusIcon, CalendarDays } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { CalendarView, type ScheduledPost } from '@/components/calendar/calendar-view'
import { PostDialog } from '@/components/calendar/post-dialog'

export type ClientOption = { id: string; name: string }

export function AdminCalendarClient({
  clients,
  initialPosts,
}: {
  clients: ClientOption[]
  initialPosts: ScheduledPost[]
}) {
  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id ?? '')
  const [posts, setPosts] = useState<ScheduledPost[]>(initialPosts)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [initialDate, setInitialDate] = useState<Date | undefined>()
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null)
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar')

  const loadPosts = async (clientId: string) => {
    if (!clientId) return
    const res = await fetch(`/api/admin/scheduled-posts?client_id=${clientId}`)
    const json = await res.json()
    setPosts(json.posts ?? [])
  }

  const handleClientChange = (value: string | null) => {
    if (!value) return
    setSelectedClientId(value)
    loadPosts(value)
  }

  const handleAddPost = (date: Date) => {
    setInitialDate(date)
    setEditingPost(null)
    setDialogOpen(true)
  }

  const handleSelectPost = (post: ScheduledPost) => {
    setEditingPost(post)
    setInitialDate(undefined)
    setDialogOpen(true)
  }

  const handleSave = async () => {
    await loadPosts(selectedClientId)
  }

  const handleUpdatePost = async (postId: string, data: Partial<ScheduledPost>) => {
    // Optimistic update
    setPosts((prev) => prev.map(p => p.id === postId ? { ...p, ...data } : p))
    
    try {
      const res = await fetch(`/api/admin/scheduled-posts`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: postId, ...data })
      })
      if (!res.ok) {
        // Revert on failure
        loadPosts(selectedClientId)
      }
    } catch {
      loadPosts(selectedClientId)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-8 max-w-7xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <CalendarDays className="w-8 h-8 text-neutral-400 dark:text-neutral-500" />
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">Kalender Konten</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Kelola jadwal postingan untuk tiap client
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative z-10 w-48">
            <Select
              value={selectedClientId}
              onValueChange={handleClientChange}
            >
              <SelectTrigger className="rounded-xl h-11 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border-neutral-200/50 dark:border-neutral-800/50 shadow-sm transition-all focus:ring-2 focus:ring-neutral-900/5 dark:focus:ring-white/5">
                <SelectValue placeholder="Pilih Client" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-neutral-200/50 dark:border-neutral-800/50 shadow-lg backdrop-blur-xl bg-white/90 dark:bg-neutral-900/90">
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="rounded-lg hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 focus:bg-neutral-100/50 dark:focus:bg-neutral-800/50 cursor-pointer">
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <button
            onClick={() => {
              setInitialDate(undefined)
              setEditingPost(null)
              setDialogOpen(true)
            }}
            className="inline-flex items-center gap-2 bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 px-4 py-2 h-11 rounded-xl text-sm font-medium hover:scale-105 active:scale-95 transition-all shadow-sm"
          >
            <PlusIcon className="size-4" />
            Tambah Jadwal
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
      >
        <div className="inline-flex flex-wrap rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm p-1" role="group" aria-label="Status filter">
          {['all', 'scheduled', 'published', 'draft', 'failed'].map((key) => {
            const count = posts.filter((p) => key === 'all' ? true : p.status === key).length;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  // filterStatus is a placeholder until the parent wires state here
                }}
                className={`min-h-11 rounded-lg px-4 py-2 text-sm font-medium transition-colors lg:min-h-9 lg:px-3 lg:py-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100`}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)} <span className="ml-1 opacity-60 tabular-nums">({count})</span>
              </button>
            )
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.2 }}
        className="bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 rounded-3xl p-6 shadow-sm overflow-hidden"
      >
        <CalendarView
          posts={posts}
          role="admin"
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onSelectPost={handleSelectPost}
          onAddPost={handleAddPost}
          onUpdatePost={handleUpdatePost}
        />
      </motion.div>

      <PostDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditingPost(null)
          setInitialDate(undefined)
        }}
        initialDate={initialDate}
        editingPost={editingPost}
        clientId={selectedClientId}
        onSave={handleSave}
        onDelete={handleSave}
      />
    </div>
  )
}
