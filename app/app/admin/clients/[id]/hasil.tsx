'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { ChevronDownIcon, FolderIcon, InboxIcon, LoaderIcon, SendIcon, CheckIcon, CalendarIcon, ClapperboardIcon } from 'lucide-react'
import { Markdown } from '@/components/markdown'
import { PostDialog } from '@/components/calendar/post-dialog'

export type SkillOutput = {
  id: string
  client_id: string
  skill_id: string
  stage: string | null
  title: string
  status: string
  content: string
  created_at: string
  deliverable_id?: string | null
}

/** Map a skill's pipeline stage to a deliverable type. The repo's chain: foundation/plan set the
 *  strategy (brief), create/media make the content, grow/measure produce the reporting. */
export function stageToDeliverableType(stage: string | null | undefined): 'brief' | 'content' | 'report' {
  switch (stage) {
    case 'foundation':
    case 'plan':
    case 'publish':
      return 'brief'
    case 'create':
    case 'media':
      return 'content'
    case 'grow':
    case 'measure':
      return 'report'
    default:
      return 'content'
  }
}

/** The 7 repo stages, used to order the groups exactly as the pipeline does. */
const STAGE_ORDER = ['foundation', 'plan', 'create', 'media', 'publish', 'grow', 'measure']

const STAGE_LABEL: Record<string, string> = {
  foundation: 'Foundation',
  plan: 'Plan',
  create: 'Create',
  media: 'Media',
  publish: 'Publish',
  grow: 'Grow & Engage',
  measure: 'Measure & Recycle',
}

const STATUS_LABEL: Record<string, string> = {
  draft: 'Draft',
  sent: 'Terkirim',
  approved: 'Disetujui',
  revision_requested: 'Revisi',
}

