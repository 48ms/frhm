"use client"

import React, { useMemo, useState } from "react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import {
  CAMPAIGNS,
  CAMPAIGN_CLIENTS,
  CAMPAIGN_TYPE_META,
  type Campaign,
  type CampaignClient,
  type CampaignType,
} from "./campaign-data"

/* -------------------------------------------------------------------------- */
/* Create / Edit Campaign modal                                               */
/* -------------------------------------------------------------------------- */
function CampaignModal({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  editing?: Campaign | null
}) {
  const [name, setName] = useState(editing?.name ?? "")
  const [type, setType] = useState<CampaignType>(editing?.type ?? "campaign")
  const [clientId, setClientId] = useState(editing?.clientId ?? CAMPAIGN_CLIENTS[0].id)

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 p-4 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[hsl(var(--admin-on-surface))]/40 backdrop-blur-md"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-2xl border border-white/80 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[hsl(var(--admin-outline-variant))]/30 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] flex items-center justify-center">
              <Icons.campaign className="size-[18px]" />
            </div>
            <div>
              <h3 className="font-syne font-bold text-[hsl(var(--admin-on-surface))] text-sm">
                {editing ? "Edit Campaign" : "Create Campaign"}
              </h3>
              <p className="text-[10px] text-[hsl(var(--admin-outline))]">
                {editing ? "Update campaign details" : "Launch a new client campaign"}
              </p>
            </div>
          </div>
          <button
            className="p-1 rounded-full hover:bg-[hsl(var(--admin-surface-high))] text-[hsl(var(--admin-outline))] hover:text-[hsl(var(--admin-on-surface))] transition-all cursor-pointer"
            onClick={onClose}
          >
            <Icons.close className="size-[18px]" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1">
              Campaign Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-[hsl(var(--admin-outline-variant))]/40 bg-[hsl(var(--admin-surface-low))] px-3 py-2 text-xs focus:border-[hsl(var(--admin-cobalt))] outline-none text-[hsl(var(--admin-on-surface))]"
              placeholder="e.g. Summer Drop 2026"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1">
              Client
            </label>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="w-full rounded-xl border border-[hsl(var(--admin-outline-variant))]/40 bg-[hsl(var(--admin-surface-low))] px-3 py-2 text-xs focus:border-[hsl(var(--admin-cobalt))] outline-none text-[hsl(var(--admin-on-surface))]"
            >
              {CAMPAIGN_CLIENTS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1.5">
              Campaign Type
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(CAMPAIGN_TYPE_META) as CampaignType[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={cn(
                    "py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                    type === t
                      ? "bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] border-transparent"
                      : "border-[hsl(var(--admin-outline-variant))]/40 text-[hsl(var(--admin-on-surface))] hover:bg-[hsl(var(--admin-surface-low))]"
                  )}
                >
                  {CAMPAIGN_TYPE_META[t].label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1">
                Start Date
              </label>
              <input
                type="date"
                defaultValue={editing?.startDate}
                className="w-full rounded-xl border border-[hsl(var(--admin-outline-variant))]/40 bg-[hsl(var(--admin-surface-low))] px-3 py-2 text-xs focus:border-[hsl(var(--admin-cobalt))] outline-none text-[hsl(var(--admin-on-surface))]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1">
                End Date
              </label>
              <input
                type="date"
                defaultValue={editing?.endDate}
                className="w-full rounded-xl border border-[hsl(var(--admin-outline-variant))]/40 bg-[hsl(var(--admin-surface-low))] px-3 py-2 text-xs focus:border-[hsl(var(--admin-cobalt))] outline-none text-[hsl(var(--admin-on-surface))]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1">
              Notes
            </label>
            <textarea
              defaultValue={editing?.notes}
              rows={2}
              className="w-full rounded-xl border border-[hsl(var(--admin-outline-variant))]/40 bg-[hsl(var(--admin-surface-low))] px-3 py-2 text-xs focus:border-[hsl(var(--admin-cobalt))] outline-none text-[hsl(var(--admin-on-surface))] resize-none"
              placeholder="Campaign objectives, target audience, key messages..."
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            className="px-4 py-2 rounded-full text-xs font-semibold text-[hsl(var(--admin-on-surface))] hover:bg-[hsl(var(--admin-surface-high))] transition-all cursor-pointer"
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer">
            <Icons.check className="size-4" />
            {editing ? "Save Changes" : "Create Campaign"}
          </button>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Campaign card                                                              */
/* -------------------------------------------------------------------------- */
function CampaignCard({
  campaign,
  client,
  onEdit,
}: {
  campaign: Campaign
  client: CampaignClient
  onEdit: (c: Campaign) => void
}) {
  const meta = CAMPAIGN_TYPE_META[campaign.type]
  return (
    <div className="p-5 rounded-2xl bg-[hsl(var(--admin-glass-bg-strong))] backdrop-blur-xl border border-white/80 shadow-sm hover:border-[hsl(var(--brand-accent))]/40 transition-all group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
            style={{ backgroundColor: campaign.color }}
          >
            <Icons.campaign className="size-5 text-white" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[hsl(var(--admin-on-surface))] truncate group-hover:text-[hsl(var(--admin-cobalt))] transition-colors">
              {campaign.name}
            </h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-[hsl(var(--admin-outline))]">{client.initials}</span>
              <span className="text-[10px] text-[hsl(var(--admin-outline))]">·</span>
              <span className="text-[10px] text-[hsl(var(--admin-outline))] truncate">
                {client.shortName}
              </span>
            </div>
          </div>
        </div>
        <span className={cn("admin-badge shrink-0", meta.badge)}>{meta.label}</span>
      </div>

      <p className="text-xs text-[hsl(var(--admin-outline))] mt-3 line-clamp-2 min-h-[2rem]">
        {campaign.notes}
      </p>

      {/* Progress */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[10px] font-bold mb-1.5">
          <span className="text-[hsl(var(--admin-outline))] uppercase tracking-wider">Progress</span>
          <span className="text-[hsl(var(--admin-on-surface))]">{campaign.progress}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-[hsl(var(--admin-surface-high))] overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${campaign.progress}%`, backgroundColor: campaign.color }}
          />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="text-center p-2 rounded-xl bg-[hsl(var(--admin-surface-low))]/60">
          <span className="admin-stat-value block text-base text-[hsl(var(--admin-on-surface))]">
            {campaign.reach}
          </span>
          <span className="block text-[9px] font-bold text-[hsl(var(--admin-outline))] uppercase tracking-wider">
            Reach
          </span>
        </div>
        <div className="text-center p-2 rounded-xl bg-[hsl(var(--admin-surface-low))]/60">
          <span className="admin-stat-value block text-base text-[hsl(var(--admin-on-surface))]">
            {campaign.posts}
          </span>
          <span className="block text-[9px] font-bold text-[hsl(var(--admin-outline))] uppercase tracking-wider">
            Posts
          </span>
        </div>
        <div className="text-center p-2 rounded-xl bg-[hsl(var(--admin-surface-low))]/60">
          <span className="admin-stat-value block text-base text-[hsl(var(--admin-on-surface))]">
            {client.reachGrowth}
          </span>
          <span className="block text-[9px] font-bold text-[hsl(var(--admin-outline))] uppercase tracking-wider">
            Growth
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[hsl(var(--admin-outline-variant))]/20">
        <span className="text-[10px] text-[hsl(var(--admin-outline))]">
          {campaign.startDate} → {campaign.endDate}
        </span>
        <button
          className="inline-flex items-center gap-1 text-[10px] font-bold text-[hsl(var(--admin-cobalt))] hover:underline cursor-pointer"
          onClick={() => onEdit(campaign)}
        >
          <Icons.edit className="size-3" />
          Edit
        </button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Page                                                                       */
/* -------------------------------------------------------------------------- */
export function CampaignsBoard() {
  const [activeClientId, setActiveClientId] = useState<string>("all")
  const [typeFilter, setTypeFilter] = useState<CampaignType | "all">("all")
  const [query, setQuery] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Campaign | null>(null)

  const clientById = useMemo(
    () => Object.fromEntries(CAMPAIGN_CLIENTS.map((c) => [c.id, c])),
    []
  )

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return CAMPAIGNS.filter((c) => {
      if (activeClientId !== "all" && c.clientId !== activeClientId) return false
      if (typeFilter !== "all" && c.type !== typeFilter) return false
      if (q && !c.name.toLowerCase().includes(q) && !c.notes.toLowerCase().includes(q))
        return false
      return true
    })
  }, [activeClientId, typeFilter, query])

  const totalLive = CAMPAIGNS.length
  const totalPosts = CAMPAIGNS.reduce((n, c) => n + c.posts, 0)
  const avgProgress = Math.round(
    CAMPAIGNS.reduce((n, c) => n + c.progress, 0) / CAMPAIGNS.length
  )

  function openCreate() {
    setEditing(null)
    setModalOpen(true)
  }
  function openEdit(c: Campaign) {
    setEditing(c)
    setModalOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="admin-section-label">Campaigns</span>
          <h1 className="admin-headline-xl text-[hsl(var(--admin-on-surface))] mt-1">
            Campaign Hub
          </h1>
          <p className="text-sm text-[hsl(var(--admin-outline))] mt-1">
            {totalLive} live campaigns across {CAMPAIGN_CLIENTS.length} managed clients — plan, track &amp; accelerate every drop.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
          onClick={openCreate}
        >
          <Icons.add className="size-[18px]" />
          Create Campaign
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Live Campaigns", value: String(totalLive) },
          { label: "Managed Clients", value: String(CAMPAIGN_CLIENTS.length) },
          { label: "Scheduled Posts", value: String(totalPosts) },
          { label: "Avg Progress", value: `${avgProgress}%` },
        ].map((s) => (
          <div
            key={s.label}
            className="p-4 rounded-2xl bg-[hsl(var(--admin-glass-bg-strong))] backdrop-blur-xl border border-white/80 shadow-sm"
          >
            <span className="block text-[10px] font-bold tracking-wider uppercase text-[hsl(var(--admin-outline))]">
              {s.label}
            </span>
            <span className="admin-stat-value block text-2xl text-[hsl(var(--admin-on-surface))] mt-1">
              {s.value}
            </span>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Client tabs */}
        <div className="flex flex-wrap gap-1.5 p-1 rounded-full bg-[hsl(var(--admin-surface-low))] border border-[hsl(var(--admin-outline-variant))]/40 w-fit">
          <button
            onClick={() => setActiveClientId("all")}
            className={cn(
              "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
              activeClientId === "all"
                ? "bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] shadow-sm"
                : "text-[hsl(var(--admin-outline))] hover:text-[hsl(var(--admin-on-surface))]"
            )}
          >
            All Clients
          </button>
          {CAMPAIGN_CLIENTS.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveClientId(c.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                activeClientId === c.id
                  ? "bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] shadow-sm"
                  : "text-[hsl(var(--admin-outline))] hover:text-[hsl(var(--admin-on-surface))]"
              )}
            >
              {c.shortName}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex gap-1.5">
          {(["all", "campaign", "promo", "event"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={cn(
                "px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-all cursor-pointer capitalize",
                typeFilter === t
                  ? "bg-[hsl(var(--admin-cobalt))] text-white border-transparent"
                  : "border-[hsl(var(--admin-outline-variant))]/40 text-[hsl(var(--admin-outline))] hover:text-[hsl(var(--admin-on-surface))]"
              )}
            >
              {t === "all" ? "All Types" : t}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Icons.search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--admin-outline))] size-[18px]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-full bg-[hsl(var(--admin-surface-low))] border border-[hsl(var(--admin-outline-variant))]/40 focus:border-[hsl(var(--admin-cobalt))] text-xs text-[hsl(var(--admin-on-surface))] placeholder:text-[hsl(var(--admin-outline))]/70 outline-none"
            placeholder="Search campaigns..."
          />
        </div>
      </div>

      {/* Campaign grid */}
      {filtered.length === 0 ? (
        <div className="p-10 text-center rounded-2xl bg-[hsl(var(--admin-surface-low))]/40 border border-dashed border-[hsl(var(--admin-outline-variant))]/60">
          <Icons.campaign className="size-8 mx-auto text-[hsl(var(--admin-outline))]" />
          <p className="text-sm font-semibold text-[hsl(var(--admin-on-surface))] mt-2">
            No campaigns found
          </p>
          <p className="text-xs text-[hsl(var(--admin-outline))] mt-1">
            Try a different filter or create a new campaign.
          </p>
          <button
            className="mt-3 text-xs text-[hsl(var(--admin-cobalt))] font-bold hover:underline"
            onClick={openCreate}
          >
            + Create Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              client={clientById[c.clientId]}
              onEdit={openEdit}
            />
          ))}
        </div>
      )}

      <CampaignModal
        open={modalOpen}
        editing={editing}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}
