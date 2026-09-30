"use client"

import React, { useEffect, useState } from "react"
import { toast } from "sonner"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { ALL_PLATFORMS, type SocialAccount, type SocialClient } from "./social-data"
import { useDialogA11y } from "./use-dialog-a11y"

type Step = "platform" | "details" | "authorizing" | "success"

const PLATFORM_META: Record<string, { icon: string; bg: string; fg: string }> = {
  Instagram: {
    icon: "photo_camera",
    bg: "bg-gradient-to-tr from-amber-400 via-rose-500 to-purple-600",
    fg: "text-white",
  },
  TikTok: {
    icon: "music_note",
    bg: "bg-[hsl(var(--admin-on-surface))]",
    fg: "text-[hsl(var(--brand-accent))]",
  },
  YouTube: { icon: "smart_display", bg: "bg-[#ba1a1a]", fg: "text-white" },
  LinkedIn: { icon: "work", bg: "bg-[hsl(var(--admin-cobalt))]", fg: "text-white" },
  "Twitter / X": {
    icon: "twitter",
    bg: "bg-[hsl(var(--admin-on-surface))]",
    fg: "text-white",
  },
  Threads: {
    icon: "hub",
    bg: "bg-[hsl(var(--admin-on-surface))]",
    fg: "text-white",
  },
  Facebook: { icon: "hub", bg: "bg-[#1877F2]", fg: "text-white" },
}

function PlatformTile({
  platform,
  className,
}: {
  platform: string
  className?: string
}) {
  const meta = PLATFORM_META[platform] ?? {
    icon: "hub",
    bg: "bg-[hsl(var(--admin-on-surface))]",
    fg: "text-white",
  }
  const Cmp = (Icons as Record<string, React.ComponentType<{ className?: string }>>)[
    meta.icon
  ]
  return (
    <div
      className={cn(
        "flex items-center justify-center rounded-xl shadow-sm shrink-0",
        meta.bg,
        meta.fg,
        className
      )}
    >
      {Cmp ? <Cmp className="size-[55%]" /> : <Icons.hub className="size-[55%]" />}
    </div>
  )
}

