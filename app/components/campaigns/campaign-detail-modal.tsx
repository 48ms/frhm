"use client"

import React, { useState } from "react"
import { toast } from "sonner"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { CAMPAIGN_TYPE_META } from "./campaign-data"
import type { Campaign } from "@/features/campaigns/api/types"
import type { ClientWithChannels } from "@/features/social-accounts/api/types"
import { campaignTransitionName } from "@/lib/view-transition"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/animate-ui/components/radix/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/animate-ui/components/radix/tabs"
import { Button } from "@/components/ui/button"

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
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-xl bg-card rounded-2xl border border-border/40 p-5 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
        style={
          { viewTransitionName: campaignTransitionName(campaign.id) } as React.CSSProperties
        }
      >
        <DialogHeader className="flex flex-row items-start gap-3 border-b border-border/40 pb-3 space-y-0 text-left">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
            style={{ backgroundColor: campaign.color || "hsl(var(--primary))" }}
          >
            {campaign.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <DialogTitle className="font-syne font-bold text-foreground text-sm truncate">
              {campaign.name}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-1.5 mt-0.5 text-2xs text-muted-foreground">
              <span>{client.name}</span>
              <span>•</span>
              <span className="capitalize">{meta.label}</span>
            </DialogDescription>
          </div>
        </DialogHeader>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(t) => setTab(t as "overview" | "performance")} className="w-full space-y-4">
          <TabsList className="bg-muted/70 p-1 rounded-full border border-border/40" highlightClassName="bg-card text-foreground shadow-sm rounded-full">
            <TabsTrigger value="overview" className="rounded-full px-3.5 py-1 text-xs font-semibold capitalize">
              Overview
            </TabsTrigger>
            <TabsTrigger value="performance" className="rounded-full px-3.5 py-1 text-xs font-semibold capitalize">
              Performance
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {facts.map((s) => (
                <div
                  key={s.label}
                  className="p-3 rounded-xl bg-muted/60 border border-border/40 text-center"
                >
                  <span className="admin-stat-value block text-sm text-foreground break-words">
                    {s.value}
                  </span>
                  <span className="block text-2xs font-bold text-muted-foreground mt-0.5">
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-muted/50 border border-border/40">
              <span className="block text-2xs font-bold text-muted-foreground mb-1">
                Notes
              </span>
              <p className="text-1xs text-foreground">
                {campaign.notes || "Belum ada catatan."}
              </p>
            </div>

            <div className="flex items-center justify-between text-1xs py-2 border-t border-border/20">
              <span className="text-muted-foreground">Campaign window</span>
              <span className="font-semibold text-foreground">
                {campaign.start_date ?? "-"} → {campaign.end_date ?? "-"}
              </span>
            </div>
          </TabsContent>

          <TabsContent value="performance" className="mt-0">
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
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/20">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const row = (label: string, value: string) => `${label}\t${value}`
              const lines = [
                row("Campaign", campaign.name),
                row("Klien", client?.name ?? "—"),
                row("Tipe", meta.label),
                row("Status", STATUS_LABEL[getStatus(campaign)]),
                row("Mulai", campaign.start_date ?? "—"),
                row("Selesai", campaign.end_date ?? "—"),
                row("Durasi", getDurationDays(campaign) ? `${getDurationDays(campaign)} hari` : "—"),
                row("Catatan", campaign.notes ?? "—"),
              ].join("\n")
              const blob = new Blob([lines], { type: "text/tab-separated-values;charset=utf-8" })
              const url = URL.createObjectURL(blob)
              const a = document.createElement("a")
              a.href = url
              a.download = `${campaign.name.replace(/\s+/g, "-").toLowerCase()}.tsv`
              a.click()
              URL.revokeObjectURL(url)
              toast.success("Export campaign selesai.")
            }}
            className="inline-flex items-center gap-1.5 rounded-full border-border/40 text-xs font-semibold text-foreground hover:bg-muted"
          >
            <Icons.download className="size-3.5" />
            Export
          </Button>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full text-xs font-semibold text-foreground hover:bg-muted"
              onClick={onClose}
            >
              Tutup
            </Button>
            <Button
              type="button"
              size="sm"
              className="inline-flex items-center gap-1.5 rounded-full bg-brand-accent text-brand-accent-foreground text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all"
              onClick={() => {
                onClose()
                onEdit(campaign)
              }}
            >
              <Icons.edit className="size-3.5" />
              Edit Campaign
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
