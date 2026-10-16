'use client'

import { useState, useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  eventQueries,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
} from "@/features/events/api/queries"
import type { EventItem } from "@/features/events/api/types"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { motion, AnimatePresence } from "motion/react"
import { MetricTicker } from "@/components/animate-ui/components/texts/metric-ticker"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/animate-ui/components/radix/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/animate-ui/components/radix/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/animate-ui/components/radix/dropdown-menu"

const STATUS_META: Record<string, { label: string; className: string; pillClass: string }> = {
  upcoming: {
    label: "Akan Datang",
    className: "bg-[hsl(var(--admin-cobalt))]/10 text-[hsl(var(--admin-cobalt))] border-[hsl(var(--admin-cobalt))]/25",
    pillClass: "bg-[hsl(var(--admin-cobalt))]",
  },
  ongoing: {
    label: "Berlangsung",
    className: "bg-[hsl(var(--admin-lime))]/15 text-[hsl(var(--admin-lime-ink))] border-[hsl(var(--admin-lime))]/30 font-bold",
    pillClass: "bg-[hsl(var(--admin-lime))]",
  },
  completed: {
    label: "Selesai",
    className: "bg-muted text-muted-foreground border-border/40",
    pillClass: "bg-muted-foreground",
  },
  cancelled: {
    label: "Dibatalkan",
    className: "bg-destructive/10 text-destructive border-destructive/25",
    pillClass: "bg-destructive",
  },
}

function statusMeta(status: string | null | undefined) {
  const key = (status ?? "upcoming").toLowerCase()
  return STATUS_META[key] ?? STATUS_META.upcoming
}

function formatDatetimeForInput(isoString: string | null | undefined): string {
  if (!isoString) return ""
  try {
    const d = new Date(isoString)
    if (isNaN(d.getTime())) return ""
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ""
  }
}

