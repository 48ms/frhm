'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { SkillChat } from './skill-chat'
import { FoundationPanel } from './foundation-panel'
import { Icons } from '@/components/icons'

type Pack = { id: string; name: string; description: string | null; icon?: string | null }
type SkillRow = { id: string; name: string; description: string | null; category?: string | null }
type ClientSkill = { skill_id: string; status: string; notes: string | null }
type Stage = { key: string; label: string; description: string | null; sort_order: number }
type PipelineSkill = { id: string; name: string; description: string | null; stage: string | null }

const STATUS = {
  belum: { label: 'Belum', Icon: Icons.circleDashed, cls: 'text-muted-foreground border-muted-foreground/40' },
  jalan: { label: 'Jalan', Icon: Icons.spinner, cls: 'text-blue-600 border-blue-500/40 bg-blue-50' },
  selesai: { label: 'Selesai', Icon: Icons.circleCheck, cls: 'text-green-600 border-green-500/40 bg-green-50' },
} as const

const STAGES = [
  { id: 'foundation', label: '1. FOUNDATION', icon: Icons.building, desc: 'Identitas & Suara Brand' },
  { id: 'plan', label: '2. PLAN', icon: Icons.calendar, desc: 'Pilar & Kalender Konten' },
  { id: 'create', label: '3. CREATE', icon: Icons.post, desc: 'Penulisan Konten & Draf' },
  { id: 'media', label: '4. MEDIA', icon: Icons.media, desc: 'Visual, Prompt & Video AI' },
  { id: 'publish', label: '5. PUBLISH', icon: Icons.send, desc: 'Penjadwalan & Antrean' },
  { id: 'grow', label: '6. GROW & ENGAGE', icon: Icons.user, desc: 'Interaksi & Komunitas' },
  { id: 'measure', label: '7. MEASURE', icon: Icons.chartBar, desc: 'Analitik & Daur Ulang' },
]

/** Map a skill id/category onto one of the 7 repo-chain stages (AGENTS.md workflow). */
function getSkillStage(skillId: string, category?: string | null): string {
  const id = skillId.toLowerCase()
  if (id.includes('brand') || id.includes('voice') || id.includes('audience')) return 'foundation'
  if (id.includes('pillar') || id.includes('calendar') || id.includes('plan') || id.includes('ideation')) return 'plan'
  if (id.includes('writer') || id.includes('script') || id.includes('hook') || id.includes('caption') || id.includes('post')) return 'create'
  if (id.includes('image') || id.includes('video') || id.includes('prompt') || id.includes('voiceover')) return 'media'
  if (id.includes('schedule') || id.includes('publish') || id.includes('queue')) return 'publish'
  if (id.includes('engage') || id.includes('comment') || id.includes('community') || id.includes('reply')) return 'grow'
  if (id.includes('analytic') || id.includes('report') || id.includes('audit') || id.includes('recycle')) return 'measure'

  if (category) {
    const cat = category.toLowerCase()
    if (STAGES.some((s) => s.id === cat)) return cat
  }
  return 'foundation'
}

