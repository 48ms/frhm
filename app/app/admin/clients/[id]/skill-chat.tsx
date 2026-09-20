'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { LoaderIcon, SendIcon, SparklesIcon, FileTextIcon, CheckIcon } from 'lucide-react'
import { Markdown } from '@/components/markdown'

type Msg = { role: 'user' | 'assistant'; content: string }
type SkillRef = { id: string; name: string; description: string | null }

/**
 * The interactive skill runner, generic across all 106 skills: the AI follows the skill's own
 * SKILL.md, reads the client's existing workspace files, and (when the skill produces an
 * artifact) returns it for the admin to save into the client folder.
 */
export function SkillChat({
  clientId,
  skill,
  providerId,
  onClose,
  onSaved,
}: {
  clientId: string
  skill: SkillRef | null
  providerId?: string
  onClose: () => void
  onSaved?: () => void
}) {
  const router = useRouter()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const [file, setFile] = useState<{ path: string; content: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState(false)
  // Non-Foundation skills return a titled work result instead of a workspace file. It is stored in
  // skill_outputs, which is what the Hasil tab lists.
  const [output, setOutput] = useState<{ title: string; content: string } | null>(null)
  const [outSaving, setOutSaving] = useState(false)
  const [outSaved, setOutSaved] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const started = useRef<string | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, busy])

  useEffect(() => {
    if (!skill || started.current === skill.id) return
    started.current = skill.id
    setMessages([])
    setFile(null)
    setSaved(false)
    setOutput(null)
    setOutSaved(false)
    send([
      {
        role: 'user',
        content:
          'Mulai sesi untuk klien ini. Ikuti aturan skill: kalau artifact-nya sudah ada, cukup ' +
          'ringkas dan tawarkan perubahan; kalau belum, mulai langkah pertama.',
      },
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [skill])

  async function send(next: Msg[]) {
    setBusy(true)
    setErr('')
    setMessages(next)
    try {
      const r = await fetch('/api/admin/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          skill_id: skill?.id,
          provider_id: providerId,
          messages: next,
        }),
      })
      const j = await r.json()
      if (!r.ok) {
        setErr(j.error || 'Gagal memanggil AI')
        setBusy(false)
        return
      }
      setMessages([...next, { role: 'assistant', content: j.reply || '(tidak ada balasan)' }])
      if (j.file?.content) setFile(j.file)
      if (j.output?.content) setOutput({ title: j.output.title ?? skill?.id ?? 'output', content: j.output.content })
    } catch {
      setErr('Gagal menghubungi server')
    }
    setBusy(false)
  }

  function reply() {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    send([...messages, { role: 'user', content: text }])
  }

  async function saveOutput() {
    if (!output) return
    setOutSaving(true)
    const r = await fetch(`/api/admin/clients/${clientId}/outputs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        skill_id: skill?.id,
        title: output.title,
        content: output.content,
      }),
    })
    const j = await r.json()
    setOutSaving(false)
    if (!r.ok) {
      setErr(j.error || 'Gagal menyimpan hasil')
      return
    }
    setOutSaved(true)
  }

  async function saveFile() {
    if (!file) return
    setSaving(true)
    const r = await fetch(`/api/admin/clients/${clientId}/files`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ path: file.path, content: file.content }),
    })
    const j = await r.json()
    setSaving(false)
    if (!r.ok) {
      setErr(j.error || 'Gagal menyimpan')
      return
    }
    setSaved(true)
    onSaved?.()
    router.refresh()
  }

  if (!skill) return null

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="flex h-[85vh] flex-col sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {/* SparklesIcon = AI-powered skill (per R-04 Part 1 exception: AI features may use SparklesIcon with written justification) */}
            <SparklesIcon className="size-4" /> {skill.name}
          </DialogTitle>
          <DialogDescription>
            AI mengikuti panduan asli skill ini dan membaca file workspace client. Hasilnya
            disimpan sebagai file di folder client.
          </DialogDescription>
        </DialogHeader>

        <div ref={scrollRef} className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={
                  m.role === 'user'
                    ? 'bg-primary text-primary-foreground max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap'
                    : 'bg-muted max-w-[85%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap'
                }
              >
                {m.content}
              </div>
            </div>
          ))}
          {busy && (
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <LoaderIcon className="size-4 animate-spin" /> AI sedang menyusun…
            </div>
          )}
          {err && <p className="text-destructive text-sm">{err}</p>}
        </div>

        {output && !file && (
          <div className="bg-muted/50 space-y-2 rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileTextIcon className="size-4" /> {output.title}
              {outSaved && (
                <span className="inline-flex items-center gap-1 text-green-600">
                  <CheckIcon className="size-3.5" /> tersimpan ke Hasil
                </span>
              )}
            </div>
            <div className="bg-background max-h-56 overflow-auto rounded-md border p-3">
              <Markdown source={output.content} />
            </div>
            <Button size="sm" onClick={saveOutput} disabled={outSaving || outSaved} className="h-11 sm:h-8">
              {outSaving ? <LoaderIcon className="size-4 animate-spin" /> : null}
              {outSaved ? 'Tersimpan' : 'Simpan ke Hasil'}
            </Button>
          </div>
        )}

        {file && (
          <div className="bg-muted/50 space-y-2 rounded-lg border p-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileTextIcon className="size-4" /> {file.path}
              {saved && (
                <span className="inline-flex items-center gap-1 text-green-600">
                  <CheckIcon className="size-3.5" /> tersimpan
                </span>
              )}
            </div>
            {editing ? (
              <Textarea
                value={file.content}
                onChange={(e) => setFile({ ...file, content: e.target.value })}
                className="max-h-64 min-h-40 font-mono text-xs"
              />
            ) : (
              <div className="bg-background max-h-56 overflow-auto rounded-md border p-3">
                <Markdown source={file.content} />
              </div>
            )}
            <div className="flex gap-2">
              <Button size="sm" onClick={saveFile} disabled={saving || saved} className="h-11 sm:h-8">
                {saving ? <LoaderIcon className="size-4 animate-spin" /> : null}
                {saved ? 'Tersimpan' : 'Simpan ke folder client'}
              </Button>
              <Button size="sm" variant="outline" onClick={() => setEditing((v) => !v)} className="h-11 sm:h-8">
                {editing ? 'Pratinjau' : 'Edit dulu'}
              </Button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                reply()
              }
            }}
            placeholder="Tulis jawaban… (Enter kirim, Shift+Enter baris baru)"
            className="min-h-12 flex-1 resize-none"
            disabled={busy}
          />
          <Button onClick={reply} disabled={busy || !input.trim()} className="self-end">
            {busy ? <LoaderIcon className="size-4 animate-spin" /> : <SendIcon className="size-4" />}
          </Button>
        </div>

        <DialogFooter className="sm:justify-start">
          <Button variant="outline" onClick={onClose}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
