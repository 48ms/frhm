"use client"

import React, { useState } from "react"
import { Icons } from "@/components/icons"
import { useActiveDashboard } from "./dashboard-data"
import { SchedulePostModal } from "./schedule-post-modal"
import { useScheduledPosts } from "@/features/scheduled-posts/api/queries"
import { useRouter } from "next/navigation"

const STATUS_STYLES: Record<string, string> = {
  scheduled: "bg-brand-accent/15 text-brand-accent border border-brand-accent/20",
  draft: "bg-muted/70 text-muted-foreground border border-border/40",
  published: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  failed: "bg-destructive/10 text-destructive dark:text-red-400 border border-destructive/20",
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
  const router = useRouter()

  const recent = posts.slice(0, 8)

  return (
    <div className="p-6 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/40 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <span className="text-xs font-semibold text-muted-foreground block">
            Post pipeline
          </span>
          <h2 className="font-syne font-bold text-lg text-foreground">
            Content Queue &amp; Upcoming Dispatch
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Menampilkan post terjadwal untuk {client.name}
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setScheduleOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-accent text-brand-accent-foreground text-xs font-bold hover:bg-brand-accent/80 transition-all cursor-pointer active:scale-95 shadow-sm"
          >
            <Icons.add className="size-4" />
            Tambah post
          </button>
          <button
            onClick={() => router.push(`/admin/calendar?clientId=${client.id}`)}
            className="text-xs text-brand-accent font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            Lihat kalender
            <Icons.arrow_forward className="size-4" />
          </button>
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
              className="group flex items-center gap-4 p-3.5 rounded-2xl bg-muted/40 border border-border/40 hover:bg-card hover:border-border hover:shadow-md transition-all cursor-pointer"
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-brand-accent shrink-0">
                {getPlatformIcon(post.platform ?? "")}
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-foreground truncate">
                  {post.title}
                </span>
                <span className="block text-xs text-muted-foreground truncate">
                  {post.content || "Tanpa caption"}
                </span>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    STATUS_STYLES[post.status] ?? STATUS_STYLES.draft
                  }`}
                >
                  {STATUS_LABEL[post.status] ?? post.status}
                </span>
                <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
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
    </div>
  )
}
