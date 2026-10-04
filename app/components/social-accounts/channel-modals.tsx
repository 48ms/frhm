"use client"

import React, { useEffect, useState } from "react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import type { SocialAccount, SocialClient } from "./social-data"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"

function PlatformTile({
  acc,
  className,
}: {
  acc: SocialAccount
  className?: string
}) {
  const Cmp = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[
    acc.icon
  ]
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl shadow-sm shrink-0",
        acc.bg,
        acc.fg,
        className
      )}
    >
      {Cmp ? <Cmp className="size-[55%]" /> : <Icons.hub className="size-[55%]" />}
    </div>
  )
}

/** Simulated token health: derives a plausible expiry from the account id. */
function tokenHealth(acc: SocialAccount) {
  const seed = acc.id.split("").reduce((n, c) => n + c.charCodeAt(0), 0)
  const days = seed % 60
  if (days < 7) return { level: "expiring" as const, days }
  return { level: "healthy" as const, days }
}

/** Stable per-account metrics derived from the id, so one account always shows the same numbers. */
function accountMetrics(acc: SocialAccount) {
  const seed = acc.id
    .split("")
    .reduce((n, c) => n + c.charCodeAt(0), 0)
  const fansDigits = parseInt(
    acc.fans.replace(/[^0-9]/g, ""),
    10
  )
  const actualFans = isNaN(fansDigits) ? 428 : fansDigits
  const engRate = ((seed % 73) / 10 + 1.2).toFixed(1)
  const postsPerWeek = (seed % 12) + 3
  const minutesAgo = seed % 90
  return {
    fans: actualFans,
    engRate,
    postsPerWeek,
    minutesAgo,
  }
}

/** Recent activity events derived deterministically from the account id. */
function recentEvents(acc: SocialAccount) {
  const seed = acc.id
    .split("")
    .reduce((n, c) => n + c.charCodeAt(0), 0)
  const templates = [
    { icon: "check", tone: "ok", title: "Post published", meta: "Carousel · " },
    { icon: "refresh", tone: "info", title: "Metrics synced", meta: "Reach " },
    { icon: "sparkles", tone: "info", title: "AI hook generated", meta: "Draft saved · " },
    { icon: "check", tone: "ok", title: "Comment auto-replied", meta: "" },
    { icon: "warning", tone: "warn", title: "Rate limit hit", meta: "Retried OK · " },
  ] as const
  return Array.from({ length: 5 }, (_, i) => {
    const t = templates[(seed + i) % templates.length]
    const time = (seed + i * 3) % 48
    const extra = time < 1 ? "now" : time === 1 ? "1h ago" : `${time}h ago`
    const meta = t.meta + extra
    return { ...t, meta }
  })
}

