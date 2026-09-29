"use client"

import React, { useMemo, useState } from "react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import {
  SOCIAL_CLIENTS,
  ALL_PLATFORMS,
  type SocialAccount,
  type SocialClient,
} from "./social-data"

function PlatformIcon({ icon, className }: { icon: string; className?: string }) {
  const Cmp = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[icon]
  if (Cmp) return <Cmp className={className} />
  return <Icons.hub className={className} />
}

/* -------------------------------------------------------------------------- */
/* Account row — mirrors the reference `renderAccounts` card verbatim.        */
/* -------------------------------------------------------------------------- */
function AccountRow({ acc }: { acc: SocialAccount }) {
  const isSynced = acc.status === "SYNCED"
  return (
    <div className="flex items-center justify-between p-3 rounded-2xl bg-[hsl(var(--admin-surface-low))]/60 border border-white/80 hover:bg-[hsl(var(--admin-surface-lowest))] transition-all group shadow-sm">
      <div className="flex items-center gap-2.5">
        <div
          className={cn(
            "w-9 h-9 rounded-xl flex items-center justify-center shadow-sm font-bold group-hover:scale-105 transition-transform",
            acc.bg,
            acc.fg
          )}
        >
          <PlatformIcon icon={acc.icon} className="size-[18px]" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-[hsl(var(--admin-on-surface))] leading-tight group-hover:text-[hsl(var(--admin-cobalt))] transition-colors">
            {acc.platform}
          </h3>
          <p className="text-[11px] text-[hsl(var(--admin-outline))]">{acc.handle}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="text-right">
          <span
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold",
              isSynced
                ? "bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))]"
                : "bg-[hsl(var(--admin-surface-high))] text-[hsl(var(--admin-outline))]"
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                isSynced ? "bg-[#526600] animate-pulse" : "bg-[hsl(var(--admin-outline))]"
              )}
            />
            {acc.status}
          </span>
          <p className="text-[11px] font-semibold text-[hsl(var(--admin-on-surface))] mt-0.5">
            {acc.fans}
          </p>
        </div>
        <button
          className="p-1 rounded-full text-[hsl(var(--admin-outline))] hover:text-[hsl(var(--admin-on-surface))] hover:bg-[hsl(var(--admin-surface-high))] transition-all cursor-pointer"
          title="Disconnect channel"
        >
          <Icons.close className="size-4" />
        </button>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Connect Channel modal — reference `Connect Channel to Client` dialog.      */
