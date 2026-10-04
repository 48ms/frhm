"use client"

import * as React from "react"
import { useQueryState, parseAsString, parseAsStringEnum } from "nuqs"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { SOCIAL_CLIENTS, type SocialAccount } from "./social-data"
import { ConnectChannelModal } from "./connect-channel-modal"
import { WebhookLogs } from "./webhook-logs"
import { AuditLogsModal } from "./audit-logs-modal"
import { useAppStore } from "@/lib/store/app-store"
import { toast } from "sonner"
import { DisconnectDialog } from "./disconnect-dialog"
import { ManageAccessDialog } from "./manage-access-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

function fansToK(fans: string): number {
  const m = String(fans).replace(/,/g, "").match(/([\d.]+)\s*([KMB])?/i)
  if (!m) return 0
  const n = parseFloat(m[1])
  if (Number.isNaN(n)) return 0
  const unit = (m[2] ?? "").toUpperCase()
  if (unit === "B") return n * 1_000_000
  if (unit === "M") return n * 1_000
  return n
}

function formatK(val: number): string {
  if (val >= 1_000_000) return (val / 1_000_000).toFixed(2) + "M"
  if (val >= 1_000) return (val / 1_000).toFixed(0) + "K"
  return val.toString()
}

/** Labels and colours come from the Stitch reference prototype. */
function statusBadge(status: SocialAccount["status"]) {
  switch (status) {
    case "SYNCED":
      return { label: "Connected & Verified", className: "bg-primary text-primary-foreground", dot: "bg-primary animate-pulse" }
    case "LIVE_SYNC":
      return { label: "Live Data Feed", className: "bg-primary text-primary-foreground", dot: "bg-primary animate-ping" }
    case "TOKEN_EXPIRING":
      return { label: "Token Refresh Needed", className: "bg-amber-500 text-white", dot: "" }
    case "ACTION_NEEDED":
      return { label: "Action Required", className: "bg-amber-500 text-white", dot: "" }
    case "FAILED":
      return { label: "Connection Error", className: "bg-rose-500 text-white", dot: "" }
    default:
      return { label: "Connected", className: "bg-muted text-foreground", dot: "bg-muted-foreground" }
  }
}

const TABS = ["All Accounts", "Instagram", "TikTok", "Action Required"]

