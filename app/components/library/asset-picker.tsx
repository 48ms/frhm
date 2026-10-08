"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Icons } from "@/components/icons"
import { cn } from "@/lib/utils"
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query"
import { uploadAsset } from "@/features/library/api/service"
import { assetKeys, assetListOptions } from "@/features/library/api/queries"
import type { Asset, AssetFileType } from "@/features/library/api/types"
import { thumbnailUrl } from "@/lib/media/transform"
import { FileUploader } from "@/components/file-uploader"
import { toast } from "sonner"

const TYPE_TABS = ["all", "image", "video"] as const
type TypeTab = (typeof TYPE_TABS)[number]

/**
 * Modal browser over the tenant's Media Library. It is a pure reader: it never
 * writes, never fabricates a placeholder asset, and surfaces a load failure as
 * an error instead of an empty grid so the caller cannot mistake "could not
 * load" for "nothing here".
 */
export function AssetPicker({
  clientId,
  open,
  onOpenChange,
  onSelect,
  fileType,
}: {
  clientId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (asset: Asset) => void
  fileType?: AssetFileType
}) {
  const [query, setQuery] = React.useState("")
  const [tab, setTab] = React.useState<TypeTab>(fileType ?? "all")
  const [uploading, setUploading] = React.useState(false)

  const activeType = tab === "all" ? undefined : (tab as AssetFileType)

  const { data, isLoading, error: queryError } = useQuery({
    ...assetListOptions({ clientId, fileType: activeType }),
    enabled: open,
    placeholderData: keepPreviousData,
  })

  const assets = data ?? []
  const loading = isLoading
  const error = queryError?.message ?? null

  // Reset transient UI each time the picker is reopened.
  React.useEffect(() => {
    if (open) {
      setQuery("")
    }
  }, [open])

  const visible = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return assets
    return assets.filter(
      (a) => a.publicId.toLowerCase().includes(q) || a.tags.some((t) => t.includes(q))
    )
  }, [assets, query])

  const handlePick = (asset: Asset) => {
    onSelect(asset)
    onOpenChange(false)
  }

  const queryClient = useQueryClient()

  const handleUpload = async (files: File[]) => {
    if (!files.length) return
    setUploading(true)
    let addedCount = 0
    try {
      for (const file of files) {
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) continue
        const result = await uploadAsset(clientId, file)
        if (result.error) {
          throw new Error(result.error ?? "Upload failed")
        }
        if (result.asset) {
          addedCount++
        }
      }
      queryClient.invalidateQueries({ queryKey: assetKeys.all })
      toast.success(`${addedCount} media berhasil di-upload!`)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Upload gagal")
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogTitle>Pilih Media</DialogTitle>
        <DialogDescription>
          Pilih aset dari Media Library untuk dilampirkan ke postingan ini.
        </DialogDescription>

        {/* Search + type filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Icons.search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama atau tag..."
              className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-1 p-1 bg-secondary/50 rounded-full border border-border/20 w-max">
            {TYPE_TABS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer",
                  tab === t
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {t === "all" ? "Semua" : t === "image" ? "Gambar" : "Video"}
              </button>
            ))}
          </div>
        </div>

        {/* Upload Dropzone */}
        <div className="mb-4">
          <FileUploader
            onUpload={handleUpload}
            maxFiles={5}
            maxSize={25 * 1024 * 1024}
            disabled={uploading}
          />
        </div>

        {/* Grid body */}
        <div className="max-h-[40vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Icons.spinner className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
              {error}
            </div>
          ) : visible.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Icons.media className="size-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {assets.length === 0
                  ? "Belum ada aset. Unggah file di Media Library terlebih dahulu."
                  : "Tidak ada aset yang cocok dengan pencarian."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {visible.map((asset) => (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => handlePick(asset)}
                  className="group relative aspect-square rounded-xl overflow-hidden border border-border hover:border-primary focus-visible:ring-2 focus-visible:ring-ring outline-none cursor-pointer"
                >
                  <img
                    src={thumbnailUrl(asset.url)}
                    alt={asset.publicId}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-black/60 text-white text-[9px] font-bold">
                    {asset.fileType}
                  </span>
                  <span className="absolute inset-0 bg-primary/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Icons.check className="size-6 text-white" />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
