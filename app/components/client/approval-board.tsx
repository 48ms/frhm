'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, X, Clock, XCircle, CheckCircle2 } from 'lucide-react'
import { PlatformIcon } from '@/components/calendar/calendar-view'
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
  initialPosts, clientId
}: {
  initialPosts: ApprovalPost[]
  clientId: string
}) {
  const [posts, setPosts] = useState<ApprovalPost[]>(initialPosts)
  const [isUpdating, setIsUpdating] = useState<string | null>(null)

  const pending = posts.filter(p => p.status === 'InReview')
  const approved = posts.filter(p => p.status === 'Approved')

  const handleApprove = async (postId: string) => {
    setIsUpdating(postId)
    try {
      await postApproval(postId, 'approve')
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, status: 'Approved' } : p))
      toast.success('Konten berhasil disetujui')
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
      toast.success('Konten dikembalikan ke Draft untuk revisi')
    } catch (err) {
      console.error(err)
      toast.error('Gagal meminta revisi')
    } finally {
      setIsUpdating(null)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Menunggu Persetujuan ({pending.length})</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Draf konten sosial media yang siap dipublikasikan. Silakan tinjau dan klik Approve.
        </p>
      </div>

      {pending.length === 0 ? (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Check className="size-12 mb-4 text-green-500/50" />
            <p>Hore! Tidak ada konten yang menunggu persetujuan Anda saat ini.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pending.map(post => (
            <Card key={post.id} className="flex flex-col h-full hover:border-primary/50 transition-colors">
              <CardHeader className="pb-3 border-b bg-muted/10">
                <div className="flex justify-between items-start">
                  <Badge variant="outline" className="flex items-center gap-1.5 font-medium">
                    {getPlatformIcon(post.platform)}
                    {post.platform}
                  </Badge>
                  <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                    <Clock className="size-3 mr-1" /> Menunggu
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-3">{post.asset.title}</CardTitle>
                <CardDescription className="text-xs">
                  {post.asset.campaign_name}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 py-4 space-y-4">
                {post.scheduled_at && (
                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded-md">
                    <span className="font-semibold block mb-1">Rencana Tayang:</span>
                    {format(parseISO(post.scheduled_at), 'EEEE, d MMMM yyyy HH:mm', { locale: id })}
                  </div>
                )}
                
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Visual Hook / Visual</span>
                  <p className="text-sm line-clamp-2">
                    {post.visual_hook || post.asset.description || 'Tidak ada keterangan visual.'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Caption / Copy</span>
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground line-clamp-4">
                    {post.body_content || 'Belum ada caption.'}
                  </p>
                </div>
              </CardContent>

              <CardFooter className="pt-4 border-t gap-2">
                <Button 
                  variant="outline" 
                  className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => handleReject(post.id)}
                  disabled={isUpdating === post.id}
                >
                  <XCircle className="size-4 mr-2" /> Revisi
                </Button>
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleApprove(post.id)}
                  disabled={isUpdating === post.id}
                >
                  <CheckCircle2 className="size-4 mr-2" /> Approve
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {approved.length > 0 && (
        <div className="pt-8">
          <h2 className="text-lg font-bold tracking-tight mb-4">Riwayat Disetujui ({approved.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {approved.map(post => (
              <Card key={post.id} className="opacity-75">
                <CardHeader className="py-3 px-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium flex items-center gap-1">
                      {getPlatformIcon(post.platform)} {post.platform}
                    </span>
                    <Badge variant="outline" className="text-[10px] text-green-600 border-green-200 bg-green-50">
                      Disetujui
                    </Badge>
                  </div>
                  <CardTitle className="text-sm mt-2 truncate">{post.asset.title}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
