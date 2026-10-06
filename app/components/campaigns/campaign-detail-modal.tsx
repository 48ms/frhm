"use client"

import React, { useState } from "react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { CAMPAIGN_TYPE_META } from "./campaign-data"
import type { Campaign } from "@/features/campaigns/api/types"
import type { ClientWithChannels } from "@/features/social-accounts/api/types"

/**
 * Status kampanye dihitung dari tanggal faktual (start/end), bukan angka rekaan.
 */
function getStatus(c: Campaign): "active" | "completed" | "upcoming" {
  const now = new Date()
  if (c.end_date) {
    const end = new Date(c.end_date + "T23:59:59")
    if (end < now) return "completed"
  }
  if (c.start_date) {
    const start = new Date(c.start_date + "T00:00:00")
    if (start > now) return "upcoming"
  }
  return "active"
}

/**
 * Durasi hari dihitung dari tanggal faktual; null bila tanggal tidak lengkap.
 */
function getDurationDays(c: Campaign): number | null {
  if (!c.start_date || !c.end_date) return null
  const start = new Date(c.start_date + "T00:00:00")
  const end = new Date(c.end_date + "T00:00:00")
  const days = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
  return days > 0 ? days : null
}

const STATUS_LABEL: Record<"active" | "completed" | "upcoming", string> = {
  active: "Aktif",
  completed: "Selesai",
  upcoming: "Akan datang",
}

export function CampaignDetailModal({
  campaign,
  client,
  open,
  onClose,
  onEdit,
}: {
  campaign: Campaign | null
  client: ClientWithChannels | undefined
  open: boolean
  onClose: () => void
  onEdit: (c: Campaign) => void
}) {
  const [tab, setTab] = useState<"overview" | "performance">("overview")
  if (!open || !campaign || !client) return null

  const meta = CAMPAIGN_TYPE_META[campaign.type]
  const status = getStatus(campaign)
  const durationDays = getDurationDays(campaign)

  // Fakta yang benar-benar ada pada record kampanye (tanpa metrik rekaan).
  const facts = [
    { label: "Status", value: STATUS_LABEL[status] },
    { label: "Durasi", value: durationDays ? `${durationDays} hari` : "Belum dijadwalkan" },
    { label: "Mulai", value: campaign.start_date ?? "Belum ditetapkan" },
    { label: "Selesai", value: campaign.end_date ?? "Belum ditetapkan" },
  ]

  return (
    <div className="fixed inset-0 z-50 p-4 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-md animate-in fade-in duration-300"
        onClick={onClose}
      />
      <div className="relative w-full max-w-xl bg-card/95 backdrop-blur-2xl rounded-2xl border border-border/40 p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-border/40 pb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
              style={{ backgroundColor: campaign.color ?? "#3b82f6" }}
            >
              <Icons.campaign className="size-5 text-white" />
            </div>
            <div className="min-w-0">
              <h3 className="font-syne font-bold text-foreground text-sm truncate">
                {campaign.name}
              </h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-muted-foreground">
                  {client.name}
                </span>
                <span className={cn("admin-badge ml-1", meta.badge)}>{meta.label}</span>
              </div>
            </div>
          </div>
          <button
            className="p-1 rounded-full hover:bg-muted text-muted-foreground transition-all cursor-pointer shrink-0"
            onClick={onClose}
          >
            <Icons.close className="size-[18px]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="inline-flex p-1 rounded-full bg-muted/70 border border-border/40">
          {(["overview", "performance"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer capitalize",
                tab === t
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "overview" ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {facts.map((s) => (
                <div
                  key={s.label}
                  className="p-3 rounded-xl bg-muted/60 border border-border/40 text-center"
                >
                  <span className="admin-stat-value block text-sm text-foreground break-words">
                    {s.value}
                  </span>
                  <span className="block text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-0.5">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-muted/50 border border-border/40">
              <span className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">
                Notes
              </span>
              <p className="text-[11px] text-foreground">
                {campaign.notes || "Belum ada catatan."}
              </p>
            </div>

            <div className="flex items-center justify-between text-[11px] py-2 border-t border-border/20">
              <span className="text-muted-foreground">Campaign window</span>
              <span className="font-semibold text-foreground">
                {campaign.start_date ?? "-"} → {campaign.end_date ?? "-"}
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
            <Icons.activity className="size-6 text-muted-foreground" />
            <p className="text-sm font-semibold text-foreground">
              Belum ada data performa
            </p>
            <p className="text-xs text-muted-foreground max-w-xs">
              Metrik kampanye ini akan tampil setelah postingan terhubung ke
              kampanye dan metriknya tercatat.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/20">
          <button className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-border/40 text-xs font-semibold text-foreground hover:bg-muted transition-all cursor-pointer">
            <Icons.ios_share className="size-3.5" />
            Export
          </button>
          <div className="flex items-center gap-2">
            <button
              className="px-4 py-2 rounded-full text-xs font-semibold text-foreground hover:bg-muted transition-all cursor-pointer"
              onClick={onClose}
            >
              Close
            </button>
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand-accent text-brand-accent-foreground text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
              onClick={() => {
                onClose()
                onEdit(campaign)
              }}
            >
              <Icons.edit className="size-3.5" />
              Edit Campaign
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
