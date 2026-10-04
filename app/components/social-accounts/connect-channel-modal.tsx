"use client"

import * as React from "react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { ALL_PLATFORMS, type SocialAccount, type SocialClient } from "./social-data"
import { PLATFORM_SCOPES } from "./social-scopes"
import { useAppStore } from "@/lib/store/app-store"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type PlatformId = (typeof ALL_PLATFORMS)[number]

type PlatformMeta = {
  available: boolean
  icon: string
  iconClass: string
  blurb: string
}

/**
 * Platform capability matrix. `available: false` renders a "Coming soon" tile
 * instead of a dead button, so an admin never hits an action that cannot work.
 */
const PLATFORM_META: Record<PlatformId, PlatformMeta> = {
  Instagram: {
    available: true,
    icon: "instagram",
    iconClass: "text-rose-500",
    blurb: "Reels, carousels, stories and insights",
  },
  TikTok: {
    available: true,
    icon: "tiktok",
    iconClass: "text-foreground",
    blurb: "Short video, Spark Ads and analytics",
  },
  YouTube: {
    available: false,
    icon: "play",
    iconClass: "text-red-500",
    blurb: "Long-form, Shorts and Studio analytics",
  },
  LinkedIn: {
    available: false,
    icon: "building",
    iconClass: "text-sky-600",
    blurb: "Company pages and sponsored content",
  },
  Twitter: {
    available: false,
    icon: "twitter",
    iconClass: "text-foreground",
    blurb: "Posts, threads and audience insights",
  },
}

function platformIcon(name: string) {
  return (Icons as Record<string, React.ComponentType<{ className?: string }>>)[name]
}

function accountAppearance(platform: PlatformId) {
  switch (platform) {
    case "Instagram":
      return {
        bg: "bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600",
        fg: "text-white",
        icon: "photo_camera",
      }
    case "TikTok":
      return { bg: "bg-foreground", fg: "text-background", icon: "music_note" }
    case "YouTube":
      return { bg: "bg-red-600", fg: "text-white", icon: "play" }
    case "LinkedIn":
      return { bg: "bg-sky-700", fg: "text-white", icon: "building" }
    default:
      return { bg: "bg-foreground", fg: "text-background", icon: "twitter" }
  }
}

const CONNECT_STAGES = [
  "Opening a secure OAuth window…",
  "Waiting for authorization on the platform…",
  "Exchanging the code for an access token…",
  "Syncing profile, permissions & webhooks…",
] as const

export interface ConnectChannelModalProps {
  open?: boolean
  /** Legacy alias for `open`. */
  isOpen?: boolean
  client?: SocialClient
  /** Legacy alias for `client`. */
  clientId?: string
  /** Already-connected platforms; only used to mark tiles as "Connected". */
  existingPlatforms?: string[]
  /** Fired after a channel is committed to the store. */
  onConnected?: (acc: SocialAccount) => void
  onClose: () => void
}

type Step = "platform" | "authorize" | "connecting" | "success"

