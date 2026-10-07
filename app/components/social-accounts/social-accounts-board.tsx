"use client"

import * as React from "react"
import { useSearchParams } from "next/navigation"
import { useQueryState, parseAsString, parseAsStringEnum } from "nuqs"
import { useSuspenseQuery } from "@tanstack/react-query"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { ConnectChannelModal } from "./connect-channel-modal"
import { toast } from "sonner"
import { DisconnectDialog } from "./disconnect-dialog"
import { useCreateClient } from "@/components/client/create-client-provider"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { socialQueries, useDisconnectChannel, useSyncChannel } from "@/features/social-accounts/api/queries"
import type { ClientChannel } from "@/features/social-accounts/api/types"

export function getPlatformUI(platform: string) {
  const p = (platform || "").toLowerCase()
  if (p === 'instagram') return { icon: 'instagram', bg: 'bg-pink-500', fg: 'text-white' }
  if (p === 'tiktok') return { icon: 'tiktok', bg: 'bg-black', fg: 'text-white' }
  if (p === 'youtube') return { icon: 'youtube', bg: 'bg-red-500', fg: 'text-white' }
  if (p === 'linkedin') return { icon: 'linkedin', bg: 'bg-blue-600', fg: 'text-white' }
  if (p === 'twitter' || p === 'x') return { icon: 'twitter', bg: 'bg-sky-500', fg: 'text-white' }
  if (p === 'facebook') return { icon: 'facebook', bg: 'bg-blue-600', fg: 'text-white' }
  return { icon: 'hub', bg: 'bg-gray-500', fg: 'text-white' }
}

function statusBadge(status: ClientChannel["status"]) {
  switch (status) {
    case "terhubung":
      return { label: "Connected", className: "admin-badge admin-badge-lime", dot: "admin-dot-live" }
    case "gagal":
      return { label: "Connection Error", className: "admin-badge bg-destructive/15 text-destructive", dot: "" }
    case "belum":
    default:
      return { label: "Not Connected", className: "admin-badge admin-badge-surface", dot: "bg-muted-foreground" }
  }
}

const TABS = ["All Accounts", "Instagram", "TikTok", "Action Required"]

