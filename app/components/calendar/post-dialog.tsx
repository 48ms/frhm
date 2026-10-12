'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/animate-ui/components/radix/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/animate-ui/components/radix/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/animate-ui/components/radix/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/animate-ui/components/radix/radio-group'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Icons } from '@/components/icons'
import { cn } from '@/lib/utils'
import { PlatformIcon } from './platform-icon'
import { type ScheduledPost } from '@/features/scheduled-posts/api/types'
import { useCreateScheduledPost, useUpdateScheduledPost, useDeleteScheduledPost } from '@/features/scheduled-posts/api/queries'
import { useCurrentUser } from '@/lib/auth/use-current-user'
import { toast } from 'sonner'
import { useDialogA11y } from '@/components/social-accounts/use-dialog-a11y'
import { AssetPicker } from '@/components/library/asset-picker'
import type { Asset, AssetFileType } from '@/features/library/api/types'
import { campaignQueries } from '@/features/campaigns/api/queries'
import { useQuery } from '@tanstack/react-query'

const PLATFORM_OPTIONS = [
  { id: 'instagram', label: 'Instagram' },
  { id: 'tiktok', label: 'TikTok' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'facebook', label: 'Facebook' },
  { id: 'x', label: 'X' },
]

const STATUS_OPTIONS = [
  { id: 'scheduled', label: 'Terjadwal' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Draft' },
]

const PRIORITY_OPTIONS = [
  { id: 'low', label: 'Low' },
  { id: 'normal', label: 'Normal' },
  { id: 'high', label: 'High' },
  { id: 'urgent', label: 'Urgent' },
]

/**
 * Per-platform caption limits enforced by the downstream publishing APIs.
 * A caption over its platform's limit is accepted by the composer but rejected
 * at publish time by the cron -> Ayrshare bridge, so the dialog blocks it up
 * front instead of letting the post fail silently hours later.
 *
 * Instagram 2,200 · TikTok 2,200 · YouTube (Shorts) 5,000 · LinkedIn 3,000.
 * `youtube` shares the Shorts limit; unknown platforms fall back to 2,200.
 */
const CAPTION_LIMIT: Record<string, number> = {
  instagram: 2200,
  tiktok: 2200,
  shorts: 5000,
  youtube: 5000,
  linkedin: 3000,
}

const DEFAULT_CAPTION_LIMIT = 2200

export function PostDialog({
  isOpen,
  onClose,
  initialDate,
  editingPost,
  clientId,
  onSave,
  onDelete,
  initialTitle,
  initialContent,
  initialMediaUrl,
}: {
  isOpen: boolean
  onClose: () => void
  initialDate?: Date
  editingPost?: ScheduledPost | null
  clientId: string
  onSave: () => void
  onDelete?: (id: string) => void
  initialTitle?: string
  initialContent?: string
  initialMediaUrl?: string
}) {
  const { mutateAsync: createPost } = useCreateScheduledPost()
  const { authorName } = useCurrentUser()
  const { mutateAsync: updatePost } = useUpdateScheduledPost()
  const { mutateAsync: deletePost } = useDeleteScheduledPost()

  useDialogA11y(isOpen, onClose)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [platform, setPlatform] = useState('instagram')
  const [status, setStatus] = useState<'draft' | 'scheduled' | 'published'>('scheduled')
  const [time, setTime] = useState('09:00')
  const [dateStr, setDateStr] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mediaUrl, setMediaUrl] = useState('')
  const [mediaType, setMediaType] = useState<AssetFileType>('image')
  const [pickerOpen, setPickerOpen] = useState(false)

  // Reserved slot fields
  const [isReserved, setIsReserved] = useState(false)
  const [reservedFor, setReservedFor] = useState('')

  // Content Planning fields
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal')
  const [campaignTag, setCampaignTag] = useState('')

  // Destructive-action confirmation (replaces the native blocking confirm()
  // dialog, which is not keyboard/screen-reader friendly and cannot be styled).
  const [deleteOpen, setDeleteOpen] = useState(false)

  const { data: fetchedCampaigns } = useQuery(campaignQueries.listByClient(clientId))
  const campaigns = fetchedCampaigns || []

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title)
      setContent(editingPost.content)
      setPlatform(editingPost.platform)
      setStatus(editingPost.status as 'draft' | 'scheduled' | 'published')
      setIsReserved(editingPost.is_reserved ?? false)
      setReservedFor(editingPost.reserved_for ?? '')
      setPriority((editingPost.priority as 'low' | 'normal' | 'high' | 'urgent') || 'normal')
      setCampaignTag(editingPost.campaign_tag || '')
      // Load the post's existing media so "Edit Media" shows what is attached
      // instead of an empty slot.
      const existingMedia = editingPost.media_url ?? ''
      setMediaUrl(existingMedia)
      setMediaType(/\.(mp4|mov|webm|m4v)(\?|$)/i.test(existingMedia) ? 'video' : 'image')
      const d = new Date(editingPost.scheduled_at)
      setDateStr(d.toISOString().split('T')[0])
      setTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
    } else if (initialDate) {
      setTitle(initialTitle ?? '')
      setContent(initialContent ?? '')
      setPlatform('instagram')
      setStatus('scheduled')
      setIsReserved(false)
      setReservedFor('')
      setPriority('normal')
      setCampaignTag('')
      setMediaUrl(initialMediaUrl ?? '')
      setMediaType('image')
      const offset = initialDate.getTimezoneOffset()
      const d = new Date(initialDate.getTime() - offset * 60 * 1000)
      setDateStr(d.toISOString().split('T')[0])
      setTime('09:00')
    }
  }, [editingPost, initialDate, initialTitle, initialContent, initialMediaUrl, isOpen])

  const isPlaceholder = isReserved

  // Per-platform caption limit for the currently selected platform.
  const captionLimit = CAPTION_LIMIT[platform] ?? DEFAULT_CAPTION_LIMIT
  const captionOverLimit = content.length > captionLimit

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isPlaceholder) {
      if (!dateStr || !time) {
        setError('Tanggal dan waktu wajib diisi')
        return
      }
    } else {
      if (!title.trim() || !dateStr || !time) {
        setError('Judul, tanggal, dan waktu wajib diisi')
        return
      }
      // The publish cron rejects a post whose text AND media are both empty
      // (route.ts: "Post content and media are both empty"). Catch it here so
      // the admin learns immediately instead of the post failing hours later.
      if (!content.trim() && !mediaUrl) {
        setError('Isi caption atau lampirkan media sebelum menjadwalkan.')
        return
      }
      // A caption over the platform's limit is accepted by the composer but
      // rejected by the publishing API. Block it before it can be scheduled.
      if (captionOverLimit) {
        setError(
          `Caption ${content.length.toLocaleString('id-ID')} karakter melebihi batas ${platform} (${captionLimit.toLocaleString('id-ID')} karakter).`
        )
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      const scheduledAt = new Date(`${dateStr}T${time}:00`).toISOString()

      if (editingPost) {
        await updatePost({
          id: editingPost.id,
          clientId,
          title: isPlaceholder
            ? title || (reservedFor ? `Slot: ${reservedFor}` : 'Slot Reserved')
            : title,
          content: isPlaceholder ? '' : content || '',
          platform,
          scheduled_at: scheduledAt,
          status,
          media_url: mediaUrl || undefined,
        })
        toast.success('Post diperbarui.')
      } else {
        await createPost({
          client_id: clientId,
          title: isPlaceholder
            ? title || (reservedFor ? `Slot: ${reservedFor}` : 'Slot Reserved')
            : title,
          content: isPlaceholder ? '' : content || '',
          platform,
          scheduled_at: scheduledAt,
          status: "draft",
          author: authorName,
          media_url: mediaUrl || undefined,
        })
        toast.success('Post dijadwalkan.')
      }

      onSave()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!editingPost || !onDelete) return
    setLoading(true)
    try {
      await deletePost({ id: editingPost.id, clientId })
      toast.success('Post dihapus.')
      onDelete(editingPost.id)
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus')
    } finally {
      setLoading(false)
    }
  }

  const isCampaignMode = isPlaceholder

  const submitLabel = loading
    ? 'Menyimpan...'
    : editingPost
    ? isCampaignMode
      ? 'Simpan Slot'
      : 'Simpan Perubahan'
    : isCampaignMode
    ? 'Reservasi Slot'
    : 'Jadwalkan Postingan'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl p-0 gap-0 overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row h-[78vh] sm:max-h-[640px] max-h-[90vh] animate-in fade-in zoom-in-95 duration-300">
          {/* ========================================================== */}
          {/* MAIN WORKSPACE (left): editor area, Notion-style           */}
          {/* ========================================================== */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-popover">
            <DialogHeader className="px-6 pt-6 pb-4 space-y-1">
              <DialogTitle className="text-lg font-semibold tracking-tight">
                {editingPost
                  ? isCampaignMode
                    ? 'Edit Slot Reserve'
                    : 'Edit Jadwal Postingan'
                  : isCampaignMode
                  ? 'Buat Slot Reserve'
                  : 'Jadwalkan Postingan Baru'}
              </DialogTitle>
              <DialogDescription>
                {isCampaignMode
                  ? 'Buat slot waktu untuk kampanye Natal sebelum konten jadi siap.'
                  : 'Tentukan platform, tanggal rilis, dan isi konten yang akan dipublish.'}
              </DialogDescription>
            </DialogHeader>

            <Separator />

            <ScrollArea className="flex-1 min-h-0">
              <div className="px-6 py-5 space-y-5">
                {error && (
                  <div
                    role="alert"
                    className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive animate-in fade-in slide-in-from-top-2 duration-200"
                  >
                    {error}
                  </div>
                )}

                {/* Reserve toggle — styled as a subtle glass card */}
                <div className={cn(
                  "flex items-start space-x-3 space-y-0 rounded-xl border p-3.5 transition-colors",
                  isReserved
                    ? "bg-primary/5 border-primary/30 ring-1 ring-primary/15"
                    : "bg-muted/40 border-border/40"
                )}>
                  <Checkbox
                    id="is-reserved"
                    checked={isReserved}
                    onCheckedChange={(checked: boolean) => setIsReserved(checked)}
                    className="mt-0.5"
                  />
                  <div className="space-y-1 leading-none">
                    <Label htmlFor="is-reserved" className="font-medium cursor-pointer">
                      Ini adalah slot reserve untuk kampanye
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Buat slot di kalender sebelum konten siap. Saat konten siap, ubah status dari Draft ke Scheduled.
                    </p>
                  </div>
                </div>

                {/* Reserved for (campaign name) */}
                {isCampaignMode && (
                  <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                    <Label htmlFor="reserved-for" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                      Nama Kampanye
                    </Label>
                    <Input
                      id="reserved-for"
                      placeholder="e.g. Campaign Natal 2026"
                      value={reservedFor}
                      onChange={(e) => setReservedFor(e.target.value)}
                      className="h-11 text-sm-plus font-medium"
                    />
                  </div>
                )}

                {/* Judul Postingan (optional if reserved) */}
                <div className="space-y-1.5">
                  <Label htmlFor="post-title" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    {isCampaignMode ? 'Judul / Catatan' : 'Judul Postingan / Konsep'}
                  </Label>
                  <Input
                    id="post-title"
                    placeholder={isCampaignMode ? 'e.g. Slot untuk Konten Natal' : 'e.g. Tips Digital Marketing untuk UMKM'}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required={!isCampaignMode}
                    className="h-11 text-sm-plus font-medium"
                  />
                </div>

                {/* Isi Konten / Caption (hidden if reserved) — the star of the workspace */}
                {!isCampaignMode && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="post-content" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                        Isi Caption / Copywriting
                      </Label>
                      <span
                        id="post-content-count"
                        aria-live="polite"
                        className={cn(
                          "text-1xs tabular-nums transition-colors",
                          captionOverLimit ? "text-destructive font-semibold" : "text-muted-foreground/70"
                        )}
                      >
                        {content.length.toLocaleString('id-ID')} / {captionLimit.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <Textarea
                      id="post-content"
                      placeholder="Tulis caption lengkap beserta hashtag di sini..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={6}
                      aria-invalid={captionOverLimit}
                      aria-describedby={captionOverLimit ? "post-content-count post-content-error" : "post-content-count"}
                      className={cn(
                        "min-h-[180px] resize-none border-border/60 bg-muted/20 focus-visible:bg-background transition-colors text-sm-plus leading-relaxed",
                        captionOverLimit && "border-destructive focus-visible:border-destructive"
                      )}
                    />
                    {captionOverLimit && (
                      <p id="post-content-error" role="alert" className="text-xs text-destructive">
                        Caption melebihi batas {platform} ({captionLimit.toLocaleString('id-ID')} karakter). Publikasi akan ditolak.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* ========================================================== */}
          {/* SETTINGS SIDEBAR (right): controls, Linear-style           */}
          {/* ========================================================== */}
          <aside
            aria-label="Pengaturan postingan"
            className="w-full sm:w-[320px] flex-1 sm:flex-none flex flex-col min-h-0 border-l border-border/60 bg-muted/30"
          >
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-5 py-5 space-y-5">
                {/* Platform Radio Group (accessible) */}
                <div className="space-y-2">
                  <Label id="platform-label" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                    Platform Tujuan
                  </Label>
                  <RadioGroup
                    value={platform}
                    onValueChange={setPlatform}
                    className="grid grid-cols-3 gap-1.5 bg-background p-1 rounded-xl border border-border/40"
                    aria-labelledby="platform-label"
                  >
                    {PLATFORM_OPTIONS.map((opt) => (
                      <div key={opt.id} className="relative flex items-center justify-center">
                        <RadioGroupItem
                          value={opt.id}
                          id={`platform-${opt.id}`}
                          className="sr-only"
                        />
                        <Label
                          htmlFor={`platform-${opt.id}`}
                          className={cn(
                            "flex w-full cursor-pointer items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-medium transition-all",
                            platform === opt.id
                              ? "bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20"
                              : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                          )}
                        >
                          <PlatformIcon platform={opt.id} className="size-3.5" />
                          <span className="truncate">{opt.label}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Date & Time Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="post-date" className="text-xs">Tanggal Tayang</Label>
                    <Input
                      id="post-date"
                      type="date"
                      value={dateStr}
                      onChange={(e) => setDateStr(e.target.value)}
                      required
                      className="h-10 font-medium"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="post-time" className="text-xs">Waktu (Jam)</Label>
                    <Input
                      id="post-time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      className="h-10 font-medium"
                    />
                  </div>
                </div>

                <Separator />

                {/* Planning Layer: Priority & Campaign via shadcn Select */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label id="priority-label" className="text-xs">Prioritas</Label>
                    <RadioGroup
                      aria-labelledby="priority-label"
                      value={priority}
                      onValueChange={(v) => setPriority(v as 'low' | 'normal' | 'high' | 'urgent')}
                      className="grid grid-cols-4 gap-2"
                    >
                      {PRIORITY_OPTIONS.map((opt) => (
                        <div key={opt.id}>
                          <RadioGroupItem value={opt.id} id={`prio-${opt.id}`} className="peer sr-only" />
                          <Label
                            htmlFor={`prio-${opt.id}`}
                            className="flex items-center justify-center h-10 px-2 rounded-lg border bg-popover hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10 peer-data-[state=checked]:text-primary cursor-pointer text-xs font-bold transition-all"
                          >
                            {opt.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="post-campaign" className="text-xs">Kampanye / Promo</Label>
                    <Select
                      value={campaignTag}
                      onValueChange={(v) => setCampaignTag(v ?? '')}
                    >
                      <SelectTrigger id="post-campaign" className="w-full h-10">
                        <SelectValue placeholder="Tidak terkait kampanye" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="">(Tidak terkait kampanye)</SelectItem>
                          {campaigns.map((c) => (
                            <SelectItem key={c.id} value={c.name}>
                              {c.name}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                {/* Media attachment preview (from Media Library) */}
                {!isCampaignMode && (
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                      Media Terlampir
                    </Label>
                    {mediaUrl ? (
                      <div className="relative w-full overflow-hidden rounded-xl border border-border/60 group">
                        {mediaType === 'video' ? (
                          <video
                            src={mediaUrl}
                            controls
                            className="h-36 w-full object-cover bg-black"
                          />
                        ) : (
                          <img
                            src={mediaUrl}
                            alt="Media terlampir"
                            className="h-36 w-full object-cover"
                          />
                        )}
                        <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            className="h-7 text-xs shadow-md"
                            onClick={() => setPickerOpen(true)}
                          >
                            Ganti
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="destructive"
                            className="h-7 text-xs shadow-md"
                            onClick={() => setMediaUrl('')}
                          >
                            Hapus
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setPickerOpen(true)}
                        className="w-full flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/60 bg-background/40 hover:bg-muted/60 hover:border-primary/40 transition-all py-6 h-auto group cursor-pointer"
                      >
                        <div className="size-9 rounded-full bg-muted/60 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <Icons.media className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors font-medium">
                          Pilih dari Media Library
                        </span>
                      </Button>
                    )}
                  </div>
                )}

                {/* Status Radio Group (accessible) */}
                {!isCampaignMode && (
                  <div className="space-y-2">
                    <Label id="status-label" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                      Status
                    </Label>
                    <RadioGroup
                      value={status}
                      onValueChange={(v) => setStatus(v as 'draft' | 'scheduled' | 'published')}
                      className="grid grid-cols-3 gap-1.5 bg-background p-1 rounded-xl border border-border/40"
                      aria-labelledby="status-label"
                    >
                      {STATUS_OPTIONS.map((opt) => (
                        <div key={opt.id} className="relative flex items-center justify-center">
                          <RadioGroupItem
                            value={opt.id}
                            id={`status-${opt.id}`}
                            className="sr-only"
                          />
                          <Label
                            htmlFor={`status-${opt.id}`}
                            className={cn(
                              "flex w-full cursor-pointer items-center justify-center py-2 text-xs font-medium rounded-lg transition-all",
                              status === opt.id
                                ? "bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                            )}
                          >
                            {opt.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Footer: sticky action bar */}
            <div className="border-t border-border/60 bg-background/80 backdrop-blur-sm p-4 flex items-center gap-2">
              {editingPost && onDelete && (
                <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      isLoading={loading}
                      className="h-9 text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      Hapus
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Hapus postingan?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Tindakan ini akan menghapus postingan{' '}
                        <strong>{editingPost?.title}</strong> secara permanen. Setelah dihapus,
                        postingan tidak dapat dikembalikan.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Batalkan</AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={loading}
                      >
                        {loading ? 'Menghapus...' : 'Hapus Postingan'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="h-9 ml-auto">
                Batal
              </Button>
              <Button
                type="submit"
                isLoading={loading}
                loadingLabel="Menyimpan..."
                className="h-9 shadow-md min-w-[140px]"
              >
                {submitLabel}
              </Button>
            </div>
          </aside>
        </form>
      </DialogContent>

      {/* Nested dialog: browsing the Media Library without leaving the composer. */}
      <AssetPicker
        clientId={clientId}
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={(asset: Asset) => {
          setMediaUrl(asset.url)
          setMediaType(asset.fileType)
        }}
      />
    </Dialog>
  )
}
