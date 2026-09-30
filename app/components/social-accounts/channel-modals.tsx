"use client"

import React, { useEffect, useState } from "react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import type { SocialAccount, SocialClient } from "./social-data"

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

  if (!open || !account) return null

  const health = tokenHealth(account)
  const expiring = health.level === "expiring"

  return (
    <div className="fixed inset-0 z-50 p-4 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[hsl(var(--admin-on-surface))]/40 backdrop-blur-md"
        onClick={phase === "refreshing" ? undefined : onClose}
      />
      <div className="relative w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-2xl border border-white/80 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[hsl(var(--admin-outline-variant))]/30 pb-3">
          <div className="flex items-center gap-2.5">
            <PlatformTile acc={account} className="w-9 h-9" />
            <div>
              <h3 className="font-syne font-bold text-[hsl(var(--admin-on-surface))] text-sm">
                Token Health
              </h3>
              <p className="text-[10px] text-[hsl(var(--admin-outline))]">
                {account.platform} · {account.handle}
              </p>
            </div>
          </div>
          <button
            className="p-1 rounded-full hover:bg-[hsl(var(--admin-surface-high))] text-[hsl(var(--admin-outline))] transition-all cursor-pointer"
            onClick={onClose}
          >
            <Icons.close className="size-[18px]" />
          </button>
        </div>

        {phase === "done" ? (
          <div className="py-6 flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[hsl(var(--brand-accent))]/20 flex items-center justify-center">
              <Icons.circleCheck className="size-7 text-[#526600]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[hsl(var(--admin-on-surface))]">
                Access token renewed
              </p>
              <p className="text-[11px] text-[hsl(var(--admin-outline))] mt-1">
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
                { label: "Last sync", value: "12 minutes ago" },
                { label: "Granted", value: "OAuth 2.0 · refreshable" },
              ].map((row) => (
                <div
                  key={row.label}
                  className="flex items-center justify-between text-[11px] py-1.5 border-b border-[hsl(var(--admin-outline-variant))]/20 last:border-0"
                >
                  <span className="text-[hsl(var(--admin-outline))]">{row.label}</span>
                  <span className="font-semibold text-[hsl(var(--admin-on-surface))]">
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="flex items-center justify-end gap-2 pt-1">
          {phase === "done" ? (
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
              onClick={onClose}
            >
              <Icons.check className="size-4" />
              Done
            </button>
          ) : (
            <>
              <button
                className="px-4 py-2 rounded-full text-xs font-semibold text-[hsl(var(--admin-on-surface))] hover:bg-[hsl(var(--admin-surface-high))] transition-all cursor-pointer"
                onClick={onClose}
              >
                Close
              </button>
              <button
                disabled={phase === "refreshing"}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[hsl(var(--admin-cobalt))] text-white text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:hover:scale-100"
                onClick={() => {
                  setPhase("refreshing")
                  setTimeout(() => onRefreshed(account.id), 1400)
                }}
              >
                {phase === "refreshing" ? (
                  <>
                    <Icons.refresh className="size-4 animate-spin" />
                    Renewing…
                  </>
                ) : (
                  <>
                    <Icons.refresh className="size-4" />
                    Renew Token
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

/** Slide-in drawer with a short sync history for the selected channel. */
export function ChannelDetailDrawer({
  account,
  client,
  open,
  onClose,
  onManage,
}: {
  account: SocialAccount | null
  client: SocialClient
  open: boolean
  onClose: () => void
  onManage: (account: SocialAccount) => void
}) {
  if (!open || !account) return null

  const events = [
    { icon: "check", tone: "ok", title: "Post published", meta: "Carousel · 2h ago" },
    { icon: "refresh", tone: "info", title: "Metrics synced", meta: "Reach +12.4K · 2h ago" },
    { icon: "sparkles", tone: "info", title: "AI hook generated", meta: "Draft saved · 5h ago" },
    { icon: "check", tone: "ok", title: "Comment auto-replied", meta: "3 replies · 1d ago" },
    { icon: "warning", tone: "warn", title: "Rate limit hit", meta: "Retried OK · 2d ago" },
  ] as const

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-[hsl(var(--admin-on-surface))]/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white/95 backdrop-blur-2xl border-l border-white/80 shadow-2xl p-5 space-y-5 overflow-y-auto">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <PlatformTile acc={account} className="w-11 h-11" />
            <div>
              <h3 className="font-syne font-bold text-[hsl(var(--admin-on-surface))]">
                {account.platform}
              </h3>
              <p className="text-[11px] text-[hsl(var(--admin-outline))]">
                {account.handle}
              </p>
            </div>
          </div>
          <button
            className="p-1 rounded-full hover:bg-[hsl(var(--admin-surface-high))] text-[hsl(var(--admin-outline))] transition-all cursor-pointer"
            onClick={onClose}
          >
            <Icons.close className="size-[18px]" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "Followers", value: account.fans.replace(/ (fans|subs|peers|devs)$/, "") },
            { label: "Eng. Rate", value: "4.8%" },
            { label: "Posts / wk", value: "9" },
          ].map((m) => (
            <div
              key={m.label}
              className="p-3 rounded-xl bg-[hsl(var(--admin-surface-low))]/70 border border-[hsl(var(--admin-outline-variant))]/30 text-center"
            >
              <span className="block text-sm font-bold text-[hsl(var(--admin-on-surface))]">
                {m.value}
              </span>
              <span className="block text-[9px] font-bold uppercase tracking-wide text-[hsl(var(--admin-outline))] mt-0.5">
                {m.label}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 p-3 rounded-xl bg-[hsl(var(--admin-surface-low))]/60 border border-[hsl(var(--admin-outline-variant))]/30">
          <div className="w-6 h-6 rounded-lg bg-[hsl(var(--admin-cobalt))] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
            {client.initials}
          </div>
          <span className="text-[11px] text-[hsl(var(--admin-outline))]">
            Managed under{" "}
            <b className="text-[hsl(var(--admin-on-surface))]">{client.shortName}</b>
          </span>
        </div>

        <div>
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--admin-outline))] mb-2">
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
                  className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-[hsl(var(--admin-surface-low))] transition-colors"
                >
                  <div
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                      e.tone === "ok" && "bg-emerald-100 text-emerald-700",
                      e.tone === "info" && "bg-[hsl(var(--admin-cobalt))]/10 text-[hsl(var(--admin-cobalt))]",
                      e.tone === "warn" && "bg-amber-100 text-amber-700"
                    )}
                  >
                    {IconCmp ? <IconCmp className="size-3.5" /> : <Icons.hub className="size-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <span className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] truncate">
                      {e.title}
                    </span>
                    <span className="block text-[10px] text-[hsl(var(--admin-outline))]">
                      {e.meta}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() =>
              window.open(
                `https://www.google.com/search?q=${encodeURIComponent(
                  account.platform + " " + account.handle
                )}`,
                "_blank",
                "noopener,noreferrer"
              )
            }
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full border border-[hsl(var(--admin-outline-variant))]/40 text-xs font-semibold text-[hsl(var(--admin-on-surface))] hover:bg-[hsl(var(--admin-surface-low))] transition-all cursor-pointer"
          >
            <Icons.externalLink className="size-3.5" />
            Open profile
          </button>
          <button
            onClick={() => onManage(account)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-[hsl(var(--admin-cobalt))] text-white text-xs font-bold hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <Icons.settings className="size-3.5" />
            Manage
          </button>
        </div>
      </div>
    </div>
  )
}
