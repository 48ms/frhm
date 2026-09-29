'use client'

import React from 'react'
import { Icons } from '@/components/icons'
import { Button } from '@/components/ui/button'

export function WorkspaceGuidanceBanner({ 
  hasBrandProfile, 
  hasVoice, 
  hasContentPillars,
  onAction 
}: { 
  hasBrandProfile: boolean
  hasVoice: boolean
  hasContentPillars: boolean
  onAction: (skillId: string) => void
}) {
  let step = 1
  let title = 'Langkah 1: Bangun Brand Profile'
  let desc = 'Mulai interview AI untuk menetapkan identitas dasar, target audiens, dan tujuan brand.'
  let skillTarget = 'brand-profile'
  let completed = false

  if (hasBrandProfile && !hasVoice) {
    step = 2
    title = 'Langkah 2: Tentukan Voice & Tone'
    desc = 'AI akan menganalisis profil brand Anda untuk menciptakan gaya komunikasi (voice) yang unik.'
    skillTarget = 'voice-builder'
  } else if (hasBrandProfile && hasVoice && !hasContentPillars) {
    step = 3
    title = 'Langkah 3: Susun Content Pillars'
    desc = 'Rancang pilar konten dan rubrik bulanan berdasarkan fondasi brand Anda.'
    skillTarget = 'content-pillars'
  } else if (hasBrandProfile && hasVoice && hasContentPillars) {
    step = 4
    title = 'Fondasi Selesai!'
    desc = 'Klien ini sudah siap. Lanjutkan dengan pembuatan draf konten mingguan (content creation).'
    skillTarget = ''
    completed = true
  }

  return (
    <div className="mb-6 rounded-xl border border-brand-accent/20 bg-brand-accent/5 overflow-hidden">
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 sm:p-5 gap-4">
        <div className="flex items-start gap-4 w-full sm:w-auto">
          <div className="hidden sm:flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-accent/10 text-brand-accent">
            {completed ? <Icons.check className="size-5" /> : <Icons.sparkles className="size-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-accent">
                {completed ? 'Tahap Aktif' : `Fase Fondasi (${step}/3)`}
              </span>
            </div>
            <h3 className="text-base font-semibold text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground mt-0.5 max-w-xl leading-relaxed">
              {desc}
            </p>
          </div>
        </div>
        
        {!completed && (
          <Button 
            className="w-full sm:w-auto bg-brand-accent hover:bg-brand-accent/90 shrink-0 shadow-sm"
            onClick={() => onAction(skillTarget)}
          >
            Mulai Interview <Icons.arrowRight className="ml-2 size-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
