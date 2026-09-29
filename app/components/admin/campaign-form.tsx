'use client'

import React, { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Icons } from '@/components/icons'

const campaignSchema = z.object({
  client_id: z.string().min(1, 'Klien wajib dipilih'),
  name: z.string().min(1, 'Nama kampanye wajib diisi'),
  type: z.enum(['campaign', 'promo', 'event']),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
  color: z.string().min(1, 'Warna wajib diisi'),
  notes: z.string().optional(),
})

type CampaignFormValues = z.infer<typeof campaignSchema>

type ClientOption = { id: string; name: string }

export function CampaignForm() {
  const router = useRouter()
  const [clients, setClients] = useState<ClientOption[]>([])
  const [submitting, setSubmitting] = useState(false)

  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      client_id: '',
      name: '',
      type: 'campaign',
      start_date: '',
      end_date: '',
      color: '#3b82f6',
      notes: '',
    },
  })

  const { register, handleSubmit, formState: { errors }, setValue, watch } = form
  const clientId = watch('client_id')
  const type = watch('type')

  useEffect(() => {
    fetch('/api/admin/clients?all=true&limit=100')
      .then((r) => r.json())
      .then((j) => setClients(j.clients ?? []))
      .catch(() => toast.error('Gagal memuat daftar klien'))
  }, [])

  const onSubmit = async (data: CampaignFormValues) => {
    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/clients/' + data.client_id + '/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: data.client_id,
          name: data.name.trim(),
          type: data.type,
          start_date: data.start_date || null,
          end_date: data.end_date || null,
          color: data.color,
          notes: data.notes || null,
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan kampanye')

      toast.success('Kampanye berhasil dibuat')
      router.push('/admin/calendar')
      router.refresh()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal menyimpan kampanye'
      toast.error(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Informasi Dasar</CardTitle>
          <CardDescription>Detail utama dari kampanye ini.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="client">Klien</Label>
            <Select value={clientId} onValueChange={(v) => setValue('client_id', v ?? '', { shouldValidate: true })}>
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
            <Label htmlFor="name">Nama Kampanye</Label>
            <Input id="name" placeholder="Mis. Promo Lebaran 2026" {...register('name')} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Tipe</Label>
            <Select value={type} onValueChange={(v) => setValue('type', (v ?? 'campaign') as CampaignFormValues['type'], { shouldValidate: true })}>
              <SelectTrigger id="type">
                <SelectValue placeholder="Pilih tipe..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="campaign">Kampanye</SelectItem>
                <SelectItem value="promo">Promo</SelectItem>
                <SelectItem value="event">Event</SelectItem>
              </SelectContent>
            </Select>
            {errors.type && <p className="text-sm text-red-500">{errors.type.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_date">Tanggal Mulai</Label>
              <Input type="date" id="start_date" {...register('start_date')} />
              {errors.start_date && <p className="text-sm text-red-500">{errors.start_date.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_date">Tanggal Selesai</Label>
              <Input type="date" id="end_date" {...register('end_date')} />
              {errors.end_date && <p className="text-sm text-red-500">{errors.end_date.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Warna</Label>
            <Input type="color" id="color" className="h-10 w-20 p-1" {...register('color')} />
            {errors.color && <p className="text-sm text-red-500">{errors.color.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Catatan (Opsional)</Label>
            <Textarea id="notes" placeholder="Catatan tambahan..." {...register('notes')} />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" type="button" onClick={() => router.back()} disabled={submitting}>Batal</Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? (<><Icons.spinner className="mr-2 h-4 w-4 animate-spin" />Menyimpan...</>) : 'Simpan Kampanye'}
        </Button>
      </div>
    </form>
  )
}