export function ClientChannelsBoard() {
  const [tab, setTab] = useQueryState("tab", parseAsStringEnum(TABS).withDefault("All Accounts"))
  const [clientId] = useQueryState("clientId", parseAsString)
  const searchParams = useSearchParams()
  
  React.useEffect(() => {
    const success = searchParams?.get("success")
    const error = searchParams?.get("error")
    
    if (success === "connected") {
      toast.success("Social account connected successfully")
    } else if (error) {
      toast.error(`Connection failed: ${decodeURIComponent(error)}`)
    }

    if (success || error) {
      // Clear the query params from the URL without triggering a re-render
      const url = new URL(window.location.href)
      url.searchParams.delete("success")
      url.searchParams.delete("error")
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])
  
  const [connectOpen, setConnectOpen] = React.useState(false)
  const { openCreateClient } = useCreateClient()
  const [syncing, setSyncing] = React.useState(false)
  const [pendingDisconnect, setPendingDisconnect] = React.useState<{ id: string; handle: string } | null>(null)

  const { data: rawClients } = useSuspenseQuery(socialQueries.listClientsWithChannels())
  
  const disconnectMutation = useDisconnectChannel()
  const syncMutation = useSyncChannel()

  const activeClient = React.useMemo(() => {
    if (!rawClients || rawClients.length === 0) return null
    return rawClients.find((c) => c.id === clientId) ?? rawClients[0]
  }, [rawClients, clientId])

  const handleDisconnect = React.useCallback((id: string, handle: string) => {
    setPendingDisconnect({ id, handle })
  }, [])

  const confirmDisconnect = React.useCallback(() => {
    if (!pendingDisconnect) return
    disconnectMutation.mutate(pendingDisconnect.id, {
      onSuccess: () => {
        toast.success(`${pendingDisconnect.handle} disconnected successfully`)
        setPendingDisconnect(null)
      },
      onError: (err) => {
        toast.error(`Failed to disconnect: ${err.message}`)
      }
    })
  }, [pendingDisconnect, disconnectMutation])

  const handleSyncAll = React.useCallback(() => {
    if (!activeClient) return
    const target = activeClient.channels
    if (target.length === 0) {
      toast.info("No accounts to refresh")
      return
    }
    
    setSyncing(true)
    
    Promise.allSettled(target.map(a => syncMutation.mutateAsync(a.id))).then((results) => {
      setSyncing(false)
      const failed = results.filter(r => r.status === 'rejected')
      if (failed.length === 0) {
        toast.success(`Refreshed ${target.length} accounts`)
      } else {
        toast.warning(`Refreshed data, but ${failed.length} account(s) failed to sync.`)
      }
    })
  }, [activeClient, syncMutation])

  const handleBulkRefresh = React.useCallback((accounts: ClientChannel[]) => {
    if (accounts.length === 0) {
      toast.info("No accounts to refresh")
      return
    }
    setSyncing(true)
    Promise.allSettled(accounts.map(a => syncMutation.mutateAsync(a.id))).then((results) => {
      setSyncing(false)
      const failed = results.filter(r => r.status === 'rejected')
      if (failed.length === 0) {
        toast.success(`Refreshed ${accounts.length} account(s)`)
      } else {
        toast.warning(`Refreshed data, but ${failed.length} account(s) failed to sync.`)
      }
    })
  }, [syncMutation])

  const handleRefreshOne = React.useCallback((account: ClientChannel) => {
    setSyncing(true)
    syncMutation.mutate(account.id, {
      onSuccess: () => {
        setSyncing(false)
        toast.success(`Refreshed ${account.handle || account.platform}`)
      },
      onError: (err) => {
        setSyncing(false)
        toast.error(`Failed to refresh: ${err.message}`)
      },
    })
  }, [syncMutation])

  const handleReconnect = React.useCallback((account: ClientChannel) => {
    toast.loading(`Redirecting to reconnect ${account.platform}...`, { id: "reconnect" })
    setTimeout(() => {
      toast.dismiss("reconnect")
      setConnectOpen(true)
    }, 500)
  }, [])

  const stats = React.useMemo(() => {
    if (!activeClient) {
      return { totalFollowers: "0", syncedCount: 0, actionNeededCount: 0 }
    }
    
    let synced = 0
    let actionNeeded = 0

    for (const a of activeClient.channels) {
      if (a.status === 'terhubung') {
        synced++
      } else if (a.status === 'gagal') {
        actionNeeded++
      }
    }
    
    const factualFollowers = activeClient.dashboard_profile?.audience_size 
      ? Number(activeClient.dashboard_profile.audience_size).toLocaleString() 
      : "0"

    return {
      totalFollowers: factualFollowers,
      syncedCount: synced,
      actionNeededCount: actionNeeded,
    }
  }, [activeClient])
  
  const { totalFollowers, syncedCount, actionNeededCount } = stats

  const filteredAccounts = React.useMemo(() => {
    if (!activeClient) return []
    let accs = activeClient.channels
    if (tab === "Instagram") accs = accs.filter(a => a.platform.toLowerCase() === "instagram")
    if (tab === "TikTok") accs = accs.filter(a => a.platform.toLowerCase() === "tiktok")
    if (tab === "Action Required") accs = accs.filter(a => a.status === "gagal")
    return accs
  }, [activeClient, tab])

  if (!activeClient) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center h-[50vh]">
        <Icons.hub className="size-16 text-muted-foreground/30 mb-6" />
        <h2 className="text-2xl font-bold text-foreground">No clients found</h2>
        <p className="text-muted-foreground mt-2 max-w-sm mx-auto mb-8">
          Add your first client to start connecting their social accounts, running campaigns, and tracking analytics.
        </p>
        <Button 
          onClick={openCreateClient} 
          className="bg-primary text-primary-foreground font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/40 active:scale-95 transition-all"
        >
          <Icons.add className="mr-2 size-4" />
          Create First Client
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Action Toolbar */}
      <div className="flex items-center justify-end gap-2">
            <Button
              onClick={handleSyncAll}
              disabled={syncing}
              isLoading={syncing}
              variant="outline"
              className="admin-pill admin-pill-ghost px-4 py-2.5 sm:px-5 border-none"
              title="Refresh all accounts data"
            >
              <Icons.refresh className="size-4 mr-2" />
              <span className="hidden sm:inline">Refresh data</span>
            </Button>

            <Button
              onClick={() => setConnectOpen(true)}
              className="admin-pill admin-pill-lime px-4 py-2.5 sm:px-6 shadow-md hover:shadow-lg flex items-center gap-2"
            >
                <Icons.add className="size-4" /> 
                <span className="hidden sm:inline">Connect account</span>
                <span className="sm:hidden">Connect</span>
            </Button>
        </div>
      <div 
        className="w-full overflow-x-auto no-scrollbar pb-1 -mb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset rounded-full"
        tabIndex={0}
        role="region"
        aria-label="Filter accounts horizontally"
      >
        <div
          role="tablist"
          aria-label="Filter social accounts"
          className="flex items-center gap-1 p-1 bg-secondary/50 rounded-full w-max border border-border/20"
        >
          {TABS.map(t => {
              if (t === "Action Required" && actionNeededCount === 0) return null;
              
              return (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                    tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-foreground/5"
                  )}
                >
                    {t} {t === "All Accounts" && `(${activeClient.channels.length})`}
                    {t === "Action Required" && actionNeededCount > 0 && (
                       <span className="ml-1.5 bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-full text-[10px]">
                         {actionNeededCount}
                       </span>
                    )}
                </button>
              )
          })}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          label="Connected Accounts"
          value={String(activeClient.channels.length)}
          badge="Active"
          sub="Across IG & TikTok"
          icon="hub"
          tone="secondary"
        />
        <KPICard
          label="Combined Audience"
          value={totalFollowers}
          badge="Followers"
          sub="Followers & Subscribers"
          icon="teams"
          tone="primary"
        />
        <KPICard
          label="Token & API Status"
          value={`${syncedCount} / ${activeClient.channels.length}`}
          badge={actionNeededCount > 0 ? `${actionNeededCount} Failed` : "All Secure"}
          sub={actionNeededCount > 0 ? "Re-authentication required" : "Automated Sync Active"}
          icon="key"
          tone={actionNeededCount > 0 ? "error" : "primary"}
        />
        <KPICard
          label="Needs Attention"
          value={String(actionNeededCount)}
          badge={actionNeededCount > 0 ? "Action" : "Clear"}
          sub={actionNeededCount > 0 ? "Reconnect to resume posting" : "No tokens expiring"}
          icon="playCircle"
          tone={actionNeededCount > 0 ? "error" : "tertiary"}
          onClick={() => setTab("Action Required")}
        />
      </div>

      {/* Account Sections */}
      <div className="space-y-8">
        <AccountSection
            title="Instagram"
            subtitle="Connected through the Meta Graph API"
            accounts={filteredAccounts.filter(a => a.platform.toLowerCase() === "instagram")}
            icon="instagram"
            iconClass="bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white"
            bulkLabel="Refresh data"
            onDisconnect={handleDisconnect}
            onReconnect={handleReconnect}
            onBulkRefresh={handleBulkRefresh}
            onRefreshOne={handleRefreshOne}
          />
          <AccountSection
            title="TikTok"
            subtitle="Connected through the TikTok Business API"
            accounts={filteredAccounts.filter(a => a.platform.toLowerCase() === "tiktok")}
            icon="tiktok"
            iconClass="bg-foreground text-background"
            bulkLabel="Refresh data"
            onDisconnect={handleDisconnect}
            onReconnect={handleReconnect}
            onBulkRefresh={handleBulkRefresh}
            onRefreshOne={handleRefreshOne}
          />
          <AccountSection
            title="Other platforms"
            subtitle="YouTube, LinkedIn and other connected accounts"
            accounts={filteredAccounts.filter(a => a.platform.toLowerCase() !== "instagram" && a.platform.toLowerCase() !== "tiktok")}
            icon="smart_display"
            iconClass="bg-primary text-primary-foreground"
            bulkLabel="Refresh data"
            onDisconnect={handleDisconnect}
            onReconnect={handleReconnect}
            onBulkRefresh={handleBulkRefresh}
            onRefreshOne={handleRefreshOne}
          />
      </div>

      <ConnectChannelModal
        open={connectOpen}
        client={activeClient}
        existingPlatforms={activeClient.channels.map((a) => a.platform)}
        onClose={() => setConnectOpen(false)}
      /> 

      <DisconnectDialog
        open={pendingDisconnect !== null}
        handle={pendingDisconnect?.handle ?? ""}
        onConfirm={confirmDisconnect}
        onClose={() => setPendingDisconnect(null)}
      />
    </div>
  )
}

