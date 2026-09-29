'use client'

import { useState } from 'react'
import { useSuspenseQuery, useMutation } from '@tanstack/react-query'
import { Card, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/icons'
import { toast } from 'sonner'
import {
  clientFeedbackQueryOptions,
  createFeedbackMutation,
  invalidateFeedbackQueries,
} from '@/features/feedback/api/queries'
import type { CreateFeedbackPayload } from '@/features/feedback/api/types'

export function FeedbackBoard({ clientId }: { clientId: string }) {
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    rating: 5,
    title: '',
    comment: '',
    deliverable_id: '',
  })
  const [creating, setCreating] = useState(false)

  const { data: items = [] } = useSuspenseQuery(
    clientFeedbackQueryOptions(clientId)
  )

  const createMutation = useMutation(createFeedbackMutation)

  const stars = (n: number) => (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Icons.exclusive
          key={i}
          className={`size-4 ${
            i < n ? 'text-amber-500 fill-current' : 'text-muted-foreground'
          }`}
        />
      ))}
      <span className="text-xs text-muted-foreground ml-1">{n}/5</span>
    </div>
  )

  const statusBadge = (s: string) => {
    const cfg = {
      pending: {
        variant: 'default' as const,
        icon: Icons.alertCircle,
        label: 'Menunggu',
      },
      acknowledged: {
        variant: 'secondary' as const,
        icon: Icons.circleCheck,
        label: 'Dibaca',
      },
      resolved: {
        variant: 'outline' as const,
        icon: Icons.circleCheck,
        label: 'Selesai',
      },
    }
    const c = cfg[s as keyof typeof cfg] ?? cfg.pending
    return (
      <Badge variant={c.variant} className="gap-1">
        <c.icon className="size-3" />
        {c.label}
      </Badge>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setCreating(true)
    try {
      const payload: CreateFeedbackPayload = {
        rating: form.rating,
        title: form.title,
        comment: form.comment || undefined,
        deliverable_id: form.deliverable_id || undefined,
      }

      await createMutation.mutateAsync({
        clientId,
        payload,
      })

      invalidateFeedbackQueries(clientId)
      toast.success('Feedback terkirim')
      setShowForm(false)
      setForm({ rating: 5, title: '', comment: '', deliverable_id: '' })
    } catch (err: unknown) {
      toast.error((err instanceof Error ? err.message : null) || 'Gagal kirim feedback')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Icons.chat className="size-5 text-primary" />
          Feedback Client
        </CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowForm(!showForm)}
          className="h-11 sm:h-9"
        >
          {showForm ? 'Tutup Form' : 'Kirim Feedback Baru'}
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4 space-y-3">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs">Rating</Label>
                <div
                  className="flex gap-1.5"
                  role="radiogroup"
                  aria-label="Rating 1-5"
                >
                  {[...Array(5)].map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      role="radio"
                      aria-checked={form.rating === i + 1}
                      aria-label={`${i + 1} dari 5 bintang`}
                      onClick={() => setForm({ ...form, rating: i + 1 })}
                      className={`size-11 sm:size-8 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 rounded-lg border-2 transition-colors flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                        form.rating === i + 1
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-500'
                          : 'border-border hover:border-amber-300'
                      }`}
                    >
                      <Icons.exclusive className="size-4 sm:size-5" />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="title" className="text-xs">
                  Judul
                </Label>
                <input
                  id="title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="flex h-11 sm:h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="comment" className="text-xs">
                  Komentar (opsional)
                </Label>
                <Textarea
                  id="comment"
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                  className="min-h-[80px] text-sm"
                  placeholder="Tuliskan masukan, saran, atau keluhan di sini..."
                />
              </div>
              <Button
                type="submit"
                disabled={creating || createMutation.isPending}
                className="w-full h-11 sm:h-9"
              >
                {creating || createMutation.isPending
                  ? 'Mengirim...'
                  : 'Kirim Feedback'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {items.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Icons.chat className="size-10 mx-auto mb-2 opacity-50" />
              <p>Belum ada feedback dari client.</p>
            </CardContent>
          </Card>
        ) : (
          items.map((item) => (
            <Card key={item.id} className="border-border/50">
              <CardContent className="p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium">{item.title}</h4>
                      {stars(item.rating)}
                      {statusBadge(item.status)}
                    </div>
                    {item.comment && (
                      <p className="mt-2 text-sm text-muted-foreground prose prose-sm">
                        {item.comment}
                      </p>
                    )}
                  </div>
                  <div className="text-left sm:text-right text-xs text-muted-foreground sm:whitespace-nowrap shrink-0">
                    <p>
                      {new Date(item.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                    {item.responded_at && (
                      <p className="text-primary">
                        Direspons:{' '}
                        {new Date(item.responded_at).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}