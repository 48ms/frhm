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
} from '@/components/animate-ui/components/radix/select'
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
import { socialQueries } from '@/features/social-accounts/api/queries'
import { useGenerateCaption, useGenerateHooks } from '@/features/copilot/api/queries'
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
 */
const CAPTION_LIMIT: Record<string, number> = {
  instagram: 2200,
  tiktok: 2200,
  shorts: 5000,
  youtube: 5000,
  linkedin: 3000,
  facebook: 5000,
  x: 280,
}

const DEFAULT_CAPTION_LIMIT = 2200

const CTA_PRESETS = [
  { label: '📲 Link Bio', text: '\n\n👉 Klik link di bio kami untuk info selengkapnya!' },
  { label: '💬 Komen INFO', text: '\n\n💬 Komen "INFO" di bawah, tim kami akan kirimkan detailnya lewat DM!' },
  { label: '📌 Save & Share', text: '\n\n📌 Simpan postingan ini agar tidak lupa dan share ke rekanmu!' },
  { label: '⚡ Promo Terbatas', text: '\n\n⚡ Promo terbatas khusus minggu ini. Amankan sekarang sebelum kehabisan!' },
]

function toLocalDateString(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function toLocalTimeString(d: Date): string {
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

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

  // AI Co-pilot mutations
  const { mutateAsync: generateCaptionMutate, isPending: isGeneratingCaption } = useGenerateCaption()
  const { mutateAsync: generateHooksMutate, isPending: isGeneratingHooks } = useGenerateHooks()

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

  // Workspace View Mode: 'editor' vs 'preview'
  const [workspaceView, setWorkspaceView] = useState<'editor' | 'preview'>('editor')

  // AI Hook suggestions state
  const [hookSuggestions, setHookSuggestions] = useState<Array<{ angle: string; text: string; explanation?: string }>>([])
  const [showHookSuggestions, setShowHookSuggestions] = useState(false)

  // Reserved slot fields
  const [isReserved, setIsReserved] = useState(false)
  const [reservedFor, setReservedFor] = useState('')

  // Content Planning fields
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal')
  const [campaignTag, setCampaignTag] = useState('')

  // Confirmation dialogs
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [confirmExitOpen, setConfirmExitOpen] = useState(false)

  const { data: fetchedCampaigns } = useQuery(campaignQueries.listByClient(clientId))
  const campaigns = fetchedCampaigns || []

  // Fetch client details for realistic live preview
  const { data: clientsData } = useQuery({
    ...socialQueries.listClientsWithChannels(),
    placeholderData: [],
  })
  const currentClient = clientsData?.find((c) => c.id === clientId)
  const clientName = currentClient?.name || 'Brand Workspace'
  const clientHandle = currentClient?.name ? '@' + currentClient.name.toLowerCase().replace(/\s+/g, '') : '@brand'

  useEffect(() => {
    if (editingPost) {
      setTitle(editingPost.title || '')
      setContent(editingPost.content || '')
      setPlatform(editingPost.platform)
      setStatus((editingPost.status as 'draft' | 'scheduled' | 'published') || 'scheduled')
      setIsReserved(editingPost.is_reserved ?? false)
      setReservedFor(editingPost.reserved_for ?? '')
      setPriority((editingPost.priority as 'low' | 'normal' | 'high' | 'urgent') || 'normal')
      setCampaignTag(editingPost.campaign_tag || '')
      const existingMedia = editingPost.media_url ?? ''
      setMediaUrl(existingMedia)
      setMediaType(/\.(mp4|mov|webm|m4v)(\?|$)/i.test(existingMedia) ? 'video' : 'image')
      const d = new Date(editingPost.scheduled_at)
      setDateStr(toLocalDateString(d))
      setTime(toLocalTimeString(d))
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
      setDateStr(toLocalDateString(initialDate))
      setTime('09:00')
    }
    setWorkspaceView('editor')
    setShowHookSuggestions(false)
    setHookSuggestions([])
  }, [editingPost, initialDate, initialTitle, initialContent, initialMediaUrl, isOpen])

  const isPlaceholder = isReserved
  const isCampaignMode = isReserved

  // Per-platform caption limit for the currently selected platform.
  const captionLimit = CAPTION_LIMIT[platform] ?? DEFAULT_CAPTION_LIMIT
  const captionOverLimit = content.length > captionLimit
  const captionPercent = Math.min(100, Math.round((content.length / captionLimit) * 100))
  const isDirty = (title.trim().length > 0 || content.trim().length > 0) && !editingPost

  const handleSafeClose = () => {
    if (isDirty) {
      setConfirmExitOpen(true)
    } else {
      onClose()
    }
  }

  // AI Generate Caption Action
  const handleGenerateCaption = async () => {
    if (!title.trim()) {
      toast.error('Isi Judul Postingan / Konsep terlebih dahulu sebagai topik caption.')
      return
    }
    try {
      const res = await generateCaptionMutate({
        clientId,
        topic: title.trim(),
        platform,
        goal: 'engagement',
      })
      if (res.error) {
        toast.error(res.error)
        return
      }
      if (res.caption) {
        setContent(res.caption)
        toast.success('Caption berhasil diracik AI sesuai Brand Voice!')
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal meracik caption dengan AI')
    }
  }

  // AI Hook Generator Action
  const handleGenerateHooks = async () => {
    if (!title.trim()) {
      toast.error('Isi Judul Postingan / Konsep terlebih dahulu sebagai topik hook.')
      return
    }
    try {
      const res = await generateHooksMutate({
        clientId,
        topic: title.trim(),
        platform,
      })
      if (res.error) {
        toast.error(res.error)
        return
      }
      if (res.hooks && res.hooks.length > 0) {
        setHookSuggestions(res.hooks)
        setShowHookSuggestions(true)
        toast.success('3 Variasi Hook Siap Dipilih!')
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal meracik variasi hook')
    }
  }

  const handleSelectHook = (hookText: string) => {
    if (content.trim()) {
      setContent(`${hookText}\n\n${content.trim()}`)
    } else {
      setContent(hookText)
    }
    setShowHookSuggestions(false)
    toast.success('Hook disisipkan di baris pertama caption!')
  }

  const handleInsertCta = (ctaText: string) => {
    setContent((prev) => prev.trim() + ctaText)
    toast.success('Call-to-Action disisipkan ke caption!')
  }

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
      if (!content.trim() && !mediaUrl) {
        setError('Isi caption atau lampirkan media sebelum menjadwalkan.')
        return
      }
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
            ? title.trim() || (reservedFor ? `Slot: ${reservedFor}` : 'Slot Reserved')
            : title.trim(),
          content: isPlaceholder ? '' : content || '',
          platform,
          scheduled_at: scheduledAt,
          status,
          media_url: mediaUrl || undefined,
          is_reserved: isReserved,
          is_placeholder: isReserved,
          reserved_for: isReserved ? (reservedFor.trim() || title.trim() || 'Slot Reserved') : null,
          priority,
          campaign_tag: campaignTag && campaignTag !== '_none_' ? campaignTag : null,
        })
        toast.success(isReserved ? 'Slot reserve diperbarui.' : 'Post diperbarui.')
      } else {
        await createPost({
          client_id: clientId,
          title: isPlaceholder
            ? title.trim() || (reservedFor ? `Slot: ${reservedFor}` : 'Slot Reserved')
            : title.trim(),
          content: isPlaceholder ? '' : content || '',
          platform,
          scheduled_at: scheduledAt,
          status: isReserved ? 'draft' : status,
          author: authorName,
          media_url: mediaUrl || undefined,
          is_reserved: isReserved,
          is_placeholder: isReserved,
          reserved_for: isReserved ? (reservedFor.trim() || title.trim() || 'Slot Reserved') : null,
          priority,
          campaign_tag: campaignTag && campaignTag !== '_none_' ? campaignTag : null,
        })
        toast.success(isReserved ? 'Slot berhasil direservasi.' : 'Post dijadwalkan.')
      }

      onSave()
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan post.'
      setError(msg)
      toast.error(msg)
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
      const msg = err instanceof Error ? err.message : 'Gagal menghapus post.'
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

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
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleSafeClose()}>
      <DialogContent
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          document.getElementById('post-title')?.focus()
        }}
        className="sm:max-w-5xl bg-card rounded-3xl border border-border/40 p-0 overflow-hidden shadow-2xl gap-0"
      >
        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
              e.preventDefault()
              void handleSubmit(e)
            }
          }}
          className="flex flex-col sm:flex-row h-[84vh] sm:h-[660px] max-h-[88vh] animate-in fade-in zoom-in-95 duration-300"
        >
          {/* ========================================================== */}
          {/* MAIN WORKSPACE (left): editor area & live feed preview     */}
          {/* ========================================================== */}
          <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-card">
            <DialogHeader className="px-6 pt-6 pb-4 space-y-1">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <DialogTitle className="text-lg font-semibold tracking-tight truncate">
                    {editingPost
                      ? isCampaignMode
                        ? 'Edit Slot Reserve'
                        : 'Edit Jadwal Postingan'
                      : isCampaignMode
                      ? 'Buat Slot Reserve'
                      : 'Jadwalkan Postingan Baru'}
                  </DialogTitle>
                  <DialogDescription className="truncate">
                    {isCampaignMode
                      ? 'Buat slot waktu untuk kampanye sebelum konten jadi siap.'
                      : 'Tentukan platform, tanggal rilis, dan isi konten yang akan dipublish.'}
                  </DialogDescription>
                </div>

                {!isCampaignMode && (
                  <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/40 shrink-0">
                    <button
                      type="button"
                      onClick={() => setWorkspaceView('editor')}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                        workspaceView === 'editor'
                          ? 'bg-background text-foreground shadow-xs border border-border/40'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Icons.pencil className="size-3.5" />
                      <span>Editor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setWorkspaceView('preview')}
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer',
                        workspaceView === 'preview'
                          ? 'bg-background text-foreground shadow-xs border border-border/40'
                          : 'text-muted-foreground hover:text-foreground'
                      )}
                    >
                      <Icons.eye className="size-3.5" />
                      <span>Live Preview</span>
                    </button>
                  </div>
                )}
              </div>
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

                {workspaceView === 'preview' && !isCampaignMode ? (
                  /* ======================================================== */
                  /* LIVE SOCIAL FEED PREVIEW                                 */
                  /* ======================================================== */
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5 font-medium">
                        <PlatformIcon platform={platform} className="size-3.5" />
                        Simulasi Feed {platform.toUpperCase()}
                      </span>
                      <span className="text-3xs bg-muted px-2 py-0.5 rounded-full font-medium">
                        Fidelitas Nyata
                      </span>
                    </div>

                    <SocialFeedCard
                      platform={platform}
                      title={title}
                      content={content}
                      mediaUrl={mediaUrl}
                      mediaType={mediaType}
                      clientName={clientName}
                      clientHandle={clientHandle}
                      dateStr={dateStr}
                      time={time}
                    />
                  </div>
                ) : (
                  /* ======================================================== */
                  /* STANDARD FORM EDITOR WORKSPACE                           */
                  /* ======================================================== */
                  <>
                    {/* Reserve toggle — styled as a subtle glass card */}
                    <div
                      className={cn(
                        'flex items-start space-x-3 space-y-0 rounded-xl border p-3.5 transition-colors',
                        isReserved
                          ? 'bg-primary/5 border-primary/30 ring-1 ring-primary/15'
                          : 'bg-muted/40 border-border/40'
                      )}
                    >
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

                    {/* Isi Konten / Caption (hidden if reserved) */}
                    {!isCampaignMode && (
                      <div className="space-y-2">
                        {/* Caption Header with AI Co-pilot & Character Gauge */}
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2">
                            <Label htmlFor="post-content" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                              Isi Caption / Copywriting
                            </Label>
                            {/* Inline AI Co-pilot Actions */}
                            <div className="flex items-center gap-1">
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                disabled={isGeneratingCaption}
                                onClick={handleGenerateCaption}
                                className="h-6 px-2 text-2xs font-semibold text-primary hover:text-primary hover:bg-primary/10 rounded-md gap-1 cursor-pointer"
                                title="Buat caption otomatis dari judul dan Brand Voice"
                              >
                                <Icons.sparkles className="size-3" />
                                {isGeneratingCaption ? 'Meracik...' : '✨ AI Caption'}
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                disabled={isGeneratingHooks}
                                onClick={handleGenerateHooks}
                                className="h-6 px-2 text-2xs font-semibold text-warning hover:text-warning hover:bg-warning/10 rounded-md gap-1 cursor-pointer"
                                title="Dapatkan 3 pilihan hook viral"
                              >
                                <Icons.flame className="size-3" />
                                {isGeneratingHooks ? 'Mencari...' : '🔥 3 Hook'}
                              </Button>
                            </div>
                          </div>

                          {/* Visual Character Progress Meter */}
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={cn(
                                  'h-full transition-all duration-300 rounded-full',
                                  captionOverLimit
                                    ? 'bg-destructive animate-pulse'
                                    : captionPercent > 85
                                    ? 'bg-warning'
                                    : 'bg-primary'
                                )}
                                style={{ width: `${Math.min(100, captionPercent)}%` }}
                              />
                            </div>
                            <span
                              id="post-content-count"
                              aria-live="polite"
                              className={cn(
                                'text-1xs tabular-nums transition-colors font-medium',
                                captionOverLimit ? 'text-destructive font-semibold' : 'text-muted-foreground/70'
                              )}
                            >
                              {content.length.toLocaleString('id-ID')} / {captionLimit.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>

                        {/* Hook Suggestions Drawer */}
                        {showHookSuggestions && hookSuggestions.length > 0 && (
                          <div className="p-3 rounded-xl bg-warning/5 border border-warning/20 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="flex items-center justify-between">
                              <span className="text-2xs font-bold uppercase tracking-wider text-warning flex items-center gap-1">
                                <Icons.flame className="size-3" /> Pilih Hook Terbaik (1-Klik Sisipkan ke Baris Pertama):
                              </span>
                              <button
                                type="button"
                                onClick={() => setShowHookSuggestions(false)}
                                className="text-2xs text-muted-foreground hover:text-foreground cursor-pointer"
                              >
                                ✕ Tutup
                              </button>
                            </div>
                            <div className="grid grid-cols-1 gap-1.5">
                              {hookSuggestions.map((h, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => handleSelectHook(h.text)}
                                  className="text-left p-2 rounded-lg bg-card/80 hover:bg-card border border-border/40 hover:border-warning/40 text-xs transition-all flex items-start gap-2 group cursor-pointer"
                                >
                                  <span className="px-1.5 py-0.5 rounded text-3xs font-semibold bg-warning/10 text-warning shrink-0 mt-0.5">
                                    {h.angle || `Hook ${i + 1}`}
                                  </span>
                                  <span className="text-foreground group-hover:text-primary transition-colors flex-1 leading-snug">
                                    &ldquo;{h.text}&rdquo;
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <Textarea
                          id="post-content"
                          placeholder="Tulis caption lengkap beserta hashtag di sini..."
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          rows={6}
                          aria-invalid={captionOverLimit}
                          aria-describedby={captionOverLimit ? 'post-content-count post-content-error' : 'post-content-count'}
                          className={cn(
                            'min-h-[170px] resize-none border-border/60 bg-muted/20 focus-visible:bg-background transition-colors text-sm-plus leading-relaxed',
                            captionOverLimit && 'border-destructive focus-visible:border-destructive'
                          )}
                        />

                        {captionOverLimit && (
                          <p id="post-content-error" role="alert" className="text-xs text-destructive">
                            Caption melebihi batas {platform} ({captionLimit.toLocaleString('id-ID')} karakter). Publikasi akan ditolak.
                          </p>
                        )}

                        {/* Quick CTA Presets */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span className="text-2xs text-muted-foreground font-medium">Sisip CTA:</span>
                          {CTA_PRESETS.map((cta, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleInsertCta(cta.text)}
                              className="inline-flex items-center gap-1 text-2xs px-2 py-0.5 rounded-full bg-muted/60 hover:bg-primary/10 hover:text-primary border border-border/40 text-muted-foreground transition-all cursor-pointer font-medium"
                            >
                              {cta.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* ========================================================== */}
          {/* SETTINGS SIDEBAR (right): controls, Linear-style           */}
          {/* ========================================================== */}
          <aside
            aria-label="Pengaturan postingan"
            className="w-full sm:w-[350px] flex-1 sm:flex-none flex flex-col min-h-0 border-l border-border/40 bg-muted/20 shrink-0"
          >
            <ScrollArea className="flex-1 min-h-0">
              <div className="px-5 py-4 space-y-4">
                {/* Platform Radio Group (accessible) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between pr-8">
                    <Label id="platform-label" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                      Platform Tujuan
                    </Label>
                  </div>
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
                            'flex w-full cursor-pointer items-center justify-center gap-1.5 py-2 px-1 rounded-lg text-xs font-medium transition-all',
                            platform === opt.id
                              ? 'bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20 font-bold'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
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
                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <Label htmlFor="post-date" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                      Tanggal Tayang
                    </Label>
                    <Input
                      id="post-date"
                      type="date"
                      value={dateStr}
                      onChange={(e) => setDateStr(e.target.value)}
                      required
                      className="h-10 text-xs font-medium bg-background border-border/40"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="post-time" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                      Waktu (Jam)
                    </Label>
                    <Input
                      id="post-time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      required
                      className="h-10 text-xs font-medium bg-background border-border/40"
                    />
                  </div>
                </div>

                <Separator />

                {/* Planning Layer: Priority & Campaign via shadcn Select */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label id="priority-label" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                      Prioritas
                    </Label>
                    <RadioGroup
                      aria-labelledby="priority-label"
                      value={priority}
                      onValueChange={(v) => setPriority(v as 'low' | 'normal' | 'high' | 'urgent')}
                      className="grid grid-cols-4 gap-1.5"
                    >
                      {PRIORITY_OPTIONS.map((opt) => (
                        <div key={opt.id} className="relative flex items-center justify-center">
                          <RadioGroupItem value={opt.id} id={`prio-${opt.id}`} className="sr-only" />
                          <Label
                            htmlFor={`prio-${opt.id}`}
                            className={cn(
                              'flex w-full cursor-pointer items-center justify-center py-2 px-1 rounded-xl border text-xs font-semibold transition-all',
                              priority === opt.id
                                ? 'border-primary bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20 font-bold'
                                : 'border-border/40 bg-card hover:bg-muted/60 text-muted-foreground hover:text-foreground'
                            )}
                          >
                            {opt.label}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="post-campaign" className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                      Kampanye / Promo
                    </Label>
                    <Select
                      value={campaignTag || '_none_'}
                      onValueChange={(v) => setCampaignTag(v === '_none_' ? '' : v)}
                    >
                      <SelectTrigger id="post-campaign" className="w-full h-10 bg-background border-border/40 min-h-11">
                        <SelectValue placeholder="Tidak terkait kampanye" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectItem value="_none_">Tidak terkait kampanye</SelectItem>
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
                  <div className="space-y-1.5">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground font-medium">
                      Media Terlampir
                    </Label>
                    {mediaUrl ? (
                      <div className="relative w-full overflow-hidden rounded-xl border border-border/60 group">
                        {mediaType === 'video' ? (
                          <video
                            src={mediaUrl}
                            controls
                            className="h-32 w-full object-cover bg-muted"
                          />
                        ) : (
                          <img
                            src={mediaUrl}
                            alt="Media terlampir"
                            className="h-32 w-full object-cover"
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
                        className="w-full flex flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-border/60 bg-background/50 hover:bg-muted/60 hover:border-primary/40 transition-all py-3.5 h-auto group cursor-pointer"
                      >
                        <div className="size-7 rounded-full bg-muted/60 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                          <Icons.photo_camera className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
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
                  <div className="space-y-1.5">
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
                              'flex w-full cursor-pointer items-center justify-center py-2 text-xs font-medium rounded-lg transition-all',
                              status === opt.id
                                ? 'bg-primary/10 text-primary shadow-xs ring-1 ring-primary/20 font-bold'
                                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
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
            <div className="border-t border-border/40 bg-card/90 backdrop-blur-sm px-4 py-3 flex items-center justify-between gap-2 mt-auto shrink-0">
              {editingPost && onDelete && (
                <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      isLoading={loading}
                      className="h-9 px-3 text-destructive border-destructive/30 hover:bg-destructive/10 cursor-pointer text-xs"
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

              <span className="text-3xs text-muted-foreground/60 hidden sm:inline-block">
                ⌘+Enter untuk simpan
              </span>

              <div className="flex items-center gap-2 ml-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSafeClose}
                  disabled={loading}
                  className="h-9 px-3.5 text-xs font-medium cursor-pointer"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  isLoading={loading}
                  loadingLabel="Menyimpan..."
                  className="h-9 px-4 shadow-sm text-xs font-bold cursor-pointer"
                >
                  {submitLabel}
                </Button>
              </div>
            </div>
          </aside>
        </form>
      </DialogContent>

      {/* Unsaved changes exit protection dialog */}
      <AlertDialog open={confirmExitOpen} onOpenChange={setConfirmExitOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan perubahan postingan?</AlertDialogTitle>
            <AlertDialogDescription>
              Draf postingan yang sedang Anda buat belum disimpan. Semua ketikan judul dan caption akan hilang jika Anda keluar sekarang.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmExitOpen(false)}>
              Lanjut Mengedit
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                setConfirmExitOpen(false)
                onClose()
              }}
            >
              Tinggalkan Draf
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

/**
 * Platform-tailored Live Social Feed Mockup component
 */
function SocialFeedCard({
  platform,
  title,
  content,
  mediaUrl,
  mediaType,
  clientName,
  clientHandle,
  dateStr,
  time,
}: {
  platform: string
  title: string
  content: string
  mediaUrl: string
  mediaType: AssetFileType
  clientName: string
  clientHandle: string
  dateStr: string
  time: string
}) {
  const [expanded, setExpanded] = useState(false)
  const isTruncated = content.length > 130 && !expanded
  const displayContent = isTruncated ? content.slice(0, 130) + '...' : content

  if (platform === 'tiktok') {
    return (
      <div className="max-w-[320px] mx-auto aspect-[9/16] bg-black text-white rounded-3xl relative overflow-hidden flex flex-col justify-between p-4 shadow-xl border border-border/40">
        {mediaUrl ? (
          mediaType === 'video' ? (
            <video src={mediaUrl} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <img src={mediaUrl} alt="TikTok Preview" className="absolute inset-0 w-full h-full object-cover" />
          )
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-card to-background flex items-center justify-center p-6 text-center text-xs text-muted-foreground">
            Preview Media Vertikal TikTok 9:16
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10 flex items-center justify-between text-xs pt-2">
          <span className="font-semibold text-white/90">Following | For You</span>
          <Icons.search className="size-4 text-white" />
        </div>

        {/* Floating Right Actions */}
        <div className="relative z-10 self-end flex flex-col items-center gap-3.5 pb-8">
          <div className="size-9 rounded-full bg-primary/20 border-2 border-white flex items-center justify-center text-xs font-bold text-white">
            {clientName.charAt(0)}
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Icons.heart className="size-6 text-white" />
            <span className="text-3xs font-medium">12.4K</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Icons.messageSquare className="size-6 text-white" />
            <span className="text-3xs font-medium">348</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Icons.tag className="size-6 text-white" />
            <span className="text-3xs font-medium">1.2K</span>
          </div>
          <div className="flex flex-col items-center gap-0.5">
            <Icons.share className="size-6 text-white" />
            <span className="text-3xs font-medium">890</span>
          </div>
        </div>

        {/* Bottom Details */}
        <div className="relative z-10 space-y-1.5 text-xs text-left">
          <div className="font-bold text-white drop-shadow-md">{clientHandle}</div>
          <p className="text-xs text-white/90 line-clamp-3 leading-relaxed drop-shadow-md">
            {content || title || 'Draf konten TikTok siap tayang.'}
          </p>
          <div className="flex items-center gap-2 text-3xs text-white/80 pt-1">
            <Icons.music_note className="size-3 animate-spin" />
            <span>Audio Asli - {clientName}</span>
          </div>
        </div>
      </div>
    )
  }

  if (platform === 'linkedin') {
    return (
      <div className="max-w-md mx-auto bg-card border border-border/60 rounded-2xl p-4 space-y-3 shadow-md text-left">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm border border-primary/20">
            {clientName.charAt(0)}
          </div>
          <div>
            <div className="text-xs font-bold text-foreground">{clientName}</div>
            <div className="text-3xs text-muted-foreground">Digital Marketing & Creative Agency</div>
            <div className="text-3xs text-muted-foreground flex items-center gap-1">
              <span>{dateStr || 'Terjadwal'} • {time || '09:00'}</span>
              <span>• 🌐 Publik</span>
            </div>
          </div>
        </div>

        <div className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
          {displayContent || title || 'Isi draft postingan LinkedIn.'}
          {content.length > 130 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-primary font-semibold ml-1 cursor-pointer"
            >
              {expanded ? 'Lebih sedikit' : '...lihat selengkapnya'}
            </button>
          )}
        </div>

        {mediaUrl && (
          <div className="rounded-xl overflow-hidden border border-border/40 max-h-64 bg-muted">
            {mediaType === 'video' ? (
              <video src={mediaUrl} controls className="w-full h-full object-cover" />
            ) : (
              <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
            )}
          </div>
        )}

        <Separator />

        <div className="flex items-center justify-around text-muted-foreground text-xs pt-1">
          <span className="flex items-center gap-1.5 hover:text-foreground cursor-pointer">
            <Icons.thumb_up className="size-4" /> Like
          </span>
          <span className="flex items-center gap-1.5 hover:text-foreground cursor-pointer">
            <Icons.messageSquare className="size-4" /> Comment
          </span>
          <span className="flex items-center gap-1.5 hover:text-foreground cursor-pointer">
            <Icons.share className="size-4" /> Repost
          </span>
          <span className="flex items-center gap-1.5 hover:text-foreground cursor-pointer">
            <Icons.send className="size-4" /> Send
          </span>
        </div>
      </div>
    )
  }

  if (platform === 'x') {
    return (
      <div className="max-w-md mx-auto bg-card border border-border/60 rounded-2xl p-4 space-y-3 shadow-md text-left">
        <div className="flex items-start gap-3">
          <div className="size-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
            {clientName.charAt(0)}
          </div>
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="font-bold text-foreground truncate">{clientName}</span>
              <span className="text-muted-foreground">{clientHandle}</span>
              <span className="text-muted-foreground">· Terjadwal</span>
            </div>
            <div className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
              {content || title || 'Draf tweet postingan.'}
            </div>

            {mediaUrl && (
              <div className="rounded-xl overflow-hidden border border-border/40 max-h-56 mt-2 bg-muted">
                {mediaType === 'video' ? (
                  <video src={mediaUrl} controls className="w-full h-full object-cover" />
                ) : (
                  <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                )}
              </div>
            )}

            <div className="flex items-center justify-between text-muted-foreground text-2xs pt-2">
              <span className="flex items-center gap-1"><Icons.messageSquare className="size-3.5" /> 24</span>
              <span className="flex items-center gap-1"><Icons.share className="size-3.5" /> 18</span>
              <span className="flex items-center gap-1"><Icons.heart className="size-3.5" /> 142</span>
              <span className="flex items-center gap-1"><Icons.barChart className="size-3.5" /> 3.2K</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Default: Instagram Mockup
  return (
    <div className="max-w-sm mx-auto bg-card border border-border/60 rounded-2xl overflow-hidden shadow-lg text-left">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/30">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-full p-0.5 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600">
            <div className="size-full rounded-full bg-card flex items-center justify-center font-bold text-xs text-foreground">
              {clientName.charAt(0)}
            </div>
          </div>
          <div>
            <div className="text-xs font-bold leading-none text-foreground">{clientHandle}</div>
            <div className="text-3xs text-muted-foreground pt-0.5">Original audio</div>
          </div>
        </div>
        <Icons.moreHorizontal className="size-4 text-muted-foreground" />
      </div>

      {/* Media Box */}
      <div className="aspect-square bg-muted/40 relative flex items-center justify-center overflow-hidden">
        {mediaUrl ? (
          mediaType === 'video' ? (
            <video src={mediaUrl} controls className="w-full h-full object-cover" />
          ) : (
            <img src={mediaUrl} alt="Preview Instagram" className="w-full h-full object-cover" />
          )
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
            <div className="size-12 rounded-full bg-muted flex items-center justify-center">
              <Icons.photo_camera className="size-6 text-muted-foreground/60" />
            </div>
            <span className="text-xs font-medium">Belum ada media terlampir</span>
            <span className="text-3xs text-muted-foreground/70">Pilih dari Media Library di panel samping</span>
          </div>
        )}
      </div>

      {/* Action Bar */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between text-foreground">
          <div className="flex items-center gap-3">
            <Icons.heart className="size-5 hover:text-destructive cursor-pointer transition-colors" />
            <Icons.messageSquare className="size-5 hover:text-primary cursor-pointer transition-colors" />
            <Icons.send className="size-5 hover:text-primary cursor-pointer transition-colors" />
          </div>
          <Icons.tag className="size-5 hover:text-primary cursor-pointer transition-colors" />
        </div>

        <div className="text-xs font-semibold text-foreground">1.428 likes</div>

        {/* Caption */}
        <div className="text-xs leading-relaxed text-foreground">
          <span className="font-bold mr-1.5">{clientHandle}</span>
          <span className="whitespace-pre-wrap">{displayContent || title || 'Isi draft caption postingan Instagram.'}</span>
          {content.length > 130 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="text-muted-foreground font-semibold ml-1 cursor-pointer hover:text-foreground"
            >
              {expanded ? 'Lebih sedikit' : '...selengkapnya'}
            </button>
          )}
        </div>

        <div className="text-3xs uppercase tracking-wider text-muted-foreground pt-1">
          Dijadwalkan untuk {dateStr || 'Hari ini'} • {time || '09:00'}
        </div>
      </div>
    </div>
  )
}
