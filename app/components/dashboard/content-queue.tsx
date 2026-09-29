import Link from "next/link"

import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"

export type QueueItem = {
  id: string
  title: string
  type: string
  status: string
  clientName?: string | null
  updatedAt?: string | null
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-lum-surface-high text-lum-outline" },
  sent: {
    label: "Perlu Persetujuan",
    className: "bg-lum-primary-container/40 text-lum-on-primary-container",
  },
  approved: { label: "Disetujui", className: "bg-lum-cobalt/15 text-lum-cobalt" },
  revision_requested: {
    label: "Revisi",
    className: "bg-lum-tertiary-container text-lum-tertiary",
  },
}

const TYPE_ICON: Record<string, keyof typeof Icons> = {
  video: "video",
  reel: "clapperboard",
  image: "media",
  carousel: "galleryVerticalEnd",
  article: "fileText",
  post: "post",
}

function formatDate(iso?: string | null) {
  if (!iso) return "—"
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function DashboardContentQueue({ items }: { items: QueueItem[] }) {
  return (
    <div className="rounded-2xl border border-white/80 bg-lum-surface-lowest/85 p-6 shadow-sm backdrop-blur-xl">
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <span className="block text-xs font-bold tracking-wider text-lum-outline">
            POST PIPELINE
          </span>
          <h2 className="font-display text-lg font-bold text-lum-on-surface">
            Content Queue &amp; Upcoming Dispatch
          </h2>
          <p className="mt-0.5 text-xs text-lum-outline">
            Deliverable terbaru dari seluruh klien
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/deliverables/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-lum-primary-container px-3 py-1.5 text-xs font-bold text-lum-on-primary-container shadow-sm transition-all hover:bg-lum-primary-container/80 active:scale-95"
          >
            <Icons.add className="size-4" />
            Add Post
          </Link>
          <Link
            href="/admin/calendar"
            className="flex items-center gap-1 text-xs font-bold text-lum-cobalt hover:underline"
          >
            View Calendar
            <Icons.arrowRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-lum-outline-variant/40 py-8 text-center text-xs text-lum-outline">
            Belum ada deliverable.
          </p>
        ) : (
          items.map((item) => {
            const meta = STATUS_META[item.status] ?? STATUS_META.draft
            const Icon = Icons[TYPE_ICON[item.type] ?? "post"]
            return (
              <Link
                key={item.id}
                href={`/admin/deliverables/${item.id}`}
                className="flex items-center gap-3.5 rounded-xl border border-white/60 bg-lum-surface-low/50 p-3.5 transition-all hover:border-lum-cobalt/30 hover:bg-lum-surface-lowest"
              >
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-lum-surface-container text-lum-on-surface">
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-lum-on-surface">
                    {item.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-lum-outline">
                    {item.clientName ?? "—"} • {formatDate(item.updatedAt)}
                  </p>
                </div>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
                    meta.className,
                  )}
                >
                  {meta.label}
                </span>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
