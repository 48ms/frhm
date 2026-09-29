'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/icons'
import { toast } from 'sonner'

/**
 * The 5 foundation documents, in the order the repo's pipeline writes them.
 * `brand-profile.md` is the source every other file derives from; `voice.md` is the
 * exception — voice-builder derives it from real writing samples, never from the profile.
 */
const FOUNDATION_FILES = [
  'brand-profile.md',
  'voice.md',
  'audience.md',
  'social-strategy.md',
  'content-pillars.md',
] as const

/** Files that a batch run can derive from brand-profile.md. voice.md is deliberately excluded. */
const BATCH_FILES = ['audience.md', 'social-strategy.md', 'content-pillars.md']

const FILE_HINT: Record<string, string> = {
  'brand-profile.md': 'Identitas, voice, guardrail, channel. Sumber semua file lain.',
  'voice.md': 'Di-derive dari 3-5 contoh tulisan asli, bukan dari brand profile. Tidak bisa 1-klik.',
  'audience.md': 'Bisa di-derive dari brand-profile.',
  'social-strategy.md': 'Bisa di-derive dari brand-profile.',
  'content-pillars.md': 'Bisa di-derive dari brand-profile. Kalender butuh file ini.',
}

type Stage = { key: string; label: string; description: string | null; sort_order: number }
type PipelineSkill = { id: string; name: string; description: string | null; stage: string | null }
type ClientSkill = { skill_id: string; status: string; notes: string | null }

interface FoundationPanelProps {
  clientId: string
  stages?: Stage[]
  skills?: PipelineSkill[]
  clientSkills?: ClientSkill[]
  /** Paths of files already written for this client (client_files.path). */
  files?: string[]
  provider?: { id: string; name: string; model: string | null } | null
  connectedChannels?: number
  onAction: (skillId: string) => void
}

function statusVariant(status: string) {
  if (status === 'ada' || status === 'terhubung') return 'ghost' as const
  if (status === 'gagal') return 'destructive' as const
  if (status === 'generate-ready') return 'ghost' as const
  if (status === 'loading') return 'secondary' as const
  return 'secondary' as const
}

