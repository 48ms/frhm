'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle } from 'lucide-react'

const draftSchema = z.object({
  platform: z.enum(['Instagram', 'LinkedIn', 'TikTok', 'Twitter', 'Facebook']),
  format: z.enum(['Reel', 'Carousel', 'SingleImage', 'Thread', 'TextPost', 'Story']),
  visual_hook: z.string().min(1, 'Visual hook wajib diisi (contoh: "Gambar kontras tinggi dengan teks besar")'),
  body_content: z.string().min(1, 'Isi konten wajib diisi'),
  call_to_action: z.string().min(1, 'Call to Action (CTA) wajib diisi'),
})

type DraftFormValues = z.infer<typeof draftSchema>

export function ContentDraftForm() {
  const form = useForm<DraftFormValues>({
    resolver: zodResolver(draftSchema),
    defaultValues: {
      platform: 'LinkedIn',
      format: 'TextPost',
      visual_hook: '',
      body_content: '',
      call_to_action: '',
    }
  })

  const { register, handleSubmit, formState: { errors }, watch, setValue } = form

  const platform = watch('platform')
  const bodyContent = watch('body_content')

  // Check for links in LinkedIn post body
  const hasLinkedInLink = platform === 'LinkedIn' && /(https?:\/\/[^\s]+)/.test(bodyContent)

  const onSubmit = async (data: DraftFormValues) => {
    console.log('Submitting draft:', data)
    // TODO: Connect to backend
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Structured Brief</CardTitle>
          <CardDescription>Pecah ide konten Anda menjadi elemen-elemen spesifik agar mudah dikelola dan direpurpose.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select 
                value={platform} 
                onValueChange={(val: any) => setValue('platform', val)}
              >
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
            </div>
            
            <div className="space-y-2">
              <Label>Format Konten</Label>
              <Select 
                value={watch('format')} 
                onValueChange={(val: any) => setValue('format', val)}
              >
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
            
            {/* Real-time LinkedIn Link Warning */}
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
        <Button variant="outline" type="button">Simpan sebagai Ide</Button>
        <Button type="submit">Ajukan Review</Button>
      </div>
    </form>
  )
}