export function SocialAccountsBoard() {
  const [tab, setTab] = useQueryState("tab", parseAsStringEnum(TABS).withDefault("All Accounts"))
  const [clientId, setClientId] = useQueryState("clientId", parseAsString.withDefault(SOCIAL_CLIENTS[0].id))
  const [connectOpen, setConnectOpen] = React.useState(false)
  const [auditOpen, setAuditOpen] = React.useState(false)
  const [syncing, setSyncing] = React.useState(false)
  const [pendingDisconnect, setPendingDisconnect] = React.useState<{ id: string; handle: string } | null>(null)
  const [accessAccount, setAccessAccount] = React.useState<SocialAccount | null>(null)

  const rawClients = useAppStore((s) => s.socialClients)
  const rawAccounts = useAppStore((s) => s.accounts)
  const refreshAccount = useAppStore((s) => s.refreshAccount)
  const removeAccount = useAppStore((s) => s.removeSocialAccount)

  const activeClient = React.useMemo(() => {
    const found = rawClients.find((c) => c.id === clientId) ?? rawClients[0] ?? SOCIAL_CLIENTS[0]
    return {
      ...found,
      accounts: rawAccounts.filter((a) => a.clientId === found.id),
    }
  }, [rawClients, rawAccounts, clientId])

  const handleDisconnect = React.useCallback((id: string, handle: string) => {
    setPendingDisconnect({ id, handle })
  }, [])

  const handleManageAccess = React.useCallback((account: SocialAccount) => {
    setAccessAccount(account)
  }, [])

  const confirmDisconnect = React.useCallback(() => {
    if (!pendingDisconnect) return
    removeAccount(pendingDisconnect.id)
    toast.error(`${pendingDisconnect.handle} disconnected`)
    setPendingDisconnect(null)
  }, [pendingDisconnect, removeAccount])

  const handleSyncAll = React.useCallback(() => {
    const target = activeClient.accounts
    setSyncing(true)
    target.forEach((a) => refreshAccount(a.id))
    window.setTimeout(() => {
      setSyncing(false)
      toast.success(`Synced ${target.length} channels successfully`)
    }, 1200)
  }, [activeClient.accounts, refreshAccount])

  const totalFollowers = React.useMemo(() => {
    const sum = activeClient.accounts.reduce((acc, a) => acc + fansToK(a.fans), 0)
    return formatK(sum)
  }, [activeClient.accounts])

  const syncedCount = React.useMemo(
    () => activeClient.accounts.filter(a => a.status === 'SYNCED' || a.status === 'LIVE_SYNC' || a.status === 'ACTIVE').length,
    [activeClient.accounts]
  )
  const expiringCount = React.useMemo(
    () => activeClient.accounts.filter(a => a.status === 'TOKEN_EXPIRING').length,
    [activeClient.accounts]
  )
  const actionNeededCount = React.useMemo(
    () => activeClient.accounts.filter(a => a.status === 'ACTION_NEEDED' || a.status === 'FAILED').length,
    [activeClient.accounts]
  )
  const avgGrowth = React.useMemo(() => {
    const valid = activeClient.accounts.filter(a => a?.growth && /^\+?[\d.]+%$/.test(a.growth))
    if (valid.length === 0) return '0%'
    const nums = valid.map(a => parseFloat(a.growth!.replace('+', '').replace('%', '')))
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length
    return `${avg.toFixed(1)}%`
  }, [activeClient.accounts])

  const filteredAccounts = React.useMemo(() => {
    let accs = activeClient.accounts
    if (tab === "Instagram") accs = accs.filter(a => a.platform === "Instagram")
    if (tab === "TikTok") accs = accs.filter(a => a.platform === "TikTok")
    if (tab === "Action Required") accs = accs.filter(a => a.status === "TOKEN_EXPIRING" || a.status === "ACTION_NEEDED" || a.status === "FAILED")
    return accs
  }, [activeClient, tab])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Social Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            Every Instagram and TikTok account your clients have connected, with sync status and token health.
          </p>
        </div>
        <div className="flex items-center gap-2">
            <button
              onClick={handleSyncAll}
              disabled={syncing}
              className="px-5 py-2.5 rounded-full bg-card border border-border/40 text-foreground text-sm font-semibold hover:bg-secondary/40 transition-all cursor-pointer inline-flex items-center gap-2 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <Icons.refresh className={cn("size-4", syncing && "animate-spin")} />
              {syncing ? "Syncing…" : "Sync all accounts"}
            </button>
            <button
              onClick={() => setAuditOpen(true)}
              className="px-5 py-2.5 rounded-full bg-card border border-border/40 text-foreground text-sm font-semibold hover:bg-secondary/40 transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              Audit Access Logs
            </button>
            <button
              onClick={() => setConnectOpen(true)}
              className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
                <Icons.add className="size-4" /> Connect channel
            </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Filter social accounts"
        className="flex items-center gap-1 p-1 bg-secondary/50 rounded-full w-max border border-border/20"
      >
        {TABS.map(t => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:ring-offset-background",
                tab === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
            >
                {t} {t === "All Accounts" && `(${activeClient.accounts.length})`}
            </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          label="Connected Handles"
          value={String(activeClient.accounts.length)}
          badge={avgGrowth.startsWith('-') ? avgGrowth : `+${avgGrowth}`}
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
          value={`${syncedCount} / ${activeClient.accounts.length}`}
          badge={expiringCount > 0 ? `${expiringCount} Expiring` : (actionNeededCount > 0 ? `${actionNeededCount} Failed` : "All Secure")}
          sub={expiringCount > 0 ? "Re-authentication required" : "Automated Sync Active"}
          icon="key"
          tone={expiringCount > 0 || actionNeededCount > 0 ? "error" : "primary"}
        />
        <KPICard
          label="Needs Attention"
          value={String(expiringCount + actionNeededCount)}
          badge={expiringCount + actionNeededCount > 0 ? "Action" : "Clear"}
          sub={expiringCount + actionNeededCount > 0 ? "Reconnect to resume posting" : "No tokens expiring"}
          icon="playCircle"
          tone={expiringCount + actionNeededCount > 0 ? "error" : "tertiary"}
          onClick={() => setTab("Action Required")}
        />
      </div>

      {/* Account Sections */}
      <div className="space-y-8">
        <AccountSection
            title="Instagram"
            subtitle="Connected through the Meta Graph API"
            accounts={filteredAccounts.filter(a => a.platform === "Instagram")}
            icon="photo_camera"
            iconClass="bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white"
            bulkLabel="Sync insights"
            onDisconnect={handleDisconnect}
            onManageAccess={handleManageAccess}
          />
          <AccountSection
            title="TikTok"
            subtitle="Connected through the TikTok Business API"
            accounts={filteredAccounts.filter(a => a.platform === "TikTok")}
            icon="music_note"
            iconClass="bg-foreground text-background"
            bulkLabel="Sync insights"
            onDisconnect={handleDisconnect}
            onManageAccess={handleManageAccess}
          />
          <AccountSection
            title="Other platforms"
            subtitle="YouTube, LinkedIn and other connected accounts"
            accounts={filteredAccounts.filter(a => a.platform !== "Instagram" && a.platform !== "TikTok")}
            icon="smart_display"
            iconClass="bg-primary text-primary-foreground"
            bulkLabel="Sync insights"
            onDisconnect={handleDisconnect}
            onManageAccess={handleManageAccess}
          />
      </div>

      <WebhookLogs />

      {/* Footer Client Switcher Bar */}
      <div className="pt-6 border-t border-border/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Switch client</span>
          <span className="text-xs text-muted-foreground">Show another client&apos;s accounts</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {rawClients.map(c => {
            const accCount = rawAccounts.filter(a => a.clientId === c.id).length
            const active = clientId === c.id
            return (
              <button
                key={c.id}
                onClick={() => setClientId(c.id)}
                className={cn(
                  "px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 transition-all cursor-pointer",
                  active
                    ? "bg-primary text-primary-foreground text-primary-foreground shadow-sm ring-1 ring-primary/40"
                    : "bg-secondary/60 hover:bg-muted text-foreground"
                )}
              >
                <span className={cn("w-2 h-2 rounded-full", active ? "bg-primary" : "bg-muted-foreground/40")} />
                {c.shortName} ({accCount})
              </button>
            )
          })}
        </div>
      </div>

      <ConnectChannelModal
        open={connectOpen}
        client={activeClient}
        existingPlatforms={activeClient.accounts.map((a) => a.platform)}
        onClose={() => setConnectOpen(false)}
      />

      <AuditLogsModal open={auditOpen} onClose={() => setAuditOpen(false)} />

      <ManageAccessDialog
        open={accessAccount !== null}
        account={accessAccount}
        onClose={() => setAccessAccount(null)}
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
  error: "bg-rose-500/15 text-rose-600",
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
          "p-5 rounded-2xl bg-card/85 border shadow-sm backdrop-blur-xl flex items-center justify-between relative overflow-hidden group hover:shadow-md transition-all",
          isError ? "border-rose-500/30" : "border-border/20",
          onClick && "cursor-pointer hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        )}>
            <div className="space-y-1 min-w-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">{label}</span>
                <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-2xl font-extrabold text-foreground tabular-nums">{value}</span>
                    <span className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full",
                      isError ? "bg-rose-500/15 text-rose-600" : "bg-primary text-primary-foreground/40 text-primary"
                    )}>{badge}</span>
                </div>
                <p className={cn("text-[11px] truncate", isError ? "text-rose-600" : "text-muted-foreground")}>{sub}</p>
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

function AccountSection({ title, subtitle, accounts, icon, iconClass, bulkLabel, onDisconnect, onManageAccess }: {
  title: string
  subtitle: string
  accounts: SocialAccount[]
  icon: string
  iconClass: string
  bulkLabel: string
  onDisconnect: (id: string, handle: string) => void
  onManageAccess: (account: SocialAccount) => void
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
                  onClick={() => toast.info(`${bulkLabel} action triggered for ${title}`)}
                  className="px-4 py-1.5 rounded-full bg-card border border-border/40 hover:bg-muted text-foreground text-xs font-semibold transition-all cursor-pointer self-start sm:self-auto"
                >
                  {bulkLabel}
                </button>
              )}
            </div>

            {accounts.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-border/50 text-center text-sm font-medium text-muted-foreground">
                No accounts connected on this platform yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {accounts.map(a => (
                  <AccountCard key={a.id} account={a} onDisconnect={onDisconnect} onManageAccess={onManageAccess} />
                ))}
              </div>
            )}
        </section>
    )
}

