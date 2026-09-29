'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Icons } from '@/components/icons'
import { ClientSkills } from './skills'
import { ChannelsPanel } from './channels-panel'
import { ClientReminderSettings } from '@/components/production/client-reminder-settings'
import { ProductionCalendarBoard } from '@/components/production/production-calendar-board'
import { ContentProductionBoard } from '@/components/production/content-production-board'
import { WorkspaceGuidanceBanner } from '@/components/client/workspace-guidance-banner'
import { EmptyState, EmptyMedia, EmptyTitle, EmptyDescription, EmptyHeader, EmptyContent } from '@/components/ui/empty'

export function ClientWorkspace({
  client, deliverables, packs = [], skillsByPack = {}, clientSkills = [],
  pipelineStages = [], pipelineSkills = [], haveFiles = [], providerId,
  allFiles = {}, provider = null, guardrails = [], groundTruths = [], channels = [],
  outputs = [], initialSkill = null,
}: {
  client: {
    id: string
    name: string
    contact_email: string | null
    contact_phone: string | null
    brand_profile: Record<string, unknown>
    created_at: string
  }
  deliverables: {
    id: string
    title: string
    type: 'brief' | 'content' | 'report'
    status: 'draft' | 'sent' | 'approved' | 'revision_requested'
    updated_at: string
  }[]
  packs?: { id: string; name: string; description: string | null; icon: string | null; skill_count: number }[]
  skillsByPack?: Record<string, { id: string; name: string; description: string | null; category: string | null }[]>
  clientSkills?: { skill_id: string; status: 'belum' | 'jalan' | 'selesai'; notes: string | null }[]
  pipelineStages?: { key: string; label: string; description: string | null; sort_order: number; chain?: string | null; skill_order?: string[] | null; publishes?: boolean | null }[]
  pipelineSkills?: { id: string; name: string; description: string | null; stage: string | null; reads_files: string[] | null; writes_files: string[] | null }[]
  haveFiles?: string[]
  providerId?: string
  allFiles?: Record<string, { content: string; lastModified: string }[]>
  provider?: { id: string; name: string; model: string | null } | null
  guardrails?: { skill_id: string; kind: string; heading: string; body: string }[]
  groundTruths?: { source: string; rule: string }[]
  channels?: { platform: string; handle: string | null; status: 'belum' | 'terhubung' | 'gagal'; note: string | null; confirmed_at: string | null }[]
  outputs?: { id: string; client_id: string; skill_id: string; stage: string; title: string; status: string; content: string; deliverable_id: string | null; created_at: string }[]
  /** When set, the Skills tab opens with this skill's interview already running (onboarding handoff). */
  initialSkill?: string | null
}) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [channelsLocal, setChannelsLocal] = useState(channels)
  const [securityBusy, setSecurityBusy] = useState<'reset' | 'revoke' | null>(null)
  const [revealedPassword, setRevealedPassword] = useState<string | null>(null)
  // Onboarding handoff: when a foundation skill is requested (e.g. right after client creation),
  // land the admin on the Skills tab so the interview starts without hunting through the UI.
  const [tab, setTab] = useState(initialSkill ? 'skills' : 'overview')

  useEffect(() => {
    setChannelsLocal(channels)
  }, [channels])

  const handleSave = async () => {
    setSaving(true)
    try {
      // TODO: implement actual save logic to API
      await new Promise((resolve) => setTimeout(resolve, 500))
      setSaved(true)
      toast.success('Perubahan tersimpan')
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    if (confirm('Reset semua data client ke kondisi awal? Data tidak dapat dikembalikan.')) {
      // TODO: implement actual reset logic
      toast.info('Reset belum diimplementasikan')
    }
  }

  const fileCount = Object.keys(allFiles || {}).length

  const hasBrandProfile = haveFiles?.includes('brand-profile.md') || false
  const hasVoice = haveFiles?.includes('voice.md') || false
  const hasContentPillars = haveFiles?.includes('content-pillars.md') || false

  const handleBannerAction = (skillId: string) => {
    setTab('skills')
    window.dispatchEvent(new CustomEvent('skills:launch', { detail: { skillId } }))
  }

  return (
    <div className="flex flex-col gap-6 mt-4">
      {/* Guidance Banner */}
      <WorkspaceGuidanceBanner 
        hasBrandProfile={hasBrandProfile}
        hasVoice={hasVoice}
        hasContentPillars={hasContentPillars}
        onAction={handleBannerAction}
      />

      {/* Header */}
      <div>
        <Link
          href="/admin/clients"
          className="mb-3 inline-flex min-h-11 items-center gap-1 text-sm text-muted-foreground hover:text-foreground lg:min-h-0"
        >
          <Icons.chevronLeft className="size-3.5" /> Semua Client
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icons.building2 className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{client.name}</h1>
              <p className="text-sm text-muted-foreground">
                {client.contact_email || 'Workspace client'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {fileCount > 0 && (
              <Badge variant="outline" className="gap-1.5">
                <Icons.fileText className="size-3" />
                {fileCount} file artifact
              </Badge>
            )}
            <Button
              variant="outline"
              className="h-11 lg:h-9"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? (
                <Icons.spinner className="size-4 animate-spin" />
              ) : saved ? (
                <>
                  <Icons.check className="size-4" /> Tersimpan
                </>
              ) : (
                <>
                  <Icons.save className="size-4" /> Simpan
                </>
              )}
            </Button>
            <Button
              variant="destructive"
              className="h-11 lg:h-9"
              onClick={handleReset}
            >
              <Icons.refresh className="size-4" /> Reset Data
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="h-11 w-max lg:h-9 lg:w-fit">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="deliverables">Deliverables</TabsTrigger>
            <TabsTrigger value="skills">Skills</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </div>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Content</CardDescription>
                <CardTitle className="text-2xl">{deliverables.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  {deliverables.filter((d) => d.status === 'approved').length} approved
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Deliverables</CardDescription>
                <CardTitle className="text-2xl">{deliverables.length}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  {deliverables.filter((d) => d.status === 'sent').length} sent
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Active Skills</CardDescription>
                <CardTitle className="text-2xl">
                  {clientSkills.filter((s) => s.status === 'jalan').length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  {clientSkills.length} total skills
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Connected Channels</CardDescription>
                <CardTitle className="text-2xl">
                  {channelsLocal.filter((c) => c.status === 'terhubung').length}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground">
                  {channelsLocal.length} configured
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="mt-4">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Content Calendar</CardTitle>
                <CardDescription>
                  Schedule, plan, and manage your content across platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductionCalendarBoard clientId={client.id} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Production Board</CardTitle>
                <CardDescription>
                  Track content production progress through stages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ContentProductionBoard clientId={client.id} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Deliverables Tab — output/approval surface. Rows link to the deliverable detail page. */}
        <TabsContent value="deliverables" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1.5">
                  <CardTitle>Deliverables</CardTitle>
                  <CardDescription>
                    Brief, konten, dan laporan yang diserahkan ke klien
                  </CardDescription>
                </div>
                <Button
                  size="sm"
                  className="h-11 shrink-0 lg:h-9"
                  onClick={() => router.push(`/admin/deliverables/new?client=${client.id}`)}
                >
                  <Icons.add className="size-4" />
                  Buat Deliverable
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {deliverables.length === 0 ? (
                <EmptyState>
                  <EmptyMedia variant="icon">
                    <Icons.fileText />
                  </EmptyMedia>
                  <EmptyHeader>
                    <EmptyTitle>Belum ada deliverables</EmptyTitle>
                    <EmptyDescription>
                      Deliverable adalah output yang diserahkan ke klien. Buat dari brief,
                      atau jalankan skill di tab Skills agar hasilnya otomatis tersimpan di sini.
                    </EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button
                      size="sm"
                      onClick={() => router.push(`/admin/deliverables/new?client=${client.id}`)}
                    >
                      <Icons.add className="size-4" />
                      Buat Deliverable
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setTab('skills')}>
                      <Icons.sparkles className="size-4" />
                      Jalankan Skill
                    </Button>
                  </EmptyContent>
                </EmptyState>
              ) : (
                <div className="space-y-2">
                  {deliverables.map((d) => (
                    <Link
                      key={d.id}
                      href={`/admin/deliverables/${d.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Icons.fileText className="size-5 shrink-0 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate font-medium">{d.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {d.type} • {d.updated_at}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge
                          variant={
                            d.status === 'approved'
                              ? 'default'
                              : d.status === 'sent'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {d.status}
                        </Badge>
                        <Icons.chevronRight className="size-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Skills Tab — the interactive interview lives here (repo: "the agent interviews you") */}
        <TabsContent value="skills" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
              <CardDescription>
                Jalankan skill satu per satu lewat wawancara AI. Mulai dari fondasi: brand-profile
                dulu, baru voice, lalu sisanya.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ClientSkills
                clientId={client.id}
                packs={packs}
                skillsByPack={skillsByPack}
                clientSkills={clientSkills}
                initialSkill={initialSkill}
                stages={pipelineStages}
                pipelineSkills={pipelineSkills as {
                  id: string
                  name: string
                  description: string | null
                  stage: string | null
                }[]}
                files={haveFiles}
                provider={provider}
                connectedChannels={channels.filter((c) => c.status === 'terhubung').length}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab — configuration only: contact, channel, notifications, access. Skill work lives in Skills. */}
        <TabsContent value="settings" className="mt-4">
          <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Channel publish */}
              <ChannelsPanel clientId={client.id} channels={channelsLocal} />

              {/* Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Icons.bell className="size-4" />
                    Pengaturan Notifikasi
                  </CardTitle>
                  <CardDescription>
                    Atur jadwal pengingat untuk postingan yang akan tayang
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ClientReminderSettings clientId={client.id} embedded />
                </CardContent>
              </Card>
            </div>

            {/* Security & Access */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Icons.shield className="size-4" />
                  Keamanan & Akses
                </CardTitle>
                <CardDescription>
                  Kelola akses login dan sesi klien. Tercatat di audit log.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="divide-y">
                  <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">Reset Password</p>
                      <p className="text-xs text-muted-foreground">
                        Buat password baru untuk akun login klien. Password baru hanya ditampilkan sekali.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0"
                      disabled={securityBusy === 'reset'}
                      onClick={async () => {
                        if (!confirm('Reset password akun login klien? Password lama langsung tidak berlaku.')) return
                        setSecurityBusy('reset')
                        try {
                          const res = await fetch(`/api/admin/clients/${client.id}/reset-password`, { method: 'POST' })
                          const data = await res.json()
                          if (!res.ok) throw new Error(data.error || 'Gagal reset password')
                          setRevealedPassword(data.password)
                          toast.success(`Password baru dibuat untuk ${data.email ?? 'akun klien'}. Salin sekarang — tidak ditampilkan lagi.`)
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Gagal reset password')
                        } finally {
                          setSecurityBusy(null)
                        }
                      }}
                    >
                      {securityBusy === 'reset' ? (
                        <Icons.spinner className="size-4 animate-spin" />
                      ) : (
                        <Icons.key className="size-4" />
                      )}
                      Reset Password
                    </Button>
                  </div>

                  <div className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">Cabut Semua Sesi</p>
                      <p className="text-xs text-muted-foreground">
                        Logout paksa dari semua perangkat. Klien harus login ulang dengan password terbaru.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="shrink-0"
                      disabled={securityBusy === 'revoke'}
                      onClick={async () => {
                        if (!confirm('Cabut semua sesi klien? Mereka akan logout dari semua perangkat.')) return
                        setSecurityBusy('revoke')
                        try {
                          const res = await fetch(`/api/admin/clients/${client.id}/revoke-sessions`, { method: 'POST' })
                          const data = await res.json()
                          if (!res.ok) throw new Error(data.error || 'Gagal mencabut sesi')
                          toast.success(data.message || 'Semua sesi berhasil dicabut')
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : 'Gagal mencabut sesi')
                        } finally {
                          setSecurityBusy(null)
                        }
                      }}
                    >
                      {securityBusy === 'revoke' ? (
                        <Icons.spinner className="size-4 animate-spin" />
                      ) : (
                        <Icons.logout className="size-4" />
                      )}
                      Cabut Sesi
                    </Button>
                  </div>
                </div>

                {revealedPassword && (
                  <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <Icons.warning className="size-4" />
                      <p className="text-sm font-medium">Password sementara</p>
                    </div>
                    <p className="mt-2 font-mono text-lg font-bold tracking-wide">{revealedPassword}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Salin sekarang. Frhm tidak menyimpan password ini dan tidak bisa menampilkannya lagi.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => {
                        void navigator.clipboard.writeText(revealedPassword)
                        toast.success('Password disalin')
                      }}
                    >
                      <Icons.copy className="size-4" />
                      Salin
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Integrations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Icons.send className="size-4" />
                  Integrasi Telegram
                </CardTitle>
                <CardDescription>
                  Hubungkan Telegram untuk notifikasi real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <p className="font-medium">Notifikasi via Telegram</p>
                    <p className="text-xs text-muted-foreground">
                      Terima notifikasi instan saat materi konten siap direview
                    </p>
                  </div>
                  <Link
                    href="/admin/settings/telegram"
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <Icons.send className="size-4" />
                    Kelola Telegram
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