const KPI_TONES: Record<string, string> = {
  primary: "bg-primary text-primary-foreground/60 text-primary-foreground",
  secondary: "bg-secondary/50 text-secondary-foreground",
  tertiary: "bg-muted text-foreground",
  error: "bg-destructive/15 text-destructive",
}

function KPICard({ label, value, badge, sub, icon, tone, onClick }: {
  label: string
  value: string
  badge: string
  sub: string
  icon: keyof typeof Icons
  tone: keyof typeof KPI_TONES
  onClick?: () => void
}) {
    const IconComponent = typeof Icons[icon] === 'function' ? Icons[icon] : null
    const isError = tone === 'error'
    return (
        <div 
          onClick={onClick}
          role={onClick ? "button" : undefined}
          tabIndex={onClick ? 0 : undefined}
          onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick() } } : undefined}
          aria-label={onClick ? `Show ${label}` : undefined}
          className={cn(
          "p-5 admin-card flex items-center justify-between relative overflow-hidden group transition-all",
          isError ? "border-rose-500/30" : "admin-card-hover",
          onClick && "cursor-pointer hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        )}>
            <div className="space-y-1 min-w-0">
                <span className="admin-section-label block">{label}</span>
                <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-2xl font-extrabold font-syne text-foreground tabular-nums">{value}</span>
                    <span className={cn(
                      "admin-badge",
                      isError ? "bg-rose-500/15 text-rose-600" : "admin-badge-cobalt"
                    )}>{badge}</span>
                </div>
                <p className={cn("text-[11px] truncate", isError ? "text-destructive" : "text-muted-foreground")}>{sub}</p>
            </div>
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform",
              KPI_TONES[tone]
            )}>
              {IconComponent && <IconComponent className="size-6" />}
            </div>
        </div>
    )
}