export function EventsBoard({ clientId }: { clientId: string }) {
  const { data: events = [] } = useQuery({
    ...eventQueries.listByClient(clientId),
    placeholderData: [],
  })

  // State dialogs
  const [createOpen, setCreateOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null)
  const [deletingEvent, setDeletingEvent] = useState<EventItem | null>(null)

  // Filter & Search
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState<string>("")

  // Form states for Create
  const [createName, setCreateName] = useState("")
  const [createDescription, setCreateDescription] = useState("")
  const [createLocation, setCreateLocation] = useState("")
  const [createDate, setCreateDate] = useState("")
  const [createStatus, setCreateStatus] = useState("upcoming")

  // Form states for Edit
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editLocation, setEditLocation] = useState("")
  const [editDate, setEditDate] = useState("")
  const [editStatus, setEditStatus] = useState("upcoming")

  // Mutations
  const createMutation = useCreateEvent()
  const updateMutation = useUpdateEvent()
  const deleteMutation = useDeleteEvent()

  // Metrics
  const totalEvents = events.length
  const upcomingCount = events.filter((e) => (e.status ?? "upcoming").toLowerCase() === "upcoming").length
  const ongoingCount = events.filter((e) => (e.status ?? "").toLowerCase() === "ongoing").length
  const completedCount = events.filter((e) => (e.status ?? "").toLowerCase() === "completed").length

  // Filtered List
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const matchStatus =
        filterStatus === "all" || (ev.status ?? "upcoming").toLowerCase() === filterStatus.toLowerCase()
      const q = searchQuery.toLowerCase().trim()
      const matchSearch =
        !q ||
        ev.name.toLowerCase().includes(q) ||
        (ev.location ?? "").toLowerCase().includes(q) ||
        (ev.description ?? "").toLowerCase().includes(q)
      return matchStatus && matchSearch
    })
  }, [events, filterStatus, searchQuery])

  // Handlers
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!createName.trim()) return

    createMutation.mutate(
      {
        client_id: clientId,
        name: createName.trim(),
        description: createDescription.trim() || null,
        location: createLocation.trim() || null,
        event_date: createDate ? new Date(createDate).toISOString() : null,
        status: createStatus,
      },
      {
        onSuccess: (res) => {
          if (res.success) {
            setCreateName("")
            setCreateDescription("")
            setCreateLocation("")
            setCreateDate("")
            setCreateStatus("upcoming")
            setCreateOpen(false)
          }
        },
      }
    )
  }

  const handleOpenEdit = (ev: EventItem) => {
    setEditingEvent(ev)
    setEditName(ev.name)
    setEditDescription(ev.description ?? "")
    setEditLocation(ev.location ?? "")
    setEditDate(formatDatetimeForInput(ev.event_date))
    setEditStatus(ev.status ?? "upcoming")
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingEvent || !editName.trim()) return

    updateMutation.mutate(
      {
        id: editingEvent.id,
        name: editName.trim(),
        description: editDescription.trim() || null,
        location: editLocation.trim() || null,
        event_date: editDate ? new Date(editDate).toISOString() : null,
        status: editStatus,
      },
      {
        onSuccess: (res) => {
          if (res.success) {
            setEditingEvent(null)
          }
        },
      }
    )
  }

  const handleDeleteConfirm = () => {
    if (!deletingEvent) return
    deleteMutation.mutate(deletingEvent.id, {
      onSuccess: (res) => {
        if (res.success) {
          setDeletingEvent(null)
        }
      },
    })
  }

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-xs flex flex-col justify-between">
          <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">Total Event</span>
          <span className="text-2xl font-black font-mono text-foreground mt-2">
            <MetricTicker value={totalEvents} />
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-[hsl(var(--admin-cobalt))]/25 shadow-xs flex flex-col justify-between">
          <span className="text-2xs font-bold uppercase tracking-wider text-[hsl(var(--admin-cobalt))]">Akan Datang</span>
          <span className="text-2xl font-black font-mono text-[hsl(var(--admin-cobalt))] mt-2">
            <MetricTicker value={upcomingCount} />
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-[hsl(var(--admin-lime))]/30 shadow-xs flex flex-col justify-between">
          <span className="text-2xs font-bold uppercase tracking-wider text-[hsl(var(--admin-lime-ink))]">Berlangsung</span>
          <span className="text-2xl font-black font-mono text-[hsl(var(--admin-lime-ink))] mt-2">
            <MetricTicker value={ongoingCount} />
          </span>
        </div>
        <div className="p-4 rounded-2xl bg-card border border-border/50 shadow-xs flex flex-col justify-between">
          <span className="text-2xs font-bold uppercase tracking-wider text-muted-foreground">Selesai</span>
          <span className="text-2xl font-black font-mono text-muted-foreground mt-2">
            <MetricTicker value={completedCount} />
          </span>
        </div>
      </div>

      {/* Control Bar: Search, Status Filter, and Add Event Button */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama event, lokasi, deskripsi..."
              className="pl-9 h-10 text-xs bg-card border-border/60 rounded-xl"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <Icons.close className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <div className="flex items-center bg-muted/60 p-1 rounded-xl border border-border/40 text-xs shrink-0">
            {[
              { id: "all", label: "Semua" },
              { id: "upcoming", label: "Akan Datang" },
              { id: "ongoing", label: "Berlangsung" },
              { id: "completed", label: "Selesai" },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer whitespace-nowrap",
                  filterStatus === tab.id
                    ? "bg-card text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Button
            onClick={() => setCreateOpen(true)}
            className="admin-pill admin-pill-primary gap-2 cursor-pointer shrink-0"
          >
            <Icons.add className="size-4" />
            Tambah Event
          </Button>
        </div>
      </div>

      {/* Event Grid / Empty State */}
      {filteredEvents.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-border/50 bg-card/40">
          <div className="size-14 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
            <Icons.calendar className="size-7 text-muted-foreground" />
          </div>
          <p className="text-sm font-semibold text-foreground">
            {searchQuery || filterStatus !== "all" ? "Tidak Ada Event yang Cocok" : "Belum Ada Event Terjadwal"}
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery || filterStatus !== "all"
              ? "Ubah kata kunci pencarian atau ganti filter status untuk melihat event lain."
              : "Tambahkan event pertama untuk melacak aktivasi offline, peluncuran produk, atau gathering klien."}
          </p>
          {searchQuery || filterStatus !== "all" ? (
            <Button
              onClick={() => {
                setSearchQuery("")
                setFilterStatus("all")
              }}
              variant="outline"
              size="sm"
              className="mt-4 gap-2 cursor-pointer"
            >
              Reset Filter
            </Button>
          ) : (
            <Button onClick={() => setCreateOpen(true)} variant="outline" className="mt-4 gap-2 cursor-pointer">
              <Icons.add className="size-4" /> Tambah Event Pertama
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filteredEvents.map((ev, i) => (
              <EventCard
                key={ev.id}
                event={ev}
                index={i}
                onEdit={handleOpenEdit}
                onDelete={(e) => setDeletingEvent(e)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ========================================================== */}
      {/* CREATE EVENT DIALOG                                        */}
      {/* ========================================================== */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md bg-card/95 backdrop-blur-2xl rounded-3xl border border-border/40 p-6 shadow-2xl">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-base font-bold text-foreground">Tambah Event Baru</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Jadwalkan aktivasi offline, peluncuran produk, atau gathering untuk klien ini.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="ev-create-name" className="text-xs font-semibold">
                Nama Event <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ev-create-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                placeholder="Contoh: Grand Opening Cabang Bandung"
                required
                className="h-10 text-xs bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ev-create-date" className="text-xs font-semibold">Tanggal &amp; Waktu</Label>
                <Input
                  id="ev-create-date"
                  type="datetime-local"
                  value={createDate}
                  onChange={(e) => setCreateDate(e.target.value)}
                  className="h-10 text-xs bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ev-create-status" className="text-xs font-semibold">Status Awal</Label>
                <select
                  id="ev-create-status"
                  value={createStatus}
                  onChange={(e) => setCreateStatus(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option value="upcoming">Akan Datang</option>
                  <option value="ongoing">Berlangsung</option>
                  <option value="completed">Selesai</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ev-create-loc" className="text-xs font-semibold">Lokasi Pelaksanaan</Label>
              <Input
                id="ev-create-loc"
                value={createLocation}
                onChange={(e) => setCreateLocation(e.target.value)}
                placeholder="Misal: Jakarta Convention Center Hall A"
                className="h-10 text-xs bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ev-create-desc" className="text-xs font-semibold">Deskripsi / Catatan</Label>
              <Input
                id="ev-create-desc"
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder="Detail persiapan, rundown, atau PIC event..."
                className="h-10 text-xs bg-background"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setCreateOpen(false)}
                className="cursor-pointer text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                isLoading={createMutation.isPending}
                disabled={createMutation.isPending}
                className="admin-pill admin-pill-primary cursor-pointer text-xs gap-1.5"
              >
                <Icons.add className="size-3.5" />
                Simpan Event
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================== */}
      {/* EDIT EVENT DIALOG                                          */}
      {/* ========================================================== */}
      <Dialog open={Boolean(editingEvent)} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="max-w-md bg-card/95 backdrop-blur-2xl rounded-3xl border border-border/40 p-6 shadow-2xl">
          <DialogHeader className="space-y-1 text-left">
            <DialogTitle className="text-base font-bold text-foreground">Edit Event &amp; Aktivasi</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Perbarui detail jadwal, lokasi, atau status event klien.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleEditSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="ev-edit-name" className="text-xs font-semibold">
                Nama Event <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ev-edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                className="h-10 text-xs bg-background"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ev-edit-date" className="text-xs font-semibold">Tanggal &amp; Waktu</Label>
                <Input
                  id="ev-edit-date"
                  type="datetime-local"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="h-10 text-xs bg-background"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ev-edit-status" className="text-xs font-semibold">Status Event</Label>
                <select
                  id="ev-edit-status"
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-xs shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <option value="upcoming">Akan Datang</option>
                  <option value="ongoing">Berlangsung</option>
                  <option value="completed">Selesai</option>
                  <option value="cancelled">Dibatalkan</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ev-edit-loc" className="text-xs font-semibold">Lokasi Pelaksanaan</Label>
              <Input
                id="ev-edit-loc"
                value={editLocation}
                onChange={(e) => setEditLocation(e.target.value)}
                placeholder="Misal: Jakarta Convention Center Hall A"
                className="h-10 text-xs bg-background"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ev-edit-desc" className="text-xs font-semibold">Deskripsi / Catatan</Label>
              <Input
                id="ev-edit-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Detail persiapan, rundown, atau PIC event..."
                className="h-10 text-xs bg-background"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/40">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditingEvent(null)}
                className="cursor-pointer text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                isLoading={updateMutation.isPending}
                disabled={updateMutation.isPending}
                className="admin-pill admin-pill-primary cursor-pointer text-xs gap-1.5"
              >
                <Icons.check className="size-3.5" />
                Simpan Perubahan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ========================================================== */}
      {/* DELETE EVENT ALERT DIALOG                                  */}
      {/* ========================================================== */}
      <AlertDialog open={Boolean(deletingEvent)} onOpenChange={(open) => !open && setDeletingEvent(null)}>
        <AlertDialogContent className="max-w-md bg-card border border-border/50 rounded-2xl shadow-xl">
          <AlertDialogHeader>
            <div className="size-11 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-2">
              <Icons.trash className="size-5" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Hapus Event?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Anda akan menghapus event <strong className="text-foreground">&ldquo;{deletingEvent?.name}&rdquo;</strong>.
              Data yang dihapus tidak dapat dipulihkan kembali.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 gap-2">
            <AlertDialogCancel
              disabled={deleteMutation.isPending}
              className="text-xs cursor-pointer rounded-xl"
            >
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteConfirm()
              }}
              disabled={deleteMutation.isPending}
              className="text-xs cursor-pointer rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Menghapus..." : "Ya, Hapus Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function EventCard({
  event: ev,
  index,
  onEdit,
  onDelete,
}: {
  event: EventItem
  index: number
  onEdit: (ev: EventItem) => void
  onDelete: (ev: EventItem) => void
}) {
  const meta = statusMeta(ev.status)
  const date = ev.event_date ? new Date(ev.event_date) : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.03, 0.2), ease: [0.16, 1, 0.3, 1] }}
      className="group relative p-5 rounded-2xl bg-card border border-border/60 shadow-xs hover:border-[hsl(var(--admin-cobalt))]/40 hover:shadow-md transition-all flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border", meta.className)}>
            {meta.label}
          </span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="size-7 p-0 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
                aria-label="Menu opsi event"
              >
                <Icons.moreVertical className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-xl bg-popover/95 backdrop-blur-xl border border-border/50 shadow-xl">
              <DropdownMenuItem
                onClick={() => onEdit(ev)}
                className="text-xs flex items-center gap-2 cursor-pointer font-medium"
              >
                <Icons.edit className="size-3.5 text-foreground" />
                Edit Event
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border/40" />
              <DropdownMenuItem
                onClick={() => onDelete(ev)}
                className="text-xs flex items-center gap-2 text-destructive focus:text-destructive cursor-pointer font-medium"
              >
                <Icons.trash className="size-3.5" />
                Hapus Event
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <h3 className="font-bold text-foreground text-sm line-clamp-2 leading-snug mt-2.5">
          {ev.name}
        </h3>

        {ev.description && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
            {ev.description}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5 mt-4 pt-3 border-t border-border/30 text-xs text-muted-foreground">
        {date && (
          <span className="inline-flex items-center gap-1.5 truncate">
            <Icons.calendar className="size-3.5 shrink-0 text-muted-foreground/80" />
            <span>
              {date.toLocaleDateString("id-ID", {
                weekday: "short",
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
              {" • "}
              {date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })} WIB
            </span>
          </span>
        )}
        {ev.location && (
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <Icons.mapPin className="size-3.5 shrink-0 text-muted-foreground/80" />
            <span className="truncate">{ev.location}</span>
          </span>
        )}
      </div>
    </motion.div>
  )
}