export function ConnectChannelModal({
  open,
  client,
  existingPlatforms,
  onClose,
  onConnected,
}: {
  open: boolean
  client: SocialClient
  existingPlatforms: string[]
  onClose: () => void
  onConnected: (acc: SocialAccount) => void
}) {
  const [step, setStep] = useState<Step>("platform")
  const [platform, setPlatform] = useState(ALL_PLATFORMS[0])
  const [handle, setHandle] = useState("")
  const [fans, setFans] = useState("")

  // Opsi error handling yang bisa di-toggle
  const [forceError, setForceError] = useState(false)
  const [hasError, setHasError] = useState(false)
  const panelRef = useDialogA11y(open, onClose)

  // Reset the wizard every time it is opened so each session starts clean.
  useEffect(() => {
    if (open) {
      setStep("platform")
      setPlatform(ALL_PLATFORMS[0])
      setHandle("")
      setFans("")
      setForceError(false)
      setHasError(false)
    }
  }, [open])

  // Drive the simulated OAuth handshake: authorizing -> success (or error).
  useEffect(() => {
    if (step !== "authorizing") return
    const t = setTimeout(() => {
      if (forceError) {
        setHasError(true)
        toast.error(`${platform} connection rejected`, {
          description: "OAuth permissions were declined or the account is locked.",
        })
      } else {
        setStep("success")
      }
    }, 1600)
    return () => clearTimeout(t)
  }, [step, forceError, platform])

  if (!open) return null

  const alreadyLinked = existingPlatforms.includes(platform)
  const isValid = handle.trim().length >= 2 // Validasi real-time minimal 2 huruf

  const finish = () => {
    const meta = PLATFORM_META[platform] ?? {
      icon: "hub",
      bg: "bg-[hsl(var(--admin-on-surface))]",
      fg: "text-white",
    }
    onConnected({
      id: `acc-${client.id}-${Date.now()}`,
      platform,
      handle: handle.trim() || "@new.channel",
      fans: fans.trim() ? `${fans.trim()} fans` : "0 fans",
      status: "SYNCED",
      icon: meta.icon,
      bg: meta.bg,
      fg: meta.fg,
    })
    toast.success(`${platform} connected`, {
      description: `${handle.trim() || "@new.channel"} is now linked to ${client.shortName}.`,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 p-4 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[hsl(var(--admin-on-surface))]/40 backdrop-blur-md"
        onClick={step === "authorizing" ? undefined : onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Connect channel to ${client.name}`}
        tabIndex={-1}
        className="relative w-full max-w-lg bg-white/95 backdrop-blur-2xl rounded-2xl border border-white/80 p-5 shadow-2xl space-y-4 outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[hsl(var(--admin-outline-variant))]/30 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[hsl(var(--admin-cobalt))]/15 text-[hsl(var(--admin-cobalt))] flex items-center justify-center">
              <Icons.hub className="size-[18px]" />
            </div>
            <div>
              <h3 className="font-syne font-bold text-[hsl(var(--admin-on-surface))] text-sm">
                Connect Channel to Client
              </h3>
              <p className="text-[11px] text-[hsl(var(--admin-on-surface-variant))]">
                Target client: {client.name}
              </p>
            </div>
          </div>
          {step !== "authorizing" && (
            <button
              aria-label="Close connect channel dialog"
              className="p-1 rounded-full hover:bg-[hsl(var(--admin-surface-high))] text-[hsl(var(--admin-outline))] transition-all cursor-pointer"
              onClick={onClose}
            >
              <Icons.close className="size-[18px]" />
            </button>
          )}
        </div>

        {/* Step rail */}
        {step !== "authorizing" && step !== "success" && (
          <div className="flex items-center gap-2">
            {(["platform", "details"] as const).map((s, i) => (
              <React.Fragment key={s}>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors",
                      step === s
                        ? "bg-[hsl(var(--admin-cobalt))] text-white"
                        : "bg-[hsl(var(--admin-surface-high))] text-[hsl(var(--admin-outline))]"
                    )}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-wide",
                      step === s
                        ? "text-[hsl(var(--admin-on-surface))]"
                        : "text-[hsl(var(--admin-outline))]"
                    )}
                  >
                    {s === "platform" ? "Platform" : "Channel Details"}
                  </span>
                </div>
                {i === 0 && (
                  <div className="flex-1 h-px bg-[hsl(var(--admin-outline-variant))]/40" />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {/* STEP 1 , pick platform */}
        {step === "platform" && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))]">
              Platform Channel
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_PLATFORMS.map((p) => {
                const linked = existingPlatforms.includes(p)
                const selected = platform === p
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPlatform(p)}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer",
                      selected
                        ? "border-[hsl(var(--admin-cobalt))] bg-[hsl(var(--admin-cobalt))]/5 shadow-sm"
                        : "border-[hsl(var(--admin-outline-variant))]/30 hover:border-[hsl(var(--admin-cobalt))]/50 hover:bg-[hsl(var(--admin-surface-low))]/50"
                    )}
                  >
                    <PlatformTile platform={p} className="w-8 h-8" />
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] truncate">
                        {p}
                      </span>
                      <span className="block text-[10px] text-[hsl(var(--admin-outline))]">
                        {linked ? "Already linked" : "Not connected"}
                      </span>
                    </div>
                    {selected && (
                      <Icons.circleCheck className="size-4 text-[hsl(var(--admin-cobalt))] shrink-0" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* STEP 2 , channel details */}
        {step === "details" && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[hsl(var(--admin-surface-low))]/60 border border-[hsl(var(--admin-outline-variant))]/30">
              <PlatformTile platform={platform} className="w-10 h-10" />
              <div>
                <span className="block text-xs font-bold text-[hsl(var(--admin-on-surface))]">
                  {platform}
                </span>
                <span className="block text-[10px] text-[hsl(var(--admin-outline))]">
                  Connecting to {client.name}
                </span>
              </div>
            </div>

            {alreadyLinked && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200">
                <Icons.warning className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 leading-snug">
                  <b>{client.shortName}</b> already has a {platform} channel. Linking
                  another will keep both under the same client.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1">
                  Handle / Channel Name <span className="text-red-500">*</span>
                </label>
                <input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className={cn(
                    "w-full rounded-lg border bg-[hsl(var(--admin-surface-low))] px-3 py-2 text-xs outline-none text-[hsl(var(--admin-on-surface))] focus:ring-2 focus:ring-[hsl(var(--admin-cobalt))]/30 focus:border-[hsl(var(--admin-cobalt))]",
                    !isValid && handle.length > 0
                      ? "border-red-400 focus:border-red-500 focus:ring-red-500/20"
                      : "border-[hsl(var(--admin-outline-variant))]/40"
                  )}
                  placeholder="@username"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))] mb-1">
                  Audience Size
                </label>
                <input
                  value={fans}
                  onChange={(e) => setFans(e.target.value)}
                  className="w-full rounded-lg border border-[hsl(var(--admin-outline-variant))]/40 bg-[hsl(var(--admin-surface-low))] px-3 py-2 text-xs focus:border-[hsl(var(--admin-cobalt))] focus:ring-2 focus:ring-[hsl(var(--admin-cobalt))]/30 outline-none text-[hsl(var(--admin-on-surface))]"
                  placeholder="e.g. 12,400"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-[hsl(var(--admin-surface-low))]/50 border border-[hsl(var(--admin-outline-variant))]/30">
              <Icons.shield className="size-4 text-[hsl(var(--admin-cobalt))] shrink-0" />
              <div>
                <span className="block text-xs font-semibold text-[hsl(var(--admin-on-surface))]">
                  Direct OAuth 2.0 Auth
                </span>
                <span className="block text-[11px] text-[hsl(var(--admin-on-surface-variant))]">
                  Connecting authorizes FRHM to publish posts and fetch real-time
                  engagement telemetry for this client.
                </span>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-[hsl(var(--admin-on-surface))] cursor-pointer">
              <input
                type="checkbox"
                checked={forceError}
                onChange={(e) => setForceError(e.target.checked)}
                className="rounded border-[hsl(var(--admin-outline-variant))] bg-white accent-[hsl(var(--admin-cobalt))]"
              />
              Simulate OAuth rejection (for testing)
            </label>
          </div>
        )}

        {/* STEP 3a , authorizing */}
        {step === "authorizing" && !hasError && (
          <div className="py-8 flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[hsl(var(--admin-cobalt))]/10 flex items-center justify-center">
              <Icons.refresh className="size-6 text-[hsl(var(--admin-cobalt))] animate-spin" />
            </div>
            <div>
              <p className="text-sm font-bold text-[hsl(var(--admin-on-surface))]">
                Opening secure OAuth window…
              </p>
              <p className="text-[11px] text-[hsl(var(--admin-outline))] mt-1">
                Waiting for {platform} to confirm authorization for {client.shortName}.
              </p>
            </div>
            <div className="w-full max-w-xs h-1.5 rounded-full bg-[hsl(var(--admin-surface-high))] overflow-hidden">
              <div className="h-full w-2/3 bg-[hsl(var(--admin-cobalt))] rounded-full animate-pulse" />
            </div>
          </div>
        )}

        {/* STEP 3c , error state (R-27) */}
        {step === "authorizing" && hasError && (
          <div className="py-6 flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
              <Icons.warning className="size-7 text-red-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-[hsl(var(--admin-on-surface))]">
                Connection Rejected
              </p>
              <p className="text-[11px] text-[hsl(var(--admin-outline))] mt-1">
                {platform} denied the OAuth request. The permissions might have been declined or the account is locked.
              </p>
            </div>
          </div>
        )}

        {/* STEP 3b , success */}
        {step === "success" && (
          <div className="py-6 flex flex-col items-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-[hsl(var(--brand-accent))]/20 flex items-center justify-center">
              <Icons.circleCheck className="size-7 text-[#526600]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[hsl(var(--admin-on-surface))]">
                Channel linked successfully
              </p>
              <p className="text-[11px] text-[hsl(var(--admin-outline))] mt-1">
                <b className="text-[hsl(var(--admin-on-surface))]">
                  {handle.trim() || "@new.channel"}
                </b>{" "}
                is now publishing for {client.shortName}.
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[hsl(var(--admin-surface-low))]/60 border border-[hsl(var(--admin-outline-variant))]/30">
              <Icons.zap className="size-3.5 text-[hsl(var(--admin-cobalt))]" />
              <span className="text-[10px] text-[hsl(var(--admin-outline))]">
                Real-time telemetry will start flowing within 60 seconds.
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {step === "platform" && (
            <>
              <button
                className="px-4 py-2 rounded-lg text-xs font-semibold text-[hsl(var(--admin-on-surface))] hover:bg-[hsl(var(--admin-surface-high))] transition-all cursor-pointer"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[hsl(var(--admin-cobalt))] text-white text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
                onClick={() => setStep("details")}
              >
                Continue
              </button>
            </>
          )}

          {step === "details" && (
            <>
              <button
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-[hsl(var(--admin-on-surface))] hover:bg-[hsl(var(--admin-surface-high))] transition-all cursor-pointer"
                onClick={() => setStep("platform")}
              >
                <Icons.arrowLeft className="size-4" />
                Back
              </button>
              <button
                disabled={!isValid}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
                onClick={() => setStep("authorizing")}
              >
                <Icons.link className="size-4" />
                Authorize &amp; Link
              </button>
            </>
          )}

          {step === "authorizing" && (
            <>
              {hasError ? (
                <button
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[hsl(var(--admin-outline-variant))]/40 text-xs font-semibold text-[hsl(var(--admin-on-surface))] hover:bg-[hsl(var(--admin-surface-low))] transition-all cursor-pointer mr-auto"
                  onClick={() => {
                    setHasError(false)
                    setStep("details")
                  }}
                >
                  <Icons.arrowLeft className="size-4" />
                  Try Again
                </button>
              ) : (
                <span className="text-[10px] text-[hsl(var(--admin-outline))] mr-auto">
                  Do not close this window…
                </span>
              )}
            </>
          )}

          {step === "success" && (
            <button
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[hsl(var(--brand-accent))] text-[hsl(var(--brand-accent-foreground))] text-xs font-bold shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
              onClick={finish}
            >
              <Icons.check className="size-4" />
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
