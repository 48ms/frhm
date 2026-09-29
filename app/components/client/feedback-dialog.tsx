'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog'
import { Icons } from '@/components/icons'

interface FeedbackDialogProps {
  clientId: string
}

export function FeedbackDialog({ clientId }: FeedbackDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!form.title.trim()) { setError('Judul wajib diisi'); return }
    if (form.rating < 1 || form.rating > 5) { setError('Rating 1-5'); return }

    setLoading(true)
    try {
      const res = await fetch(`/api/client/${clientId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal mengirim feedback')
      setOpen(false)
      setForm({ rating: 5, title: '', comment: '' })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Kirim Feedback</DialogTitle>
          <DialogDescription>Berikan rating & komentar untuk hasil kerja kami</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label>Rating *</Label>
            <div className="flex items-center gap-2" role="radiogroup" aria-label="Rating 1-5">
              {[1,2,3,4,5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={form.rating === n}
                  aria-label={`${n} dari 5 bintang`}
                  onClick={() => setForm({...form, rating: n})}
                  className={`flex size-11 sm:size-10 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 items-center justify-center rounded-md border-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 ${
                    form.rating === n ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30 hover:border-muted-foreground'
                  }`}
                >
                  <Icons.exclusive className="size-5 fill-current" />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-title">Judul *</Label>
            <Input
              id="feedback-title"
              value={form.title}
              onChange={e => setForm({...form, title: e.target.value})}
              placeholder="Contoh: Puas dengan hasil brief minggu ini"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-comment">Komentar (opsional)</Label>
            <Textarea
              id="feedback-comment"
              value={form.comment}
              onChange={e => setForm({...form, comment: e.target.value})}
              placeholder="Detail tambahan..."
              rows={3}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading} className="h-11 sm:h-9">
              <Icons.close className="size-4 mr-2" /> Batal
            </Button>
            <Button type="submit" disabled={loading} className="h-11 sm:h-9">
              {loading ? 'Mengirim...' : 'Kirim Feedback'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="h-11 sm:h-9 shrink-0">
            <Icons.chat className="size-4 mr-2" /> Kirim Feedback
          </Button>
        }
      />
    </Dialog>
  )
}