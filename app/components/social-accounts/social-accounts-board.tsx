"use client"

import React, { useMemo, useState, useTransition, useEffect } from "react"
import { useQueryState, parseAsString, debounce } from "nuqs"
import { toast } from "sonner"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { SOCIAL_CLIENTS, type SocialAccount } from "./social-data"
import { ConnectChannelModal } from "./connect-channel-modal"
import { TokenHealthModal, ChannelDetailDrawer } from "./channel-modals"
import { useAppStore } from "@/lib/store/app-store"
import { AccountSkeleton } from "./account-skeleton"

function PlatformIcon({ icon, className }: { icon: string; className?: string }) {
  const Cmp = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[icon]
  if (Cmp) return <Cmp className={className} />
  return <Icons.hub className={className} />
}

function AccountRow({
  acc,
  onOpen,
  onToken,
  onRefresh,
  onDisconnect,
}: {
  acc: SocialAccount
  onOpen: () => void
  onToken: () => void
  onRefresh: () => void
  onDisconnect: () => void
}) {
  const isSynced = acc.status === "SYNCED"
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (refreshing) return
    setRefreshing(true)
    onRefresh()
    setTimeout(() => setRefreshing(false), 900)
  }

  return (
    <div
      onClick={onOpen}
      className="flex items-center justify-between p-3 rounded-2xl bg-[hsl(var(--admin-surface-low))]/60 border border-white/80 hover:bg-[hsl(var(--admin-surface-lowest))] transition-all group shadow-sm cursor-pointer"
    >
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
                : "bg-red-100 text-red-700"
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                isSynced ? "bg-[#526600] animate-pulse" : "bg-red-600"
              )}
            />
            {isSynced ? "SYNCED" : "ACTION NEEDED"}
          </span>
          <p className="text-[11px] font-semibold text-[hsl(var(--admin-on-surface))] mt-0.5">
            {acc.fans}
          </p>
        </div>
        {isSynced && (
          <button
            aria-label="Token health"
            onClick={(e) => {
              e.stopPropagation()
              onToken()
            }}
            className="p-1 rounded-full text-[hsl(var(--admin-outline))] hover:text-[hsl(var(--admin-cobalt))] hover:bg-[hsl(var(--admin-surface-high))] transition-all cursor-pointer"
            title="Token health"
          >
            <Icons.shield className="size-4" />
          </button>
        )}
        <button
          aria-label={isSynced ? "Refresh telemetry" : "Reconnect channel"}
          onClick={handleRefresh}
          className={cn(
            "p-1 rounded-full transition-all cursor-pointer",
            isSynced
              ? "text-[hsl(var(--admin-outline))] hover:text-[hsl(var(--admin-cobalt))] hover:bg-[hsl(var(--admin-surface-high))]"
              : "text-red-600 hover:bg-red-50"
          )}
          title={isSynced ? "Refresh telemetry" : "Reconnect channel"}
        >
          <Icons.refresh className={cn("size-4", refreshing && "animate-spin")} />
        </button>
        <button
          aria-label="Disconnect channel"
          onClick={(e) => {
            e.stopPropagation()
            onDisconnect()
          }}
          className="p-1 rounded-full text-[hsl(var(--admin-outline))] hover:text-[hsl(var(--admin-on-surface))] hover:bg-[hsl(var(--admin-surface-high))] transition-all cursor-pointer"
          title="Disconnect channel"
        >
          <Icons.close className="size-4" />
        </button>
      </div>
    </div>
  )
}

