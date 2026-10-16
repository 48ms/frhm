"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { useActiveDashboard } from "./dashboard-data"
import { StitchAiHookModal } from "./ai-hook-modal"
import { ConnectChannelModal } from "@/components/social-accounts/connect-channel-modal"
import { useDisconnectChannel } from "@/features/social-accounts/api/queries"
import { toast } from "sonner"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/animate-ui/components/radix/tooltip"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/animate-ui/components/radix/alert-dialog"
import { Button } from "@/components/ui/button"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"

export function getPlatformMeta(platform: string) {
  const p = (platform || "").toLowerCase()
  if (p.includes("instagram")) {
    return {
      label: "Instagram",
      icon: Icons.instagram,
      bg: "bg-[hsl(var(--platform-instagram,340_80%_55%))]",
    }
  }
  if (p.includes("tiktok")) {
    return {
      label: "TikTok",
      icon: Icons.tiktok,
      bg: "bg-[hsl(var(--platform-tiktok,180_100%_40%))]",
    }
  }
  if (p.includes("youtube")) {
    return {
      label: "YouTube",
      icon: Icons.youtube,
      bg: "bg-[hsl(var(--platform-youtube,0_85%_50%))]",
    }
  }
  if (p.includes("twitter") || p === "x") {
    return {
      label: "Twitter / X",
      icon: Icons.twitter,
      bg: "bg-foreground text-background",
    }
  }
  if (p.includes("linkedin")) {
    return {
      label: "LinkedIn",
      icon: Icons.linkedin,
      bg: "bg-[hsl(var(--platform-linkedin,210_80%_45%))]",
    }
  }
  return {
    label: platform || "Saluran",
    icon: Icons.hub,
    bg: "bg-brand-accent",
  }
}

const CHANNEL_STATUS_STYLES: Record<string, { label: string; pill: string }> = {
  terhubung: {
    label: "Terhubung",
    pill: "bg-brand-accent/20 text-brand-accent",
  },
  menunggu: {
    label: "Menunggu",
    pill: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
  },
  terputus: {
    label: "Terputus",
    pill: "bg-muted text-muted-foreground",
  },
  gagal: {
    label: "Gagal",
    pill: "bg-destructive/15 text-destructive",
  },
}

