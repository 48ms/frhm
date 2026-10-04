"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { useQueryState } from "nuqs"
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  defaultAnnouncements,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { PageContainer } from "@/components/layout/page-container"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { FileUploader } from "@/components/file-uploader"
import { SOCIAL_CLIENTS } from "@/components/social-accounts/social-data"
import {
  listAssets,
  uploadAsset,
  deleteAsset,
  deleteAssets,
  tagAssets,
  reorderAssets,
} from "@/features/library/api/service"
import { generateAssetCaption } from "@/features/library/api/ai"
import type { Asset, AssetFileType } from "@/features/library/api/types"
import { thumbnailUrl, previewUrl } from "@/lib/media/transform"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"

export function LibraryClient() {
  const router = useRouter()
  const [clientId] = useQueryState("clientId", {
    defaultValue: SOCIAL_CLIENTS[0].id,
  })
  const [fileType, setFileType] = useQueryState("fileType", {
    defaultValue: "all",
  })
  const [assets, setAssets] = React.useState<Asset[]>([])
  const [loading, setLoading] = React.useState(true)
  const [uploading, setUploading] = React.useState(false)
  const [deletingId, setDeletingId] = React.useState<string | null>(null)
  const [selected, setSelected] = React.useState<Set<string>>(new Set())
  const [batchBusy, setBatchBusy] = React.useState(false)
  const [tagInput, setTagInput] = React.useState("")
  const [tagOpen, setTagOpen] = React.useState(false)
  const [tagFilter, setTagFilter] = useQueryState("tag", { defaultValue: "" })
  const [previewAsset, setPreviewAsset] = React.useState<Asset | null>(null)
  const [caption, setCaption] = React.useState("")
  const [captionBusy, setCaptionBusy] = React.useState(false)
  const [sortBusy, setSortBusy] = React.useState(false)

  // Clear any draft caption when the previewed asset changes, so text from one
  // asset never appears to belong to another.
  React.useEffect(() => {
    setCaption("")
  }, [previewAsset?.id])

  const handleGenerateCaption = async () => {
    if (!previewAsset) return
    setCaptionBusy(true)
    try {
      const result = await generateAssetCaption(clientId, previewAsset.url, previewAsset.fileType)
      if (result.error) {
        toast.error(result.error)
        return
      }
      setCaption(result.caption)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Caption AI gagal")
    } finally {
      setCaptionBusy(false)
    }
  }

  // Dnd-kit sensors. A small activation distance keeps a plain click (open the
  // lightbox) distinct from a drag.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {})
  )

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = filteredAssets.findIndex((a) => a.id === active.id)
    const newIndex = filteredAssets.findIndex((a) => a.id === over.id)
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return

    const next = arrayMove(filteredAssets, oldIndex, newIndex)
    setAssets(next)
    void saveOrder(next.map((a) => a.id))
  }

  async function saveOrder(ids: string[]) {
    setSortBusy(true)
    try {
      const result = await reorderAssets(clientId, ids)
      if (!result.success) {
        toast.error(result.error ?? "Gagal menyimpan urutan")
        // Reload so the grid reflects what the server actually holds.
        const fresh = await listAssets({ clientId, fileType: activeFileType, tag: activeTag })
        setAssets(fresh)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan urutan")
    } finally {
      setSortBusy(false)
    }
  }

  const activeClient = React.useMemo(
    () => SOCIAL_CLIENTS.find((c) => c.id === clientId) ?? SOCIAL_CLIENTS[0],
    [clientId]
  )

  const activeFileType = fileType === "all" ? undefined : (fileType as AssetFileType)

  // All tags present across this client's assets, for the filter chips.
  const allTags = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const a of assets) {
      for (const t of a.tags) counts.set(t, (counts.get(t) ?? 0) + 1)
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
  }, [assets])

  const activeTag = tagFilter || undefined

  // Fetch assets
  React.useEffect(() => {
    let cancelled = false
    setLoading(true)
    listAssets({ clientId, fileType: activeFileType, tag: activeTag })
      .then((data) => {
        if (!cancelled) setAssets(data)
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(err instanceof Error ? err.message : "Failed to load assets")
          setAssets([])
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [clientId, activeFileType, activeTag])

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return
    setUploading(true)
    try {
      await Promise.all(
        files.map(async (file) => {
          const result = await uploadAsset(clientId, file)
          if (!result.success) {
            throw new Error(result.error ?? "Upload failed")
          }
          return result.asset
        })
      )
      toast.success(`${files.length} asset(s) uploaded`)
      const updated = await listAssets({
        clientId,
        fileType: activeFileType,
      })
      setAssets(updated)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = async (files: File[]) => {
    await handleUpload(files)
  }

  const handleDelete = async (assetId: string) => {
    setDeletingId(assetId)
    try {
      const result = await deleteAsset(assetId, clientId)
      if (!result.success) throw new Error(result.error ?? "Delete failed")
      toast.success("Asset deleted")
      setAssets((prev) => prev.filter((a) => a.id !== assetId))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed")
    } finally {
      setDeletingId(null)
    }
  }

  const toggleSelect = (assetId: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(assetId)) next.delete(assetId)
      else next.add(assetId)
      return next
    })
  }

  const selectAll = () => {
    setSelected((prev) => {
      if (prev.size === assets.length) return new Set()
      return new Set(assets.map((a) => a.id))
    })
  }

  const refresh = async () => {
    const updated = await listAssets({
      clientId,
      fileType: activeFileType,
      tag: activeTag,
    })
    setAssets(updated)
  }

  const handleBatchDelete = async () => {
    const ids = Array.from(selected)
    if (ids.length === 0) return
    if (!confirm(`Hapus ${ids.length} aset terpilih? Tindakan ini tidak bisa dibatalkan.`)) return

    setBatchBusy(true)
    try {
      const result = await deleteAssets(ids, clientId)
      if (!result.success) throw new Error(result.error ?? "Batch delete failed")
      toast.success(`${result.affected} aset dihapus`)
      setSelected(new Set())
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Batch delete failed")
    } finally {
      setBatchBusy(false)
    }
  }

  const handleBatchTag = async () => {
    const ids = Array.from(selected)
    const tags = tagInput.split(",").map((t) => t.trim()).filter(Boolean)
    if (ids.length === 0 || tags.length === 0) {
      toast.error("Pilih aset dan isi minimal satu tag")
      return
    }

    setBatchBusy(true)
    try {
      const result = await tagAssets(ids, clientId, tags)
      if (!result.success) throw new Error(result.error ?? "Batch tag failed")
      toast.success(`${result.affected} aset diberi tag`)
      setTagOpen(false)
      setTagInput("")
      setSelected(new Set())
      await refresh()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Batch tag failed")
    } finally {
      setBatchBusy(false)
    }
  }

  const filteredAssets = assets

  // Reordering only makes sense on the full list: a filtered view is a subset,
  // and dragging inside it would write positions that contradict the hidden
  // assets. So dragging is disabled whenever a type or tag filter is active.
  const canReorder = !activeFileType && !activeTag && !sortBusy && filteredAssets.length > 1

  return (
    <PageContainer
      pageTitle="Media Library"
      pageDescription={`Aset media untuk ${activeClient.name}. File diupload ke Cloudinary dan tersimpan di storage client ini.`}
    >
      {/* Upload Zone */}
      <div className="rounded-xl border border-dashed border-border p-6">
        <FileUploader
          onUpload={handleDrop}
          maxSize={25 * 1024 * 1024}
          accept={{
            "image/*": [],
            "video/*": [],
          }}
          disabled={uploading}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-full w-max border border-border/20 mt-4">
        {(["all", "image", "video"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFileType(f)}
            className={cn(
              "px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
              fileType === f
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {f === "all" ? "All Assets" : f === "image" ? "Images" : "Videos"}
          </button>
        ))}
      </div>

      {/* Tag filter chips */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <span className="text-[10px] font-bold text-muted-foreground uppercase mr-1">Tags</span>
          {allTags.map(([tag, count]) => (
            <button
              key={tag}
              type="button"
              onClick={() => setTagFilter(tagFilter === tag ? "" : tag)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer border",
                tagFilter === tag
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-muted-foreground border-border hover:text-foreground hover:border-primary/40"
              )}
            >
              #{tag}
              <span className="ml-1 opacity-60">{count}</span>
            </button>
          ))}
          {tagFilter && (
            <button
              type="button"
              onClick={() => setTagFilter("")}
              className="px-2.5 py-1 rounded-full text-[11px] font-bold text-destructive hover:bg-destructive/10 transition-colors"
            >
              Reset
            </button>
          )}
        </div>
      )}

      {/* Batch action bar — appears only when assets are selected */}
      {selected.size > 0 && (
        <div className="sticky top-4 z-20 flex items-center gap-2 rounded-xl border border-primary/40 bg-card/95 backdrop-blur p-3 shadow-lg mt-4">
          <span className="text-sm font-bold text-foreground">
            {selected.size} dipilih
          </span>
          <div className="h-4 w-px bg-border" />
          <Button
            size="sm"
            variant="outline"
            onClick={() => setTagOpen((v) => !v)}
            disabled={batchBusy}
            className="gap-1 text-xs"
          >
            <Icons.tag className="size-3.5" /> Tag
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => void handleBatchDelete()}
            disabled={batchBusy}
            className="gap-1 text-xs"
          >
            <Icons.trash className="size-3.5" /> Hapus
          </Button>
          {tagOpen && (
            <div className="flex items-center gap-2 ml-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder="tag1, tag2"
                className="h-8 w-44 rounded-lg border border-input bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-ring"
              />
              <Button
                size="sm"
                onClick={() => void handleBatchTag()}
                disabled={batchBusy}
                className="text-xs h-8"
              >
                Simpan
              </Button>
            </div>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelected(new Set())}
            disabled={batchBusy}
            className="ml-auto text-xs"
          >
            Batal
          </Button>
        </div>
      )}

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
        <div className="p-3 rounded-xl bg-card border border-border">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Total</p>
          <p className="text-lg font-black text-foreground">{assets.length}</p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Images</p>
          <p className="text-lg font-black text-foreground">
            {assets.filter((a) => a.fileType === "image").length}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Videos</p>
          <p className="text-lg font-black text-foreground">
            {assets.filter((a) => a.fileType === "video").length}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Storage</p>
          <p className="text-lg font-black text-foreground">{assets.length} files</p>
        </div>
      </div>

      {/* Asset Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={handleDragEnd}
        accessibility={{
          announcements: {
            ...defaultAnnouncements,
            onDragEnd({ over }) {
              return over
                ? `Aset dipindahkan ke posisi ${filteredAssets.findIndex((a) => a.id === over.id) + 1}.`
                : 'Pemindahan aset dibatalkan.'
            },
          },
        }}
      >
      <div className={cn(
        "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 mt-4 transition-opacity",
        sortBusy ? "pointer-events-none opacity-60" : "opacity-100"
      )}>
        {/* Select all header */}
        {assets.length > 0 && (
          <div className="col-span-full flex items-center gap-3 mb-1">
            <button
              type="button"
              onClick={selectAll}
              className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-bold hover:bg-secondary/50 transition-colors"
            >
              <Checkbox
                checked={selected.size === assets.length && assets.length > 0}
                onCheckedChange={selectAll}
                aria-label="Pilih semua aset"
              />
              {selected.size === assets.length ? "Batalkan semua" : "Pilih semua"}
            </button>
            {selected.size > 0 && (
              <span className="text-xs text-muted-foreground">
                {selected.size} / {assets.length} dipilih
              </span>
            )}
          </div>
        )}
        {loading ? (
          <div className="col-span-full flex items-center justify-center py-12">
            <Icons.spinner className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            <Icons.media className="size-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No assets yet. Upload your first file above.</p>
          </div>
        ) : (
          <SortableContext items={filteredAssets.map((a) => a.id)} strategy={rectSortingStrategy}>
            {filteredAssets.map((asset) => (
              <SortableAsset
                key={asset.id}
                asset={asset}
                selected={selected}
                deletingId={deletingId}
                canReorder={canReorder}
                toggleSelect={toggleSelect}
                setPreviewAsset={setPreviewAsset}
                handleDelete={handleDelete}
                clientId={clientId}
              />
            ))}
          </SortableContext>
        )}
      </div>
      </DndContext>

      {/* Asset detail lightbox */}
      <Dialog open={!!previewAsset} onOpenChange={(open) => !open && setPreviewAsset(null)}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden gap-0">
          <DialogTitle className="sr-only">Detail aset</DialogTitle>
          {previewAsset && (
            <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr]">
              {/* Media */}
              <div className="relative bg-black/90 flex items-center justify-center min-h-[260px] max-h-[70vh]">
                {previewAsset.fileType === "video" ? (
                  <video
                    src={previewUrl(previewAsset.url)}
                    controls
                    className="max-h-[70vh] w-full"
                  />
                ) : (
                  <img
                    src={previewUrl(previewAsset.url)}
                    alt={previewAsset.publicId}
                    className="max-h-[70vh] w-full object-contain"
                  />
                )}
              </div>
              {/* Metadata */}
              <div className="p-5 flex flex-col gap-4 overflow-y-auto">
                <div>
                  <p className="text-[10px] font-bold uppercase text-muted-foreground">File ID</p>
                  <p className="text-sm font-mono text-foreground break-all">
                    {previewAsset.publicId}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase">
                    {previewAsset.fileType}
                  </span>
                  {previewAsset.tags.length > 0 &&
                    previewAsset.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-bold"
                      >
                        #{tag}
                      </span>
                    ))}
                </div>
                <div className="text-xs text-muted-foreground">
                  Diunggah {new Date(previewAsset.createdAt).toLocaleString("id-ID")}
                </div>

                {/* AI caption draft */}
                <div className="rounded-lg border border-border bg-muted/40 p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase text-muted-foreground">
                      <Icons.sparkles className="size-3.5" /> Caption AI
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 gap-1.5 text-xs"
                      disabled={captionBusy || previewAsset.fileType === "video"}
                      onClick={() => void handleGenerateCaption()}
                    >
                      {captionBusy ? (
                        <>
                          <Icons.refresh className="size-3.5 animate-spin" /> Menulis...
                        </>
                      ) : (
                        <>
                          <Icons.bot className="size-3.5" /> Buat
                        </>
                      )}
                    </Button>
                  </div>
                  {caption ? (
                    <div className="flex flex-col gap-2">
                      <p className="text-sm text-foreground whitespace-pre-wrap">{caption}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 gap-1.5 text-xs self-start"
                        onClick={() => {
                          void navigator.clipboard.writeText(caption)
                          toast.success("Caption disalin")
                        }}
                      >
                        <Icons.copy className="size-3.5" /> Salin
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      {previewAsset.fileType === "video"
                        ? "Caption AI belum tersedia untuk video."
                        : "Buat draf caption dari gambar ini."}
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  <Button
                    className="gap-2 w-full"
                    onClick={() => {
                      router.push(
                        `/admin/calendar?clientId=${clientId}&mediaUrl=${encodeURIComponent(previewAsset.url)}&new=1`
                      )
                    }}
                  >
                    <Icons.calendar className="size-4" /> Jadwalkan dengan aset ini
                  </Button>
                  <a href={previewAsset.url} download target="_blank" rel="noreferrer" className="w-full">
                    <Button variant="outline" className="gap-2 w-full">
                      <Icons.download className="size-4" /> Download
                    </Button>
                  </a>
                  <Button
                    variant="destructive"
                    className="gap-2 w-full"
                    disabled={deletingId === previewAsset.id}
                    onClick={() => {
                      void handleDelete(previewAsset.id)
                      setPreviewAsset(null)
                    }}
                  >
                    <Icons.trash className="size-4" /> Hapus aset
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </PageContainer>
  )
}

