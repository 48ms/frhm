'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge, TypeBadge } from '@/components/deliverable/status-badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { ClientSkills } from './skills'
import { PipelineBoard } from './pipeline/board'
import { ClientSetup } from './setup'
import { HasilTab, type SkillOutput } from './hasil'
import { ContentProductionBoard } from '@/components/production/content-production-board'
import { AnalyticsBoard } from '@/components/analytics/analytics-board'
import { FeedbackBoard } from '@/components/feedback/feedback-board'
import { TrendRadarBoard } from '@/components/trends/trend-radar-board'
import { TrendJackBar } from '@/components/trends/trend-jack-bar'
import { BrandAssetHub } from '@/components/client/brand-asset-hub'
import { EventWorkspaceBoard } from '@/components/events/event-workspace-board'
import { BudgetLedgerBoard } from '@/components/marketing/budget-ledger-board'
import { OmniCalendarBoard } from '@/components/production/omni-calendar-board'
// Recharts (~200KB bundle) — lazy-loaded to avoid loading chart code when marketing tab is closed.
const AdsTrackerBoard = dynamic(
  () => import('@/components/marketing/ads-tracker-board').then((m) => m.AdsTrackerBoard),
  {
    loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" />,
  }
)
const ROIDashboardBoard = dynamic(
  () => import('@/components/marketing/roi-dashboard-board').then((m) => m.ROIDashboardBoard),
  {
    loading: () => <div className="h-64 animate-pulse rounded-lg bg-muted" />,
  }
)
import {
ArrowLeftIcon, Building2Icon, SaveIcon, PlusIcon, FileTextIcon,
CheckCircle2Icon, LayersIcon, WorkflowIcon, KeyRoundIcon,
DownloadIcon, LoaderIcon, MessageCircle, Flame, LogOut,
} from 'lucide-react'

type BrandProfile = {
  who?: string
  audience?: string
  voice?: string
  pov?: string
  proof?: string
  guardrails?: string
  pillars?: string[]
}

type Client = {
  id: string
  name: string
  contact_email: string | null
  contact_phone: string | null
  brand_profile: BrandProfile
  created_at: string
}

type Deliverable = {
  id: string
  title: string
  type: 'brief' | 'content' | 'report'
  status: 'draft' | 'sent' | 'approved' | 'revision_requested'
  updated_at: string
}

type Pack = { id: string; name: string; description: string | null; icon: string | null; skill_count: number }
type Skill = { id: string; name: string; description: string | null; category: string | null }
type ClientSkill = { skill_id: string; status: 'belum' | 'jalan' | 'selesai'; notes: string | null }
/** A publishing channel: the platform named in brand-profile.md, plus the bridge's state. */
export type Channel = {
  platform: string
  handle: string | null
  status: 'belum' | 'terhubung' | 'gagal'
  note: string | null
  confirmed_at: string | null
}


