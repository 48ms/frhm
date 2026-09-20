'use client'

import { useState, useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { ProductionItem } from './content-production-board'

const STAGES = [
  { id: 'idea', label: 'Ideasi' },
  { id: 'script', label: 'Script / Brief' },
  { id: 'shooting', label: 'Shooting' },
  { id: 'editing', label: 'Editing' },
  { id: 'design', label: 'Design' },
  { id: 'caption', label: 'Caption' },
  { id: 'review', label: 'Review' },
  { id: 'ready', label: 'Siap Post' },
]

const formSchema = z.object({
  title: z.string().min(2, 'Judul minimal 2 karakter'),
  platform: z.string().min(1, 'Pilih platform'),
  stage: z.string().min(1, 'Pilih tahapan'),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  assignee: z.string().optional().nullable(),
  due_date: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  assets: z.array(z.object({
    name: z.string(),
    url: z.string()
  }))
})

type FormData = z.infer<typeof formSchema>

interface ContentFormModalProps {
  clientId: string
  open: boolean
  onOpenChange: (open: boolean) => void
  editingItem?: ProductionItem | null
  defaultStage?: ProductionItem['stage']
  onSuccess: () => void
  onDelete?: (id: string) => void
}

export function ContentFormModal({ 
  clientId, 
  open, 
  onOpenChange,
  editingItem,
  defaultStage = 'idea',
  onSuccess,
  onDelete
}: ContentFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newAssetName, setNewAssetName] = useState('')
  const [newAssetUrl, setNewAssetUrl] = useState('')
  
  const { register, handleSubmit, formState: { errors }, reset, control, setValue, getValues } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      platform: 'instagram',
      stage: defaultStage,
      priority: 'normal',
      assignee: '',
      due_date: '',
      notes: '',
      assets: []
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "assets"
  })

  useEffect(() => {
    if (open) {
      if (editingItem) {
        reset({
          title: editingItem.title,
          platform: editingItem.platform,
          stage: editingItem.stage,
          priority: editingItem.priority,
          assignee: editingItem.assignee || '',
          due_date: editingItem.due_date ? editingItem.due_date.split('T')[0] : '',
          notes: editingItem.notes || '',
          assets: editingItem.assets || []
        })
      } else {
        reset({
          title: '',
          platform: 'instagram',
          stage: defaultStage,
          priority: 'normal',
          assignee: '',
          due_date: '',
          notes: '',
          assets: []
        })
      }
      setNewAssetName('')
      setNewAssetUrl('')
    }
  }, [open, editingItem, defaultStage, reset])

  const addAsset = () => {
    if (!newAssetName || !newAssetUrl) return
    append({ name: newAssetName, url: newAssetUrl })
    setNewAssetName('')
    setNewAssetUrl('')
  }

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsSubmitting(true)
    
    const payload = {
      client_id: clientId,
      title: data.title,
      platform: data.platform,
      stage: data.stage,
      priority: data.priority,
      assignee: data.assignee || null,
      due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
      assets: data.assets,
      notes: data.notes || null,
      ...(editingItem ? { id: editingItem.id } : {}),
    }

    try {
      const res = await fetch('/api/admin/content-productions', {
        method: editingItem ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      
      if (!res.ok) throw new Error('Failed to save')
      
      reset()
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      console.error('Error saving content:', err)
      alert('Gagal menyimpan task produksi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {editingItem ? 'Edit Task Produksi' : 'Tambah Task Produksi Baru'}
          </DialogTitle>
          <DialogDescription>
            Kelola rincian produksi konten ini.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Judul Konten / Topik <span className="text-destructive">*</span></Label>
            <Input
              placeholder="Contoh: Reels Tips Skincare 3 Langkah"
              {...register('title')}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Platform</Label>
              <select
                {...register('platform')}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs shadow-sm"
              >
                <option value="instagram">Instagram</option>
                <option value="tiktok">TikTok</option>
                <option value="linkedin">LinkedIn</option>
                <option value="youtube">YouTube</option>
                <option value="facebook">Facebook</option>
                <option value="x">X / Twitter</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tahapan (Stage)</Label>
              <select
                {...register('stage')}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs shadow-sm"
              >
                {STAGES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Prioritas</Label>
              <select
                {...register('priority')}
                className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs shadow-sm"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Assignee / PIC</Label>
              <Input
                {...register('assignee')}
                placeholder="Nama editor / creator"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Link Asset / Drive / Canva</Label>
            <div className="flex gap-2">
              <Input
                value={newAssetName}
                onChange={(e) => setNewAssetName(e.target.value)}
                placeholder="Nama (e.g. Video Mentah)"
                className="text-xs"
              />
              <Input
                value={newAssetUrl}
                onChange={(e) => setNewAssetUrl(e.target.value)}
                placeholder="URL Google Drive"
                className="text-xs"
              />
              <Button type="button" size="sm" onClick={addAsset} className="h-11 sm:h-9 px-3 text-xs">
                +
              </Button>
            </div>
            {fields.length > 0 && (
              <div className="space-y-1 mt-2 max-h-28 overflow-y-auto">
                {fields.map((field, idx) => (
                  <div key={field.id} className="flex items-center justify-between text-xs bg-muted/30 px-2 py-1 rounded">
                    <a href={field.url} target="_blank" rel="noreferrer" className="text-primary truncate max-w-[200px]">
                      {field.name}
                    </a>
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="text-red-500 hover:text-red-700 text-xs font-bold p-2 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 sm:p-1 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Catatan / Script singkat</Label>
            <Textarea
              {...register('notes')}
              placeholder="Catatan produksi atau ringkasan script..."
              className="h-20 text-xs"
            />
          </div>

          <DialogFooter className="flex items-center justify-between pt-2">
            {editingItem && onDelete ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  onDelete(editingItem.id)
                  onOpenChange(false)
                }}
                className="h-11 sm:h-9"
              >
                Hapus
              </Button>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)} className="h-11 sm:h-9" disabled={isSubmitting}>
                Batal
              </Button>
              <Button type="submit" size="sm" className="h-11 sm:h-9" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Simpan'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
