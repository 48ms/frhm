"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/animate-ui/components/radix/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/animate-ui/components/radix/checkbox"
import { ShimmeringText } from "@/components/animate-ui/components/texts/shimmering-text"
import { Icons } from "@/components/icons"
import {
  useNotificationTarget,
  useDispatchReviewNotification,
} from "@/features/notifications/api/queries"
import type {
  NotificationChannel,
  DispatchChannelResult,
} from "@/features/notifications/api/types"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface DispatchNotificationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  deliverable: {
    id: string
    title: string
    client_id?: string
  } | null
}

export function DispatchNotificationDialog({
  open,
  onOpenChange,
  deliverable,
}: DispatchNotificationDialogProps) {
  const deliverableId = deliverable?.id || ""
  const { data: target, isLoading: loadingTarget } = useNotificationTarget(deliverableId)
  const dispatchMutation = useDispatchReviewNotification()

  const [channels, setChannels] = React.useState<NotificationChannel[]>(["whatsapp", "telegram"])
  const [customNote, setCustomNote] = React.useState("")
  const [copied, setCopied] = React.useState(false)
  const [dispatchResults, setDispatchResults] = React.useState<DispatchChannelResult[] | null>(null)

  // Reset state saat dialog dibuka kembali
  React.useEffect(() => {
    if (open) {
      setDispatchResults(null)
      setCustomNote("")
      setCopied(false)
      // Default channel selection berdasarkan data target
      if (target?.client) {
        const initialChannels: NotificationChannel[] = []
        if (target.client.contactPhone) initialChannels.push("whatsapp")
        if (target.client.telegramChatId) initialChannels.push("telegram")
        setChannels(initialChannels.length > 0 ? initialChannels : ["whatsapp"])
      }
    }
  }, [open, target?.client])

  const toggleChannel = (channel: NotificationChannel) => {
    setChannels((prev) =>
      prev.includes(channel) ? prev.filter((c) => c !== channel) : [...prev, channel]
    )
  }

  const handleCopyMessage = async () => {
    if (!target?.suggestedWhatsAppMessage) return
    const textToCopy = customNote
      ? `${target.suggestedWhatsAppMessage}\n\n💬 Catatan: ${customNote}`
      : target.suggestedWhatsAppMessage

    try {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      toast.success("Pesan notifikasi berhasil disalin.")
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Gagal menyalin pesan ke clipboard.")
    }
  }

  const handleDispatch = async () => {
    if (!deliverableId) return
    if (channels.length === 0) {
      toast.error("Pilih setidaknya satu kanal notifikasi.")
      return
    }

    try {
      const response = await dispatchMutation.mutateAsync({
        deliverableId,
        channels,
        customNote: customNote.trim() || undefined,
      })

      setDispatchResults(response.results)

      const successCount = response.results.filter((r) => r.success).length
      if (successCount > 0) {
        toast.success(`Notifikasi review berhasil disiapkan untuk ${response.clientName}.`)
      } else {
        toast.error("Gagal mengirim notifikasi ke kanal yang dipilih.")
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan saat dispatch."
      toast.error(msg)
    }
  }

  const hasWhatsApp = channels.includes("whatsapp")
  const hasTelegram = channels.includes("telegram")

  const previewText = React.useMemo(() => {
    if (!target) return ""
    return customNote
      ? `${target.suggestedWhatsAppMessage}\n\n💬 *Catatan:* ${customNote}`
      : target.suggestedWhatsAppMessage
  }, [target, customNote])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl w-full p-6 bg-card/95 backdrop-blur-2xl border-border/40 text-foreground rounded-3xl shadow-2xl space-y-4">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Icons.send className="size-4" />
            </span>
            Kirim Notifikasi Review Klien
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Kirim tautan portal review konten langsung ke WhatsApp dan Telegram klien secara otomatis.
          </DialogDescription>
        </DialogHeader>

        {loadingTarget ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center">
            <Icons.spinner className="size-6 animate-spin text-primary" />
            <p className="text-xs text-muted-foreground">Memuat profil kontak klien...</p>
          </div>
        ) : !target ? (
          <div className="py-8 text-center space-y-2">
            <div className="size-10 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <Icons.alertCircle className="size-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">Data Deliverable Tidak Ditemukan</p>
            <p className="text-xs text-muted-foreground">
              Pastikan deliverable telah terhubung ke klien yang valid.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* DELIVERABLE & CLIENT CARD */}
            <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <span className="text-2xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Target Klien: {target.client.name}
                </span>
                <h4 className="text-sm font-bold text-foreground truncate">
                  {target.title}
                </h4>
                <div className="flex items-center gap-2 text-1xs text-muted-foreground">
                  <span>Portal Magic Link:</span>
                  <a
                    href={target.reviewUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-primary hover:underline inline-flex items-center gap-1"
                  >
                    /review/{target.deliverableId.slice(0, 8)}...
                    <Icons.externalLink className="size-2.5" />
                  </a>
                </div>
              </div>
              <Badge variant="outline" className="text-2xs uppercase shrink-0">
                {target.status}
              </Badge>
            </div>

            {/* CHANNEL SELECTION */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Pilih Kanal Notifikasi</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* WHATSAPP CARD */}
                <div
                  onClick={() => toggleChannel("whatsapp")}
                  className={cn(
                    "p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3",
                    hasWhatsApp
                      ? "bg-brand-accent00/10 border-border/4000/30 text-brand-accent50 dark:text-brand-accent00"
                      : "bg-card hover:bg-muted/30 border-border/60 text-muted-foreground"
                  )}
                >
                  <Checkbox
                    checked={hasWhatsApp}
                    onCheckedChange={() => toggleChannel("whatsapp")}
                    className="mt-0.5"
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                      <Icons.whatsapp className="size-4 text-brand-accent00" />
                      <span>WhatsApp</span>
                    </div>
                    {target.client.contactPhone ? (
                      <p className="text-1xs text-muted-foreground font-mono truncate">
                        {target.client.contactPhone}
                      </p>
                    ) : (
                      <p className="text-2xs text-amber-500 flex items-center gap-1">
                        <Icons.alertCircle className="size-3 shrink-0" />
                        Nomor belum diisi
                      </p>
                    )}
                  </div>
                </div>

                {/* TELEGRAM CARD */}
                <div
                  onClick={() => toggleChannel("telegram")}
                  className={cn(
                    "p-3 rounded-xl border text-left cursor-pointer transition-all flex items-start gap-3",
                    hasTelegram
                      ? "bg-sky-500/10 border-sky-500/30 text-sky-950 dark:text-sky-100"
                      : "bg-card hover:bg-muted/30 border-border/60 text-muted-foreground"
                  )}
                >
                  <Checkbox
                    checked={hasTelegram}
                    onCheckedChange={() => toggleChannel("telegram")}
                    className="mt-0.5"
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 font-semibold text-xs text-foreground">
                      <Icons.telegram className="size-4 text-sky-500" />
                      <span>Telegram Bot</span>
                    </div>
                    {target.client.telegramChatId ? (
                      <p className="text-1xs text-muted-foreground font-mono truncate">
                        Chat ID: {target.client.telegramChatId}
                      </p>
                    ) : (
                      <p className="text-2xs text-muted-foreground flex items-center gap-1">
                        <Icons.info className="size-3 shrink-0" />
                        Belum terhubung
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* OPTIONAL CUSTOM NOTE */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="custom-note" className="text-xs font-semibold text-foreground">
                  Catatan Tambahan (Opsional)
                </label>
                <span className="text-2xs text-muted-foreground">Ditambahkan ke pesan</span>
              </div>
              <textarea
                id="custom-note"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="Contoh: Mohon tinjau scene ke-2 pada video sebelum jam 17:00..."
                rows={2}
                className="w-full text-xs p-2.5 rounded-xl border border-border/60 bg-background text-foreground focus: focus:ring-1 focus:ring-primary resize-none placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              />
            </div>

            {/* LIVE MESSAGE PREVIEW */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">Pratinjau Pesan Terkirim</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyMessage}
                  className="h-6 text-2xs px-2 text-muted-foreground hover:text-foreground gap-1"
                >
                  {copied ? (
                    <>
                      <Icons.check className="size-3 text-brand-accent00" /> Tersalin
                    </>
                  ) : (
                    <>
                      <Icons.copy className="size-3" /> Salin Teks
                    </>
                  )}
                </Button>
              </div>
              <div className="p-3 rounded-xl bg-muted/60 border border-border/50 text-1xs font-mono leading-relaxed whitespace-pre-wrap max-h-36 overflow-y-auto text-foreground/90">
                {previewText}
              </div>
            </div>

            {/* POST-DISPATCH RESULTS */}
            {dispatchResults && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Hasil Pengiriman Notifikasi</span>
                  <Badge variant="outline" className="text-2xs bg-primary/10 border-primary/30 text-primary">
                    Selesai
                  </Badge>
                </div>
                <div className="space-y-1.5">
                  {dispatchResults.map((r) => (
                    <div
                      key={r.channel}
                      className="flex items-center justify-between p-2 rounded-lg bg-background border border-border/40 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {r.channel === "whatsapp" ? (
                          <Icons.whatsapp className="size-3.5 text-brand-accent00" />
                        ) : (
                          <Icons.telegram className="size-3.5 text-sky-500" />
                        )}
                        <span className="capitalize font-medium text-foreground">{r.channel}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {r.success ? (
                          <span className="text-brand-accent00 text-1xs font-semibold flex items-center gap-1">
                            <Icons.circleCheck className="size-3" />
                            {r.status === "ready" ? "Tautan Siap" : "Terkirim"}
                          </span>
                        ) : (
                          <span className="text-amber-500 text-1xs font-medium flex items-center gap-1">
                            <Icons.alertCircle className="size-3" />
                            {r.error || "Gagal"}
                          </span>
                        )}
                        {r.clickUrl && (
                          <a
                            href={r.clickUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-brand-accent00 hover:bg-brand-accent00 text-brand-accent0 dark:text-brand-accent50 text-2xs font-semibold transition-colors shadow-xs"
                          >
                            <Icons.whatsapp className="size-3" />
                            Buka di WhatsApp
                            <Icons.externalLink className="size-2.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex items-center justify-between pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
            Tutup
          </Button>

          {target && (
            <Button
              type="button"
              size="sm"
              onClick={handleDispatch}
              isLoading={dispatchMutation.isPending}
              disabled={channels.length === 0}
              className="text-xs gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {dispatchMutation.isPending ? (
                <ShimmeringText text="Mengirim Notifikasi..." />
              ) : (
                <>
                  <Icons.send className="size-3.5" />
                  Kirim Notifikasi Sekarang
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
