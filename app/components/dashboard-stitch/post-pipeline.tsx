"use client"

import React, { useState } from "react"
import { Icons } from "@/components/icons"
import { useActiveDashboard } from "./dashboard-data"
import { useAppStore } from "@/lib/store/app-store"
import { SchedulePostModal } from "./schedule-post-modal"
import { useRouter } from "next/navigation"

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-[hsl(var(--admin-cobalt))]/15 text-[hsl(var(--admin-cobalt))] border border-[hsl(var(--admin-cobalt))]/20 uppercase",
  review: "bg-amber-100 text-amber-700 border border-amber-200 uppercase",
  draft: "bg-[hsl(var(--admin-surface-high))] text-[hsl(var(--admin-outline))] border border-[hsl(var(--admin-outline-variant))]/40 uppercase",
  approved: "bg-[hsl(var(--brand-accent))]/30 text-[hsl(var(--brand-accent-foreground))] border border-[hsl(var(--brand-accent))]/30 uppercase",
  published: "bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase",
  failed: "bg-rose-100 text-rose-700 border border-rose-200 uppercase",
}

function getPlatformIcon(platform: string) {
  const key = platform.toLowerCase().includes("instagram")
    ? "photo_camera"
    : platform.toLowerCase().includes("tiktok")
    ? "music_note"
    : platform.toLowerCase().includes("youtube")
    ? "smart_display"
    : "work"
  const Cmp = Icons[key as keyof typeof Icons]
  return Cmp ? <Cmp className="size-4" /> : null
}

export function DashboardStitchPostPipeline() {
  const { client } = useActiveDashboard()
  // Zustand v5: select the raw array (stable ref) and filter during render.
  // Filtering inside the selector returns a new array each time -> update loop.
  const allPosts = useAppStore((s) => s.posts)
  const posts = allPosts.filter((p) => p.clientId === client.id)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const router = useRouter()

  return (
    <div className="p-6 rounded-2xl bg-[hsl(var(--admin-glass-bg-strong))] backdrop-blur-xl border border-white/80 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <span className="text-xs font-bold text-[hsl(var(--admin-outline))] tracking-wider block">
            POST PIPELINE
          </span>
          <h2 className="font-syne font-bold text-lg text-[hsl(var(--admin-on-surface))]">
            Content Queue &amp; Upcoming Dispatch
          </h2>
          <p className="text-xs text-[hsl(var(--admin-outline))] mt-0.5">
            Showing scheduled campaigns for {client.name}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setScheduleOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] text-xs font-bold hover:bg-[hsl(var(--brand-accent))]/80 transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <Icons.add className="size-4" />
            Add Post
          </button>
          <button 
            onClick={() => router.push(`/admin/calendar?clientId=${client.id}`)}
            className="text-xs text-[hsl(var(--admin-cobalt))] font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            View Calendar
            <Icons.arrow_forward className="size-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-[hsl(var(--admin-outline-variant))]/50 rounded-2xl">
            <p className="text-sm text-[hsl(var(--admin-outline))]">No posts scheduled for this client.</p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="group flex items-center gap-4 p-3.5 rounded-2xl bg-white/60 border border-white/70 hover:bg-white hover:shadow-md transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-[hsl(var(--admin-surface-base))] flex items-center justify-center text-[hsl(var(--admin-cobalt))] shrink-0">
                {getPlatformIcon(post.channel)}
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-[hsl(var(--admin-on-surface))] truncate">
                  {post.title}
                </span>
                <span className="block text-xs text-[hsl(var(--admin-outline))] truncate">
                  {post.caption}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider ${
                    STATUS_STYLES[post.status] ?? STATUS_STYLES.draft
                  }`}
                >
                  {post.status}
                </span>
                <span className="text-[10px] text-[hsl(var(--admin-outline))] font-medium whitespace-nowrap">
                  {post.scheduledAt}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <SchedulePostModal
        open={scheduleOpen}
        client={client}
        onClose={() => setScheduleOpen(false)}
      />
    </div>
  )
}
