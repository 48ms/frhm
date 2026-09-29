'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Icons } from '@/components/icons'
import { toast } from 'sonner'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

interface SkillRef {
  id: string
  name: string
}

interface SkillChatProps {
  clientId: string
  skill: SkillRef | null
  providerId?: string
  onClose: () => void
  onSaved?: () => void
}

export function SkillChat({ clientId, skill, providerId, onClose, onSaved }: SkillChatProps) {
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  
  // Output states
  const [file, setFile] = useState<{ path: string; content: string } | null>(null)
  const [output, setOutput] = useState<{ title: string; content: string; stage: string } | null>(null)
  const [preview, setPreview] = useState<{ title: string; content: string } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editing, setEditing] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  // Auto-start interview
  useEffect(() => {
    if (skill && !started.current) {
      started.current = true
      send('Halo! Saya siap untuk memulai interview skill ' + skill.name)
    }
  }, [skill])

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, busy])

  const send = async (content: string) => {
    if (!skill || busy) return
    const newMessages: Message[] = [...messages, { role: 'user', content }]
    setMessages(newMessages)
    setInput('')
    setBusy(true)
    setErr(null)

    try {
      const res = await fetch('/api/admin/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          skill_id: skill.id,
          provider_id: providerId,
          messages: newMessages,
        }),
      })

      const j = await res.json()
      if (!res.ok) throw new Error(j.error || 'Gagal menghubungi AI')

      setMessages([...newMessages, { role: 'assistant', content: j.reply }])
      
      if (j.file) {
        setFile(j.file)
        setSaved(false)
      }
      if (j.output) {
        setOutput(j.output)
        setSaved(false)
      }
      if (j.preview) {
        setPreview(j.preview)
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Terjadi kesalahan')
    } finally {
      setBusy(false)
    }
  }

  const saveToRepo = async () => {
    if (!file && !output) return
    setSaving(true)
    try {
      const endpoint = file ? `/api/admin/clients/${clientId}/files` : `/api/admin/clients/${clientId}/outputs`
      const body = file ? { path: file.path, content: file.content } : output
      
      const res = await fetch(endpoint, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      
      if (!res.ok) throw new Error('Gagal menyimpan')
      
      setSaved(true)
      toast.success(file ? 'File tersimpan ke repository' : 'Output tersimpan ke Hasil')
      if (onSaved) onSaved()
      router.refresh()
    } catch (e) {
      toast.error('Gagal menyimpan: ' + (e instanceof Error ? e.message : 'Error'))
    } finally {
      setSaving(false)
    }
  }

  if (!skill) return null

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="flex h-[90vh] max-w-[95vw] flex-col p-0 overflow-hidden sm:max-w-6xl">
        <div className="flex h-full flex-col md:flex-row">
          
          {/* LEFT PANEL: Chat Interview */}
          <div className="flex flex-col border-r bg-muted/10 md:w-[45%]">
            <DialogHeader className="border-b p-4">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-lg bg-brand-accent/10 text-brand-accent flex items-center justify-center">
                  <Icons.chat className="size-5" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-base truncate">{skill.name}</DialogTitle>
                  <DialogDescription className="text-[10px] uppercase tracking-wider font-semibold text-brand-accent">
                    Interview Fondasi AI
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4"
            >
              {messages.length === 0 && !busy && (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 text-muted-foreground">
                  <Icons.sparkles className="size-8 mb-2 opacity-20" />
                  <p className="text-xs italic">Menunggu respon pertama dari AI...</p>
                </div>
              )}
              
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[90%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === 'user' 
                    ? 'bg-brand-accent text-white rounded-tr-none' 
                    : 'bg-white border shadow-sm rounded-tl-none text-foreground'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              
              {busy && (
                <div className="flex justify-start">
                  <div className="bg-white border shadow-sm rounded-2xl rounded-tl-none px-4 py-2.5 flex items-center gap-2">
                    <Icons.spinner className="size-3.5 animate-spin text-brand-accent" />
                    <span className="text-xs text-muted-foreground">AI sedang mengetik...</span>
                  </div>
                </div>
              )}
              
              {err && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
                  {err}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-white">
              <div className="relative">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      if (input.trim()) send(input.trim())
                    }
                  }}
                  placeholder="Tulis jawaban Anda di sini..."
                  className="min-h-[80px] resize-none pr-12 rounded-xl focus-visible:ring-brand-accent"
                />
                <Button 
                  size="icon" 
                  className="absolute bottom-2 right-2 size-8 rounded-lg bg-brand-accent hover:bg-brand-accent/90"
                  onClick={() => input.trim() && send(input.trim())}
                  disabled={busy || !input.trim()}
                >
                  <Icons.send className="size-4" />
                </Button>
              </div>
              <p className="mt-2 text-[10px] text-muted-foreground text-center">
                Tekan <strong>Enter</strong> untuk mengirim, <strong>Shift+Enter</strong> untuk baris baru.
              </p>
            </div>
          </div>

          {/* RIGHT PANEL: Live Document Preview */}
          <div className="flex flex-col flex-1 bg-white">
            <div className="flex items-center justify-between border-b px-6 py-4">
              <div className="flex items-center gap-2.5">
                <Icons.post className="size-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">
                  {file ? file.path : output ? output.title : preview ? preview.title : 'Pratinjau Dokumen'}
                </span>
                {saved && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                    <Icons.check className="size-3" /> Tersimpan
                  </span>
                )}
                {preview && !file && !output && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                    <Icons.spinner className="size-3 animate-spin" /> Draf Langsung
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-3">
                {(file || output) && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 text-xs gap-1.5"
                      onClick={() => setEditing(!editing)}
                    >
                      <Icons.edit className="size-3" /> {editing ? 'Lihat Preview' : 'Edit Manual'}
                    </Button>
                    <Button 
                      size="sm" 
                      className="h-8 text-xs bg-brand-accent hover:bg-brand-accent/90 gap-1.5"
                      onClick={saveToRepo}
                      disabled={saving || saved}
                    >
                      {saving ? <Icons.spinner className="size-3 animate-spin" /> : <Icons.save className="size-3" />}
                      {saved ? 'Tersimpan' : 'Finalisasi & Simpan'}
                    </Button>
                  </>
                )}
                {/* Close button removed: Dialog handles closing via overlay/ESC or top-right X */}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-muted/5">
              {!file && !output && !preview ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground space-y-3">
                  <div className="size-16 rounded-full bg-muted/20 flex items-center justify-center">
                    <Icons.fileText className="size-8 opacity-20" />
                  </div>
                  <div className="max-w-xs">
                    <p className="text-sm font-medium text-foreground">Menunggu Dokumen</p>
                    <p className="text-xs">
                      Lanjutkan interview di sisi kiri. Begitu data cukup, AI akan menyusun dokumen draf di sini secara real-time.
                    </p>
                  </div>
                </div>
              ) : editing && (file || output) ? (
                <Textarea
                  value={file ? file.content : output?.content || ''}
                  onChange={(e) => {
                    if (file) setFile({ ...file, content: e.target.value })
                    else if (output) setOutput({ ...output, content: e.target.value })
                    setSaved(false)
                  }}
                  className="h-full min-h-[500px] font-mono text-xs leading-relaxed focus-visible:ring-brand-accent"
                />
              ) : (
                <div className="bg-white p-6 rounded-xl border shadow-sm min-h-full">
                  <pre className="whitespace-pre-wrap font-sans text-xs text-foreground leading-relaxed">
                    {file ? file.content : output?.content || preview?.content || ''}
                  </pre>
                </div>
              )}
            </div>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )
}
