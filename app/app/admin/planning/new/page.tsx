import React from 'react'
import { CampaignForm } from '@/components/admin/campaign-form'

export default function NewCampaignPage() {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Buat Kampanye Baru</h1>
        <p className="text-muted-foreground mt-2">
          Rencanakan kampanye sosial media dengan distribusi pilar konten yang strategis.
        </p>
      </div>
      
      <CampaignForm />
    </div>
  )
}