function AccountSection({ title, subtitle, accounts, icon, iconClass, bulkLabel, onDisconnect, onReconnect, onBulkRefresh, onRefreshOne }: {
  title: string
  subtitle: string
  accounts: ClientChannel[]
  icon: string
  iconClass: string
  bulkLabel: string
  onDisconnect: (id: string, handle: string) => void
  onReconnect: (account: ClientChannel) => void
  onBulkRefresh: (accounts: ClientChannel[]) => void
  onRefreshOne: (account: ClientChannel) => void
}) {
    const IconComponent = typeof Icons[icon as keyof typeof Icons] === 'function' ? Icons[icon as keyof typeof Icons] : null

    return (
        <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-3">
                <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shadow-sm shrink-0", iconClass)}>
                  {IconComponent && <IconComponent className="size-5" aria-hidden="true" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground flex items-center gap-2 flex-wrap">
                    {title}
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted text-foreground font-bold">
                      {accounts.length} {accounts.length === 1 ? "account" : "accounts"}
                    </span>
                  </h2>
                  <p className="text-xs text-muted-foreground">{subtitle}</p>
                </div>
              </div>
              {accounts.length > 0 && (
                <button
                  onClick={() => onBulkRefresh(accounts)}
                  className="px-4 py-1.5 rounded-full bg-card border border-border/40 hover:bg-muted text-foreground text-xs font-semibold transition-all cursor-pointer self-start sm:self-auto"
                >
                  {bulkLabel}
                </button>
              )}
            </div>

            {accounts.length === 0 ? (
              <div className="p-8 rounded-2xl border border-dashed border-border/50 bg-card/30 flex flex-col items-center justify-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Icons.link className="size-5 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-foreground">No accounts connected</p>
                  <p className="text-xs text-muted-foreground">Connect a {title} account to start syncing analytics and messages.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {accounts.map(a => (
                  <AccountCard key={a.id} account={a} onDisconnect={onDisconnect} onReconnect={onReconnect} onRefreshOne={onRefreshOne} />
                ))}
              </div>
            )}
        </section>
    )
}

export function AccountCard({ account: a, onDisconnect, onReconnect, onRefreshOne }: { account: ClientChannel; onDisconnect: (id: string, handle: string) => void; onReconnect: (account: ClientChannel) => void; onRefreshOne: (account: ClientChannel) => void }) {
  const badge = statusBadge(a.status)
  const isExpiring = a.status === "gagal"
  const platformUI = getPlatformUI(a.platform)

  return (
    <div className={cn(
      "p-6 flex flex-col justify-between gap-5 relative overflow-hidden admin-card",
      isExpiring ? "border-destructive/40 bg-destructive/5" : "admin-card-hover"
    )}>
      {isExpiring && <div className="absolute -right-10 -bottom-10 w-28 h-28 rounded-full bg-destructive/10 blur-xl pointer-events-none" />}

      <div className="space-y-4 relative">
        {/* Card header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ring-2 ring-white/70 shadow-sm relative overflow-hidden", !a.avatar_url && platformUI.bg, !a.avatar_url && platformUI.fg)}>
              {a.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={a.avatar_url} alt={`${a.handle} avatar`} className="w-full h-full object-cover" />
              ) : (() => {
                const key = platformUI.icon as keyof typeof Icons
                const IconComp = typeof Icons[key] === 'function' ? Icons[key] : null
                return IconComp ? <IconComp className="size-6" /> : <Icons.hub className="size-6" />
              })()}
              
              {a.avatar_url && (
                <div className={cn("absolute -bottom-1 -right-1 w-5 h-5 rounded-md flex items-center justify-center shadow-sm border border-white", platformUI.bg, platformUI.fg)}>
                  {(() => {
                    const key = platformUI.icon as keyof typeof Icons
                    const IconComp = typeof Icons[key] === 'function' ? Icons[key] : null
                    return IconComp ? <IconComp className="size-3" /> : null
                  })()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground truncate">{a.handle || 'Unknown'}</span>
                {a.status === "terhubung" && (
                  <Icons.check className="size-4 text-primary shrink-0" aria-label="verified" />
                )}
              </div>
              <span className="text-xs text-muted-foreground truncate block capitalize">{a.platform}</span>
            </div>
          </div>
          <div className={cn("shrink-0", badge.className)}>
            {badge.dot && <span className={cn(badge.dot)} />}
            {badge.label}
          </div>
        </div>

        {/* Warning block for expiring tokens */}
        {isExpiring && (
          <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <Icons.warning className="size-4" />
              Connection needs attention
            </div>
            <p className="text-[11px] leading-tight opacity-90">
              Data sync is paused until you reconnect this account.
            </p>
          </div>
        )}

        {/* Token validity row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1">
            <Icons.key className={cn("size-4", isExpiring ? "text-destructive" : "text-primary")} />
            Access active
          </span>
        </div>
      </div>

      {/* Card actions */}
      <div className="pt-4 border-t border-border/20 flex items-center justify-between gap-2 relative">
        {isExpiring ? (
          <button
            onClick={() => onReconnect(a)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-destructive hover:bg-destructive/90 text-destructive-foreground text-[11px] font-bold transition-all active:scale-95 cursor-pointer"
          >
            <Icons.warning className="size-4" />
            Reconnect account
          </button>
        ) : (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={`More actions for ${a.handle}`}
                className="p-2.5 rounded-full hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Icons.more_vert className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => onRefreshOne(a)}>
                  <Icons.refresh className="size-4 mr-2" />
                  Refresh now
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDisconnect(a.id, a.handle || 'Unknown')}
                >
                  <Icons.logout className="size-4 mr-2" />
                  Disconnect
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
      </div>
    </div>
  )
}
