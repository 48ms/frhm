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
import { Icons } from '@/components/icons'
import { toast } from 'sonner'

const formSchema = z.object({
  campaign_name: z.string().min(2, 'Nama kampanye minimal 2 karakter'),
  spend: z.coerce.number().min(0, 'Angka positif'),
  clicks: z.coerce.number().min(0, 'Angka positif'),
  log_date: z.string().min(1, 'Tanggal wajib diisi')
})

type FormData = z.infer<typeof formSchema>

interface AdSpendFormModalProps {
  clientId: string
  children: React.ReactNode
  onSuccess?: (log: any) => void
}

export function AdSpendFormModal({ clientId, children, onSuccess }: AdSpendFormModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      campaign_name: '',
      spend: 0,
      clicks: 0,
      log_date: new Date().toISOString().split('T')[0]
    }
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/ad-spend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal mencatat data iklan')
      
      reset()
      setOpen(false)
      if (onSuccess && json.ad_spend_log) {
        onSuccess(json.ad_spend_log)
      }
    } catch (err) {
      console.error('Error recording ad spend:', err)
      toast.error('Gagal mencatat data iklan. Silakan coba lagi.')
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
          <DialogTitle>Log Ad Spend</DialogTitle>
          <DialogDescription>
            Catat pengeluaran dan klik iklan harian.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="campaign_name">Nama Campaign <span className="text-destructive">*</span></Label>
            <Input id="campaign_name" placeholder="Misal: Promo Q3" {...register('campaign_name')} />
            {errors.campaign_name && <p className="text-xs text-destructive">{errors.campaign_name.message}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="spend">Spend (IDR) <span className="text-destructive">*</span></Label>
              <Input id="spend" type="number" min="0" placeholder="Misal: 50000" {...register('spend')} />
              {errors.spend && <p className="text-xs text-destructive">{errors.spend.message}</p>}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="clicks">Clicks <span className="text-destructive">*</span></Label>
              <Input id="clicks" type="number" min="0" placeholder="Misal: 120" {...register('clicks')} />
              {errors.clicks && <p className="text-xs text-destructive">{errors.clicks.message}</p>}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="log_date">Tanggal <span className="text-destructive">*</span></Label>
            <Input id="log_date" type="date" {...register('log_date')} />
            {errors.log_date && <p className="text-xs text-destructive">{errors.log_date.message}</p>}
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan Log'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