export function ClientSkills({
  clientId, packs, skillsByPack, clientSkills, initialSkill = null,
  stages = [], pipelineSkills = [], files = [], provider = null, connectedChannels = 0,
}: {
  clientId: string
  packs: Pack[]
  skillsByPack: Record<string, SkillRow[]>
  clientSkills: ClientSkill[]
  /** Skill id to auto-launch on mount (onboarding handoff — repo: "the agent interviews you"). */
  initialSkill?: string | null
  stages?: Stage[]
  pipelineSkills?: PipelineSkill[]
  files?: string[]
  provider?: { id: string; name: string; model: string | null } | null
  connectedChannels?: number
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [chosenPack, setChosenPack] = useState('')
  const [runSkill, setRunSkill] = useState<SkillRow | null>(null)

  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkBrief, setBulkBrief] = useState('')
  const [bulkRunning, setBulkRunning] = useState(false)
  const [bulkResults, setBulkResults] = useState<{ skill_id: string; ok: boolean; error?: string }[] | null>(null)
  const [bulkErr, setBulkErr] = useState<string | null>(null)

  const statusOf = (id: string) => clientSkills.find((c) => c.skill_id === id)?.status ?? 'belum'

  // Deduplicated, owned skill rows (client_skills is the source of truth).
  const ownedSkills = useMemo(() => {
    const own = new Set(clientSkills.map((c) => c.skill_id))
    const seen = new Set<string>()
    const rows: SkillRow[] = []
    Object.values(skillsByPack).flat().forEach((s) => {
      if (!own.has(s.id) || seen.has(s.id)) return
      seen.add(s.id)
      rows.push(s)
    })
    // Packless owned skills must still be runnable.
    clientSkills.forEach((c) => {
      if (seen.has(c.skill_id)) return
      seen.add(c.skill_id)
      rows.push({ id: c.skill_id, name: c.skill_id, description: null, category: null })
    })
    return rows
  }, [skillsByPack, clientSkills])

  const skillsByCategory = useMemo(() => {
    const categorized: Record<string, SkillRow[]> = {}
    STAGES.forEach((s) => { categorized[s.id] = [] })
    ownedSkills.forEach((s) => {
      const stage = getSkillStage(s.id, s.category)
      categorized[stage].push(s)
    })
    return categorized
  }, [ownedSkills])

  const allSkillIds = useMemo(() => ownedSkills.map((s) => s.id), [ownedSkills])
  const doneCount = clientSkills.filter((c) => c.status === 'selesai').length
  const pendingCount = allSkillIds.filter((id) => statusOf(id) !== 'selesai').length

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelected(new Set())
    setBulkResults(null)
    setBulkErr(null)
  }

  function selectAllPending() {
    setSelected(new Set(allSkillIds.filter((id) => statusOf(id) !== 'selesai')))
  }

  async function runBulk() {
    setBulkRunning(true)
    setBulkErr(null)
    setBulkResults(null)
    try {
      const res = await fetch(`/api/admin/clients/${clientId}/skills/bulk-run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill_ids: Array.from(selected), brief: bulkBrief.trim() }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menjalankan')
      setBulkResults(json.results)
      router.refresh()
    } catch (e) {
      setBulkErr(e instanceof Error ? e.message : 'Terjadi kesalahan')
    } finally {
      setBulkRunning(false)
    }
  }

  async function addPack() {
    if (!chosenPack) return
    setBusy(true)
    await fetch(`/api/admin/clients/${clientId}/skills`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pack_id: chosenPack }),
    })
    setBusy(false); setAddOpen(false); setChosenPack('')
    router.refresh()
  }

  async function setStatus(skillId: string, status: string) {
    await fetch(`/api/admin/clients/${clientId}/skills`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ skill_id: skillId, status }),
    })
    router.refresh()
  }

  function openRunner(s: SkillRow) {
    setRunSkill(s)
    if (statusOf(s.id) === 'belum') setStatus(s.id, 'jalan')
  }

  // Onboarding handoff: auto-open the requested skill once.
  const autoOpened = useRef(false)
  useEffect(() => {
    if (autoOpened.current || !initialSkill) return
    const match = ownedSkills.find((s) => s.id === initialSkill)
    if (!match) return
    autoOpened.current = true
    openRunner(match)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSkill, ownedSkills])

  // Banner handoff: open a skill launched via the guidance banner.
  useEffect(() => {
    const handleLaunch = (e: Event) => {
      const skillId = (e as CustomEvent<{ skillId: string }>).detail?.skillId
      if (!skillId) return
      const match = ownedSkills.find((s) => s.id === skillId)
      if (match) openRunner(match)
    }
    window.addEventListener('skills:launch', handleLaunch)
    return () => window.removeEventListener('skills:launch', handleLaunch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownedSkills])

  return (
    <div className="space-y-5">
      {/* Fondasi Cepat — semua aksi pembuatan file fondasi tinggal di tab Skills */}
      <FoundationPanel
        clientId={clientId}
        stages={stages}
        skills={pipelineSkills}
        clientSkills={clientSkills}
        files={files}
        provider={provider}
        connectedChannels={connectedChannels}
        onAction={(skillId) => {
          const match = ownedSkills.find((s) => s.id === skillId)
          if (match) openRunner(match)
        }}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-4">
        <div>
          <h3 className="text-base font-bold tracking-tight">Workflow Rantai Repo</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {clientSkills.length} skill aktif · {doneCount} selesai — jalankan bertahap dari Fondasi hingga Pengukuran.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectMode ? (
            <>
              <Badge variant="secondary">{selected.size} dipilih</Badge>
              <Button
                variant="outline" size="sm"
                onClick={selected.size > 0 ? () => setSelected(new Set()) : selectAllPending}
                disabled={bulkRunning || pendingCount === 0}
              >
                {selected.size > 0 ? 'Kosongkan' : `Pilih yang belum (${pendingCount})`}
              </Button>
              <Button variant="outline" size="sm" onClick={exitSelectMode} disabled={bulkRunning}>
                Batal
              </Button>
              <Button
                size="sm" className="bg-brand-accent hover:bg-brand-accent/90"
                onClick={() => setBulkOpen(true)}
                disabled={selected.size === 0 || bulkRunning}
              >
                <Icons.play className="size-3.5 mr-1.5" /> Jalankan {selected.size > 0 ? `${selected.size} skill` : ''}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setSelectMode(true)} disabled={clientSkills.length === 0}>
                <Icons.listChecks className="size-4 mr-1.5" /> Pilih Banyak
              </Button>
              <Button size="sm" className="bg-brand-accent hover:bg-brand-accent/90" onClick={() => setAddOpen(true)}>
                <Icons.add className="size-4 mr-1.5" /> Tambah Paket
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Balanced responsive bento grid — 7 stages of the repo chain */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {STAGES.map((stage) => {
          const skills = skillsByCategory[stage.id] || []
          if (skills.length === 0) return null

          return (
            <Card key={stage.id} className="bg-card shadow-sm border border-muted/80 flex flex-col">
              <CardHeader className="p-4 pb-3 border-b bg-muted/10">
                <div className="flex items-center gap-2.5">
                  <div className="size-7 rounded-lg bg-brand-accent/10 text-brand-accent flex items-center justify-center shrink-0">
                    <stage.icon className="size-4" />
                  </div>
                  <div>
                    <CardTitle className="text-xs font-bold uppercase tracking-wider text-foreground">
                      {stage.label}
                    </CardTitle>
                    <p className="text-[10px] text-muted-foreground leading-none mt-1">{stage.desc}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-3 space-y-2 flex-1">
                {skills.map((s) => {
                  const st = statusOf(s.id)
                  const cfg = STATUS[st as keyof typeof STATUS] ?? STATUS.belum
                  const isSel = selected.has(s.id)
                  return (
                    <div
                      key={s.id}
                      className={`w-full flex items-center justify-between gap-2 rounded-lg border bg-background p-2.5 transition-all ${
                        selectMode && isSel ? 'border-brand-accent bg-brand-accent/5' : 'hover:border-brand-accent/40 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {selectMode ? (
                          <Checkbox
                            checked={isSel}
                            onCheckedChange={() => toggleSelect(s.id)}
                            className="shrink-0"
                            aria-label={`Pilih ${s.name}`}
                          />
                        ) : (
                          <div className={`size-6 rounded-full border flex items-center justify-center shrink-0 ${cfg.cls}`}>
                            <cfg.Icon className={`size-3 ${st === 'jalan' ? 'animate-spin' : ''}`} />
                          </div>
                        )}
                        <span className="text-xs font-medium truncate text-foreground">{s.name}</span>
                      </div>

                      {!selectMode && (
                        <button
                          onClick={() => openRunner(s)}
                          className="shrink-0 text-[10px] font-semibold text-slate-500 uppercase tracking-wider hover:text-brand-accent transition-colors"
                        >
                          Jalankan →
                        </button>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Paket Skill</DialogTitle>
            <DialogDescription>Tambahkan modul skill baru ke workspace klien.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Select value={chosenPack} onValueChange={(v) => setChosenPack(v ?? '')}>
              <SelectTrigger><SelectValue placeholder="Pilih paket…" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {packs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button className="bg-brand-accent hover:bg-brand-accent/90" onClick={addPack} disabled={!chosenPack || busy}>Tambah</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkOpen} onOpenChange={(o) => { if (!o && !bulkRunning) setBulkOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icons.listChecks className="size-5 text-brand-accent" /> Jalankan {selected.size} Skill
            </DialogTitle>
            <DialogDescription>
              Skill dijalankan berurutan. Hasilnya otomatis masuk ke tab Hasil.
            </DialogDescription>
          </DialogHeader>

          {bulkResults ? (
            <div className="max-h-72 space-y-1.5 overflow-y-auto" aria-live="polite">
              {bulkResults.map((r) => {
                const name = ownedSkills.find((s) => s.id === r.skill_id)?.name ?? r.skill_id
                return (
                  <div key={r.skill_id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                    {r.ok
                      ? <Icons.circleCheck className="size-4 shrink-0 text-green-600" aria-hidden="true" />
                      : <Icons.circleDashed className="size-4 shrink-0 text-destructive" aria-hidden="true" />}
                    <span className="min-w-0 flex-1 truncate">{name}</span>
                    {!r.ok && <span className="text-xs text-destructive">{r.error}</span>}
                  </div>
                )
              })}
              <p className="pt-2 text-sm font-medium">
                {bulkResults.filter((r) => r.ok).length} berhasil ·{' '}
                {bulkResults.filter((r) => !r.ok).length} gagal
              </p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="bulk-brief">Arahan (opsional)</Label>
                <Textarea
                  id="bulk-brief"
                  value={bulkBrief}
                  onChange={(e) => setBulkBrief(e.target.value)}
                  placeholder="Contoh: Fokus konten Ramadan, target UMKM kuliner."
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  Kalau kosong, tiap skill jalan dengan konteks brand saja.
                </p>
              </div>
              {bulkErr && <p className="text-sm text-destructive" role="alert">{bulkErr}</p>}
            </>
          )}

          <DialogFooter className="gap-2">
            {bulkResults ? (
              <>
                <Button variant="outline" className="h-11 lg:h-8" onClick={() => setBulkResults(null)}>
                  Jalankan Lagi
                </Button>
                <Button className="h-11 lg:h-8" onClick={() => { setBulkOpen(false); exitSelectMode() }}>
                  Selesai
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" className="h-11 lg:h-8" onClick={() => setBulkOpen(false)} disabled={bulkRunning}>
                  Batal
                </Button>
                <Button className="h-11 lg:h-8 bg-brand-accent hover:bg-brand-accent/90" onClick={runBulk} disabled={bulkRunning}>
                  {bulkRunning ? <Icons.spinner className="size-4 animate-spin" /> : <Icons.play className="size-4" />}
                  {bulkRunning ? 'Menjalankan…' : 'Jalankan'}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <SkillChat
        clientId={clientId}
        skill={runSkill}
        onClose={() => setRunSkill(null)}
        onSaved={() => { if (runSkill) setStatus(runSkill.id, 'selesai') }}
      />
    </div>
  )
}