export function DashboardStitchConnectedHub() {
  const router = useRouter()
  const { client, clientId, profile } = useActiveDashboard()
  
  // Data FAKTUAL dari tabel client_channels (PostgreSQL Supabase)
  const channels = client.channels ?? []
  
  const [aiOpen, setAiOpen] = useState(false)
  const [connectOpen, setConnectOpen] = useState(false)
  const [disconnectId, setDisconnectId] = useState<string | null>(null)

  const { mutateAsync: disconnectChannelMutate, isPending: isDisconnecting } = useDisconnectChannel()

  return (
    <div className="space-y-4">
      {/* Connected Hub Panel */}
      <div className="p-6 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/40 shadow-sm transition-all">
        <div className="space-y-3 border-b border-border/30 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-sans font-bold text-base sm:text-lg text-foreground tracking-tight">
                Connected Hub
              </h2>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <MetricTicker value={channels.length} /> accounts connected
              </p>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon"
                  onClick={() => setConnectOpen(true)}
                  className="w-8 h-8 rounded-full bg-brand-accent text-brand-accent-foreground hover:bg-brand-accent/90 hover:scale-105 active:scale-95 transition-transform shadow-sm cursor-pointer"
                  aria-label="Connect New Account for Active Client"
                >
                  <Icons.add className="size-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Connect New Account for Active Client</TooltipContent>
            </Tooltip>
          </div>

          {/* Client Info Capsule — read-only. Switching lives in the sidebar WorkspaceSwitcher. */}
          <div className="w-full flex items-center justify-between p-3 rounded-2xl bg-muted/60 border border-border/40">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-brand-accent text-primary-foreground flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div className="truncate text-left space-y-0.5">
                <span className="block text-2xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Klien aktif
                </span>
                <span className="block text-xs font-bold text-foreground truncate">
                  {client.name}
                </span>
              </div>
            </div>
          </div>

          {/* Client Verification Note */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/70 border border-border/30 text-xs text-muted-foreground">
            <Icons.check className="size-4 text-brand-accent shrink-0" />
            <span className="truncate">
              Channels belong to{" "}
              <b className="text-foreground">{client.name}</b>
            </span>
          </div>
        </div>

        <div className="mt-4 space-y-3">
          {channels.length === 0 ? (
            <div className="p-4 rounded-xl border border-dashed border-border/50 text-center">
              <p className="text-xs text-muted-foreground">
                Belum ada channel terhubung untuk {client.name}.
              </p>
            </div>
          ) : (
            channels.map((ch) => {
              const meta = getPlatformMeta(ch.platform)
              const PlatformIcon = meta.icon
              const statusInfo = CHANNEL_STATUS_STYLES[ch.status] ?? {
                label: ch.status,
                pill: "bg-muted text-muted-foreground",
              }

              return (
                <div
                  key={ch.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-muted/60 border border-border/40 hover:bg-muted/50 hover:border-border transition-all cursor-pointer group shadow-sm hover:shadow"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-primary-foreground shadow-sm font-bold group-hover:scale-105 transition-transform shrink-0",
                      meta.bg
                    )}>
                      <PlatformIcon className="size-5" />
                    </div>
                    <div className="truncate">
                      <h3 className="font-label-lg text-label-lg text-foreground font-bold leading-tight group-hover:text-brand-accent transition-colors truncate">
                        {meta.label}
                      </h3>
                      <p className="font-body-sm text-body-sm text-muted-foreground truncate">
                        {ch.handle || "Belum ada handle"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="text-right">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-2xs font-label-caps font-bold",
                        statusInfo.pill
                      )}>
                        {ch.status === "terhubung" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-accent" />
                        )}
                        {statusInfo.label}
                      </span>
                      {ch.note && (
                        <p className="font-body-sm text-body-sm text-muted-foreground font-normal mt-0.5 max-w-[90px] truncate">
                          {ch.note}
                        </p>
                      )}
                    </div>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDisconnectId(ch.id)
                          }}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer opacity-100 md:opacity-0 md:group-hover:opacity-100"
                          aria-label="Disconnect channel"
                        >
                          <Icons.close className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Disconnect channel</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              )
            })
          )}

          <Button
            type="button"
            variant="outline"
            onClick={() => setConnectOpen(true)}
            className="w-full h-10 rounded-full border-dashed border-border/60 text-xs font-bold gap-2 text-muted-foreground hover:text-foreground mt-2"
          >
            <Icons.add className="size-4" />
            Connect Channel to Client
          </Button>
        </div>
      </div>

      {/* Studio Strategy & AI Copilot Hub (Fungsional & Zero-Gap) */}
      <div className="p-5 rounded-2xl bg-card/90 backdrop-blur-xl border border-border/40 shadow-sm transition-all space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-accent/20 text-brand-accent flex items-center justify-center">
              <Icons.sparkles className="size-3.5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground">
                Strategi Studio &amp; AI
              </h3>
              <p className="text-3xs text-muted-foreground font-mono">
                {client.name}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/admin/settings?tab=brand${clientId ? `&clientId=${clientId}` : ""}`)}
            className="h-7 px-2 text-2xs text-muted-foreground hover:text-foreground font-semibold gap-1 hover:bg-muted/60 rounded-lg cursor-pointer"
          >
            <Icons.settings className="size-3" />
            Atur Brand
          </Button>
        </div>

        {/* Brand Persona & Content Pillars Capsule */}
        <div className="p-3 rounded-xl bg-muted/40 border border-border/30 space-y-2">
          <div className="flex items-center justify-between text-2xs">
            <span className="font-semibold text-muted-foreground">Brand Voice:</span>
            <span className="font-bold text-foreground truncate max-w-[170px]">
              {client.brand_profile?.voice || "Dinamis & Edukatif"}
            </span>
          </div>
          {client.brand_profile?.pillars && client.brand_profile.pillars.length > 0 ? (
            <div className="flex flex-wrap gap-1 pt-1">
              {client.brand_profile.pillars.slice(0, 3).map((pillar, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-md bg-muted text-foreground text-3xs font-semibold border border-border/40 truncate max-w-[130px]"
                >
                  {pillar}
                </span>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-between text-2xs pt-1 border-t border-border/20">
              <span className="text-3xs text-muted-foreground">Pilar Konten:</span>
              <span className="text-3xs font-medium text-brand-accent">3 Pilar Terjadwal</span>
            </div>
          )}
        </div>

        {/* Campaign Velocity & Real-time Status */}
        <div className="p-3 rounded-xl bg-muted/40 border border-border/30">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-3xs font-bold uppercase tracking-wider text-muted-foreground block">
                Campaign Velocity
              </span>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="font-mono font-bold text-base text-foreground">
                  <MetricTicker value={profile.velocity} />%
                </span>
                <span className="text-3xs font-semibold text-muted-foreground">amplifikasi</span>
              </div>
            </div>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-3xs font-bold",
              profile.velocity >= 90
                ? "bg-brand-accent/20 text-brand-accent border border-brand-accent/30"
                : "bg-muted text-muted-foreground border border-border/40"
            )}>
              {profile.velocity >= 90 ? "Accelerating" : "Steady"}
            </span>
          </div>
        </div>

        {/* Tombol Aksi Fungsional (Zero Gap) */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <Button
            type="button"
            onClick={() => setAiOpen(true)}
            className="w-full h-9 rounded-xl bg-brand-accent text-brand-accent-foreground text-xs font-bold gap-1.5 shadow-xs hover:bg-brand-accent/90 cursor-pointer"
          >
            <Icons.bot className="size-3.5" />
            Launch AI
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/admin/campaigns${clientId ? `?new=1&clientId=${clientId}` : "?new=1"}`)}
            className="w-full h-9 rounded-xl border-border/60 hover:bg-muted text-xs font-semibold gap-1.5 cursor-pointer"
          >
            <Icons.add className="size-3.5" />
            Kampanye
          </Button>
        </div>
      </div>

      <AlertDialog open={Boolean(disconnectId)} onOpenChange={(open) => !open && setDisconnectId(null)}>
        <AlertDialogContent className="max-w-sm bg-card/95 backdrop-blur-2xl rounded-3xl border border-border/40 p-6 shadow-2xl space-y-6 text-center">
          <AlertDialogHeader className="items-center text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
              <Icons.warning className="size-6" />
            </div>
            <AlertDialogTitle className="font-sans font-bold text-foreground text-lg">
              Disconnect Channel?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground">
              Are you sure you want to disconnect this channel? Data syncing will stop immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-3 pt-2 sm:justify-center">
            <AlertDialogCancel
              disabled={isDisconnecting}
              onClick={() => setDisconnectId(null)}
              className="flex-1 rounded-xl bg-muted text-foreground text-sm font-semibold hover:bg-muted/70 transition-all shadow-sm"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDisconnecting}
              onClick={async () => {
                if (disconnectId) {
                  try {
                    await disconnectChannelMutate(disconnectId)
                    toast.success("Saluran berhasil diputuskan")
                  } catch (err: unknown) {
                    toast.error(err instanceof Error ? err.message : "Gagal memutuskan saluran")
                  } finally {
                    setDisconnectId(null)
                  }
                }
              }}
              className="flex-1 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:bg-destructive/90 transition-all shadow-sm"
            >
              {isDisconnecting ? "Disconnecting..." : "Disconnect"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <StitchAiHookModal open={aiOpen} onOpenChange={setAiOpen} clientName={client.name} clientId={clientId} />
      <ConnectChannelModal
        open={connectOpen}
        client={client}
        existingPlatforms={channels.map((a) => a.platform)}
        onClose={() => setConnectOpen(false)}
      />
    </div>
  )
}

export const RightPanel = DashboardStitchConnectedHub


