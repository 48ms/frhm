'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge, TypeBadge } from '@/components/deliverable/status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { PageContainer } from '@/components/layout/page-container'
import { EmptyState, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty-state'
import { Icons } from '@/components/icons'
import type { Deliverable } from '@/lib/supabase/types'

interface DeliverableWithClient extends Deliverable {
  clients?: { name: string; contact_email: string | null } | null
}

const deliverablesInfoContent = {
  title: 'Panduan Deliverable',
  sections: [
    {
      title: 'Tinjau Dokumen & Materi',
      description:
        'Klik pada kartu deliverable untuk melihat detail draft tulisan, link dokumen eksternal, atau materi kreatif yang disiapkan tim.',
    },
    {
      title: 'Status & Diskusi',
      description:
        'Anda dapat memberikan komentar atau catatan revisi langsung pada masing-masing deliverable.',
    },
  ],
}

export default function ClientDeliverablesPage() {
  const searchParams = useSearchParams()
  const filter = (searchParams.get('status') || 'all') as
    | 'all' | 'draft' | 'sent' | 'approved' | 'revision_requested'

  const [deliverables, setDeliverables] = useState<DeliverableWithClient[]>([])
  const [commentCounts, setCommentCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const supabase = createClient()

  async function exportAll() {
    setExporting(true)
    try {
      const res = await fetch('/api/client/deliverables/export')
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
      // leaves the page usable; the button re-enables below
    } finally {
      setExporting(false)
    }
  }

  const loadDeliverables = useCallback(async () => {
    setLoading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // the profile row holds client_id; the auth uid is NOT the client id
    const { data: profile } = await supabase
      .from('users').select('client_id').eq('id', user.id).single()
    const clientId = profile?.client_id
    if (!clientId) { setDeliverables([]); setLoading(false); return }

    const query = supabase
      .from('deliverables')
      .select(`*, clients!left(name, contact_email)`)
      .eq('client_id', clientId)

    if (filter !== 'all') query.eq('status', filter)
    query.order('updated_at', { ascending: false })

    const { data, error } = await query
    const rows = (!error && data ? (data as unknown as DeliverableWithClient[]) : [])
    setDeliverables(rows)

    if (rows.length > 0) {
      const { data: cs } = await supabase
        .from('comments').select('deliverable_id').in('deliverable_id', rows.map((r) => r.id))
      const counts: Record<string, number> = {}
      for (const c of cs ?? []) counts[c.deliverable_id] = (counts[c.deliverable_id] ?? 0) + 1
      setCommentCounts(counts)
    } else {
      setCommentCounts({})
    }
    setLoading(false)
  }, [filter, supabase])

  useEffect(() => { loadDeliverables() }, [loadDeliverables])

  return (
    <PageContainer
      pageTitle="Deliverable Saya"
      pageDescription="Semua deliverable dari tim Frhm untuk Anda review dan evaluasi."
      infoContent={deliverablesInfoContent}
      pageHeaderAction={
        deliverables.length > 0 ? (
          <Button
            variant="outline"
            size="sm"
            onClick={exportAll}
            disabled={exporting}
            isLoading={exporting}
            className="h-10 sm:h-9"
          >
            {!exporting && <Icons.download className="mr-2 size-4" />}
            Ekspor Semua
          </Button>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                <CardContent>
                  <Skeleton className="mb-2 h-4 w-1/2" />
                  <Skeleton className="h-4 w-1/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : deliverables.length === 0 ? (
          <EmptyState className="my-8">
            <EmptyMedia variant="icon">
              <Icons.post className="size-6 text-muted-foreground" />
            </EmptyMedia>
            <EmptyTitle>Belum ada deliverable</EmptyTitle>
            <EmptyDescription>
              Deliverable dari tim Frhm akan muncul di sini segera setelah dikirim untuk review.
            </EmptyDescription>
          </EmptyState>
        ) : (
          <div className="space-y-4">
            {deliverables.map((d) => (
              <Link key={d.id} href={`/client/deliverables/${d.id}`} className="block">
                <Card className="transition-colors hover:bg-muted/50">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle className="flex flex-wrap items-center gap-2 text-lg">
                          {d.title}
                          <TypeBadge type={d.type} />
                        </CardTitle>
                        <CardDescription className="mt-1">
                          Diperbarui{' '}
                          {new Date(d.updated_at).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </CardDescription>
                      </div>
                      <StatusBadge status={d.status} />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {d.content_md && (
                      <p className="line-clamp-3 font-mono text-sm text-muted-foreground">{d.content_md}</p>
                    )}
                    {d.external_link && (
                      <a
                        href={d.external_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex min-h-11 items-center gap-2 text-sm text-primary hover:underline lg:min-h-0"
                      >
                        <Icons.externalLink className="size-4" />
                        Buka link
                      </a>
                    )}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      {(commentCounts[d.id] ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Icons.chat className="size-3.5" />
                          {commentCounts[d.id]} komentar
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-primary">
                        Lihat detail <Icons.arrowRight className="size-3.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  )
}