interface SortableAssetProps {
  asset: Asset
  selected: Set<string>
  deletingId: string | null
  canReorder: boolean
  toggleSelect: (id: string) => void
  setPreviewAsset: (asset: Asset) => void
  handleDelete: (id: string) => Promise<void>
  clientId: string
}

/**
 * One draggable grid cell. The whole tile is the drag handle (except the
 * checkbox and the hover action buttons, which stop propagation) so a small
 * drag moves the card while a plain click opens the preview.
 */
function SortableAsset({
  asset,
  selected,
  deletingId,
  canReorder,
  toggleSelect,
  setPreviewAsset,
  handleDelete,
  clientId,
}: SortableAssetProps) {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: asset.id,
    disabled: !canReorder,
  })

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 30 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group relative aspect-square rounded-2xl overflow-hidden border transition-shadow",
        selected.has(asset.id)
          ? "border-primary ring-2 ring-primary/30"
          : "border-border hover:border-primary/50",
        isDragging && "shadow-2xl ring-2 ring-primary",
        canReorder ? "cursor-grab active:cursor-grabbing" : ""
      )}
    >
      {/* Drag affordance, only when reordering is available */}
      {canReorder && (
        <div className="absolute top-2 right-10 z-10 rounded-md bg-black/50 p-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <Icons.gripVertical className="size-3 text-white" />
        </div>
      )}

      {/* Selection checkbox */}
      <div
        className="absolute top-2 left-2 z-10"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Checkbox
          checked={selected.has(asset.id)}
          onCheckedChange={() => toggleSelect(asset.id)}
          aria-label={`Pilih ${asset.publicId}`}
        />
      </div>

      <img
        src={thumbnailUrl(asset.url)}
        alt={asset.publicId}
        loading="lazy"
        draggable={false}
        className="w-full h-full object-cover"
        onClick={() => setPreviewAsset(asset)}
      />

      {/* Hover Overlay */}
      <div
        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2"
        onPointerDown={(e) => e.stopPropagation()}
      >
        <Button
          size="sm"
          variant="default"
          className="gap-1 text-xs"
          onClick={() => {
            router.push(
              `/admin/calendar?clientId=${clientId}&mediaUrl=${encodeURIComponent(asset.url)}&new=1`
            )
          }}
        >
          <Icons.calendar className="size-3" /> Use in Post
        </Button>
        <a href={asset.url} download target="_blank" rel="noreferrer">
          <Button size="sm" variant="secondary" className="gap-1 text-xs">
            <Icons.download className="size-3" /> Download
          </Button>
        </a>
        <Button
          size="sm"
          variant="destructive"
          className="gap-1 text-xs"
          disabled={deletingId === asset.id}
          onClick={() => void handleDelete(asset.id)}
        >
          <Icons.trash className="size-3" />
          {deletingId === asset.id ? "Deleting..." : "Delete"}
        </Button>
      </div>

      {/* File Type Badge */}
      <div className="absolute top-2 right-2 pointer-events-none">
        <span className="px-2 py-0.5 rounded-full bg-black/60 text-white text-[9px] font-bold uppercase">
          {asset.fileType}
        </span>
      </div>

      {/* Tags display */}
      {asset.tags.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
          <div className="flex flex-wrap gap-1">
            {asset.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 py-0.5 rounded-md bg-primary/70 text-white text-[9px] font-bold"
              >
                #{tag}
              </span>
            ))}
            {asset.tags.length > 3 && (
              <span className="px-1.5 py-0.5 text-white text-[9px] font-bold">
                +{asset.tags.length - 3}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
