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
import { Icons } from '@/components/icons'
import { toast } from 'sonner'

const formSchema = z.object({
  amount: z.coerce.number().min(1, 'Jumlah pengeluaran harus lebih dari 0'),
  category: z.string().min(1, 'Pilih kategori'),
  description: z.string().min(1, 'Isi keterangan'),
  expense_date: z.string().min(1, 'Pilih tanggal'),
})

type FormData = z.infer<typeof formSchema>

interface ExpenseFormModalProps {
  clientId: string
  budgetId: string | undefined
  children: React.ReactNode
  onSuccess?: (expense: { id: string; amount: number; category: string; description: string; expense_date: string }) => void
}

export function ExpenseFormModal({ clientId, budgetId, children, onSuccess }: ExpenseFormModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [kols, setKols] = useState<{ id: string; name: string; rate_card: number | null }[]>([])
  const supabase = createClient()
  
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<FormData>({
    resolver: zodResolver(formSchema as any),
    defaultValues: {
      amount: 0,
      category: '',
      description: '',
      expense_date: new Date().toISOString().split('T')[0]
    }
  })

  const selectedCategory = watch('category')

  useEffect(() => {
    if (open) {
      const fetchKols = async () => {
        const { data } = await supabase.from('kols').select('id, name, rate_card').order('name', { ascending: true })
        if (data) setKols(data)
      }
      fetchKols()
    }
  }, [open, supabase])

  const handleKolSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const kolId = e.target.value
    if (!kolId) return
    const kol = kols.find(k => k.id === kolId)
    if (kol) {
      setValue('amount', kol.rate_card || 0, { shouldValidate: true })
      setValue('description', `Pembayaran KOL ${kol.name}`, { shouldValidate: true })
    }
  }

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget_id: budgetId,
          amount: data.amount,
          category: data.category,
          description: data.description,
          expense_date: data.expense_date,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal mencatat pengeluaran')
      
      reset()
      setOpen(false)
      if (onSuccess && json.expense) {
        onSuccess(json.expense)
      }
    } catch (err) {
      console.error('Error recording expense:', err)
      toast.error('Gagal mencatat pengeluaran. Silakan coba lagi.')
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
          <DialogTitle>Catat Pengeluaran Baru</DialogTitle>
          <DialogDescription>
            Masukkan nominal pengeluaran yang akan memotong budget bulanan.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="category">Kategori <span className="text-destructive">*</span></Label>
            <select 
              id="category"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register('category')}
            >
              <option value="" disabled>Pilih Kategori</option>
              <option value="ads">Ads / Iklan</option>
              <option value="kol">KOL / Influencer</option>
              <option value="event">Event / Acara</option>
              <option value="other">Lain-lain</option>
            </select>
            {errors.category && <p className="text-xs text-destructive">{errors.category.message}</p>}
          </div>

          {selectedCategory === 'kol' && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg border border-border/50">
              <Label htmlFor="kol_select">Pilih KOL (Auto-fill)</Label>
              <select 
                id="kol_select"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                onChange={handleKolSelect}
                defaultValue=""
              >
                <option value="" disabled>-- Pilih KOL dari CRM --</option>
                {kols.map(kol => (
                  <option key={kol.id} value={kol.id}>{kol.name} (Rp {kol.rate_card?.toLocaleString('id-ID')})</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground mt-1">Memilih KOL akan otomatis mengisi nominal dan keterangan.</p>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="amount">Nominal (IDR) <span className="text-destructive">*</span></Label>
            <Input id="amount" type="number" min="0" placeholder="Misal: 500000" {...register('amount')} />
            {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expense_date">Tanggal <span className="text-destructive">*</span></Label>
            <Input id="expense_date" type="date" {...register('expense_date')} />
            {errors.expense_date && <p className="text-xs text-destructive">{errors.expense_date.message}</p>}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Keterangan <span className="text-destructive">*</span></Label>
            <Input id="description" placeholder="Misal: Pembayaran KOL @username" {...register('description')} />
            {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
          </div>
          
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting || !budgetId}>
              {isSubmitting ? (
                <>
                  <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                !budgetId ? 'Atur Budget Dulu' : 'Simpan Pengeluaran'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