export function FoundationPanel({
  clientId, stages = [], skills = [], clientSkills = [], files = [],
  provider = null, connectedChannels = 0, onAction,
}: FoundationPanelProps) {
  const [voiceOpen, setVoiceOpen] = React.useState(false)
  const [voiceSamples, setVoiceSamples] = React.useState('')
  const [voiceSaving, setVoiceSaving] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [batchState, setBatchState] = React.useState<Record<string, 'loading' | 'ada' | 'gagal'>>({})
  const [batchError, setBatchError] = React.useState<string | null>(null)

  const hasFile = (path: string) => files.includes(path) || batchState[path] === 'ada'

  const voiceSampleBlocks = voiceSamples.trim()
    ? voiceSamples.trim().split(/\n\s*\n/).filter((b) => b.trim().length > 0)
    : []
  const voiceValid = voiceSampleBlocks.length >= 3 && voiceSamples.trim().length >= 100

  const statusFor = (path: string): string => {
    if (batchState[path]) return batchState[path]
    if (hasFile(path)) return 'ada'
    // generate-ready: transient state saat dialog voice terbuka dan sampel valid
    if (path === 'voice.md' && voiceOpen && voiceValid) return 'generate-ready'
    return path === 'voice.md' ? 'butuh sampel' : 'belum'
  }

  const handleVoiceGenerate = async () => {
    if (!voiceValid || voiceSaving) return
    setVoiceSaving(true)
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/foundation/voice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ samples: voiceSampleBlocks }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error(data?.error ?? `HTTP ${res.status}`)
        return
      }
      toast.success('voice.md berhasil dibuat dari sampel tulisan.')
      setVoiceSamples('')
      setVoiceOpen(false)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal membuat voice.md')
    } finally {
      setVoiceSaving(false)
    }
  }

  const foundationReady = FOUNDATION_FILES.filter(hasFile).length
  const statusBySkill = React.useMemo(
    () => Object.fromEntries(clientSkills.map((c) => [c.skill_id, c.status])),
    [clientSkills]
  )
  const sortedStages = [...stages].sort((a, b) => a.sort_order - b.sort_order)
  const brandProfileReady = hasFile('brand-profile.md')

  const handleGenerate = async () => {
    if (!brandProfileReady || busy) return
    setBusy(true)
    setBatchError(null)
    setBatchState(Object.fromEntries(BATCH_FILES.map((p) => [p, 'loading' as const])))
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/foundation/batch`, { method: 'POST' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setBatchError(data?.error ?? `HTTP ${res.status}`)
        setBatchState({})
        return
      }
      const next: Record<string, 'ada' | 'gagal'> = {}
      for (const f of (data?.files ?? []) as Array<{ path: string; status: string }>) {
        next[f.path] = f.status === 'ada' ? 'ada' : 'gagal'
      }
      setBatchState((prev) => ({ ...prev, ...next }))
      if (data?.errors?.length) setBatchError(data.errors.join('; '))
    } catch (e) {
      setBatchError((e as Error)?.message ?? 'Gagal menghubungi server')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Voice builder dialog */}
      <Dialog open={voiceOpen} onOpenChange={setVoiceOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Buat Voice dari Sampel Tulisan</DialogTitle>
            <DialogDescription>
              Voice di-derive dari tulisan asli, bukan brand profile. Tempel 3-5 contoh tulisan
              asli klien (post, caption, artikel). Pisahkan antar sampel dengan baris kosong.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label htmlFor="voice-samples">
              Contoh tulisan asli (3-5 sampel, minimal 100 karakter total)
            </Label>
            <Textarea
              id="voice-samples"
              rows={10}
              placeholder={'Contoh caption Instagram 1\n\n#lorem ipsum dolor sit amet\n\nContoh caption Instagram 2\n\n...'}
              value={voiceSamples}
              onChange={(e) => setVoiceSamples(e.target.value)}
              disabled={voiceSaving}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{voiceSampleBlocks.length}/3 sampel terpisah</span>
              <span>{voiceSamples.trim().length}/100 karakter</span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">
            Aturan repo:{' '}
            <a
              href="https://github.com/social-media-skills/skills/blob/main/skills/voice-builder/SKILL.md"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-3 hover:text-foreground"
            >
              voice-builder/SKILL.md
            </a>{' '}
            : voice harus dari sampel asli, jangan di-invent dari brand profile.
          </p>

          <DialogFooter>
            <Button
              variant="outline"
              className="h-11 sm:h-9"
              onClick={() => setVoiceOpen(false)}
              disabled={voiceSaving}
            >
              Batal
            </Button>
            <Button
              className="h-11 sm:h-9"
              onClick={handleVoiceGenerate}
              disabled={!voiceValid || voiceSaving}
              title={voiceValid ? undefined : 'Minimal 3 sampel terpisah dan 100 karakter total'}
            >
              {voiceSaving ? <Icons.spinner className="size-4 animate-spin" /> : null}
              {voiceSaving ? 'Membuat voice.md...' : 'Buat voice.md dari sampel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Readiness strip */}
      <div className="flex flex-wrap gap-2">
        <div className="flex min-h-11 items-center gap-2 rounded-lg border bg-card px-3 text-sm">
          <span className={`size-2 rounded-full ${foundationReady === FOUNDATION_FILES.length ? 'bg-green-600' : 'bg-amber-500'}`} />
          {foundationReady} dari {FOUNDATION_FILES.length} file fondasi
        </div>
        <div className="flex min-h-11 items-center gap-2 rounded-lg border bg-card px-3 text-sm">
          <span className={`size-2 rounded-full ${connectedChannels > 0 ? 'bg-green-600' : 'bg-muted-foreground'}`} />
          {connectedChannels} channel terhubung
        </div>
        <div className="flex min-h-11 items-center gap-2 rounded-lg border bg-card px-3 text-sm">
          <span className="size-2 rounded-full bg-muted-foreground" />
          {provider ? `Provider: ${provider.name}${provider.model ? ` ${provider.model}` : ''}` : 'Provider belum diatur'}
        </div>
      </div>

      {/* Foundation files */}
      <Card>
        <CardHeader>
          <CardTitle>File fondasi</CardTitle>
          <CardDescription>
            Urutan repo: brand-profile dulu, baru sisanya. Skill lain baca file ini sebelum menulis.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-0">
          {FOUNDATION_FILES.map((file, i) => {
            const status = statusFor(file)
            const isBrandProfile = file === 'brand-profile.md'
            const isVoice = file === 'voice.md'
            return (
              <div
                key={file}
                className={`flex min-h-14 items-center justify-between gap-3 py-2.5 ${i > 0 ? 'border-t' : ''}`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <code className="text-sm font-medium">{file}</code>
                    <Badge variant={statusVariant(status)}>{status}</Badge>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{FILE_HINT[file]}</p>
                </div>
                {isBrandProfile && (
                  <Button variant="outline" className="h-11 shrink-0 lg:h-8" onClick={() => onAction('brand-profile')}>
                    Edit brand profile
                  </Button>
                )}
                {isVoice && status !== 'ada' && (
                  <Button
                    variant="outline"
                    className="h-11 shrink-0 lg:h-8"
                    onClick={() => setVoiceOpen(true)}
                  >
                    Tambah sampel tulisan
                  </Button>
                )}
                {!isBrandProfile && !isVoice && (
                  <Badge variant="outline" className="shrink-0">ikut batch</Badge>
                )}
              </div>
            )
          })}

          {/* Batch generation — wires to /api/admin/clients/[id]/foundation/batch */}
          <div className="mt-3 rounded-lg border bg-muted/40 p-3">
            <p className="text-sm font-medium">Generate {BATCH_FILES.length} file fondasi</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {BATCH_FILES.join(' → ')}, berurutan. Tiap skill baca brand-profile. Berhenti kalau ada yang gagal.
            </p>
            <Button
              className="mt-3 h-11 w-full lg:h-8"
              onClick={handleGenerate}
              disabled={!brandProfileReady || busy}
            >
              {busy ? 'Generating…' : 'Generate dari brand profile'}
            </Button>
            {!brandProfileReady && (
              <p className="mt-2 text-xs text-destructive">
                brand-profile.md belum ada. Isi dulu sebelum generate.
              </p>
            )}
            {batchError && (
              <p className="mt-2 text-xs text-destructive">{batchError}</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
