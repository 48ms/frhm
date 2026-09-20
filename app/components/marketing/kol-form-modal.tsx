'use client'

import { useState, useEffect } from 'react'
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
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

const formSchema = z.object({
  name: z.string().min(2, 'Nama KOL minimal 2 karakter'),
  niche: z.string().optional(),
  contact_info: z.string().optional(),
  rate_card: z.number().min(0, 'Rate card tidak boleh negatif'),
})

type FormData = z.infer<typeof formSchema>

export type KOL = {
  id: string
  name: string
  niche: string | null
  contact_info: string | null
  rate_card: number | null
}

interface KolFormModalProps {
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
  editingKol?: KOL | null
  onSuccess?: (kol: KOL) => void
}

export function KolFormModal({ children, open: controlledOpen, onOpenChange: controlledOnOpenChange, editingKol, onSuccess }: KolFormModalProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false)
  const isControlled = controlledOpen !== undefined
  const open = isControlled ? controlledOpen : uncontrolledOpen
  const setOpen = isControlled ? controlledOnOpenChange! : setUncontrolledOpen

  const [isSubmitting, setIsSubmitting] = useState(false)
  const supabase = createClient()
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      niche: '',
      contact_info: '',
      rate_card: 0
    }
  })

  useEffect(() => {
    if (open) {
      if (editingKol) {
        reset({
          name: editingKol.name,
          niche: editingKol.niche || '',
          contact_info: editingKol.contact_info || '',
          rate_card: editingKol.rate_card || 0
        })
      } else {
        reset({
          name: '',
          niche: '',
          contact_info: '',
          rate_card: 0
        })
      }
    }
  }, [open, editingKol, reset])

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    
    try {
      const payload = {
        name: data.name,
        niche: data.niche || null,
        contact_info: data.contact_info || null,
        rate_card: data.rate_card || 0
      }

      let res
      if (editingKol) {
        res = await supabase
          .from('kols')
          .update(payload)
          .eq('id', editingKol.id)
          .select()
      } else {
        res = await supabase
          .from('kols')
          .insert(payload)
          .select()
      }

      if (res.error) throw res.error
      
      reset()
      setOpen(false)
      if (onSuccess && res.data && res.data.length > 0) {
        onSuccess(res.data[0] as KOL)
      }
    } catch (err) {
      console.error('Error saving KOL:', err)
      alert('Gagal menyimpan data KOL. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && (
        <DialogTrigger>
          {children}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{editingKol ? 'Edit Data KOL' : 'Tambah KOL Baru'}</DialogTitle>
          <DialogDescription>
            Masukkan informasi detail influencer/KOL ke dalam database CRM.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama KOL / Username <span className="text-destructive">*</span></Label>
            <Input id="name" placeholder="Misal: @budi_traveler" {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="niche">Niche / Spesialisasi</Label>
            <Input id="niche" placeholder="Misal: Travel, Food, Tech" {...register('niche')} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="contact_info">Kontak (Email / WA / Line)</Label>
            <Input id="contact_info" placeholder="Misal: 08123456789 atau budi@email.com" {...register('contact_info')} />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="rate_card">Rate Card (IDR)</Label>
            <Input id="rate_card" type="number" min="0" placeholder="Misal: 5000000" {...register('rate_card')} />
            {errors.rate_card && <p className="text-xs text-destructive">{errors.rate_card.message}</p>}
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
                'Simpan'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
