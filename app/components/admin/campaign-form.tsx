'use client'

import React from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

const pillarSchema = z.object({
  Educational: z.number().min(0).max(100),
  Promotional: z.number().min(0).max(100),
  BehindTheScenes: z.number().min(0).max(100),
  IndustryInsights: z.number().min(0).max(100),
  Entertainment: z.number().min(0).max(100),
})

const campaignSchema = z.object({
  name: z.string().min(1, 'Nama kampanye wajib diisi'),
  type: z.enum(['campaign', 'promo', 'event']),
  start_date: z.string().min(1, 'Tanggal mulai wajib diisi'),
  end_date: z.string().min(1, 'Tanggal selesai wajib diisi'),
  color: z.string().min(1, 'Warna wajib diisi'),
  notes: z.string().optional(),
  pillar_allocation: pillarSchema.refine(
    (data) => {
      const sum = data.Educational + data.Promotional + data.BehindTheScenes + data.IndustryInsights + data.Entertainment
      return sum === 100
    },
    { message: 'Total alokasi pilar harus tepat 100%' }
  )
})

type CampaignFormValues = z.infer<typeof campaignSchema>

export function CampaignForm() {
  const router = useRouter()
  
  const form = useForm<CampaignFormValues>({
    resolver: zodResolver(campaignSchema),
    defaultValues: {
      name: '',
      type: 'campaign',
      start_date: '',
      end_date: '',
      color: '#3b82f6',
      notes: '',
      pillar_allocation: {
        Educational: 30,
        Promotional: 20,
        BehindTheScenes: 20,
        IndustryInsights: 20,
        Entertainment: 10,
      }
    }
  })

  const { register, handleSubmit, formState: { errors }, control, watch } = form

  const pillarValues = watch('pillar_allocation')
  const totalPillar = (pillarValues?.Educational || 0) + 
                      (pillarValues?.Promotional || 0) + 
                      (pillarValues?.BehindTheScenes || 0) + 
                      (pillarValues?.IndustryInsights || 0) + 
                      (pillarValues?.Entertainment || 0)

  const onSubmit = async (data: CampaignFormValues) => {
    console.log('Submitting campaign:', data)
    // TODO: Connect to Server Action / Supabase
    // For now, redirect back
    router.push('/admin/dashboard')
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
            <Label htmlFor="name">Nama Kampanye</Label>
            <Input id="name" placeholder="Mis. Promo Lebaran 2026" {...register('name')} />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
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
            <Label htmlFor="notes">Catatan (Opsional)</Label>
            <Textarea id="notes" placeholder="Catatan tambahan..." {...register('notes')} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Alokasi Pilar Konten</CardTitle>
          <CardDescription>
            Tentukan persentase distribusi konten berdasarkan pilar. Total harus 100%. 
            Saat ini: <span className={totalPillar === 100 ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>{totalPillar}%</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {['Educational', 'Promotional', 'BehindTheScenes', 'IndustryInsights', 'Entertainment'].map((pillar) => (
            <div key={pillar} className="flex items-center gap-4">
              <Label className="w-1/3">{pillar}</Label>
              <div className="flex-1 flex items-center gap-2">
                <Input 
                  type="number" 
                  min="0" 
                  max="100" 
                  {...register(`pillar_allocation.${pillar as keyof typeof pillarSchema.shape}`, { valueAsNumber: true })} 
                />
                <span>%</span>
              </div>
            </div>
          ))}
          {errors.pillar_allocation && <p className="text-sm text-red-500">{errors.pillar_allocation.message}</p>}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline" type="button" onClick={() => router.back()}>Batal</Button>
        <Button type="submit" disabled={totalPillar !== 100}>Simpan Kampanye</Button>
      </div>
    </form>
  )
}
