"use client"

import React from "react"
import { Icons } from "@/components/icons"

// Reference: appStore.renderPosts() output — post rows in the queue
const POSTS = [
  {
    id: "p1",
    title: "Spatial Identity Teaser #04",
    caption: "Engineered for B2B Shell",
    channel: "Instagram",
    status: "SCHEDULED",
    scheduleTime: "Today, 18:00 CEST",
  },
  {
    id: "p2",
    title: "Chromatic Blur Reveal",
    caption: "Why top luxury creative directors are replacing corporate blue with electric lime in 2026.",
    channel: "TikTok",
    status: "REVIEW",
    scheduleTime: "Tomorrow, 12:30 CEST",
  },
  {
    id: "p3",
    title: "The 3-Layer Brand Rule",
    caption: "The 3-layer rule for B2B Shell digital branding that algorithmic feeds cannot resist scrolling past.",
    channel: "LinkedIn",
    status: "DRAFT",
    scheduleTime: "Fri, 09:00 CEST",
  },
]

const STATUS_STYLES: Record<string, string> = {
  SCHEDULED: "bg-[hsl(var(--admin-cobalt))]/15 text-[hsl(var(--admin-cobalt))] border border-[hsl(var(--admin-cobalt))]/20",
  REVIEW: "bg-amber-100 text-amber-700 border border-amber-200",
  DRAFT: "bg-[hsl(var(--admin-surface-high))] text-[hsl(var(--admin-outline))] border border-[hsl(var(--admin-outline-variant))]/40",
  APPROVED: "bg-[hsl(var(--brand-accent))]/30 text-[hsl(var(--brand-accent-foreground))] border border-[hsl(var(--brand-accent))]/30",
}

function getPlatformIcon(platform: string) {
  const key = platform.toLowerCase().includes("instagram")
    ? "photo_camera"
    : platform.toLowerCase().includes("tiktok")
    ? "music_note"
    : platform.toLowerCase().includes("youtube")
    ? "smart_display"
    : "work"
  const Cmp = Icons[key]
  return Cmp ? <Cmp className="size-4" /> : null
}

export function DashboardStitchPostPipeline() {
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
            Showing scheduled campaigns for selected client
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] text-xs font-bold hover:bg-[hsl(var(--brand-accent))]/80 transition-all cursor-pointer active:scale-95 shadow-sm">
            <Icons.add className="size-4" />
            Add Post
          </button>
          <button className="text-xs text-[hsl(var(--admin-cobalt))] font-bold hover:underline flex items-center gap-1 cursor-pointer">
            View Calendar
            <Icons.arrow_forward className="size-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {POSTS.map((post) => (
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
                  STATUS_STYLES[post.status] ?? STATUS_STYLES.DRAFT
                }`}
              >
                {post.status}
              </span>
              <span className="text-[10px] text-[hsl(var(--admin-outline))] font-medium whitespace-nowrap">
                {post.scheduleTime}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
