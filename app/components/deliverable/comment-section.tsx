'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { MessageSquare, Send } from 'lucide-react'

interface Comment {
  id: string
  content: string
  created_at: string
  author_name: string
  author_role: 'admin' | 'client'
}

interface CommentSectionProps {
  deliverableId: string
  comments: Comment[]
  onAddComment: (content: string) => Promise<void>
}

export function CommentSection({ comments, onAddComment }: CommentSectionProps) {
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim() || submitting) return

    setSubmitting(true)
    try {
      await onAddComment(content.trim())
      setContent('')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 font-semibold text-lg">
        <MessageSquare className="w-5 h-5 text-muted-foreground" />
        <h2>Diskusi & Feedback ({comments.length})</h2>
      </div>

      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-4 text-center border rounded-lg bg-muted/30">
            Belum ada komentar. Tulis komentar pertama di bawah.
          </p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className={`p-4 rounded-lg border space-y-2 ${
                comment.author_role === 'admin'
                  ? 'bg-primary/5 border-primary/20 ml-4'
                  : 'bg-muted/50 border-border mr-4'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs uppercase">
                      {comment.author_name.slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{comment.author_name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                      comment.author_role === 'admin'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground'
                    }`}
                  >
                    {comment.author_role}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(comment.created_at).toLocaleString('id-ID', {
                    dateStyle: 'short',
                    timeStyle: 'short',
                  })}
                </span>
              </div>
              <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 pt-2">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Tulis komentar atau instruksi revisi..."
          aria-label="Tulis komentar atau instruksi revisi"
          className="min-h-[100px] text-sm"
        />
        <div className="flex justify-end">
          <Button type="submit" disabled={submitting || !content.trim()} size="sm" className="h-11 w-full gap-2 lg:h-9 lg:w-auto">
            <Send className="w-4 h-4" />
            {submitting ? 'Mengirim...' : 'Kirim Komentar'}
          </Button>
        </div>
      </form>
    </div>
  )
}