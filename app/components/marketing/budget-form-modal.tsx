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
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const formSchema = z.object({
  month: z.string().min(1, 'Pilih bulan'),
  total_budget: z.coerce.number().min(1, 'Budget harus lebih dari 0'),
})

type FormData = z.infer<typeof formSchema>

interface BudgetFormModalProps {
  clientId: string
  children: React.ReactNode
  onSuccess?: (budget: any) => void
}

export function BudgetFormModal({ clientId, children, onSuccess }: BudgetFormModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      month: '',
      total_budget: 0
    }
  })

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/admin/clients/${clientId}/budgets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: data.month, total_budget: data.total_budget }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan budget')

      reset()
      setOpen(false)
      if (onSuccess && json.budget) {
        onSuccess(json.budget)
      }
    } catch (err) {
      console.error('Error setting budget:', err)
      toast.error('Gagal menyimpan budget. Silakan coba lagi.')
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
          <DialogTitle>Set Monthly Budget</DialogTitle>
          <DialogDescription>
            Atur total budget klien per bulan. Jika sudah ada, ini akan memperbarui total budgetnya.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="month">Bulan <span className="text-destructive">*</span></Label>
            <Input id="month" type="month" {...register('month')} />
            {errors.month && <p className="text-xs text-destructive">{errors.month.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="total_budget">Total Budget (IDR) <span className="text-destructive">*</span></Label>
            <Input id="total_budget" type="number" min="0" placeholder="Misal: 10000000" {...register('total_budget')} />
            {errors.total_budget && <p className="text-xs text-destructive">{errors.total_budget.message}</p>}
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
                'Simpan Budget'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
