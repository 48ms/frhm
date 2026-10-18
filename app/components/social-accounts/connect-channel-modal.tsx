"use client"

import * as React from "react"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { requestOAuthUrl } from "@/features/social-accounts/api/service"
import { useConnectChannel } from "@/features/social-accounts/api/queries"

import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/animate-ui/components/radix/dialog"

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
    iconClass: "text-destructive",
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
    icon: "youtube",
    iconClass: "text-[hsl(var(--platform-youtube))]",
    blurb: "Long-form, Shorts and Studio analytics",
  },
  LinkedIn: {
    available: true,
    icon: "linkedin",
    iconClass: "text-[hsl(var(--platform-linkedin))]",
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
    iconClass: "text-[hsl(var(--platform-facebook))]",
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
  const [selectedDirectPlatform, setSelectedDirectPlatform] = React.useState<PlatformId>("Instagram")
  const [handleInput, setHandleInput] = React.useState("")
  const [noteInput, setNoteInput] = React.useState("")

  const connectMutation = useConnectChannel()

  const reset = React.useCallback(() => {
    setLoadingPlatform(null)
    setHandleInput("")
    setNoteInput("")
  }, [])

  const close = React.useCallback(() => {
    onClose()
    window.setTimeout(reset, 150)
  }, [onClose, reset])

  const handleStartOAuth = async (selectedPlatform: PlatformId) => {
    if (!activeClientId) return
    setLoadingPlatform(selectedPlatform)

    try {
      const { url } = await requestOAuthUrl({
        clientId: activeClientId,
        platform: selectedPlatform,
      })
      // Redirect user to Ayrshare OAuth URL or internal bridge callback
      window.location.href = url
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error connecting to provider')
      setLoadingPlatform(null)
    }
  }

  const handleDirectConnect = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!activeClientId) {
      toast.error("Client ID tidak valid")
      return
    }

    const trimmed = handleInput.trim()
    if (!trimmed) {
      toast.error("Masukkan username atau handle akun sosial")
      return
    }

    const formattedHandle = trimmed.startsWith("@") || trimmed.includes(" ")
      ? trimmed
      : `@${trimmed}`

    try {
      await connectMutation.mutateAsync({
        clientId: activeClientId,
        platform: selectedDirectPlatform.toLowerCase(),
        handle: formattedHandle,
        note: noteInput.trim() || undefined,
      })
      toast.success(`Akun ${selectedDirectPlatform} ${formattedHandle} berhasil terhubung!`)
      close()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menghubungkan akun")
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
        className="max-w-xl bg-card/95 backdrop-blur-2xl rounded-3xl border border-border/40 p-0 shadow-2xl gap-0 overflow-hidden"
        aria-label="Connect social account"
      >
        <DialogHeader className="p-6 border-b shrink-0">
          <DialogTitle className="text-xl font-bold">Hubungkan Akun Sosial</DialogTitle>
          <DialogDescription className="text-xs">
            Tautkan akun media sosial ke workspace ini secara aman melalui otorisasi platform resmi.
          </DialogDescription>
        </DialogHeader>

        <div 
          className="p-6 overflow-y-auto max-h-[70vh] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset space-y-6"
          tabIndex={0}
          role="region"
          aria-label="Form content area"
        >
          {/* Quick Direct Connect Section */}
          <div className="rounded-2xl border border-border/60 bg-muted/20 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Icons.hub className="size-3.5 text-primary" />
                Hubungkan Akun Langsung (Direct Connect)
              </span>
              <span className="text-2xs text-muted-foreground">Instan & Verifikasi Langsung</span>
            </div>

            <form onSubmit={handleDirectConnect} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="sm:col-span-1">
                  <label htmlFor="direct-platform-select" className="sr-only">Platform</label>
                  <select
                    id="direct-platform-select"
                    value={selectedDirectPlatform}
                    onChange={(e) => setSelectedDirectPlatform(e.target.value as PlatformId)}
                    className="w-full px-3 py-2 text-sm rounded-xl bg-background border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium transition-all"
                    aria-label="Pilih platform untuk direct connect"
                  >
                    <option value="Instagram">IG</option>
                    <option value="TikTok">TT</option>
                    <option value="YouTube">YT</option>
                    <option value="LinkedIn">LI</option>
                    <option value="Twitter">X / TW</option>
                    <option value="Facebook">FB</option>
                  </select>
                </div>

                <div className="sm:col-span-2 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground select-none">
                    @
                  </span>
                  <input
                    type="text"
                    value={handleInput.replace(/^@/, '')}
                    onChange={(e) => setHandleInput(e.target.value)}
                    placeholder={
                      selectedDirectPlatform === "Instagram" ? "taraju_coffee" :
                      selectedDirectPlatform === "TikTok" ? "frhm.studio" :
                      selectedDirectPlatform === "YouTube" ? "taraju_official" :
                      selectedDirectPlatform === "Twitter" ? "frhm_id" :
                      "nama_akun"
                    }
                    className="w-full pl-7 pr-3 py-2 text-sm rounded-xl bg-background border border-border/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={connectMutation.isPending || !handleInput.trim()}
                  className="w-full rounded-xl font-medium shadow-sm"
                >
                  {connectMutation.isPending ? (
                    <Icons.spinner className="size-4 animate-spin mr-1.5" />
                  ) : (
                    <Icons.add className="size-4 mr-1.5" />
                  )}
                  <span>Hubungkan</span>
                </Button>
              </div>
            </form>
          </div>

          {/* Choose platform for OAuth / Bridge */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">
                Pilih platform untuk dihubungkan
              </p>
              <span className="text-2xs text-muted-foreground">via OAuth Bridge</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {ALL_PLATFORMS.map((p) => {
                const m = PLATFORM_META[p]
                const Icon = platformIcon(m.icon)
                const already = existingPlatforms.some((ep) => ep.toLowerCase() === p.toLowerCase())
                const disabled = !m.available
                const isLoading = loadingPlatform === p

                return (
                  <Button
                    key={p}
                    type="button"
                    variant="outline"
                    disabled={disabled || isLoading}
                    aria-disabled={disabled || isLoading}
                    onClick={() => handleStartOAuth(p)}
                    className={cn(
                      "relative flex flex-col items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-300 h-auto whitespace-normal font-normal",
                      disabled
                        ? "cursor-not-allowed border-dashed border-border opacity-50 bg-muted/20 grayscale"
                        : "cursor-pointer border-border bg-card hover:border-primary/30 hover:shadow-lg hover:-translate-y-1"
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
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-2xs font-bold text-primary">
                          <Icons.check className="size-3" />
                          Connected
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5 min-w-0 w-full">
                      <span className="flex items-center gap-1.5 text-sm font-bold min-w-0">
                        <span className="truncate">{p}</span>
                        {disabled && (
                          <span className="rounded-full bg-muted px-1.5 py-0.5 text-2xs font-semibold text-muted-foreground shrink-0">
                            Soon
                          </span>
                        )}
                      </span>
                      <span className="block text-1xs leading-snug text-muted-foreground line-clamp-2">
                        {m.blurb}
                      </span>
                    </div>
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