export function ClientWorkspace({
  client, deliverables, packs = [], skillsByPack = {}, clientSkills = [],
    pipelineStages = [], pipelineSkills = [], haveFiles = [], providerId,
    allFiles = {}, provider = null, guardrails = [], groundTruths = [], channels = [],
    outputs = [],
}: {
  client: Client
  deliverables: Deliverable[]
  packs?: Pack[]
  skillsByPack?: Record<string, Skill[]>
  clientSkills?: ClientSkill[]
  pipelineStages?: {
    key: string; label: string; description: string | null; sort_order: number
    chain?: string | null; skill_order?: string[] | null; publishes?: boolean | null
  }[]
  pipelineSkills?: unknown[]
  haveFiles?: string[]
  providerId?: string
  allFiles?: Record<string, string>
  provider?: { id: string; name: string; model: string | null } | null
  guardrails?: { skill_id: string; kind: string; heading: string; body: string }[]
  groundTruths?: { source: string; rule: string }[]
  channels?: Channel[]
    outputs?: SkillOutput[]
  }) {
  const router = useRouter()
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [err, setErr] = useState<string | null>(null)
    const [resetOpen, setResetOpen] = useState(false)
    const [resetData, setResetData] = useState<{ email: string; password: string } | null>(null)
    const [resetLoading, setResetLoading] = useState(false)
    const [resetErr, setResetErr] = useState<string | null>(null)
    const [exporting, setExporting] = useState(false)
    const [revokeLoading, setRevokeLoading] = useState(false)
    const [revokeErr, setRevokeErr] = useState<string | null>(null)
    const [revokeDone, setRevokeDone] = useState(false)
    const fileCount = haveFiles.length

    const exportDeliverables = async () => {
      setExporting(true)
      try {
        const res = await fetch(`/api/admin/clients/${client.id}/export`)
        if (!res.ok) throw new Error('Gagal mengekspor')
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        const cd = res.headers.get('Content-Disposition') ?? ''
        const m = cd.match(/filename="([^"]+)"/)
        a.download = m ? m[1] : 'deliverable.md'
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      } catch {
        // no toast surface here; the button simply re-enables
      } finally {
        setExporting(false)
      }
    }

    const handleSave = async () => {
      setErr(null)
      setSaving(true)
      try {
        const res = await fetch(`/api/admin/clients/${client.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: client.name }),
        })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Gagal menyimpan')
        setSaved(true)
        router.refresh()
        setTimeout(() => setSaved(false), 2500)
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Terjadi kesalahan')
      } finally {
        setSaving(false)
      }
    }

    const handleResetPassword = async () => {
      setResetErr(null)
      setResetLoading(true)
      try {
        const res = await fetch(`/api/admin/clients/${client.id}/reset-password`, { method: 'POST' })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Gagal reset password')
        setResetData({ email: json.email, password: json.password })
      } catch (e) {
        setResetErr(e instanceof Error ? e.message : 'Terjadi kesalahan')
      } finally {
        setResetLoading(false)
      }
    }

    const handleRevokeSessions = async () => {
      setRevokeErr(null)
      setRevokeDone(false)
      setRevokeLoading(true)
      try {
        const res = await fetch(`/api/admin/clients/${client.id}/revoke-sessions`, { method: 'POST' })
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Gagal mencabut session')
        setRevokeDone(true)
      } catch (e) {
        setRevokeErr(e instanceof Error ? e.message : 'Terjadi kesalahan')
      } finally {
        setRevokeLoading(false)
      }
    }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/clients"
          className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground lg:min-h-0"
        >
          <ArrowLeftIcon className="size-3.5" /> Semua Client
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Building2Icon className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
              <p className="text-sm text-muted-foreground">
                {client.contact_email || 'Workspace client'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="gap-1.5">
                        <FileTextIcon className="size-3" />
                        {fileCount} file artifact
                      </Badge>
                      <Button variant="outline" className="h-11 lg:h-9" onClick={() => { setResetData(null); setResetErr(null); setResetOpen(true) }}>
                        <KeyRoundIcon className="size-4" /> Reset Password
                      </Button>
                      <Button variant="destructive" className="h-11 lg:h-9" onClick={handleRevokeSessions} disabled={revokeLoading}>
                        <LogOut className="size-4" /> {revokeLoading ? 'Memproses...' : 'Cabut Session'}
                      </Button>
                      <Button className="h-11 lg:h-9" onClick={handleSave} disabled={saving}>
                        {saved ? (
                          <><CheckCircle2Icon className="size-4" /> Tersimpan</>
                        ) : (
                          <><SaveIcon className="size-4" /> {saving ? 'Menyimpan...' : 'Simpan'}</>
                        )}
                      </Button>
                    </div>
        </div>
      </div>

      {err && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
          {err}
        </div>
      )}

      <Tabs defaultValue="setup">
        {/* On narrow screens five tabs cannot share the width without becoming unreadable and
            untappable, so the bar scrolls horizontally and each trigger keeps a 44px target.
            whitespace-nowrap + shrink-0 stops the labels from wrapping or squashing. */}
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="h-11 w-max lg:h-9 lg:w-fit">
            <TabsTrigger value="setup" className="h-10 shrink-0 px-3 whitespace-nowrap lg:h-8">Client Setup</TabsTrigger>
            <TabsTrigger value="trends" className="h-10 shrink-0 px-3 whitespace-nowrap lg:h-8 gap-1.5">
              <Flame className="size-4 text-orange-500" /> Radar Tren
            </TabsTrigger>
            <TabsTrigger value="production" className="h-10 shrink-0 px-3 whitespace-nowrap lg:h-8">
              Production Board
            </TabsTrigger>
            <TabsTrigger value="calendar" className="h-10 shrink-0 px-3 whitespace-nowrap lg:h-8">
              Content Calendar
            </TabsTrigger>
            <TabsTrigger value="analytics" className="h-10 shrink-0 px-3 whitespace-nowrap lg:h-8">
                          Analytics & Insight
                        </TabsTrigger>
                        <TabsTrigger value="feedback" className="h-10 shrink-0 px-3 whitespace-nowrap lg:h-8">
                          <MessageCircle className="size-4" /> Feedback
                        </TabsTrigger>
                        <TabsTrigger value="pipeline" className="h-10 shrink-0 px-3 whitespace-nowrap lg:h-8">
              <WorkflowIcon className="size-4" /> Pipeline
            </TabsTrigger>
            <TabsTrigger value="skills" className="h-10 shrink-0 px-3 whitespace-nowrap lg:h-8">
              <LayersIcon className="size-4" /> Skill ({clientSkills.length})
            </TabsTrigger>
            <TabsTrigger value="events" className="h-10 shrink-0 px-3 whitespace-nowrap lg:h-8">
              Event Workspace
            </TabsTrigger>
            <TabsTrigger value="budget" className="h-10 shrink-0 px-3 whitespace-nowrap lg:h-8">
              Budget Ledger
            </TabsTrigger>
            <TabsTrigger value="ads" className="h-10 shrink-0 px-3 whitespace-nowrap lg:h-8">
              Ads Tracker
            </TabsTrigger>
            <TabsTrigger value="roi" className="h-10 shrink-0 px-3 whitespace-nowrap lg:h-8">
              ROI Dashboard
            </TabsTrigger>
            <TabsTrigger value="deliverables" className="h-10 shrink-0 px-3 whitespace-nowrap lg:h-8">
              Deliverable ({deliverables.length})
            </TabsTrigger>
            <TabsTrigger value="assets" className="h-10 shrink-0 px-3 whitespace-nowrap lg:h-8">
              Brand Assets
            </TabsTrigger>
            <TabsTrigger value="hasil" className="h-10 shrink-0 px-3 whitespace-nowrap lg:h-8">
              <FileTextIcon className="size-4" /> Hasil ({outputs?.length ?? 0})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="setup" className="mt-4">
          <ClientSetup
            clientId={client.id}
            stages={pipelineStages}
            skills={pipelineSkills as {
              id: string; name: string; description: string | null; stage: string | null
              reads_files: string[] | null; writes_files: string[] | null
            }[]}
            clientSkills={clientSkills}
            files={allFiles ? Object.keys(allFiles) : []}
            provider={provider}
            guardrails={guardrails}
            groundTruths={groundTruths}
            channels={channels}
          />
        </TabsContent>

        <TabsContent value="trends" className="mt-4 space-y-4">
          <TrendJackBar
            clientId={client.id}
            clientName={client.name}
            onContentGenerated={() => router.refresh()}
          />
          <TrendRadarBoard
            clientId={client.id}
            clientName={client.name}
            onContentGenerated={() => router.refresh()}
          />
        </TabsContent>

        <TabsContent value="production" className="mt-4">
          <ContentProductionBoard clientId={client.id} />
        </TabsContent>

        <TabsContent value="calendar" className="mt-4">
          <OmniCalendarBoard clientId={client.id} />
        </TabsContent>

        <TabsContent value="analytics" className="mt-4">
                  <AnalyticsBoard clientId={client.id} />
                </TabsContent>

                <TabsContent value="feedback" className="mt-4">
                  <FeedbackBoard clientId={client.id} />
                </TabsContent>

                <TabsContent value="pipeline" className="mt-4">
          <PipelineBoard
            stages={pipelineStages}
            skills={pipelineSkills as never}
            haveFiles={haveFiles}
            statusBySkill={Object.fromEntries(clientSkills.map((c) => [c.skill_id, c.status]))}
            providerId={providerId}
          />
        </TabsContent>

        <TabsContent value="skills" className="mt-4">
          <ClientSkills
            clientId={client.id}
            packs={packs}
            skillsByPack={skillsByPack}
            clientSkills={clientSkills}
          />
        </TabsContent>

        <TabsContent value="events" className="mt-4">
          <EventWorkspaceBoard clientId={client.id} />
        </TabsContent>

        <TabsContent value="budget" className="mt-4">
          <BudgetLedgerBoard clientId={client.id} />
        </TabsContent>

        <TabsContent value="ads" className="mt-4">
          <AdsTrackerBoard clientId={client.id} />
        </TabsContent>

        <TabsContent value="roi" className="mt-4">
          <ROIDashboardBoard clientId={client.id} />
        </TabsContent>

        <TabsContent value="deliverables" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Deliverable Client Ini</CardTitle>
                <CardDescription>Klik untuk buka detail</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {deliverables.length > 0 && (
                  <Button size="sm" variant="outline" onClick={exportDeliverables} disabled={exporting} className="h-11 lg:h-8">
                    {exporting
                      ? <LoaderIcon className="size-4 animate-spin" />
                      : <DownloadIcon className="size-4" />}
                    Ekspor
                  </Button>
                )}
                <Link href="/admin/deliverables/new">
                  <Button size="sm" className="h-11 lg:h-8">
                    <PlusIcon className="size-4" /> Baru
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {deliverables.length === 0 ? (
                <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground">
                  <FileTextIcon className="size-8" />
                  <p className="text-sm">Belum ada deliverable untuk client ini.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {deliverables.map((d) => (
                    <Link
                      key={d.id}
                      href={`/admin/deliverables/${d.id}`}
                      className="-mx-2 flex items-center justify-between gap-4 rounded-md px-2 py-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">{d.title}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <TypeBadge type={d.type} />
                          <span className="text-xs text-muted-foreground">
                            {new Date(d.updated_at).toLocaleDateString('id-ID', {
                              day: 'numeric', month: 'short', year: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={d.status} />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assets" className="mt-4">
          <BrandAssetHub clientId={client.id} />
        </TabsContent>

        <TabsContent value="hasil" className="mt-4">
                                      <HasilTab outputs={outputs ?? []} onSent={() => router.refresh()} />
                                    </TabsContent>
                                  </Tabs>

                        <Dialog open={resetOpen} onOpenChange={(o) => { if (!o) setResetOpen(false) }}>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <KeyRoundIcon className="size-5 text-primary" /> Reset Password Client
                              </DialogTitle>
                              <DialogDescription>
                                Set password baru untuk akun login client. Password lama langsung tidak berlaku.
                              </DialogDescription>
                            </DialogHeader>

                            {resetData ? (
                              <div className="space-y-3 rounded-lg border bg-muted/40 p-4">
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Email</Label>
                                  <p className="font-mono text-sm">{resetData.email}</p>
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Password Baru</Label>
                                  <p className="font-mono text-sm">{resetData.password}</p>
                                </div>
                                <p className="text-xs text-amber-600">Simpan sekarang (hanya ditampilkan sekali).</p>
                              </div>
                            ) : (
                              <>
                                <p className="text-sm text-muted-foreground">
                                  Ini akan membuat password baru. Klien harus pakai password baru untuk login berikutnya.
                                </p>
                                {resetErr && <p className="text-sm text-destructive">{resetErr}</p>}
                              </>
                            )}

                            <DialogFooter className="gap-2">
                              <Button variant="outline" className="h-11 lg:h-8" onClick={() => setResetOpen(false)} disabled={resetLoading}>
                                Tutup
                              </Button>
                              {!resetData && (
                                <Button className="h-11 lg:h-8" onClick={handleResetPassword} disabled={resetLoading}>
                                  {resetLoading ? 'Memproses...' : 'Reset Sekarang'}
                                </Button>
                              )}
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>

                        <Dialog open={revokeDone} onOpenChange={(o) => { if (!o) setRevokeDone(false) }}>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <LogOut className="size-5 text-destructive" /> Session Dicabut
                              </DialogTitle>
                              <DialogDescription>
                                Semua session client ini telah di-invalidate. Client harus login ulang.
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button className="h-11 lg:h-8" onClick={() => setRevokeDone(false)}>
                                Tutup
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    )
                  }