export function ConnectChannelModal({
  open,
  isOpen,
  client,
  clientId,
  existingPlatforms = [],
  onConnected,
  onClose,
}: ConnectChannelModalProps) {
  const visible = isOpen ?? open ?? false
  const activeClientId = clientId ?? client?.id ?? ""

  const [step, setStep] = React.useState<Step>("platform")
  const [platform, setPlatform] = React.useState<PlatformId | null>(null)
  const [handle, setHandle] = React.useState("")
  const [stage, setStage] = React.useState(0)
  const [connected, setConnected] = React.useState<SocialAccount | null>(null)
  const finalized = React.useRef(false)

  const addAccount = useAppStore((state) => state.addSocialAccount)

  const reset = React.useCallback(() => {
    setStep("platform")
    setPlatform(null)
    setHandle("")
    setStage(0)
    setConnected(null)
    finalized.current = false
  }, [])

  const close = React.useCallback(() => {
    onClose()
    window.setTimeout(reset, 150)
  }, [onClose, reset])

  const handleStartOAuth = async () => {
    if (!platform || !activeClientId) return
    try {
      const res = await fetch("/api/social/oauth-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId: activeClientId, platform }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        toast.error(data.error || "Failed to generate OAuth URL")
      }
    } catch {
      toast.error("Network error while starting OAuth")
    }
  }

  const meta = platform ? PLATFORM_META[platform] : null
  const canAuthorize = !!handle.trim()

  return (
    <Dialog
      open={visible}
      onOpenChange={(o) => {
        if (!o) close()
      }}
    >
      <DialogContent
        showCloseButton
        className="max-w-lg gap-0 overflow-hidden p-0"
        aria-label="Connect new channel"
      >
        <DialogHeader className="p-6 border-b">
          <DialogTitle className="text-xl font-bold">Connect a channel</DialogTitle>
          <DialogDescription className="text-xs">
            Link a social account to this workspace through the platform&apos;s own sign-in.
          </DialogDescription>
        </DialogHeader>

        <div className="p-6">
          {/* Choose platform */}
          {step === "platform" && (
            <div className="space-y-4">
              <p className="text-sm font-medium text-muted-foreground">
                Select a platform to authenticate:
              </p>
              <div className="grid grid-cols-2 gap-3">
                {ALL_PLATFORMS.map((p) => {
                  const m = PLATFORM_META[p]
                  const Icon = platformIcon(m.icon)
                  const already = existingPlatforms.includes(p)
                  const disabled = !m.available
                  return (
                    <button
                      key={p}
                      type="button"
                      disabled={disabled}
                      aria-disabled={disabled}
                      onClick={() => {
                        setPlatform(p)
                        setStep("authorize")
                      }}
                      className={cn(
                        "relative flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all",
                        disabled
                          ? "cursor-not-allowed border-dashed border-border opacity-60"
                          : "cursor-pointer border-border hover:border-primary hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      )}
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
                          {Icon ? (
                            <Icon className={cn("size-6", m.iconClass)} />
                          ) : (
                            <Icons.hub className="size-6 text-primary" />
                          )}
                        </div>
                        {already && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                            <Icons.check className="size-3" />
                            Connected
                          </span>
                        )}
                      </div>
                      <div className="space-y-0.5">
                        <span className="flex items-center gap-1.5 text-sm font-bold">
                          {p}
                          {disabled && (
                            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                              Soon
                            </span>
                          )}
                        </span>
                        <span className="block text-[11px] leading-snug text-muted-foreground">
                          {m.blurb}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Review scopes and enter the handle */}
          {step === "authorize" && meta && platform && (
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => setStep("platform")}
                className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-primary hover:underline"
              >
                <Icons.chevronLeft className="size-3" /> Back to platform
              </button>

              <div className="flex items-center gap-3 rounded-2xl border border-border bg-muted/40 p-3">
                <div className="flex size-10 items-center justify-center rounded-xl bg-muted">
                  {(() => {
                    const Icon = platformIcon(meta.icon)
                    return Icon ? <Icon className={cn("size-5", meta.iconClass)} /> : null
                  })()}
                </div>
                <div>
                  <p className="text-sm font-bold">{platform}</p>
                  <p className="text-[11px] text-muted-foreground">{meta.blurb}</p>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="connect-handle" className="text-sm font-bold">
                  Account handle
                </label>
                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">
                    @
                  </span>
                  <input
                    id="connect-handle"
                    type="text"
                    value={handle}
                    onChange={(e) => setHandle(e.target.value.replace(/@/g, ""))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && canAuthorize) setStep("connecting")
                    }}
                    placeholder="username"
                    className="w-full rounded-xl border border-input bg-background py-3 pl-8 pr-4 font-medium outline-none focus:ring-2 focus:ring-ring"
                    autoFocus
                  />
                </div>
                <p className="px-1 text-[10px] italic text-muted-foreground">
                  The account must have a Professional / Business profile.
                </p>
              </div>

              <div className="space-y-2 rounded-2xl border border-border p-4">
                <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                  <Icons.shield className="size-3.5" />
                  Permissions requested
                </p>
                <ul className="space-y-1.5">
                  {(PLATFORM_SCOPES[platform] ?? []).map((scope) => (
                    <li key={scope.id} className="flex items-center gap-2 text-xs">
                      <Icons.check className="size-3.5 shrink-0 text-emerald-600" />
                      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                        {scope.id}
                      </code>
                      <span className="text-muted-foreground">{scope.description}</span>
                    </li>
                  ))}
                </ul>
                <p className="pt-1 text-[10px] leading-snug text-muted-foreground">
                  You approve these on {platform}&apos;s own sign-in page. Frahma never
                  sees or stores your password.
                </p>
              </div>
            </div>
          )}

          {/* Connecting progress */}
          {step === "connecting" && platform && (
            <div className="space-y-5 py-2">
              <div className="flex items-center gap-3">
                <div className="flex size-11 items-center justify-center rounded-xl bg-muted">
                  {(() => {
                    const Icon = platformIcon(meta!.icon)
                    return Icon ? <Icon className={cn("size-6", meta!.iconClass)} /> : null
                  })()}
                </div>
                <div>
                  <p className="text-sm font-bold">Connecting {platform}</p>
                  <p className="text-[11px] text-muted-foreground">
                    @{handle.replace(/@/g, "")}
                  </p>
                </div>
              </div>

              <ol className="space-y-3" aria-live="polite">
                {CONNECT_STAGES.map((label, i) => {
                  const done = i < stage
                  const active = i === stage
                  return (
                    <li key={label} className="flex items-center gap-3 text-xs">
                      <span
                        className={cn(
                          "flex size-5 shrink-0 items-center justify-center rounded-full border",
                          done && "border-emerald-500 bg-emerald-500 text-white",
                          active && "border-primary text-primary",
                          !done && !active && "border-border text-muted-foreground"
                        )}
                      >
                        {done ? (
                          <Icons.check className="size-3" />
                        ) : active ? (
                          <Icons.spinner className="size-3 animate-spin" />
                        ) : (
                          <span className="size-1.5 rounded-full bg-current" />
                        )}
                      </span>
                      <span
                        className={cn(
                          done && "text-foreground",
                          active && "font-semibold text-foreground",
                          !done && !active && "text-muted-foreground"
                        )}
                      >
                        {label}
                      </span>
                    </li>
                  )
                })}
              </ol>

              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{
                    width: `${Math.min(100, (stage / CONNECT_STAGES.length) * 100)}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Success */}
          {step === "success" && connected && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="flex size-14 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                <Icons.circleCheck className="size-7" />
              </div>
              <div className="space-y-1">
                <p className="text-base font-bold">Channel connected</p>
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">{connected.handle}</span>{" "}
                  is now syncing under this workspace.
                </p>
              </div>
              <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-[11px] text-muted-foreground">
                <Icons.shield className="size-3.5 text-emerald-600" />
                Access token stored encrypted, refreshed automatically
              </div>
            </div>
          )}
        </div>

        {/* Footer actions per step */}
        <DialogFooter className="flex-row justify-end gap-2 px-6 py-4">
          {step === "platform" && (
            <Button variant="outline" onClick={close}>
              Cancel
            </Button>
          )}

          {step === "authorize" && (
            <>
              <Button variant="outline" onClick={() => setStep("platform")}>
                Back
              </Button>
              <Button
                disabled={!canAuthorize}
                className="disabled:opacity-50"
                onClick={() => {
                  setStage(0)
                  finalized.current = false
                  setStep("connecting")
                  void handleStartOAuth()
                }}
              >
                <Icons.check className="size-4" />
                Authorize connection
              </Button>
            </>
          )}

          {step === "connecting" && (
            <Button variant="outline" disabled>
              <Icons.spinner className="size-4 animate-spin" />
              Please wait…
            </Button>
          )}

          {step === "success" && (
            <>
              <Button variant="outline" onClick={reset}>
                <Icons.add className="size-4" />
                Connect another
              </Button>
              <Button onClick={close}>
                <Icons.check className="size-4" />
                Done
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
