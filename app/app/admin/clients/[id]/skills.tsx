'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { SkillChat } from './skill-chat'
import {
  PlusIcon, Trash2Icon, CircleDashedIcon, LoaderIcon, CircleCheckIcon, PlayIcon, ListChecksIcon,
} from 'lucide-react'

type Pack = { id: string; name: string; description: string | null; icon?: string | null }
type SkillRow = { id: string; name: string; description: string | null; category?: string | null }
type ClientSkill = { skill_id: string; status: string; notes: string | null }

const STATUS = {
  belum: { label: 'Belum', Icon: CircleDashedIcon, cls: 'text-muted-foreground border-muted-foreground/40' },
  jalan: { label: 'Jalan', Icon: LoaderIcon, cls: 'text-blue-600 border-blue-500/40' },
  selesai: { label: 'Selesai', Icon: CircleCheckIcon, cls: 'text-green-600 border-green-500/40' },
} as const

export function ClientSkills({
  clientId, packs, skillsByPack, clientSkills,
}: {
  clientId: string
  packs: Pack[]
  skillsByPack: Record<string, SkillRow[]>
  clientSkills: ClientSkill[]
}) {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [chosenPack, setChosenPack] = useState('')

  // runner state: the interview happens in <SkillChat/>
  const [runSkill, setRunSkill] = useState<SkillRow | null>(null)

  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkBrief, setBulkBrief] = useState('')
  const [bulkRunning, setBulkRunning] = useState(false)
  const [bulkResults, setBulkResults] = useState<
    { skill_id: string; ok: boolean; error?: string }[] | null
  >(null)
  const [bulkErr, setBulkErr] = useState<string | null>(null)

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
    const pending = allSkillIds.filter((id) => statusOf(id) !== 'selesai')
    setSelected(new Set(pending))
  }

  function clearSelection() {
    setSelected(new Set())
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

  function togglePack(packSkillIds: string[]) {
    setSelected((prev) => {
      const allSel = packSkillIds.every((id) => prev.has(id))
      const next = new Set(prev)
      if (allSel) packSkillIds.forEach((id) => next.delete(id))
      else packSkillIds.forEach((id) => next.add(id))
      return next
    })
  }

  // group active skills under their pack; a skill linked to several packs must appear
  // exactly once (first pack wins), otherwise the list double-counts and the selection
  // badge disagrees with the visible checkboxes.
  const activeByPack = useMemo(() => {
    const own = new Set(clientSkills.map((c) => c.skill_id))
    const seen = new Set<string>()
    return packs
      .map((p) => ({
        pack: p,
        skills: (skillsByPack[p.id] ?? []).filter((s) => {
          if (!own.has(s.id)) return false
          if (seen.has(s.id)) return false
          seen.add(s.id)
          return true
        }),
      }))
      .filter((g) => g.skills.length > 0)
  }, [packs, skillsByPack, clientSkills])

  const doneCount = clientSkills.filter((c) => c.status === 'selesai').length
  const statusOf = (id: string) => clientSkills.find((c) => c.skill_id === id)?.status ?? 'belum'
  // Every skill the client owns, whether or not its pack renders: client_skills is
  // the source of truth (a packless skill must still be selectable and runnable).
  const allSkillIds = useMemo(
    () => Array.from(new Set([
      ...clientSkills.map((c) => c.skill_id),
      ...activeByPack.flatMap((g) => g.skills.map((s) => s.id)),
    ])),
    [clientSkills, activeByPack],
  )
  const pendingCount = allSkillIds.filter((id) => statusOf(id) !== 'selesai').length

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

  async function removePack(packId: string) {
    setBusy(true)
    await fetch(`/api/admin/clients/${clientId}/skills?pack_id=${packId}`, { method: 'DELETE' })
    setBusy(false)
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

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted-foreground text-sm">
          {clientSkills.length} skill aktif · {doneCount} selesai · {activeByPack.length} paket
        </p>
        <div className="flex items-center gap-2">
          {selectMode ? (
            <>
              <Badge variant="secondary">{selected.size} dipilih</Badge>
              <Button
                variant="outline"
                onClick={selected.size > 0 ? clearSelection : selectAllPending}
                disabled={bulkRunning || pendingCount === 0}
              >
                {selected.size > 0 ? 'Kosongkan' : `Pilih yang belum (${pendingCount})`}
              </Button>
              <Button variant="outline" onClick={exitSelectMode} disabled={bulkRunning}>
                Batal
              </Button>
              <Button
                onClick={() => setBulkOpen(true)}
                disabled={selected.size === 0 || bulkRunning}
              >
                {bulkRunning ? <LoaderIcon className="size-4 animate-spin" /> : <PlayIcon className="size-4" />}
                Jalankan {selected.size > 0 ? `${selected.size} skill` : ''}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => setSelectMode(true)} disabled={clientSkills.length === 0}>
                <ListChecksIcon className="size-4" /> Pilih Banyak
              </Button>
              <Button onClick={() => setAddOpen(true)}>
                <PlusIcon className="size-4" /> Tambah Paket
              </Button>
            </>
          )}
        </div>
      </div>

      {activeByPack.length === 0 ? (
        <Card>
          <CardContent className="text-muted-foreground py-8 text-center text-sm">
            Belum ada paket skill. Klik “Tambah Paket” untuk mulai.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activeByPack.map(({ pack, skills }) => (
            <Card key={pack.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base">{pack.name}</CardTitle>
                    <CardDescription className="text-xs">{pack.description}</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectMode && (
                      <Button
                        variant="outline" size="sm"
                        onClick={() => togglePack(skills.map((s) => s.id))}
                      >
                        {skills.every((s) => selected.has(s.id)) ? 'Lepas semua' : 'Pilih semua'}
                      </Button>
                    )}
                    <Button
                      variant="ghost" size="icon-sm" disabled={busy || pack.id === '__none__'}
                      onClick={() => removePack(pack.id)}
                      aria-label={`Hapus paket ${pack.name}`}
                      title={pack.id === '__none__' ? 'Skill tanpa paket tidak bisa dihapus sebagai paket' : undefined}
                    >
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {skills.map((s) => {
                  const st = statusOf(s.id)
                  const cfg = STATUS[st as keyof typeof STATUS] ?? STATUS.belum
                  const isSel = selected.has(s.id)
                  return (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between gap-3 rounded-md border p-3 transition-colors ${
                        selectMode && isSel ? 'border-primary bg-primary/5' : ''
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {selectMode && (
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={() => toggleSelect(s.id)}
                            className="size-4 shrink-0 accent-primary"
                            aria-label={`Pilih ${s.name}`}
                          />
                        )}
                        <div className="min-w-0 space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cfg.cls}>
                              <cfg.Icon className={`size-3 ${st === 'jalan' ? 'animate-spin' : ''}`} />
                              {cfg.label}
                            </Badge>
                            <span className="truncate text-sm font-medium">{s.name}</span>
                          </div>
                          <p className="text-muted-foreground line-clamp-1 text-xs">{s.description}</p>
                        </div>
                      </div>
                      {!selectMode && (
                        <div className="flex shrink-0 gap-2">
                          <Button size="sm" variant="outline" onClick={() => openRunner(s)}>
                            <PlayIcon className="size-3.5" /> Jalankan
                          </Button>
                          <Select value={st} onValueChange={(v) => setStatus(s.id, v ?? 'belum')}>
                            <SelectTrigger className="h-9 w-28"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="belum">Belum</SelectItem>
                              <SelectItem value="jalan">Jalan</SelectItem>
                              <SelectItem value="selesai">Selesai</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Paket Skill</DialogTitle>
            <DialogDescription>
              Semua skill di paket ini akan masuk ke client sebagai workspace.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Select value={chosenPack} onValueChange={(v) => setChosenPack(v ?? '')}>
              <SelectTrigger><SelectValue placeholder="Pilih paket…" /></SelectTrigger>
              <SelectContent className="max-h-72">
                {packs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} · {(skillsByPack[p.id] ?? []).length} skill
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button onClick={addPack} disabled={!chosenPack || busy}>
              {busy ? <LoaderIcon className="size-4 animate-spin" /> : null} Tambahkan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bulkOpen} onOpenChange={(o) => { if (!o && !bulkRunning) setBulkOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListChecksIcon className="size-5 text-primary" /> Jalankan {selected.size} Skill
            </DialogTitle>
            <DialogDescription>
              Skill dijalankan berurutan. Hasilnya otomatis masuk ke tab Hasil.
            </DialogDescription>
          </DialogHeader>

          {bulkResults ? (
            <div className="max-h-72 space-y-1.5 overflow-y-auto">
              {bulkResults.map((r) => {
                const name = Object.values(skillsByPack).flat().find((s) => s.id === r.skill_id)?.name ?? r.skill_id
                return (
                  <div key={r.skill_id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
                    {r.ok
                      ? <CircleCheckIcon className="size-4 shrink-0 text-green-600" />
                      : <CircleDashedIcon className="size-4 shrink-0 text-destructive" />}
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
              {bulkErr && <p className="text-sm text-destructive">{bulkErr}</p>}
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
                <Button className="h-11 lg:h-8" onClick={runBulk} disabled={bulkRunning}>
                  {bulkRunning ? <LoaderIcon className="size-4 animate-spin" /> : <PlayIcon className="size-4" />}
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
