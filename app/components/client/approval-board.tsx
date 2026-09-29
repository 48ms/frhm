'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EmptyState, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Icons } from '@/components/icons'
import { PlatformIcon } from '@/components/calendar/platform-icon'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { id } from 'date-fns/locale'

async function postApproval(postId: string, action: 'approve' | 'reject') {
  const res = await fetch('/api/client/approvals', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: postId, action }),
  })
  if (!res.ok) throw new Error('Action failed')
}

export type ApprovalPost = {
  id: string
  platform: string
  format: string
  scheduled_at: string
  status: string
  body_content: string | null
  visual_hook: string | null
  call_to_action: string | null
  asset: {
    title: string
    description: string | null
    campaign_name: string
  }
}

function getPlatformIcon(platform: string) {
  return <PlatformIcon platform={platform} className="size-4" />
}

export function ApprovalBoard({
  initialPosts,
}: {
  initialPosts: ApprovalPost[]
  clientId?: string
}) {
  const [posts, setPosts] = useState<ApprovalPost[]>(initialPosts)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const pending = posts.filter(p => p.status === 'InReview')
  const approved = posts.filter(p => p.status === 'Approved')

  const handleCopyCaption = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      toast.success('Caption berhasil disalin ke clipboard')
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('Gagal menyalin teks')
    }
  }

  const handleApprove = async (postId: string) => {
    setIsUpdating(postId)
    try {
      await postApproval(postId, 'approve')
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'Approved' } : p))
      toast.success('Konten berhasil disetujui untuk dipublikasikan!')
    } catch (err) {
      console.error(err)
      toast.error('Gagal menyetujui konten')
    } finally {
      setIsUpdating(null)
    }
  }

  const handleReject = async (postId: string) => {
    setIsUpdating(postId)
    try {
      await postApproval(postId, 'reject')
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'Draft' } : p))
      toast.success('Konten dikembalikan ke tim produksi untuk direvisi')
    } catch (err) {
      console.error(err)
      toast.error('Gagal meminta revisi')
    } finally {
      setIsUpdating(null)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header section with clear count */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Pusat Persetujuan Konten</h1>
            {pending.length > 0 && (
              <Badge variant="outline" className="bg-warning/15 text-warning-foreground border-warning/40 font-semibold text-xs">
                {pending.length} Menunggu
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Tinjau draf materi konten yang siap tayang untuk brand kamu. Klik tombol hijau untuk menyetujui.
          </p>
        </div>
      </div>

      {pending.length === 0 ? (
        <EmptyState className="border-dashed bg-card/40 py-16">
          <EmptyMedia variant="icon" className="bg-success/15 text-success">
            <Icons.check className="size-6" />
          </EmptyMedia>
          <EmptyTitle>Semua Beres!</EmptyTitle>
          <EmptyDescription className="max-w-md">
            Tidak ada konten yang menunggu persetujuan Anda saat ini. Seluruh materi kampanye telah disetujui atau sedang disiapkan oleh tim produksi.
          </EmptyDescription>
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pending.map(post => (
            <Card
              key={post.id}
              className="flex flex-col h-full bg-card border-border/80 shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-200"
            >
              {/* Card Header with Badges */}
              <CardHeader className="pb-3 border-b bg-muted/20 space-y-2">
                <div className="flex justify-between items-center">
                  <Badge variant="outline" className="flex items-center gap-1.5 text-xs font-medium py-1 px-2.5">
                    {getPlatformIcon(post.platform)}
                    <span>{post.platform}</span>
                    <span className="text-muted-foreground/60">•</span>
                    <span className="text-muted-foreground capitalize">{post.format}</span>
                  </Badge>
                  <Badge variant="outline" className="bg-warning/15 text-warning-foreground border-warning/40 text-[11px] font-medium">
                    <Icons.clock className="size-3 mr-1 text-warning" /> Menunggu Review
                  </Badge>
                </div>
                <div>
                  <CardTitle className="text-base font-semibold line-clamp-1 leading-snug">{post.asset.title}</CardTitle>
                  <CardDescription className="text-xs truncate text-muted-foreground mt-0.5">
                    Campaign: {post.asset.campaign_name}
                  </CardDescription>
                </div>
              </CardHeader>

              {/* Card Body */}
              <CardContent className="flex-1 py-4 space-y-4 text-sm">
                {post.scheduled_at && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/60 px-3 py-2 rounded-lg border border-border/40">
                    <Icons.calendar className="size-3.5 text-primary shrink-0" />
                    <div>
                      <span className="font-medium text-foreground">Jadwal Tayang: </span>
                      {format(parseISO(post.scheduled_at), 'EEEE, d MMMM yyyy HH:mm', { locale: id })}
                    </div>
                  </div>
                )}

                {/* Visual Hook */}
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    <Icons.sparkles className="size-3 text-primary" />
                    <span>Visual Hook / Konsep Visual</span>
                  </div>
                  <p className="text-xs text-foreground/90 bg-muted/30 p-2.5 rounded-md border border-border/30 line-clamp-2 leading-relaxed">
                    {post.visual_hook || post.asset.description || 'Tidak ada catatan visual khusus.'}
                  </p>
                </div>

                {/* Caption / Copy with Quick Copy action */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Caption / Copywriting
                    </span>
                    {post.body_content && (
                      <Button
                        variant="ghost"
                        size="xs"
                        className="h-6 text-[11px] text-muted-foreground hover:text-foreground gap-1 px-1.5"
                        onClick={() => handleCopyCaption(post.id, post.body_content || '')}
                      >
                        {copiedId === post.id ? (
                          <>
                            <Icons.checks className="size-3 text-success" />
                            <span>Tersalin</span>
                          </>
                        ) : (
                          <>
                            <Icons.copy className="size-3" />
                            <span>Salin</span>
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-4 bg-muted/20 p-2.5 rounded-md border border-border/30 leading-relaxed font-mono text-[11.5px]">
                    {post.body_content || 'Belum ada draf caption.'}
                  </p>
                </div>
              </CardContent>

              {/* Action Area: Clear Single Primary Action + Secondary Destructive */}
              <CardFooter className="pt-3 pb-3 border-t bg-muted/10 flex items-center gap-2">
                <Button
                  variant="destructive-outline"
                  size="sm"
                  className="h-10 sm:h-9 px-3.5 font-medium text-xs hover:border-destructive/60"
                  onClick={() => handleReject(post.id)}
                  disabled={!!isUpdating}
                >
                  <Icons.xCircle className="size-4 mr-1.5" />
                  Minta Revisi
                </Button>
                <Button
                  variant="success"
                  size="sm"
                  className="h-10 sm:h-9 flex-1 font-semibold text-xs gap-1.5"
                  onClick={() => handleApprove(post.id)}
                  isLoading={isUpdating === post.id}
                  disabled={!!isUpdating}
                >
                  <Icons.circleCheck className="size-4" />
                  Setujui Konten
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* History of Approved Items */}
      {approved.length > 0 && (
        <div className="pt-8 border-t">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold tracking-tight">Riwayat Disetujui ({approved.length})</h2>
            <Badge variant="outline" className="bg-success/10 text-success border-success/30 text-xs">
              Sudah Tayang / Siap Tayang
            </Badge>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {approved.map(post => (
              <Card key={post.id} className="bg-card/70 border-border/60 hover:bg-card transition-colors">
                <CardHeader className="py-3 px-4 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium flex items-center gap-1.5 text-muted-foreground">
                      {getPlatformIcon(post.platform)}
                      <span>{post.platform}</span>
                    </span>
                    <Badge variant="outline" className="text-[10px] text-success border-success/30 bg-success/10 py-0 h-4.5 font-medium">
                      Disetujui
                    </Badge>
                  </div>
                  <CardTitle className="text-xs font-medium truncate mt-1 text-foreground">{post.asset.title}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