export function SocialAccountsBoard() {
  const [activeClientId, setActiveClientId] = useQueryState(
    "clientId",
    parseAsString.withDefault(SOCIAL_CLIENTS[0].id)
  )
  const [query, setQuery] = useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({ limitUrlUpdates: debounce(300) })
  )
  const [pickerOpen, setPickerOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [tokenAccount, setTokenAccount] = useState<SocialAccount | null>(null)
  const [drawerAccount, setDrawerAccount] = useState<SocialAccount | null>(null)
  // Dialog konfirmasi disconnect — R-26: tombol bahaya (disconnect) tidak boleh aksi langsung tanpa konfirmasi.
  const [pendingDisconnect, setPendingDisconnect] = useState<SocialAccount | null>(null)
  
  const [isPending, startTransition] = useTransition()

  // Escape key dismisses the disconnect confirmation modal
  useEffect(() => {
    if (!pendingDisconnect) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPendingDisconnect(null)
    }
    window.addEventListener("keydown", handleEsc)
    return () => window.removeEventListener("keydown", handleEsc)
  }, [pendingDisconnect])

  const clientsWithAccounts = useAppStore((s) => s.clientsWithAccounts)
  const connectAccount = useAppStore((s) => s.connectAccount)
  const refreshAccount = useAppStore((s) => s.refreshAccount)
  const disconnectAccount = useAppStore((s) => s.disconnectAccount)

  const clients = clientsWithAccounts()

  const activeClient = useMemo(
    () => clients.find((c) => c.id === activeClientId) ?? clients[0],
    [clients, activeClientId]
  )

  // KPI dihitung dari data store live (R-17: angka nyata, bukan invented).
  const stats = useAppStore((s) => s.accountStats)()
  const actionNeeded = useAppStore((s) => s.actionNeededCount)()
  const formatReach = (k: number) =>
    k >= 1000 ? `${(k / 1000).toFixed(1)}M` : `${k}K`

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return activeClient.accounts
    return activeClient.accounts.filter(
      (a) =>
        a.platform.toLowerCase().includes(q) || a.handle.toLowerCase().includes(q)
    )
  }, [activeClient, query])

  const totalAccounts = clients.reduce((n, c) => n + c.accounts.length, 0)

  const handleConnected = (acc: SocialAccount) => {
    connectAccount({
      clientId: activeClient.id,
      platform: acc.platform,
      handle: acc.handle,
      fans: acc.fans,
      icon: acc.icon,
      bg: acc.bg,
      fg: acc.fg,
    })
  }

  const handleRefreshed = (id: string) => {
    refreshAccount(id)
    toast.success("Channel synced", {
      description: "Latest engagement telemetry has been pulled in.",
    })
  }

  const handleDisconnect = (acc: SocialAccount) => setPendingDisconnect(acc)

  const confirmDisconnect = () => {
    if (!pendingDisconnect) return
    const { id, handle, platform } = pendingDisconnect
    disconnectAccount(id)
    setPendingDisconnect(null)
    toast.success(`${platform} disconnected`, {
      description: `${handle} was removed from ${activeClient.shortName}.`,
    })
  }

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
          { label: "Total Channels", value: String(stats.totalChannels) },
          { label: "Managed Clients", value: String(clients.length) },
          { label: "All Synced", value: `${stats.syncedPercent}%` },
          { label: "Aggregate Reach", value: formatReach(stats.aggregateReachK) },
        ].map((s) => (
          <div
            key={s.label}
            className="p-4 rounded-2xl bg-[hsl(var(--admin-glass-bg-strong))] backdrop-blur-xl border border-white/80 shadow-sm"
          >
            <span className="block text-[10px] font-bold tracking-wider uppercase text-[hsl(var(--admin-outline))]">
              {s.label}
            </span>
            <span
              className="admin-stat-value block text-2xl text-[hsl(var(--admin-on-surface))] mt-1"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {s.value}
            </span>
          </div>
        ))}
      </div>

      {/* Action-needed banner (R-27): muncul hanya bila ada channel bermasalah. */}
      {actionNeeded > 0 && (
        <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-red-50 border border-red-200">
          <Icons.warning className="size-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-red-800">
              {actionNeeded} channel{actionNeeded > 1 ? "s" : ""} need attention
            </p>
            <p className="text-[11px] text-red-700 mt-0.5">
              Publishing and telemetry are paused for these channels. Open a
              channel and use <b>Reconnect</b> to restore access.
            </p>
          </div>
        </div>
      )}

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
              {clients.map((c) => (
                <button
                  key={c.id}
                  className={cn(
                    "w-full flex items-center gap-2.5 p-2 rounded-xl transition-all cursor-pointer text-left",
                    c.id === activeClientId
                      ? "bg-[hsl(var(--brand-accent))]/15 border border-[hsl(var(--brand-accent))]/30"
                      : "hover:bg-[hsl(var(--admin-surface-low))] border border-transparent"
                  )}
                  onClick={() => {
                    startTransition(() => {
                      void setActiveClientId(c.id)
                    })
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
              {isPending ? (
                <>
                  <AccountSkeleton />
                  <AccountSkeleton />
                  <AccountSkeleton />
                </>
              ) : filtered.length === 0 ? (
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
                filtered.map((acc) => (
                  <AccountRow
                    key={acc.id}
                    acc={acc}
                    onOpen={() => setDrawerAccount(acc)}
                    onToken={() => setTokenAccount(acc)}
                    onRefresh={() => handleRefreshed(acc.id)}
                    onDisconnect={() => handleDisconnect(acc)}
                  />
                ))
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
          {clients.map((c) => (
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
                  onClick={() =>
                    startTransition(() => {
                      void setActiveClientId(c.id)
                    })
                  }
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
        existingPlatforms={activeClient.accounts.map((a) => a.platform)}
        onClose={() => setModalOpen(false)}
        onConnected={handleConnected}
      />
      <TokenHealthModal
        account={tokenAccount}
        client={activeClient}
        open={tokenAccount !== null}
        onClose={() => setTokenAccount(null)}
        onRefreshed={handleRefreshed}
      />
      <ChannelDetailDrawer
        account={drawerAccount}
        client={activeClient}
        open={drawerAccount !== null}
        onClose={() => setDrawerAccount(null)}
        onManage={(acc) => {
          setDrawerAccount(null)
          setTokenAccount(acc)
        }}
        onReconnect={(acc) => {
          refreshAccount(acc.id)
          setDrawerAccount(null)
          toast.success(`${acc.platform} reconnected`, {
            description: `${acc.handle} is syncing again. Publishing resumed.`,
          })
        }}
      />

      {/* Disconnect Confirmation Modal */}
      {pendingDisconnect && (
        <div className="fixed inset-0 z-50 p-4 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-[hsl(var(--admin-on-surface))]/40 backdrop-blur-sm"
            onClick={() => setPendingDisconnect(null)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Disconnect ${pendingDisconnect.platform} ${pendingDisconnect.handle}`}
            className="relative w-full max-w-sm bg-white/95 backdrop-blur-2xl rounded-2xl border border-white/80 p-5 shadow-2xl space-y-4"
            tabIndex={-1}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                <Icons.warning className="size-5 text-red-600" />
              </div>
              <div>
                <h3 className="font-syne font-bold text-[hsl(var(--admin-on-surface))] text-sm">
                  Disconnect Channel?
                </h3>
                <p className="text-[11px] text-[hsl(var(--admin-outline))] mt-1">
                  You are about to remove <b>{pendingDisconnect.handle}</b> (
                  {pendingDisconnect.platform}) from {activeClient.shortName}.
                  Automated publishing and telemetry will stop immediately.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[hsl(var(--admin-outline-variant))]/20">
              <button
                onClick={() => setPendingDisconnect(null)}
                className="px-4 py-2 rounded-full text-xs font-semibold text-[hsl(var(--admin-on-surface))] hover:bg-[hsl(var(--admin-surface-high))] transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmDisconnect}
                className="px-4 py-2 rounded-full bg-red-600 text-white text-xs font-bold shadow-sm hover:bg-red-700 active:scale-95 transition-all cursor-pointer"
              >
                Disconnect
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
