"use client"

import React, { useState } from "react"
import { Icons } from "@/components/icons"
import { useActiveDashboard } from "./dashboard-data"
import { useAppStore } from "@/lib/store/app-store"
import { SchedulePostModal } from "./schedule-post-modal"
import { useRouter } from "next/navigation"

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-brand-accent/15 text-brand-accent border border-brand-accent/20 uppercase",
  review: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 uppercase",
  draft: "bg-muted/70 text-muted-foreground border border-border/40 uppercase",
  sent: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 uppercase",
  approved: "bg-brand-accent/30 text-brand-accent-foreground border border-brand-accent/30 uppercase",
  revision_requested: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20 uppercase",
  published: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 uppercase",
  failed: "bg-destructive/10 text-destructive dark:text-red-400 border border-destructive/20 uppercase",
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
    <div className="p-6 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/40 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <span className="text-xs font-bold text-muted-foreground tracking-wider block">
            POST PIPELINE
          </span>
          <h2 className="font-syne font-bold text-lg text-foreground">
            Content Queue &amp; Upcoming Dispatch
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Showing scheduled campaigns for {client.name}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button 
            onClick={() => setScheduleOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-accent text-brand-accent-foreground text-xs font-bold hover:bg-brand-accent/80 transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <Icons.add className="size-4" />
            Add Post
          </button>
          <button 
            onClick={() => router.push(`/admin/calendar?clientId=${client.id}`)}
            className="text-xs text-brand-accent font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            View Calendar
            <Icons.arrow_forward className="size-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {posts.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border/50 rounded-2xl">
            <p className="text-sm text-muted-foreground">No posts scheduled for this client.</p>
          </div>
        ) : (
          posts.map((post) => (
            <div
              key={post.id}
              className="group flex items-center gap-4 p-3.5 rounded-2xl bg-muted/40 border border-border/40 hover:bg-card hover:border-border hover:shadow-md transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-brand-accent shrink-0">
                {getPlatformIcon(post.channel ?? "")}
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-foreground truncate">
                  {post.title}
                </span>
                <span className="block text-xs text-muted-foreground truncate">
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
                <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
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
