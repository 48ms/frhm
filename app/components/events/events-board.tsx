'use client'

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { eventQueries, useCreateEvent } from "@/features/events/api/queries"
import type { EventItem } from "@/features/events/api/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "motion/react"

const STATUS_META: Record<string, { label: string; className: string }> = {
  upcoming: { label: "Akan Datang", className: "bg-[hsl(var(--admin-cobalt))]/10 text-[hsl(var(--admin-cobalt))] border-[hsl(var(--admin-cobalt))]/20" },
  ongoing: { label: "Berlangsung", className: "bg-[hsl(var(--admin-lime))]/10 text-[hsl(var(--admin-lime-ink))] border-[hsl(var(--admin-lime))]/20" },
  completed: { label: "Selesai", className: "bg-muted text-muted-foreground border-border/40" },
  cancelled: { label: "Dibatalkan", className: "bg-destructive/10 text-destructive border-destructive/20" },
}

function statusMeta(status: string | null | undefined) {
  const key = (status ?? "upcoming").toLowerCase()
  return STATUS_META[key] ?? STATUS_META.upcoming
}

export function EventsBoard({ clientId }: { clientId: string }) {
  const { data: events = [] } = useQuery({
    ...eventQueries.listByClient(clientId),
    placeholderData: [],
  })

  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [location, setLocation] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [status, setStatus] = useState("upcoming")
  const { mutate, isPending } = useCreateEvent()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    mutate(
      {
        client_id: clientId,
        name: name.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        event_date: eventDate ? new Date(eventDate).toISOString() : null,
        status,
      },
      {
        onSuccess: (res) => {
          if (res.success) {
            setName("")
            setDescription("")
            setLocation("")
            setEventDate("")
            setStatus("upcoming")
            setFormOpen(false)
          }
        },
      }
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-[hsl(var(--admin-cobalt))]/10 text-[hsl(var(--admin-cobalt))] flex items-center justify-center">
            <Icons.mapPin className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">Event &amp; Aktivasi</h2>
            <p className="text-xs text-muted-foreground">
              {events.length > 0 ? `${events.length} event terjadwal` : "Belum ada event"}
            </p>
          </div>
        </div>
        <Button
          onClick={() => setFormOpen((v) => !v)}
          className="admin-pill admin-pill-primary gap-2 cursor-pointer"
        >
          <Icons.add className="size-4" />
          Tambah Event
        </Button>
      </div>

      {/* Inline Create Form */}
      <AnimatePresence initial={false}>
        {formOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleSubmit}
              className="p-5 rounded-2xl bg-card border border-border/60 shadow-sm space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="ev-name" className="text-xs font-semibold">Nama Event</Label>
                  <Input
                    id="ev-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Grand Opening Cabang Bandung"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="ev-date" className="text-xs font-semibold">Tanggal</Label>
                  <Input
                    id="ev-date"
                    type="datetime-local"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="ev-loc" className="text-xs font-semibold">Lokasi</Label>
                  <Input
                    id="ev-loc"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Jakarta Convention Center"
                    className="mt-1"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="ev-desc" className="text-xs font-semibold">Deskripsi</Label>
                  <Input
                    id="ev-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detail singkat event..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="ev-status" className="text-xs font-semibold">Status</Label>
                  <select
                    id="ev-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="mt-1 w-full h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                  >
                    <option value="upcoming">Akan Datang</option>
                    <option value="ongoing">Berlangsung</option>
                    <option value="completed">Selesai</option>
                    <option value="cancelled">Dibatalkan</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={() => setFormOpen(false)} className="cursor-pointer">
                  Batal
                </Button>
                <Button type="submit" disabled={isPending} className="admin-pill admin-pill-primary cursor-pointer">
                  {isPending ? <Icons.spinner className="size-4 animate-spin mr-2" /> : <Icons.add className="size-4 mr-2" />}
                  Simpan Event
                </Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Grid / Empty State */}
      {events.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border/50 bg-card/40">
          <div className="size-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
            <Icons.calendar className="size-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">Belum Ada Event</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Tambahkan event pertama untuk melacak aktivasi offline, peluncuran produk, atau gathering klien.
          </p>
          <Button onClick={() => setFormOpen(true)} variant="outline" className="mt-4 gap-2 cursor-pointer">
            <Icons.add className="size-4" /> Tambah Event Pertama
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((ev, i) => (
            <EventCard key={ev.id} event={ev} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}

function EventCard({ event: ev, index }: { event: EventItem; index: number }) {
  const meta = statusMeta(ev.status)
  const date = ev.event_date ? new Date(ev.event_date) : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.04, ease: [0.16, 1, 0.3, 1] }}
      className="group p-5 rounded-2xl bg-card border border-border/60 shadow-xs hover:border-[hsl(var(--admin-cobalt))]/40 hover:shadow-md transition-all"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-foreground line-clamp-2 leading-snug">{ev.name}</h3>
          {ev.description && (
            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
              {ev.description}
            </p>
          )}
        </div>
        <span className={cn("shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold border", meta.className)}>
          {meta.label}
        </span>
      </div>

      <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/30 text-xs text-muted-foreground">
        {date && (
          <span className="inline-flex items-center gap-1.5">
            <Icons.calendar className="size-3.5" />
            {date.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
          </span>
        )}
        {ev.location && (
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <Icons.mapPin className="size-3.5 shrink-0" />
            <span className="truncate">{ev.location}</span>
          </span>
        )}
      </div>
    </motion.div>
  )
}