export function TokenHealthModal({
  account,
  client,
  open,
  onClose,
  onRefreshed,
}: {
  account: SocialAccount | null
  client: SocialClient
  open: boolean
  onClose: () => void
  onRefreshed: (id: string) => void
}) {
  const [phase, setPhase] = useState<"idle" | "refreshing" | "done">("idle")

  useEffect(() => {
    if (open) setPhase("idle")
  }, [open, account?.id])

  useEffect(() => {
    if (phase !== "refreshing") return
    const t = setTimeout(() => setPhase("done"), 1400)
    return () => clearTimeout(t)
  }, [phase])

  if (!account) return null

  const health = tokenHealth(account)
  const expiring = health.level === "expiring"
  const metrics = accountMetrics(account)

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent showCloseButton className="max-w-md p-0 overflow-hidden">
        <DialogHeader className="px-5 py-4 border-b flex-row items-center gap-2.5">
          <PlatformTile acc={account} className="w-9 h-9" />
          <div>
            <DialogTitle className="font-syne font-bold text-sm">
              Token Health
            </DialogTitle>
            <DialogDescription className="text-[10px]">
              {account.platform} · {account.handle}
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="px-5 py-4 space-y-4">
          {phase === "done" ? (
            <div className="py-6 flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                <Icons.circleCheck className="size-7 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  Access token renewed
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  {account.handle} is reconnected. Next refresh in 60 days.
                </p>
              </div>
            </div>
          ) : (
            <>
              <div
                className={cn(
                  "flex items-start gap-2.5 p-3 rounded-xl border",
                  expiring
                    ? "bg-amber-50 border-amber-200"
                    : "bg-emerald-50 border-emerald-200"
                )}
              >
                {expiring ? (
                  <Icons.warning className="size-4 text-amber-600 shrink-0 mt-0.5" />
                ) : (
                  <Icons.badgeCheck className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <span
                    className={cn(
                      "block text-xs font-bold",
                      expiring ? "text-amber-800" : "text-emerald-800"
                    )}
                  >
                    {expiring ? "Expires soon" : "Token healthy"}
                  </span>
                  <span
                    className={cn(
                      "block text-[11px] leading-snug",
                      expiring ? "text-amber-700" : "text-emerald-700"
                    )}
                  >
                    {expiring
                      ? `This ${account.platform} token expires in ${health.days} day${
                          health.days === 1 ? "" : "s"
                        }. Renew now to avoid an interruption in scheduled publishing.`
                      : `This ${account.platform} token is valid for another ${health.days} days. No action needed.`}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  { label: "Client", value: client.name },
                  { label: "Scope", value: "publish, insights, comments" },
                  { label: "Last sync", value: metrics.minutesAgo === 0 ? "Just now" : `${metrics.minutesAgo}m ago` },
                  { label: "Granted", value: "OAuth 2.0 · refreshable" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between text-[11px] py-1.5 border-b border-border last:border-0"
                  >
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className="font-semibold text-foreground">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex-row justify-end gap-2 px-5 py-4">
          {phase === "done" ? (
            <Button onClick={onClose} size="sm">
              <Icons.check className="size-4" />
              Done
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" onClick={onClose}>
                Close
              </Button>
              <Button
                size="sm"
                disabled={phase === "refreshing"}
                onClick={() => {
                  setPhase("refreshing")
                  setTimeout(() => onRefreshed(account.id), 1400)
                }}
              >
                <Icons.refresh className={cn("size-4", phase === "refreshing" && "animate-spin")} />
                {phase === "refreshing" ? "Renewing…" : "Renew Token"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Slide-in drawer with sync history for the selected channel. */
export function ChannelDetailDrawer({
  account,
  client,
  open,
  onClose,
  onManage,
  onReconnect,
}: {
  account: SocialAccount | null
  client: SocialClient
  open: boolean
  onClose: () => void
  onManage: (account: SocialAccount) => void
  onReconnect: (account: SocialAccount) => void
}) {
  const isSynced = account?.status === "SYNCED"
  const metrics = account ? accountMetrics(account) : null
  const events = account ? recentEvents(account) : []

  return (
    <Sheet open={open && !!account} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="right" showCloseButton className="w-full sm:max-w-md p-5 space-y-5 overflow-y-auto">
        {account && metrics && (
          <>
            <SheetHeader className="p-0">
              <div className="flex items-center gap-3">
                <PlatformTile acc={account} className="w-11 h-11" />
                <div>
                  <SheetTitle className="font-syne font-bold">
                    {account.platform}
                  </SheetTitle>
                  <SheetDescription className="text-[11px]">
                    {account.handle}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Followers", value: String(metrics.fans) },
                { label: "Eng. Rate", value: `${metrics.engRate}%` },
                { label: "Posts / wk", value: String(metrics.postsPerWeek) },
              ].map((m) => (
                <div
                  key={m.label}
                  className="p-3 rounded-xl bg-muted/70 border border-border text-center"
                >
                  <span className="block text-sm font-bold text-foreground">
                    {m.value}
                  </span>
                  <span className="block text-[9px] font-bold uppercase tracking-wide text-muted-foreground mt-0.5">
                    {m.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/60 border border-border">
              <div className="w-6 h-6 rounded-lg bg-primary text-primary-foreground flex items-center justify-center text-[10px] font-bold shrink-0">
                {client.initials}
              </div>
              <span className="text-[11px] text-muted-foreground">
                Managed under{" "}
                <b className="text-foreground">{client.shortName}</b>
              </span>
            </div>

            <div>
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                Recent Activity
              </h4>
              <div className="space-y-1">
                {events.map((e, i) => {
                  const IconCmp = (
                    Icons as Record<string, React.ComponentType<{ className?: string }>>
                  )[e.icon]
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted transition-colors"
                    >
                      <div
                        className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                          e.tone === "ok" && "bg-emerald-100 text-emerald-700",
                          e.tone === "info" && "bg-primary/10 text-primary",
                          e.tone === "warn" && "bg-amber-100 text-amber-700"
                        )}
                      >
                        {IconCmp ? <IconCmp className="size-3.5" /> : <Icons.hub className="size-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <span className="block text-xs font-semibold text-foreground truncate">
                          {e.title}
                        </span>
                        <span className="block text-[10px] text-muted-foreground">
                          {e.meta}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {!isSynced && (
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-red-50 border border-red-200">
                <Icons.warning className="size-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-bold text-red-800">Action needed</p>
                  <p className="text-[11px] text-red-700 mt-0.5">
                    This channel stopped syncing. Publishing is paused until you
                    reconnect the account.
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-full"
                onClick={() =>
                  window.open(
                    `https://www.google.com/search?q=${encodeURIComponent(
                      account.platform + " " + account.handle
                    )}`,
                    "_blank",
                    "noopener,noreferrer"
                  )
                }
              >
                <Icons.externalLink className="size-3.5" />
                Open profile
              </Button>
              {isSynced ? (
                <Button
                  size="sm"
                  className="flex-1 rounded-full"
                  onClick={() => onManage(account)}
                >
                  <Icons.settings className="size-3.5" />
                  Manage
                </Button>
              ) : (
                <Button
                  size="sm"
                  className="flex-1 rounded-full bg-red-600 text-white hover:bg-red-700"
                  onClick={() => onReconnect(account)}
                >
                  <Icons.refresh className="size-3.5" />
                  Reconnect
                </Button>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  )
}
