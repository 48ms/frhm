'use client'

import { useState, useEffect, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
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
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isPlaceholder) {
      if (!dateStr || !time) {
        setError('Tanggal dan waktu wajib diisi')
        return
      }
    } else {
      if (!title || !dateStr || !time) {
        setError('Judul, tanggal, dan waktu wajib diisi')
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
          <DialogHeader>
            <DialogTitle>
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

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
              {error}
            </div>
          )}

          {/* Reserve toggle */}
          <div className="flex items-start space-x-3 space-y-0 rounded-lg border p-4">
            <Checkbox
              id="is-reserved"
              checked={isReserved}
              onCheckedChange={(checked: boolean) => setIsReserved(checked)}
            />
            <div className="space-y-1 leading-none">
              <Label htmlFor="is-reserved" className="font-medium">
                Ini adalah slot reserve untuk kampanye
              </Label>
              <p className="text-sm text-muted-foreground">
                Buat slot di kalender sebelum konten siap. Saat konten siap, ubah status dari Draft ke Scheduled.
              </p>
            </div>
          </div>

          {/* Platform Radio Group (accessible) */}
          <div className="space-y-1.5">
            <Label id="platform-label">Platform Tujuan</Label>
            <RadioGroup
              value={platform}
              onValueChange={setPlatform}
              className="grid grid-cols-3 gap-1.5 bg-muted/60 p-1 rounded-xl"
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
                      "flex w-full cursor-pointer items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all",
                      platform === opt.id
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <PlatformIcon platform={opt.id} className="size-3.5" />
                    <span>{opt.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Reserved for (campaign name) */}
          {isCampaignMode && (
            <div className="space-y-1.5">
              <Label htmlFor="reserved-for">Nama Kampanye</Label>
              <Input
                id="reserved-for"
                placeholder="e.g. Campaign Natal 2026"
                value={reservedFor}
                onChange={(e) => setReservedFor(e.target.value)}
                className="h-11"
              />
            </div>
          )}

          {/* Judul Postingan (optional if reserved) */}
          <div className="space-y-1.5">
            <Label htmlFor="post-title">
              {isCampaignMode ? 'Judul / Catatan' : 'Judul Postingan / Konsep'}
            </Label>
            <Input
              id="post-title"
              placeholder={isCampaignMode ? 'e.g. Slot untuk Konten Natal' : 'e.g. Tips Digital Marketing untuk UMKM'}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required={!isCampaignMode}
              className="h-11"
            />
          </div>

          {/* Date & Time Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="post-date">Tanggal Tayang</Label>
              <Input
                id="post-date"
                type="date"
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="post-time">Waktu (Jam)</Label>
              <Input
                id="post-time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
                className="h-11"
              />
            </div>
          </div>

          {/* Planning Layer: Priority & Campaign Tag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="post-priority">Prioritas</Label>
              <select
                id="post-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'low' | 'normal' | 'high' | 'urgent')}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="post-campaign">Kampanye / Promo</Label>
              <select
                id="post-campaign"
                value={campaignTag}
                onChange={(e) => setCampaignTag(e.target.value)}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">(Tidak terkait kampanye)</option>
                {campaigns.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Isi Konten / Caption (hidden if reserved) */}
          {!isCampaignMode && (
            <div className="space-y-1.5">
              <Label htmlFor="post-content">Isi Caption / Copywriting</Label>
              <Textarea
                id="post-content"
                placeholder="Tulis caption lengkap beserta hashtag di sini..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
              />
            </div>
          )}

          {/* Media attachment preview (from Media Library) */}
          {!isCampaignMode && (
            <div className="space-y-1.5">
              <Label>Media Terlampir</Label>
              {mediaUrl ? (
                <div className="relative w-full overflow-hidden rounded-lg border border-border">
                  {mediaType === 'video' ? (
                    <video
                      src={mediaUrl}
                      controls
                      className="h-40 w-full object-cover bg-black"
                    />
                  ) : (
                    <img
                      src={mediaUrl}
                      alt="Media terlampir"
                      className="h-40 w-full object-cover"
                    />
                  )}
                  <div className="absolute top-2 right-2 flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="h-7 text-xs"
                      onClick={() => setPickerOpen(true)}
                    >
                      Ganti
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      className="h-7 text-xs"
                      onClick={() => setMediaUrl('')}
                    >
                      Hapus
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-start gap-2 rounded-lg border border-dashed border-border px-3 py-4">
                  <p className="text-xs text-muted-foreground">
                    Belum ada media. Pilih aset dari Media Library, atau biarkan kosong untuk posting teks.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1.5 text-xs"
                    onClick={() => setPickerOpen(true)}
                  >
                    <Icons.media className="size-3.5" /> Pilih dari Library
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Status Radio Group (accessible) */}
          {!isCampaignMode && (
            <div className="space-y-1.5">
              <Label id="status-label">Status</Label>
              <RadioGroup
                value={status}
                onValueChange={(v) => setStatus(v as 'draft' | 'scheduled' | 'published')}
                className="grid grid-cols-3 gap-1.5 bg-muted/60 p-1 rounded-xl"
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
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {opt.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {editingPost && onDelete && (
              <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogTrigger
                  render={
                    <Button
                      type="button"
                      variant="destructive"
                      disabled={loading}
                      className="mr-auto h-11 sm:h-9"
                    />
                  }
                >
                  Hapus
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
                    <AlertDialogCancel>Batal</AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={loading}
                    >
                      {loading ? 'Menghapus...' : 'Hapus'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            <Button type="button" variant="outline" onClick={onClose} disabled={loading} className="h-11 sm:h-9">
              Batal
            </Button>
            <Button type="submit" disabled={loading} className="h-11 sm:h-9">
              {loading
                ? 'Menyimpan...'
                : editingPost
                ? isCampaignMode
                  ? 'Simpan Slot'
                  : 'Simpan Perubahan'
                : isCampaignMode
                ? 'Reservasi Slot'
                : 'Jadwalkan Postingan'}
            </Button>
          </DialogFooter>
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