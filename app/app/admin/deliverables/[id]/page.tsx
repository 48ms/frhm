'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { StatusBadge, TypeBadge } from '@/components/deliverable/status-badge'
import { CommentSection } from '@/components/deliverable/comment-section'
import { Skeleton } from '@/components/ui/skeleton'
import {
  ArrowLeft, Send, Link as LinkIcon, Calendar, User, Clock,
  CheckCircle2, MessageSquare, Pencil, Trash2, Save, X, Rocket, AlertTriangle,
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

interface DeliverableDetail extends Deliverable {
  clients?: { name: string; contact_email: string | null } | null
}

export default function DeliverableDetailPage() {
  const router = useRouter()
  const params = useParams()
  const deliverableId = params.id as string

  const [deliverable, setDeliverable] = useState<DeliverableDetail | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmPublish, setConfirmPublish] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [publishMsg, setPublishMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [form, setForm] = useState({ title: '', content_md: '', external_link: '' })
  const supabase = createClient()

  const loadDeliverable = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('deliverables')
      .select(`*, clients!left (name, contact_email)`)
      .eq('id', deliverableId)
      .single()

    if (data) {
      const d = data as unknown as DeliverableDetail
      setDeliverable(d)
      setForm({
        title: d.title,
        content_md: d.content_md ?? '',
        external_link: d.external_link ?? '',
      })
    }

    const { data: commentsData } = await supabase
      .from('deliverable_comments')
      .select('id, content, created_at, author_name, author_role')
      .eq('deliverable_id', deliverableId)
      .order('created_at', { ascending: true })

    if (commentsData) setComments(commentsData as unknown as Comment[])
    setLoading(false)
  }, [deliverableId, supabase])

  useEffect(() => { loadDeliverable() }, [loadDeliverable])

  // Realtime: refresh comments when a new one arrives (T027)
  useEffect(() => {
    const channel = supabase
      .channel(`comments-${deliverableId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `deliverable_id=eq.${deliverableId}` },
        () => { loadDeliverable() }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [deliverableId, supabase, loadDeliverable])

  const handleSend = async () => {
    if (!deliverable || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/deliverables/${deliverableId}/send`, { method: 'POST' })
      if (res.ok) setDeliverable({ ...deliverable, status: 'sent' })
    } finally { setSending(false) }
  }

  const handlePublish = async () => {
    if (!deliverable || publishing) return
    setPublishing(true)
    setPublishMsg(null)
    try {
      const res = await fetch(`/api/admin/deliverables/${deliverableId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: true }),
      })
      const j = await res.json()
      if (!res.ok) {
        setPublishMsg({ ok: false, text: j.error || 'Gagal publish' })
      } else {
        setPublishMsg({
          ok: true,
          text: `Post terkirim ke bridge (postId: ${j.postId ?? '-'}). Status delivery di cek di bridge.`,
        })
        setConfirmPublish(false)
        loadDeliverable()
      }
    } catch {
      setPublishMsg({ ok: false, text: 'Gagal menghubungi server' })
    } finally {
      setPublishing(false)
    }
  }

  const handleSave = async () => {
    if (!deliverable || saving) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/deliverables/${deliverableId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (res.ok) {
        setDeliverable({ ...deliverable, ...form, status: json.data.status })
        setEditing(false)
      } else {
        alert(json.error || 'Gagal menyimpan')
      }
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    if (deleting) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/admin/deliverables/${deliverableId}`, { method: 'DELETE' })
      const json = await res.json()
      if (res.ok) {
        router.push('/admin/deliverables')
        router.refresh()
      } else {
        alert(json.error || 'Gagal menghapus')
      }
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const handleAddComment = async (content: string) => {
    const res = await fetch(`/api/admin/deliverables/${deliverableId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    })
    if (res.ok) {
      const json = await res.json()
      if (json.comment) setComments((c) => [...c, json.comment as unknown as Comment])
    }
  }

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <Skeleton className="mb-6 h-8 w-48" />
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
        <Button variant="outline" className="mt-4" onClick={() => router.push('/admin/deliverables')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Daftar
        </Button>
      </div>
    )
  }

  const canSend = deliverable.status === 'draft'
  const canDelete = deliverable.status === 'draft'

  return (
    <div className="mx-auto w-full max-w-4xl">
      <div className="mb-6">
        <Link
          href="/admin/deliverables"
          className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Kembali
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            {editing ? (
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="text-2xl font-bold"
                aria-label="Judul deliverable"
              />
            ) : (
              <h1 className="text-2xl font-bold tracking-tight">{deliverable.title}</h1>
            )}
            <div className="mt-2 flex items-center gap-3">
              <TypeBadge type={deliverable.type} />
              <StatusBadge status={deliverable.status} />
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            {editing ? (
              <>
                <Button variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                  <X className="h-4 w-4" /> Batal
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4" /> {saving ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setEditing(true)}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
                {canDelete && (
                  <Button variant="outline" onClick={() => setConfirmDelete(true)}>
                    <Trash2 className="h-4 w-4" /> Hapus
                  </Button>
                )}
                {canSend && (
                  <Button onClick={handleSend} disabled={sending}>
                    <Send className="h-4 w-4" /> {sending ? 'Mengirim...' : 'Kirim ke Client'}
                  </Button>
                )}
                {deliverable.status === 'approved' && (
                  <Button onClick={() => setConfirmPublish(true)} disabled={publishing}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <Rocket className="h-4 w-4" /> {publishing ? 'Publishing...' : 'Publish'}
                  </Button>
                )}
              </>
            )}
          </div>
        </div>

        {(deliverable.status === 'approved' || deliverable.status === 'revision_requested') && !editing && (
          <p className="mt-3 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            Editing deliverable ini akan mengembalikannya ke status <strong>Draft</strong>.
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Konten</CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <Textarea
                  value={form.content_md}
                  onChange={(e) => setForm({ ...form, content_md: e.target.value })}
                  className="min-h-[240px] font-mono text-sm"
                  placeholder="Isi konten (markdown)..."
                  aria-label="Isi konten markdown"
                />
              ) : deliverable.content_md ? (
                <pre className="whitespace-pre-wrap rounded-lg bg-muted p-4 font-mono text-sm">
                  {deliverable.content_md}
                </pre>
              ) : (
                <p className="italic text-muted-foreground">Tidak ada konten.</p>
              )}

              {editing ? (
                <div className="mt-4 space-y-2 border-t pt-4">
                  <Label htmlFor="external_link">Link Eksternal (opsional)</Label>
                  <Input
                    id="external_link"
                    value={form.external_link}
                    onChange={(e) => setForm({ ...form, external_link: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              ) : (
                deliverable.external_link && (
                  <div className="mt-4 border-t pt-4">
                    <a
                      href={deliverable.external_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                    >
                      <LinkIcon className="h-4 w-4" /> Buka Link Eksternal
                    </a>
                  </div>
                )
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
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Client</p>
                  <p className="font-medium">{deliverable.clients?.name || 'Belum ditentukan'}</p>
                  {deliverable.clients?.contact_email && (
                    <p className="text-xs text-muted-foreground">{deliverable.clients.contact_email}</p>
                  )}
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Dibuat</p>
                  <p className="font-medium">
                    {new Date(deliverable.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Terakhir diubah</p>
                  <p className="font-medium">
                    {new Date(deliverable.updated_at).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'long', year: 'numeric',
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
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  <span className="text-sm">Draft dibuat</span>
                </div>
                {deliverable.status !== 'draft' && (
                  <div className="flex items-center gap-2">
                    <Send className="h-4 w-4 text-primary" />
                    <span className="text-sm">Terkirim ke client</span>
                  </div>
                )}
                {deliverable.status === 'approved' && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-600">Disetujui</span>
                  </div>
                )}
                {deliverable.status === 'revision_requested' && (
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-600">Revisi diminta</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus deliverable?</DialogTitle>
            <DialogDescription>
              &ldquo;{deliverable.title}&rdquo; akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="h-11 lg:h-8" onClick={() => setConfirmDelete(false)} disabled={deleting}>
              Batal
            </Button>
            <Button variant="destructive" className="h-11 lg:h-8" onClick={handleDelete} disabled={deleting}>
              <Trash2 className="h-4 w-4" /> {deleting ? 'Menghapus...' : 'Hapus'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Publish confirmation dialog — structural gate (AGENTS.md ground truth 4). The admin sees
          exactly what will happen; the publish route refuses unless confirm: true is present. */}
      <Dialog open={confirmPublish} onOpenChange={(o) => { if (!o && !publishing) { setConfirmPublish(false); setPublishMsg(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-emerald-600" /> Publish deliverable?
            </DialogTitle>
            <DialogDescription>
              &ldquo;{deliverable.title}&rdquo; akan dipublikasikan ke semua akun social yang terhubung di bridge.
              Peringatan: ini akan tayang langsung dan tidak bisa dibatalkan dari sini.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
            <p className="flex items-start gap-2 font-medium text-amber-700 dark:text-amber-400">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Pastikan konten sudah benar
            </p>
            <p className="mt-1 text-xs text-amber-600/80">
              Publish tidak bisa dibatalkan dari dashboard. Hapus manual dari platform jika perlu.
            </p>
          </div>

          {publishMsg && (
            <p className={`text-sm ${publishMsg.ok ? 'text-green-600' : 'text-destructive'}`}>
              {publishMsg.text}
            </p>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" className="h-11 lg:h-8" onClick={() => { setConfirmPublish(false); setPublishMsg(null) }} disabled={publishing}>
              Batal
            </Button>
            <Button className="h-11 lg:h-8 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handlePublish} disabled={publishing}>
              <Rocket className="h-4 w-4" /> {publishing ? 'Publishing...' : 'Ya, Publish'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
