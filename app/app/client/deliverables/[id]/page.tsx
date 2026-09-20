'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { StatusBadge, TypeBadge } from '@/components/deliverable/status-badge'
import { CommentSection } from '@/components/deliverable/comment-section'
import { ApproveRevisionButtons } from '@/components/deliverable/approve-revision-buttons'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { 
  ArrowLeft, 
  Link as LinkIcon, 
  Calendar,
  Clock,
  CheckCircle2,
  MessageSquare,
  Download,
  Loader2
} from 'lucide-react'
import Link from 'next/link'
import type { Deliverable } from '@/lib/supabase/types'

interface Comment {
  id: string
  content: string
  created_at: string
  author_name: string
  author_role: 'admin' | 'client'
}

export default function ClientDeliverableDetailPage() {
  const params = useParams()
  const deliverableId = params.id as string
  
  const [deliverable, setDeliverable] = useState<Deliverable | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const supabase = createClient()

  const loadDeliverable = useCallback(async () => {
    setLoading(true)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    // deliverables.client_id references clients.id (not the auth user id) — resolve via users.client_id
    const { data: profile } = await supabase
      .from('users').select('client_id').eq('id', user.id).single()

    const { data, error } = await supabase
      .from('deliverables')
      .select('*')
      .eq('id', deliverableId)
      .eq('client_id', profile?.client_id ?? '')
      .single()

    if (!error && data) {
      setDeliverable(data as unknown as Deliverable)
    }
    
    const { data: commentsData } = await supabase
      .from('deliverable_comments')
      .select('id, content, created_at, author_name, author_role')
      .eq('deliverable_id', deliverableId)
      .order('created_at', { ascending: true })
    
    if (commentsData) {
      setComments(commentsData as unknown as Comment[])
    }
    
    setLoading(false)
  }, [deliverableId, supabase])

  useEffect(() => {
    loadDeliverable()
  }, [loadDeliverable])

  // Realtime: refresh comments when a new one arrives (T027)
  useEffect(() => {
    const channel = supabase
      .channel(`client-comments-${deliverableId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `deliverable_id=eq.${deliverableId}` },
        () => { loadDeliverable() }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [deliverableId, supabase, loadDeliverable])

  const handleApprove = async () => {
    const response = await fetch(`/api/client/deliverables/${deliverableId}/approve`, {
      method: 'POST',
    })
    
    if (response.ok && deliverable) {
      setDeliverable({ ...deliverable, status: 'approved' })
    }
  }

  const handleRevision = async (_deliverableId: string, reason: string) => {
    const response = await fetch(`/api/client/deliverables/${deliverableId}/revision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    })
    
    if (response.ok && deliverable) {
      setDeliverable({ ...deliverable, status: 'revision_requested' })
      loadDeliverable() // Reload to get new comment
    }
  }

  const handleAddComment = async (content: string) => {
    const res = await fetch(`/api/client/deliverables/${deliverableId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    if (res.ok) {
      const json = await res.json()
      if (json.comment) setComments([...comments, json.comment as unknown as Comment])
    }
  }

  async function downloadExport() {
    setDownloading(true)
    try {
      const res = await fetch(`/api/client/deliverables/${deliverableId}/export`)
      if (!res.ok) throw new Error('Gagal mengunduh')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const cd = res.headers.get('Content-Disposition') ?? ''
      const m = cd.match(/filename="([^"]+)"/)
      a.download = m ? m[1] : `${deliverable?.title ?? 'deliverable'}.md`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      // the page stays usable; surface via button state reset below
    } finally {
      setDownloading(false)
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    )
  }

  if (!deliverable) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <p className="text-muted-foreground">Deliverable tidak ditemukan.</p>
        <Link href="/client/deliverables" className="inline-flex items-center gap-2 text-sm text-primary hover:underline mt-4">
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar
        </Link>
      </div>
    )
  }

  const canAction = deliverable.status === 'sent'

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6">
        <Link href="/client/deliverables" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </Link>
        
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{deliverable.title}</h1>
            <div className="flex items-center gap-3 mt-2">
              <TypeBadge type={deliverable.type} />
              <StatusBadge status={deliverable.status} />
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={downloadExport} disabled={downloading}>
              {downloading
                ? <Loader2 className="size-4 animate-spin" />
                : <Download className="size-4" />}
              Unduh
            </Button>
            {canAction && deliverable.status === 'sent' && (
              <ApproveRevisionButtons
                deliverableId={deliverableId}
                currentStatus={deliverable.status as 'sent'}
                onApprove={handleApprove}
                onRequestRevision={handleRevision}
              />
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Konten</CardTitle>
            </CardHeader>
            <CardContent>
              {deliverable.content_md ? (
                <div className="prose prose-sm max-w-none">
                  <pre className="whitespace-pre-wrap font-mono text-sm bg-muted p-4 rounded-lg">
                    {deliverable.content_md}
                  </pre>
                </div>
              ) : (
                <p className="text-muted-foreground italic">Tidak ada konten.</p>
              )}
              
              {deliverable.external_link && (
                <div className="mt-4 pt-4 border-t">
                  <a
                    href={deliverable.external_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Buka Link Eksternal
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <CommentSection
                deliverableId={deliverableId}
                comments={comments}
                onAddComment={handleAddComment}
              />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Diterima pada</p>
                  <p className="font-medium">
                    {deliverable.sent_at 
                      ? new Date(deliverable.sent_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                        })
                      : '-'}
                  </p>
                </div>
              </div>
              
              <Separator />
              
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Terakhir diubah</p>
                  <p className="font-medium">
                    {new Date(deliverable.updated_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span className="text-sm">Terkirim dari tim</span>
                </div>
                {deliverable.status === 'approved' && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Disetujui oleh Anda</span>
                  </div>
                )}
                {deliverable.status === 'revision_requested' && (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-600">Revisi diminta</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}