export function HasilTab({ outputs, skillsByName, onSent }: {
  outputs: SkillOutput[]
  skillsByName?: Record<string, string>
  onSent?: () => void
}) {
  const [open, setOpen] = useState<Record<string, boolean>>({})
  const [sending, setSending] = useState(false)
  const [sendMsg, setSendMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  
  const [draft, setDraft] = useState<SkillOutput | null>(null)
  const [sendTitle, setSendTitle] = useState('')
  const [sendType, setSendType] = useState<'brief' | 'content' | 'report'>('content')
  
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calendarOutput, setCalendarOutput] = useState<SkillOutput | null>(null)

  const [productionDraft, setProductionDraft] = useState<SkillOutput | null>(null)
  const [prodTitle, setProdTitle] = useState('')
  const [prodPlatform, setProdPlatform] = useState('instagram')
  const [prodSending, setProdSending] = useState(false)

  function openSend(o: SkillOutput) {
    setDraft(o)
    setSendTitle(o.title)
    setSendType(stageToDeliverableType(o.stage))
    setSendMsg(null)
  }

  function openCalendar(o: SkillOutput) {
    setCalendarOutput(o)
    setCalendarOpen(true)
  }

  function openProduction(o: SkillOutput) {
    setProductionDraft(o)
    setProdTitle(o.title)
    setProdPlatform('instagram')
  }

  async function confirmProduction() {
    if (!productionDraft || !prodTitle) return
    setProdSending(true)
    try {
      const res = await fetch('/api/admin/content-productions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: productionDraft.client_id,
          title: prodTitle,
          platform: prodPlatform,
          stage: 'idea',
          priority: 'normal',
          notes: productionDraft.content
        })
      })
      if (res.ok) {
        setProductionDraft(null)
      } else {
        const err = await res.json()
        alert(err.error || 'Gagal mengirim ke production board')
      }
    } finally {
      setProdSending(false)
    }
  }

  async function confirmSend() {
    if (!draft) return
    setSending(true)
    setSendMsg(null)
    try {
      const r = await fetch(`/api/admin/clients/${draft.client_id}/outputs/${draft.id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: sendTitle, type: sendType }),
      })
      const j = await r.json()
      if (!r.ok) {
        setSendMsg({ kind: 'err', text: j.error || 'Gagal mengirim' })
        return
      }
      setSendMsg({ kind: 'ok', text: `Terkirim sebagai ${j.deliverable?.type ?? sendType}, lihat tab Deliverable.` })
      setTimeout(() => {
        setDraft(null)
        setSendMsg(null)
        onSent?.()
      }, 1600)
    } catch {
      setSendMsg({ kind: 'err', text: 'Gagal menghubungi server' })
    } finally {
      setSending(false)
    }
  }

  const grouped = useMemo(() => {
    const byStage: Record<string, SkillOutput[]> = {}
    for (const o of outputs) {
      const stage = o.stage && STAGE_ORDER.includes(o.stage) ? o.stage : 'plan'
      byStage[stage] ??= []
      byStage[stage].push(o)
    }
    return STAGE_ORDER.map((s) => ({ stage: s, items: byStage[s] ?? [] })).filter(
      (g) => g.items.length > 0
    )
  }, [outputs])

  return (
    <Card>
      <CardContent className="pt-6">
        {outputs.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
            <InboxIcon className="size-8" />
            <p className="text-sm">Belum ada hasil skill. Jalankan skill lewat Pipeline, lalu simpan hasilnya.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map((g) => (
              <div key={g.stage}>
                <button
                  onClick={() => setOpen((p) => ({ ...p, [g.stage]: !p[g.stage] }))}
                  className="flex min-h-11 w-full items-center justify-between rounded-lg border bg-muted/30 px-3 py-2 text-left text-sm font-medium hover:bg-muted/50"
                >
                  <span className="flex items-center gap-2">
                    <FolderIcon className="size-4 text-muted-foreground" />
                    {STAGE_LABEL[g.stage] ?? g.stage}
                    <Badge variant="secondary">{g.items.length}</Badge>
                  </span>
                  <ChevronDownIcon
                    className={`size-4 transition-transform ${open[g.stage] ? 'rotate-180' : ''}`}
                  />
                </button>
                {open[g.stage] && (
                  <div className="mt-2 space-y-2">
                    {g.items.map((o) => (
                      <div key={o.id} className="rounded-lg border bg-background p-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{o.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {skillsByName?.[o.skill_id] ?? o.skill_id}
                              {' · '}
                              {new Date(o.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric', month: 'short', year: 'numeric',
                              })}
                            </p>
                          </div>
                          <Badge variant="outline">{STATUS_LABEL[o.status] ?? o.status}</Badge>
                        </div>
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs text-muted-foreground">
                            Pratinjau
                          </summary>
                          <div className="prose-sm mt-2 max-h-72 overflow-auto rounded-md bg-muted/30 p-3 text-sm">
                            <Markdown source={o.content} />
                          </div>
                        </details>
                        <div className="mt-3 flex items-center gap-2 flex-wrap">
                          {!o.deliverable_id ? (
                            <>
                              <Button size="sm" variant="outline" className="h-11 lg:h-8" onClick={() => openSend(o)}>
                                <SendIcon className="size-3.5" /> Kirim ke Client
                              </Button>
                              <Button size="sm" variant="secondary" className="h-11 lg:h-8" onClick={() => openProduction(o)}>
                                <ClapperboardIcon className="size-3.5" /> Production Board
                              </Button>
                              <Button size="sm" variant="secondary" className="h-11 lg:h-8" onClick={() => openCalendar(o)}>
                                <CalendarIcon className="size-3.5" /> Jadwalkan ke Kalender
                              </Button>
                            </>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <CheckIcon className="size-3" /> Terkirim ke Deliverable
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={!!productionDraft} onOpenChange={(o) => { if (!o && !prodSending) setProductionDraft(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClapperboardIcon className="size-4" /> Kirim ke Production Board
            </DialogTitle>
            <DialogDescription>
              Buat task produksi baru dari hasil AI Skill ini di stage &quot;Ide&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Judul Task</Label>
              <Input value={prodTitle} onChange={(e) => setProdTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={prodPlatform} onValueChange={(v) => setProdPlatform(v || 'instagram')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                  <SelectItem value="linkedin">LinkedIn</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="x">X / Twitter</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setProductionDraft(null)} disabled={prodSending}>Batal</Button>
            <Button onClick={confirmProduction} disabled={prodSending || !prodTitle}>
              {prodSending ? <LoaderIcon className="size-4 animate-spin" /> : 'Kirim ke Board'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send-to-client dialog: shows the inferred deliverable type (editable), lets the admin
          tweak the title, and confirms without a full page reload. */}
      <Dialog open={!!draft} onOpenChange={(o) => { if (!o && !sending) setDraft(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <SendIcon className="size-4" /> Kirim ke Client
            </DialogTitle>
            <DialogDescription>
              Hasil ini akan menjadi deliverable: client akan melihat, menyetujui, atau minta revisi.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Judul deliverable</Label>
              <Input value={sendTitle} onChange={(e) => setSendTitle(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Tipe deliverable</Label>
              <Select value={sendType} onValueChange={(v) => setSendType(v as 'brief' | 'content' | 'report')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="brief">Brief, strategi & perencanaan</SelectItem>
                  <SelectItem value="content">Konten, materi siap tayang</SelectItem>
                  <SelectItem value="report">Laporan, analisis & audit</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Disarankan dari tahap skill ini (stage: <span className="font-mono">{draft?.stage ?? 'Kosong'}</span>).
              </p>
            </div>
          </div>
          {sendMsg && (
            <p className={`text-sm ${sendMsg.kind === 'err' ? 'text-destructive' : 'text-green-600'}`}>
              {sendMsg.text}
            </p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDraft(null)} disabled={sending}>Batal</Button>
            <Button onClick={confirmSend} disabled={sending || !sendTitle.trim()}>
              {sending ? <LoaderIcon className="size-4 animate-spin" /> : <SendIcon className="size-4" />}
              {sending ? 'Mengirim…' : 'Kirim'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={calendarOpen} onOpenChange={(open) => {
        setCalendarOpen(open)
        if (!open) setCalendarOutput(null)
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="size-4" /> Jadwalkan ke Kalender
            </DialogTitle>
            <DialogDescription>
              Pilih tanggal & platform untuk menjadwalkan output skill ini.
            </DialogDescription>
          </DialogHeader>
          {calendarOutput && (
            <PostDialog
              isOpen={true}
              onClose={() => setCalendarOpen(false)}
              clientId={calendarOutput.client_id}
              initialDate={new Date()}
              editingPost={null}
              onSave={async () => {
                setCalendarOpen(false)
                if (calendarOutput?.client_id) {
                  onSent?.()
                }
              }}
              onDelete={undefined}
              initialTitle={calendarOutput.title}
              initialContent={calendarOutput.content}
              skillOutputId={calendarOutput.id}
            />
          )}
        </DialogContent>
      </Dialog>
    </Card>
  )
}