export function AccountCard({ account: a, onDisconnect, onManageAccess }: { account: SocialAccount; onDisconnect: (id: string, handle: string) => void; onManageAccess: (account: SocialAccount) => void }) {
  const badge = statusBadge(a.status)
  const isExpiring = a.status === "TOKEN_EXPIRING" || a.status === "ACTION_NEEDED" || a.status === "FAILED"
  const metrics = a.metrics ?? {}

  return (
    <div className={cn(
      "rounded-2xl p-6 flex flex-col justify-between gap-5 transition-all duration-300 relative overflow-hidden bg-card/85 border backdrop-blur-xl",
      isExpiring ? "border-rose-500/40 bg-rose-500/5" : "border-border/25 hover:shadow-xl hover:border-primary/30"
    )}>
      {isExpiring && <div className="absolute -right-10 -bottom-10 w-28 h-28 rounded-full bg-rose-500/10 blur-xl pointer-events-none" />}

      <div className="space-y-4 relative">
        {/* Card header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ring-2 ring-white/70 shadow-sm", a.bg, a.fg)}>
              {(() => {
                const key = a.icon as keyof typeof Icons
                const IconComp = typeof Icons[key] === 'function' ? Icons[key] : null
                return IconComp ? <IconComp className="size-6" /> : <Icons.hub className="size-6" />
              })()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-foreground truncate">{a.handle}</span>
                {(a.status === "SYNCED" || a.status === "LIVE_SYNC") && (
                  <Icons.check className="size-4 text-primary shrink-0" aria-label="verified" />
                )}
              </div>
              <span className="text-xs text-muted-foreground truncate block">{a.name}</span>
            </div>
          </div>
          <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase shrink-0", badge.className)}>
            {badge.dot && <span className={cn("w-2 h-2 rounded-full", badge.dot)} />}
            {badge.label}
          </div>
        </div>

        {/* Followers + growth */}
        <div className="flex items-baseline justify-between pt-1">
          <div>
            <span className="text-2xl font-extrabold text-foreground tabular-nums">{a.fans}</span>
            <span className="text-xs text-muted-foreground ml-1">Followers</span>
          </div>
          {a.growth && (
            <span className={cn(
              "text-[10px] font-bold px-2.5 py-1 rounded-full",
              isExpiring ? "bg-rose-500/15 text-rose-600" : "bg-primary text-primary-foreground/50 text-primary"
            )}>
              {a.growth}
            </span>
          )}
        </div>

        {/* Quick metrics grid */}
        {(metrics.reach || metrics.posts || metrics.likes || metrics.saves || metrics.watchTime || metrics.drift) && (
          <div className="grid grid-cols-3 gap-2 py-3 px-3 rounded-xl bg-secondary/40 border border-white/60">
            {metrics.reach && <MetricCell label="Reach" value={metrics.reach} />}
            {metrics.posts && <MetricCell label="Posts" value={metrics.posts} bordered={!!metrics.reach} />}
            {metrics.likes && <MetricCell label="Avg Likes" value={metrics.likes} bordered={!!metrics.posts} />}
            {metrics.saves && <MetricCell label="Saves" value={metrics.saves} />}
            {metrics.watchTime && <MetricCell label="Watch" value={metrics.watchTime} />}
            {metrics.drift && <MetricCell label="Drift" value={metrics.drift} />}
            {metrics.engagement && <MetricCell label="Engage" value={metrics.engagement} />}
          </div>
        )}

        {/* Warning block for expiring tokens */}
        {isExpiring && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <Icons.warning className="size-4" />
              {a.status === "TOKEN_EXPIRING" ? "Access expires soon" : "Connection needs attention"}
            </div>
            <p className="text-[11px] leading-tight opacity-90">
              Scheduled posts are paused until you reconnect this account.
            </p>
          </div>
        )}

        {/* Token validity row */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
          <span className="flex items-center gap-1">
            <Icons.key className={cn("size-4", isExpiring ? "text-rose-500" : "text-primary")} />
            {a.tokenExpiry ? `Access valid for ${a.tokenExpiry}` : "Access active"}
          </span>
          {a.bandwidth && (
            <span className={cn("text-[10px] font-bold uppercase", isExpiring ? "text-rose-500" : "text-secondary")}>
              {a.bandwidth}
            </span>
          )}
        </div>
      </div>

      {/* Card actions */}
      <div className="pt-4 border-t border-border/20 flex items-center justify-between gap-2 relative">
        {isExpiring ? (
          <button
            onClick={() => toast.error("Reconnect required. Opening authorization...")}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-full bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
          >
            <Icons.warning className="size-4" />
            Reconnect account
          </button>
        ) : (
          <>
            <button
              onClick={() => onManageAccess(a)}
              className="px-4 py-2 rounded-full bg-card border border-border/40 hover:bg-secondary/60 text-foreground text-xs font-semibold transition-all cursor-pointer"
            >
              Manage access
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={`More actions for ${a.handle}`}
                className="p-2.5 rounded-full hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <Icons.more_vert className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => toast.info(`Detailed logs for ${a.handle}`)}>
                  <Icons.monitoring className="size-4 mr-2" />
                  View logs
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.success(`Refreshed ${a.handle}`)}>
                  <Icons.refresh className="size-4 mr-2" />
                  Refresh now
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onManageAccess(a)}>
                  <Icons.shield className="size-4 mr-2" />
                  Manage access
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => onDisconnect(a.id, a.handle)}
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

function MetricCell({ label, value, bordered }: { label: string; value: string; bordered?: boolean }) {
  return (
    <div className={cn("text-center", bordered && "border-l border-border/30")}>
      <span className="text-[10px] text-muted-foreground block">{label}</span>
      <span className="text-sm font-bold text-foreground">{value}</span>
    </div>
  )
}
