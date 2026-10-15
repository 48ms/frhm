"use client"

import React, { useState } from "react"
import { Icons } from "@/components/icons"
import { Button } from "@/components/ui/button"
import { useActiveDashboard } from "./dashboard-data"
import { SchedulePostModal } from "./schedule-post-modal"
import { PostDialog } from "@/components/calendar/post-dialog"
import { useScheduledPosts } from "@/features/scheduled-posts/api/queries"
import type { ScheduledPost } from "@/features/scheduled-posts/api/types"
import { useRouter } from "next/navigation"
import { serializeCalendarParams } from "@/lib/searchparams"

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-brand-accent/15 text-brand-accent border border-brand-accent/20",
  draft: "bg-muted/70 text-muted-foreground border border-border/40",
  published: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border border-[hsl(var(--success))]/20",
  failed: "bg-destructive/10 text-destructive border border-destructive/20",
  cancelled: "bg-muted/70 text-muted-foreground border border-border/40",
}

const STATUS_LABEL: Record<string, string> = {
  scheduled: "Terjadwal",
  draft: "Draft",
  published: "Terbit",
  failed: "Gagal",
  cancelled: "Dibatalkan",
}

function getPlatformIcon(platform: string) {
  const norm = (platform || "").toLowerCase()
  if (norm.includes("instagram")) return <Icons.instagram className="size-4" />
  if (norm.includes("tiktok")) return <Icons.tiktok className="size-4" />
  if (norm.includes("youtube")) return <Icons.video className="size-4" />
  if (norm.includes("twitter") || norm === "x") return <Icons.twitter className="size-4" />
  if (norm.includes("linkedin")) return <Icons.linkedin className="size-4" />
  return <Icons.hub className="size-4" />
}

function formatSchedule(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export function DashboardStitchPostPipeline() {
  const { client } = useActiveDashboard()
  // Data NYATA dari tabel scheduled_posts (bukan store lokal).
  const { data: posts = [], isPending } = useScheduledPosts(client.id)
  const [scheduleOpen, setScheduleOpen] = useState(false)
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const router = useRouter()

  const recent = posts.slice(0, 8)

  return (
    <div className="p-6 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/40 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <span className="text-xs font-semibold text-muted-foreground block">
            Post pipeline
          </span>
          <h2 className="font-sans font-bold text-base sm:text-lg text-foreground tracking-tight">
            Content Queue &amp; Upcoming Dispatch
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Menampilkan post terjadwal untuk {client.name}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button
            type="button"
            size="sm"
            onClick={() => setScheduleOpen(true)}
            className="rounded-full bg-brand-accent text-brand-accent-foreground text-xs font-bold gap-1.5 shadow-sm"
          >
            <Icons.add className="size-4" />
            Tambah post
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push(serializeCalendarParams("/admin/calendar", { clientId: client.id }))}
            className="text-xs text-brand-accent font-bold hover:text-brand-accent hover:bg-brand-accent/10 flex items-center gap-1 cursor-pointer h-8 px-2.5 rounded-full"
          >
            Lihat kalender
            <Icons.arrow_forward className="size-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {isPending ? (
          <div className="p-8 text-center border border-dashed border-border/50 rounded-2xl">
            <p className="text-xs text-muted-foreground">Memuat post terjadwal…</p>
          </div>
        ) : recent.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-border/50 rounded-2xl">
            <p className="text-sm font-semibold text-foreground">
              Belum ada post terjadwal untuk klien ini.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Tambahkan post pertama untuk memulai antrean konten.
            </p>
          </div>
        ) : (
          recent.map((post) => (
            <div
              key={post.id}
              role="button"
              tabIndex={0}
              aria-label={`Lihat dan edit postingan: ${post.title}`}
              onClick={() => {
                setEditingPost(post)
                setDialogOpen(true)
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  setEditingPost(post)
                  setDialogOpen(true)
                }
              }}
              className="group flex items-center gap-4 p-3.5 rounded-2xl bg-muted/40 border border-border/40 hover:bg-card hover:border-border hover:shadow-md transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent"
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-brand-accent shrink-0 group-hover:scale-105 transition-transform">
                {getPlatformIcon(post.platform ?? "")}
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-foreground truncate group-hover:text-brand-accent transition-colors">
                  {post.title}
                </span>
                <span className="block text-xs text-muted-foreground truncate">
                  {post.content || "Tanpa caption"}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span
                  className={`px-2 py-0.5 rounded-full text-2xs font-semibold ${
                    STATUS_STYLES[post.status] ?? STATUS_STYLES.draft
                  }`}
                >
                  {STATUS_LABEL[post.status] ?? post.status}
                </span>
                <span className="text-2xs text-muted-foreground font-medium whitespace-nowrap">
                  {formatSchedule(post.scheduled_at)}
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

      <PostDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false)
          setEditingPost(null)
        }}
        editingPost={editingPost}
        clientId={client.id}
        onSave={() => {
          setDialogOpen(false)
          setEditingPost(null)
        }}
      />
    </div>
  )
}
