"use client"

import * as React from "react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"

import type { ClientChannel } from "@/features/social-accounts/api/types"
import { PLATFORM_SCOPES } from "./social-scopes"
import { toast } from "sonner"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"

type PlatformId = "Instagram" | "TikTok" | "YouTube" | "LinkedIn" | "Twitter" | "Facebook"
const ALL_PLATFORMS: PlatformId[] = ["Instagram", "TikTok", "YouTube", "LinkedIn", "Twitter", "Facebook"]

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
    available: true,
    icon: "play",
    iconClass: "text-red-500",
    blurb: "Long-form, Shorts and Studio analytics",
  },
  LinkedIn: {
    available: true,
    icon: "building",
    iconClass: "text-sky-600",
    blurb: "Company pages and sponsored content",
  },
  Twitter: {
    available: true,
    icon: "twitter",
    iconClass: "text-foreground",
    blurb: "Posts, threads and audience insights",
  },
  Facebook: {
    available: true,
    icon: "facebook",
    iconClass: "text-blue-600",
    blurb: "Pages, groups and ads",
  },
}

function platformIcon(name: string) {
  return (Icons as Record<string, React.ComponentType<{ className?: string }>>)[name]
}



export interface ConnectChannelModalProps {
  open?: boolean
  /** Legacy alias for `open`. */
  isOpen?: boolean
  client?: { id: string; name?: string; [key: string]: any }
  /** Legacy alias for `client`. */
  clientId?: string
  /** Already-connected platforms; only used to mark tiles as "Connected". */
  existingPlatforms?: string[]
  onClose: () => void
}



export function ConnectChannelModal({
  open,
  isOpen,
  client,
  clientId,
  existingPlatforms = [],
  onClose,
}: ConnectChannelModalProps) {
  const visible = isOpen ?? open ?? false
  const activeClientId = clientId ?? client?.id ?? ""

  const [loadingPlatform, setLoadingPlatform] = React.useState<PlatformId | null>(null)

  const reset = React.useCallback(() => {
    setLoadingPlatform(null)
  }, [])

  const close = React.useCallback(() => {
    onClose()
    window.setTimeout(reset, 150)
  }, [onClose, reset])

  const handleStartOAuth = async (selectedPlatform: PlatformId) => {
    if (!activeClientId) return
    setLoadingPlatform(selectedPlatform)

    try {
      const res = await fetch('/api/social/oauth-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: activeClientId, platform: selectedPlatform })
      })
      const data = await res.json()

      if (data.url) {
        // Redirect user to Ayrshare OAuth URL
        window.location.href = data.url
      } else {
        throw new Error(data.error || 'Failed to get OAuth URL')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error connecting to provider')
      setLoadingPlatform(null)
    }
  }



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
        <DialogHeader className="p-6 border-b shrink-0">
          <DialogTitle className="text-xl font-bold">Connect social account</DialogTitle>
          <DialogDescription className="text-xs">
            Link an account to this workspace by signing in securely through the platform.
          </DialogDescription>
        </DialogHeader>

        <div 
          className="p-6 overflow-y-auto max-h-[60vh] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
          tabIndex={0}
          role="region"
          aria-label="Form content area"
        >
          {/* Choose platform */}
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <p className="text-sm font-medium text-muted-foreground">
                Choose a platform to connect
              </p>
              <div className="grid grid-cols-2 gap-3">
                {ALL_PLATFORMS.map((p) => {
                  const m = PLATFORM_META[p]
                  const Icon = platformIcon(m.icon)
                  const already = existingPlatforms.some((ep) => ep.toLowerCase() === p.toLowerCase())
                  const disabled = !m.available
                  const isLoading = loadingPlatform === p

                  return (
                    <button
                      key={p}
                      type="button"
                      disabled={disabled || isLoading}
                      aria-disabled={disabled || isLoading}
                      onClick={() => handleStartOAuth(p)}
                      className={cn(
                        "relative flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-300",
                        disabled
                          ? "cursor-not-allowed border-dashed border-border opacity-50 bg-muted/20 grayscale"
                          : "cursor-pointer border-border bg-card hover:border-primary/30 hover:shadow-lg hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      )}
                    >
                      <div className="flex w-full items-center justify-between">
                        <div className={cn(
                          "flex size-11 items-center justify-center rounded-xl transition-colors",
                          disabled ? "bg-muted" : "bg-primary/5 shadow-sm"
                        )}>
                          {isLoading ? (
                            <Icons.spinner className="size-6 animate-spin text-primary" />
                          ) : Icon ? (
                            <Icon className={cn("size-6", m.iconClass, !disabled && "drop-shadow-sm")} />
                          ) : (
                            <Icons.hub className="size-6 text-primary drop-shadow-sm" />
                          )}
                        </div>
                        {already && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                            <Icons.check className="size-3" />
                            Connected
                          </span>
                        )}
                      </div>
                      <div className="space-y-0.5 min-w-0 w-full">
                        <span className="flex items-center gap-1.5 text-sm font-bold min-w-0">
                          <span className="truncate">{p}</span>
                          {disabled && (
                            <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground shrink-0">
                              Soon
                            </span>
                          )}
                        </span>
                        <span className="block text-[11px] leading-snug text-muted-foreground line-clamp-2">
                          {m.blurb}
                        </span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
