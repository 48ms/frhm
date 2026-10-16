"use client"

import * as React from "react"
import { useAllSupportTickets, useUpdateSupportTicket } from "@/features/support/api/queries"
import type { AdminSupportTicket, SupportTicketStatus } from "@/features/support/api/types"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/animate-ui/components/radix/dialog"
import { Tabs, TabsList, TabsTrigger } from "@/components/animate-ui/components/radix/tabs"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Icons } from "@/components/icons"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { id as idLocale } from "date-fns/locale"

interface AdminSupportTicketsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialClientId?: string | null
}

const STATUS_FILTERS = [
  { id: "all", label: "Semua" },
  { id: "open", label: "Menunggu" },
  { id: "in_progress", label: "Diproses" },
  { id: "resolved", label: "Selesai" },
] as const

const PRIORITY_BADGES: Record<string, { label: string; cls: string }> = {
  Urgent: { label: "Urgent", cls: "bg-destructive/10 text-destructive border-destructive/20" },
  High: { label: "High", cls: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  Normal: { label: "Normal", cls: "bg-muted text-muted-foreground border-border/40" },
  Low: { label: "Low", cls: "bg-muted/50 text-muted-foreground border-border/20" },
}

const STATUS_BADGES: Record<SupportTicketStatus, { label: string; cls: string }> = {
  open: { label: "Menunggu", cls: "bg-primary/10 text-primary border-primary/20" },
  in_progress: { label: "Diproses", cls: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  resolved: { label: "Selesai", cls: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] border-[hsl(var(--success))]/20" },
  closed: { label: "Ditutup", cls: "bg-muted text-muted-foreground border-border/40" },
}

export function AdminSupportTicketsDialog({
  open,
  onOpenChange,
  initialClientId,
}: AdminSupportTicketsDialogProps) {
  const { data: tickets = [], isLoading } = useAllSupportTickets()
  const [activeTab, setActiveTab] = React.useState<"all" | "open" | "in_progress" | "resolved">("all")
  const [selectedTicket, setSelectedTicket] = React.useState<AdminSupportTicket | null>(null)
  const [replyText, setReplyText] = React.useState("")

  const updateMutation = useUpdateSupportTicket()

  // Filter tickets by client and status tab
  const filteredTickets = React.useMemo(() => {
    let result = tickets
    if (initialClientId) {
      result = result.filter((t) => t.client_id === initialClientId)
    }
    if (activeTab === "all") return result
    return result.filter((t) => t.status === activeTab)
  }, [tickets, initialClientId, activeTab])

  const openCount = tickets.filter((t) => t.status === "open").length
  const inProgressCount = tickets.filter((t) => t.status === "in_progress").length
  const resolvedCount = tickets.filter((t) => t.status === "resolved").length

  const handleSelectTicket = (t: AdminSupportTicket) => {
    setSelectedTicket(t)
    setReplyText(t.admin_reply || "")
  }

  const handleUpdateStatus = (status: SupportTicketStatus) => {
    if (!selectedTicket) return
    updateMutation.mutate(
      {
        ticketId: selectedTicket.id,
        clientId: selectedTicket.client_id,
        status,
        adminReply: replyText,
      },
      {
        onSuccess: () => {
          setSelectedTicket((prev) =>
            prev ? { ...prev, status, admin_reply: replyText } : null
          )
        },
      }
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-6 overflow-hidden">
        <DialogHeader className="border-b border-border/40 pb-4 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <Icons.chat className="size-5 text-primary" />
                <span>Inbox Tiket Dukungan Klien</span>
                {openCount > 0 && (
                  <span className="text-2xs font-extrabold px-2 py-0.5 rounded-full bg-destructive text-destructive-foreground">
                    <MetricTicker value={openCount} /> Butuh Respons
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Kelola pertanyaan, permintaan revisi jadwal, dan konfirmasi materi langsung dari klien partner.
              </DialogDescription>
            </div>
          </div>

          <div className="pt-3">
            <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as typeof activeTab)}>
              <TabsList className="h-auto p-1 bg-muted/60 rounded-full border border-border/30">
                <TabsTrigger
                  value="all"
                  onClick={() => setActiveTab("all")}
                  className="rounded-full text-xs font-semibold px-3 py-1.5 flex items-center gap-1 cursor-pointer"
                >
                  <span>Semua</span>
                  <span className="opacity-80">(<MetricTicker value={tickets.length} />)</span>
                </TabsTrigger>
                <TabsTrigger
                  value="open"
                  onClick={() => setActiveTab("open")}
                  className="rounded-full text-xs font-semibold px-3 py-1.5 flex items-center gap-1 cursor-pointer"
                >
                  <span>Menunggu</span>
                  <span className="opacity-80">(<MetricTicker value={openCount} />)</span>
                </TabsTrigger>
                <TabsTrigger
                  value="in_progress"
                  onClick={() => setActiveTab("in_progress")}
                  className="rounded-full text-xs font-semibold px-3 py-1.5 flex items-center gap-1 cursor-pointer"
                >
                  <span>Diproses</span>
                  <span className="opacity-80">(<MetricTicker value={inProgressCount} />)</span>
                </TabsTrigger>
                <TabsTrigger
                  value="resolved"
                  onClick={() => setActiveTab("resolved")}
                  className="rounded-full text-xs font-semibold px-3 py-1.5 flex items-center gap-1 cursor-pointer"
                >
                  <span>Selesai</span>
                  <span className="opacity-80">(<MetricTicker value={resolvedCount} />)</span>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </DialogHeader>

        {/* Dual Panel Body: List (left) + Reply Detail (right) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-1 overflow-hidden pt-4 min-h-0">
          {/* Left Column: Tickets List */}
          <div className="md:col-span-5 overflow-y-auto no-scrollbar space-y-2 pr-1 border-r border-border/30">
            {isLoading ? (
              <div className="p-8 text-center text-xs text-muted-foreground animate-pulse">
                Memuat riwayat tiket...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground space-y-2">
                <Icons.inbox className="size-8 mx-auto text-muted-foreground/40" />
                <p className="font-semibold text-foreground">Tidak Ada Tiket</p>
                <p>Belum ada tiket pada kategori filter ini.</p>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id
                const priorityInfo = PRIORITY_BADGES[t.priority] || PRIORITY_BADGES.Normal
                const statusInfo = STATUS_BADGES[t.status] || STATUS_BADGES.open

                return (
                  <button
                    key={t.id}
                    type="button"
                    data-testid={`ticket-item-${t.id}`}
                    onClick={() => handleSelectTicket(t)}
                    className={cn(
                      "w-full text-left p-3 rounded-xl border transition-all cursor-pointer space-y-1.5",
                      isSelected
                        ? "bg-primary/5 border-primary/50 shadow-xs"
                        : "bg-card border-border/30 hover:border-border/60"
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-3xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-muted text-foreground">
                        {t.client_name || "Klien Partner"}
                      </span>
                      <span className={cn("text-3xs font-bold uppercase px-1.5 py-0.5 rounded-full border", priorityInfo.cls)}>
                        {priorityInfo.label}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-foreground line-clamp-1">{t.subject}</h4>
                    <p className="text-2xs text-muted-foreground line-clamp-2 leading-relaxed">{t.message}</p>

                    <div className="flex items-center justify-between pt-1 text-3xs text-muted-foreground border-t border-border/20">
                      <span className={cn("font-bold px-1.5 py-0.2 rounded-full border", statusInfo.cls)}>
                        {statusInfo.label}
                      </span>
                      <span>{format(new Date(t.created_at), "dd MMM HH:mm", { locale: idLocale })}</span>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Right Column: Ticket Inspection & Admin Response */}
          <div className="md:col-span-7 flex flex-col justify-between overflow-y-auto no-scrollbar pl-1 space-y-4">
            {selectedTicket ? (
              <>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-2xs font-extrabold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                        {selectedTicket.client_name || "Klien Partner"}
                      </span>
                      <span className="text-2xs text-muted-foreground">
                        {format(new Date(selectedTicket.created_at), "eeee, dd MMMM yyyy HH:mm", { locale: idLocale })} WIB
                      </span>
                    </div>
                    <h3 className="text-base font-extrabold text-foreground leading-snug">
                      {selectedTicket.subject}
                    </h3>
                  </div>

                  {/* Client Message */}
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/30 space-y-1">
                    <span className="text-3xs font-bold uppercase text-muted-foreground tracking-wider">
                      Pesan Klien:
                    </span>
                    <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                      {selectedTicket.message}
                    </p>
                  </div>

                  {/* Existing Reply if any */}
                  {selectedTicket.admin_reply && (
                    <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-3xs font-bold uppercase text-primary tracking-wider">
                          Balasan Terakhir Tim:
                        </span>
                        {selectedTicket.resolved_at && (
                          <span className="text-3xs text-muted-foreground">
                            Diselesaikan: {format(new Date(selectedTicket.resolved_at), "dd MMM HH:mm", { locale: idLocale })}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-foreground whitespace-pre-wrap leading-relaxed">
                        {selectedTicket.admin_reply}
                      </p>
                    </div>
                  )}

                  {/* Reply Form */}
                  <div className="space-y-1.5 pt-2 border-t border-border/30">
                    <label className="text-2xs font-bold uppercase text-muted-foreground tracking-wider block">
                      Tulis Balasan / Solusi ke Klien:
                    </label>
                    <Textarea
                      data-testid="admin-ticket-reply-textarea"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Contoh: Jadwal posting telah kami majukan ke hari Sabtu pukul 18:00 WIB sesuai permintaan..."
                      className="min-h-24 text-xs rounded-xl"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-3 border-t border-border/30">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleUpdateStatus("in_progress")}
                    disabled={updateMutation.isPending}
                    className="rounded-xl text-xs font-semibold text-amber-500 hover:text-amber-400 hover:bg-amber-500/10 border-amber-500/30"
                  >
                    Tandai Diproses
                  </Button>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleUpdateStatus("resolved")}
                      disabled={updateMutation.isPending}
                      className="rounded-xl text-xs font-semibold bg-[hsl(var(--success))] text-primary-foreground hover:bg-[hsl(var(--success))]/90"
                    >
                      <Icons.check className="size-3.5 mr-1" />
                      Kirim & Selesaikan
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-24 text-center text-xs text-muted-foreground space-y-2">
                <Icons.chat className="size-8 mx-auto text-muted-foreground/30" />
                <p className="font-semibold text-foreground">Pilih Tiket untuk Merespons</p>
                <p className="max-w-xs mx-auto">Klik salah satu tiket di kolom kiri untuk memeriksa detail dan mengirim balasan resmi.</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