/* -------------------------------------------------------------------------- */
function ConnectChannelModal({
  open,
  client,
  onClose,
}: {
  open: boolean
  client: SocialClient
  onClose: () => void
}) {
  const [platform, setPlatform] = useState(ALL_PLATFORMS[0])
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
            <div className="w-8 h-8 rounded-full bg-[hsl(var(--admin-cobalt))]/15 text-[hsl(var(--admin-cobalt))] flex items-center justify-center">
              <Icons.hub className="size-[18px]" />
            </div>
            <div>
              <h3 className="font-syne font-bold text-[hsl(var(--admin-on-surface))] text-sm">
                Connect Channel to Client
              </h3>
              <p className="text-[10px] text-[hsl(var(--admin-outline))]">
                Target client: {client.name}
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
              Target Client Account
            </label>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[hsl(var(--admin-outline-variant))]/40 bg-[hsl(var(--admin-surface-low))]">
              <div className="w-6 h-6 rounded-lg bg-[hsl(var(--admin-cobalt))] text-white flex items-center justify-center text-[10px] font-bold">
                {client.initials}
              </div>
              <span className="text-xs text-[hsl(var(--admin-on-surface))]">{client.name}</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1.5">
              Platform Channel
            </label>
            <div className="space-y-1.5">
              {ALL_PLATFORMS.map((p) => (
                <label
                  key={p}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-[hsl(var(--admin-outline-variant))]/30 hover:border-[hsl(var(--admin-cobalt))]/50 hover:bg-[hsl(var(--admin-surface-low))]/50 cursor-pointer transition-all"
                >
                  <input
                    type="radio"
                    name="platform"
                    className="accent-[hsl(var(--admin-cobalt))]"
                    checked={platform === p}
                    onChange={() => setPlatform(p)}
                  />
                  <span className="text-xs text-[hsl(var(--admin-on-surface))]">{p}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1">
                Handle / Channel Name
              </label>
              <input
                className="w-full rounded-xl border border-[hsl(var(--admin-outline-variant))]/40 bg-[hsl(var(--admin-surface-low))] px-3 py-2 text-xs focus:border-[hsl(var(--admin-cobalt))] outline-none text-[hsl(var(--admin-on-surface))]"
                placeholder="@username"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1">
                Audience Size
              </label>
              <input
                className="w-full rounded-xl border border-[hsl(var(--admin-outline-variant))]/40 bg-[hsl(var(--admin-surface-low))] px-3 py-2 text-xs focus:border-[hsl(var(--admin-cobalt))] outline-none text-[hsl(var(--admin-on-surface))]"
                placeholder="e.g. 12,400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-[hsl(var(--admin-surface-low))]/50 border border-[hsl(var(--admin-outline-variant))]/30">
            <Icons.shield className="size-4 text-[hsl(var(--admin-cobalt))]" />
            <div>
              <span className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))]">
                Direct OAuth 2.0 Auth
              </span>
              <span className="block text-[10px] text-[hsl(var(--admin-outline))]">
                Connecting authorizes FRHM to publish posts and fetch real-time engagement telemetry for this client.
              </span>
            </div>
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
            <Icons.link className="size-4" />
            Authorize &amp; Link
          </button>
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/* Page                                                                        */
/* -------------------------------------------------------------------------- */
export function SocialAccountsBoard() {
  const [activeClientId, setActiveClientId] = useState(SOCIAL_CLIENTS[0].id)
  const [query, setQuery] = useState("")
  const [pickerOpen, setPickerOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)

  const activeClient = useMemo(
    () => SOCIAL_CLIENTS.find((c) => c.id === activeClientId) ?? SOCIAL_CLIENTS[0],
    [activeClientId]
  )

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return activeClient.accounts
    return activeClient.accounts.filter(
      (a) =>
        a.platform.toLowerCase().includes(q) || a.handle.toLowerCase().includes(q)
    )
  }, [activeClient, query])

  const totalAccounts = SOCIAL_CLIENTS.reduce((n, c) => n + c.accounts.length, 0)

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="admin-section-label">Social Accounts</span>
          <h1 className="admin-headline-xl text-[hsl(var(--admin-on-surface))] mt-1">
            Connected Channels
          </h1>
          <p className="text-sm text-[hsl(var(--admin-outline))] mt-1">
            {totalAccounts} channels across {SOCIAL_CLIENTS.length} managed clients — publishing &amp; engagement telemetry in one hub.
          </p>
        </div>
        <button
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
          onClick={() => setModalOpen(true)}
        >
          <Icons.add className="size-[18px]" />
          Connect Channel
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Channels", value: String(totalAccounts) },
          { label: "Managed Clients", value: String(SOCIAL_CLIENTS.length) },
          { label: "All Synced", value: "100%" },
          { label: "Aggregate Reach", value: "4.5M" },
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

      {/* Client switcher + search */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        <div className="relative">
          <button
            className="w-full lg:w-80 flex items-center justify-between p-2.5 rounded-2xl bg-[hsl(var(--admin-surface-low))] border border-[hsl(var(--admin-outline-variant))]/40 hover:border-[hsl(var(--admin-cobalt))]/50 transition-all cursor-pointer shadow-sm group"
            onClick={() => setPickerOpen((v) => !v)}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-[hsl(var(--admin-cobalt))] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                {activeClient.initials}
              </div>
              <div className="truncate leading-tight text-left">
                <span className="block text-[10px] font-bold text-[hsl(var(--admin-outline))]">
                  LINKED CLIENT ACCOUNT
                </span>
                <span className="block text-xs font-bold text-[hsl(var(--admin-on-surface))] truncate">
                  {activeClient.name}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0 pl-2">
              <span className="px-2 py-0.5 rounded-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] text-[10px] font-bold">
                SWITCH
              </span>
              <Icons.chevronDown
                className={cn(
                  "size-[18px] text-[hsl(var(--admin-outline))] group-hover:text-[hsl(var(--admin-on-surface))] transition-transform",
                  pickerOpen && "rotate-180"
                )}
              />
            </div>
          </button>

          {pickerOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-full lg:w-80 bg-white/95 backdrop-blur-xl border border-white/80 shadow-2xl rounded-2xl p-2 z-40 space-y-1">
              <div className="text-[10px] font-bold text-[hsl(var(--admin-outline))] px-2 py-1">
                SELECT MANAGED CLIENT:
              </div>
              {SOCIAL_CLIENTS.map((c) => (
                <button
                  key={c.id}
                  className={cn(
                    "w-full flex items-center gap-2.5 p-2 rounded-xl transition-all cursor-pointer text-left",
                    c.id === activeClientId
                      ? "bg-[hsl(var(--brand-accent))]/15 border border-[hsl(var(--brand-accent))]/30"
                      : "hover:bg-[hsl(var(--admin-surface-low))] border border-transparent"
                  )}
                  onClick={() => {
                    setActiveClientId(c.id)
                    setPickerOpen(false)
                  }}
                >
                  <div className="w-7 h-7 rounded-lg bg-[hsl(var(--admin-cobalt))] text-white flex items-center justify-center font-bold text-[10px] shrink-0">
                    {c.initials}
                  </div>
                  <div className="truncate leading-tight">
                    <span className="block text-xs font-bold text-[hsl(var(--admin-on-surface))] truncate">
                      {c.name}
                    </span>
                    <span className="block text-[10px] text-[hsl(var(--admin-outline))]">
                      {c.accounts.length} channels
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative flex-1 max-w-md">
          <Icons.search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[hsl(var(--admin-outline))] size-[18px]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-full bg-[hsl(var(--admin-surface-low))] border border-[hsl(var(--admin-outline-variant))]/40 focus:border-[hsl(var(--admin-cobalt))] text-xs text-[hsl(var(--admin-on-surface))] placeholder:text-[hsl(var(--admin-outline))]/70 outline-none"
            placeholder="Search platforms or handles..."
          />
        </div>
      </div>

      {/* Verification note */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[hsl(var(--admin-surface-low))]/70 border border-[hsl(var(--admin-outline-variant))]/30 text-xs text-[hsl(var(--admin-outline))]">
        <Icons.badgeCheck className="size-4 text-[hsl(var(--admin-cobalt))]" />
        <span className="truncate">
          Channels belong to{" "}
          <b className="text-[hsl(var(--admin-on-surface))]">{activeClient.shortName}</b> — {activeClient.tagline}
        </span>
      </div>

      {/* Account list */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <div className="p-6 rounded-2xl bg-[hsl(var(--admin-glass-bg-strong))] backdrop-blur-xl border border-white/90 shadow-sm">
            <div className="flex items-center justify-between border-b border-[hsl(var(--admin-outline-variant))]/30 pb-4">
              <div>
                <h2 className="font-syne font-bold text-lg text-[hsl(var(--admin-on-surface))]">
                  Connected Hub
                </h2>
                <p className="text-xs text-[hsl(var(--admin-outline))]">
                  {activeClient.accounts.length} accounts connected for {activeClient.shortName}
                </p>
              </div>
              <button
                className="w-8 h-8 rounded-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] flex items-center justify-center hover:scale-105 active:scale-90 transition-transform shadow-sm cursor-pointer"
                onClick={() => setModalOpen(true)}
                title="Connect New Account for Active Client"
              >
                <Icons.add className="size-5" />
              </button>
            </div>

            <div className="space-y-2.5 mt-4">
              {filtered.length === 0 ? (
                <div className="p-5 text-center rounded-2xl bg-[hsl(var(--admin-surface-low))]/40 border border-dashed border-[hsl(var(--admin-outline-variant))]/60">
                  <Icons.hub className="size-6 mx-auto text-[hsl(var(--admin-outline))]" />
                  <p className="text-xs font-semibold text-[hsl(var(--admin-on-surface))] mt-1">
                    No channels found
                  </p>
                  <button
                    className="mt-2 text-xs text-[hsl(var(--admin-cobalt))] font-bold hover:underline"
                    onClick={() => setModalOpen(true)}
                  >
                    + Link channel
                  </button>
                </div>
              ) : (
                filtered.map((acc) => <AccountRow key={acc.id} acc={acc} />)
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[hsl(var(--admin-outline-variant))]/20">
              <button
                className="w-full py-2.5 px-4 rounded-full border border-dashed border-[hsl(var(--admin-cobalt))]/50 hover:border-[hsl(var(--admin-cobalt))] hover:bg-[hsl(var(--admin-cobalt))]/5 text-[hsl(var(--admin-cobalt))] font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
                onClick={() => setModalOpen(true)}
              >
                <Icons.add className="size-4" />
                Connect Channel to Client
              </button>
            </div>
          </div>
        </div>

        {/* Right: all clients overview */}
        <div className="lg:col-span-4 space-y-4">
          {SOCIAL_CLIENTS.map((c) => (
            <div
              key={c.id}
              className={cn(
                "p-5 rounded-2xl backdrop-blur-xl border shadow-sm transition-all",
                c.id === activeClientId
                  ? "bg-[hsl(var(--brand-accent))]/10 border-[hsl(var(--brand-accent))]/40"
                  : "bg-[hsl(var(--admin-glass-bg-strong))] border-white/80"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[hsl(var(--admin-cobalt))] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                  {c.initials}
                </div>
                <div className="min-w-0">
                  <span className="block text-sm font-bold text-[hsl(var(--admin-on-surface))] truncate">
                    {c.name}
                  </span>
                  <span className="block text-[11px] text-[hsl(var(--admin-outline))] truncate">
                    {c.tagline}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {c.accounts.map((a) => (
                  <span
                    key={a.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[hsl(var(--admin-surface-low))] border border-[hsl(var(--admin-outline-variant))]/30 text-[10px] font-semibold text-[hsl(var(--admin-on-surface))]"
                  >
                    <PlatformIcon icon={a.icon} className="size-3" />
                    {a.platform}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-[10px] font-bold text-[hsl(var(--admin-outline))]">
                  {c.accounts.length} CHANNELS
                </span>
                <button
                  className="text-[10px] font-bold text-[hsl(var(--admin-cobalt))] hover:underline cursor-pointer"
                  onClick={() => setActiveClientId(c.id)}
                >
                  {c.id === activeClientId ? "ACTIVE" : "VIEW"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ConnectChannelModal
        open={modalOpen}
        client={activeClient}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}
