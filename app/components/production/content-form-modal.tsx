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
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Icons } from '@/components/icons'
import { ProductionItem } from './content-production-board'
import { toast } from 'sonner'

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
  const [notesCount, setNotesCount] = useState(0)
  
  const { register, handleSubmit, formState: { errors }, reset, control, watch, setValue } = useForm<FormData>({
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

  // Watch notes value for character counter
  const notesValue = watch('notes')
  useEffect(() => {
    setNotesCount(notesValue?.length || 0)
  }, [notesValue])

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
      toast.error('Gagal menyimpan task produksi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
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
            <Label htmlFor="cf-title" className="text-xs">Judul Konten / Topik <span className="text-destructive">*</span></Label>
            <Input
              id="cf-title"
              placeholder="Contoh: Reels Tips Skincare 3 Langkah"
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'cf-title-error' : undefined}
              {...register('title')}
            />
            {errors.title && <p id="cf-title-error" role="alert" className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cf-platform" className="text-xs">Platform</Label>
              <Select onValueChange={(value) => setValue('platform', String(value))}>
                <SelectTrigger id="cf-platform">
                  <SelectValue placeholder="Pilih platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="x">X / Twitter</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cf-stage" className="text-xs">Tahapan (Stage)</Label>
              <Select onValueChange={(value) => setValue('stage', String(value))}>
                <SelectTrigger id="cf-stage">
                  <SelectValue placeholder="Pilih tahap" />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="cf-priority" className="text-xs">Prioritas</Label>
              <Select onValueChange={(value) => setValue('priority', value as FormData['priority'])}>
                <SelectTrigger id="cf-priority">
                  <SelectValue placeholder="Pilih prioritas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cf-assignee" className="text-xs">Assignee / PIC</Label>
              <Input
                id="cf-assignee"
                {...register('assignee')}
                placeholder="Nama editor / creator"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cf-notes" className="text-xs">Catatan / Script singkat</Label>
            <Textarea
              id="cf-notes"
              {...register('notes')}
              placeholder="Catatan produksi atau ringkasan script..."
              className="h-20 text-xs"
              onChange={(e) => {
                const field = control._formValues.notes
                if (field) field.value = e.target.value
                setNotesCount(e.target.value.length)
              }}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Catatan untuk tim produksi</span>
              <span>{notesCount} karakter</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cf-asset-name" className="text-xs">Link Asset / Drive / Canva</Label>
            <div className="flex gap-2">
              <Input
                id="cf-asset-name"
                value={newAssetName}
                onChange={(e) => setNewAssetName(e.target.value)}
                placeholder="Nama (e.g. Video Mentah)"
                aria-label="Nama asset"
                className="text-xs"
              />
              <Input
                value={newAssetUrl}
                onChange={(e) => setNewAssetUrl(e.target.value)}
                placeholder="URL Google Drive"
                aria-label="URL asset"
                className="text-xs"
              />
              <Button type="button" size="sm" onClick={addAsset} aria-label="Tambah asset" className="h-11 sm:h-9 px-3 text-xs">
                +
              </Button>
            </div>
            {fields.length > 0 && (
              <div className="space-y-1 mt-2 max-h-32 overflow-y-auto border rounded-md p-2 bg-muted/20">
                {fields.map((field, idx) => (
                  <div key={field.id} className="flex items-center justify-between text-xs bg-muted/30 px-2 py-1.5 rounded">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icons.link className="size-3 shrink-0 text-muted-foreground" />
                      <a 
                        href={field.url} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="text-primary truncate max-w-[180px] hover:underline"
                      >
                        {field.name}
                      </a>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      aria-label={`Hapus asset ${field.name}`}
                      className="text-red-500 hover:text-red-700 text-xs font-bold p-1 min-h-[24px] min-w-[24px] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
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
                {isSubmitting ? <Icons.spinner className="h-4 w-4 animate-spin" /> : 'Simpan'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
