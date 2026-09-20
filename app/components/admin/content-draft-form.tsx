'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { motion, AnimatePresence } from 'motion/react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const draftSchema = z.object({
  client_id: z.string().min(1, 'Klien wajib dipilih'),
  asset_id: z.string().optional(),
  platform: z.enum(['Instagram', 'LinkedIn', 'TikTok', 'Twitter', 'Facebook']),
  format: z.enum(['Reel', 'Carousel', 'SingleImage', 'Thread', 'TextPost', 'Story']),
  visual_hook: z.string().min(1, 'Visual hook wajib diisi'),
  body_content: z.string().min(1, 'Isi konten wajib diisi'),
  call_to_action: z.string().min(1, 'Call to Action (CTA) wajib diisi'),
})

type DraftFormValues = z.infer<typeof draftSchema>

type ClientOption = { id: string; name: string }

interface ContentDraftFormProps {
  assetId?: string
  clientId?: string
  platform?: string
  onSuccess?: () => void
}

export function ContentDraftForm({ assetId, clientId, platform: initialPlatform, onSuccess }: ContentDraftFormProps) {
  const [clients, setClients] = useState<ClientOption[]>([])
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<DraftFormValues>({
    resolver: zodResolver(draftSchema),
    defaultValues: {
      client_id: clientId ?? '',
      asset_id: assetId ?? '',
      platform: (initialPlatform as DraftFormValues['platform']) ?? 'LinkedIn',
      format: 'TextPost',
      visual_hook: '',
      body_content: '',
      call_to_action: '',
    },
  })

  const { register, handleSubmit, formState: { errors }, watch, setValue } = form
  const client_id = watch('client_id')
  const p = watch('platform')
  const bodyContent = watch('body_content')
  const hasLinkedInLink = p === 'LinkedIn' && /(https?:\/\/[^\s]+)/.test(bodyContent)

  useEffect(() => {
    fetch('/api/admin/clients?all=true&limit=100')
      .then((r) => r.json())
      .then((j) => setClients(j.clients ?? []))
      .catch(() => toast.error('Gagal memuat daftar klien'))
  }, [])

  const onSubmit = async (data: DraftFormValues) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/platform-posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: data.client_id,
          asset_id: data.asset_id || null,
          platform: data.platform,
          format: data.format,
          visual_hook: data.visual_hook.trim(),
          body_content: data.body_content.trim(),
          call_to_action: data.call_to_action.trim(),
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan draft')

      toast.success('Draft konten berhasil disimpan')
      form.reset()
      onSuccess?.()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan draft'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Structured Brief</CardTitle>
          <CardDescription>Pecah ide konten Anda menjadi elemen-elemen spesifik agar mudah dikelola dan direpurpose.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!client_id && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm text-yellow-800 dark:text-yellow-200">
              Pilih klien terlebih dahulu agar draft tersimpan ke klien yang benar.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client">Klien</Label>
              <Select value={client_id} onValueChange={(v) => setValue('client_id', v ?? '', { shouldValidate: true })}>
                <SelectTrigger id="client">
                  <SelectValue placeholder="Pilih klien..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.client_id && <p className="text-sm text-red-500">{errors.client_id.message}</p>}
            </div>

            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={p} onValueChange={(v) => setValue('platform', v as DraftFormValues['platform'], { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="LinkedIn">LinkedIn</SelectItem>
                  <SelectItem value="TikTok">TikTok</SelectItem>
                  <SelectItem value="Twitter">Twitter/X</SelectItem>
                  <SelectItem value="Facebook">Facebook</SelectItem>
                </SelectContent>
              </Select>
              {errors.platform && <p className="text-sm text-red-500">{errors.platform.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asset_id">Asset ID (opsional)</Label>
              <input
                id="asset_id"
                {...register('asset_id')}
                placeholder="UUID asset yang terkait"
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <Label>Format Konten</Label>
              <Select value={form.getValues('format')} onValueChange={(v) => setValue('format', v as DraftFormValues['format'], { shouldValidate: true })}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Reel">Reel / Short Video</SelectItem>
                  <SelectItem value="Carousel">Carousel / Document</SelectItem>
                  <SelectItem value="SingleImage">Single Image</SelectItem>
                  <SelectItem value="Thread">Thread</SelectItem>
                  <SelectItem value="TextPost">Text Only</SelectItem>
                  <SelectItem value="Story">Story</SelectItem>
                </SelectContent>
              </Select>
              {errors.format && <p className="text-sm text-red-500">{errors.format.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="visual_hook" className="text-lg font-semibold text-primary">1. Visual Hook (First 3 seconds / Headline)</Label>
            <p className="text-xs text-muted-foreground">Apa yang pertama kali dilihat atau didengar audiens untuk menghentikan mereka *scroll*?</p>
            <Textarea
              id="visual_hook"
              placeholder="Contoh: Video transisi cepat menampilkan masalah sebelum menggunakan produk..."
              className="h-20"
              {...register('visual_hook')}
            />
            {errors.visual_hook && <p className="text-sm text-red-500">{errors.visual_hook.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="body_content" className="text-lg font-semibold text-primary">2. Body Content (Core Message)</Label>
            <p className="text-xs text-muted-foreground">Isi pesan utama, cerita, atau argumen Anda.</p>
            <Textarea
              id="body_content"
              placeholder="Tulis draf konten di sini..."
              className="h-40"
              {...register('body_content')}
            />
            {errors.body_content && <p className="text-sm text-red-500">{errors.body_content.message}</p>}

            <AnimatePresence>
              {hasLinkedInLink && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: 'auto', marginTop: 8 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  className="flex items-center gap-2 p-3 bg-yellow-50 text-yellow-800 border border-yellow-200 rounded-md dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800"
                >
                  <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm">
                    <strong>Peringatan Algoritma:</strong> Anda meletakkan *link* di dalam *body* postingan LinkedIn. Ini akan menurunkan *reach* (jangkauan) Anda. Disarankan untuk menaruh *link* di komentar pertama.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="space-y-2">
            <Label htmlFor="call_to_action" className="text-lg font-semibold text-primary">3. Call to Action (CTA)</Label>
            <p className="text-xs text-muted-foreground">Apa langkah selanjutnya yang harus dilakukan audiens?</p>
            <Textarea
              id="call_to_action"
              placeholder="Contoh: 'Tinggalkan komentar jika Anda setuju' atau 'Klik link di bio'"
              className="h-20"
              {...register('call_to_action')}
            />
            {errors.call_to_action && <p className="text-sm text-red-500">{errors.call_to_action.message}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" type="button" onClick={() => form.reset()} disabled={submitting}>Reset</Button>
        <Button type="submit" disabled={submitting || !client_id}>
          {submitting ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>) : 'Simpan Draft'}
        </Button>
      </div>
    </form>
  )
}
