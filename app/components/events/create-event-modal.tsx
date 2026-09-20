'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
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
import { toast } from 'sonner'

const formSchema = z.object({
  name: z.string().min(2, 'Nama event minimal 2 karakter'),
  description: z.string().optional(),
  event_date: z.string().min(1, 'Pilih tanggal event'),
  location: z.string().optional(),
})

type FormData = z.infer<typeof formSchema>

interface CreateEventModalProps {
  clientId: string
  children: React.ReactNode
  onSuccess?: () => void
}

export function CreateEventModal({ clientId, children, onSuccess }: CreateEventModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      event_date: '',
      location: ''
    }
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/admin/clients/${clientId}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Gagal membuat event')
      }

      reset()
      setOpen(false)
      if (onSuccess) onSuccess()
    } catch (err: any) {
      console.error('Error creating event:', err)
      toast.error(`Gagal membuat event: ${err.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Buat Event Baru</DialogTitle>
          <DialogDescription>
            Masukkan detail event untuk klien ini.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Event <span className="text-destructive">*</span></Label>
            <Input id="name" placeholder="Misal: Launching Produk" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="event_date">Tanggal & Waktu <span className="text-destructive">*</span></Label>
            <Input id="event_date" type="datetime-local" {...register('event_date')} />
            {errors.event_date && <p className="text-xs text-destructive">{errors.event_date.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Lokasi</Label>
            <Input id="location" placeholder="Misal: Gedung X / Online" {...register('location')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" placeholder="Catatan tambahan..." {...register('description')} />
          </div>

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Event'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
