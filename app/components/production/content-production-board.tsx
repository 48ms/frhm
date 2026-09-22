'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { PlatformIcon } from '@/components/calendar/calendar-view'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { PostDialog } from '@/components/calendar/post-dialog'
import { ContentFormModal } from './content-form-modal'
import { toast } from 'sonner'
import type { RealtimeChannel } from '@/lib/supabase/client'

export type ProductionItem = {
  id: string
  client_id: string
  title: string
  platform: string
  stage: 'idea' | 'script' | 'shooting' | 'editing' | 'design' | 'caption' | 'review' | 'ready'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  assignee: string | null
  due_date: string | null
  assets: { name: string; url: string }[]
  notes: string | null
  created_at: string
}

const STAGES: { id: ProductionItem['stage']; label: string; color: string }[] = [
  { id: 'idea', label: 'Ideasi', color: 'bg-neutral-500/10 border-neutral-500/30 text-neutral-700 dark:text-neutral-300' },
  { id: 'script', label: 'Script / Brief', color: 'bg-blue-500/10 border-blue-500/30 text-blue-700 dark:text-blue-300' },
  { id: 'shooting', label: 'Shooting', color: 'bg-purple-500/10 border-purple-500/30 text-purple-700 dark:text-purple-300' },
  { id: 'editing', label: 'Editing', color: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-700 dark:text-indigo-300' },
  { id: 'design', label: 'Design', color: 'bg-pink-500/10 border-pink-500/30 text-pink-700 dark:text-pink-300' },
  { id: 'caption', label: 'Caption', color: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300' },
  { id: 'review', label: 'Review', color: 'bg-orange-500/10 border-orange-500/30 text-orange-700 dark:text-orange-300' },
  { id: 'ready', label: 'Siap Post', color: 'bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-300' },
]

export function ContentProductionBoard({ clientId }: { clientId: string }) {
  const [items, setItems] = useState<ProductionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<ProductionItem | null>(null)
  const [defaultStage, setDefaultStage] = useState<ProductionItem['stage']>('idea')

  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calendarItem, setCalendarItem] = useState<ProductionItem | null>(null)

  const [isGenerating, setIsGenerating] = useState(false)
  const [generateModalOpen, setGenerateModalOpen] = useState(false)
  const [genTopic, setGenTopic] = useState('')
  const [genAssetCount, setGenAssetCount] = useState(2)
  const [genPlatforms, setGenPlatforms] = useState<string[]>(['INSTAGRAM', 'TIKTOK', 'FACEBOOK'])
  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)

  const handleAutoGenerate = async () => {
    try {
      setIsGenerating(true)
      const res = await fetch(`/api/admin/clients/${clientId}/generate-campaign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: genTopic, assetCount: genAssetCount, platforms: genPlatforms })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal generate')
      toast.success('Berhasil membuat kampanye AI!')
      setGenerateModalOpen(false)
      fetchProductions()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal generate')
    } finally {
      setIsGenerating(false)
    }
  }

  const fetchProductions = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/content-productions?client_id=${clientId}`)
      const json = await res.json()
      if (res.ok) setItems(json.productions || [])
    } finally {
      setLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    if (clientId) fetchProductions()

    channelRef.current = supabase
      .channel('content-productions-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'content_productions' },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          if (row.client_id === clientId) {
            fetchProductions()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channelRef.current!)
    }
  }, [clientId, fetchProductions])

  const openNewModal = (stage?: ProductionItem['stage']) => {
    setEditingItem(null)
    setDefaultStage(stage || 'idea')
    setDialogOpen(true)
  }

  const openEditModal = (item: ProductionItem) => {
    setEditingItem(item)
    setDefaultStage(item.stage)
    setDialogOpen(true)
  }

  const openCalendar = (item: ProductionItem) => {
    setCalendarItem(item)
    setCalendarOpen(true)
  }

  // Saving is handled by ContentFormModal

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus task produksi ini?')) return
    const res = await fetch(`/api/admin/content-productions?id=${id}`, { method: 'DELETE' })
    if (res.ok) fetchProductions()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">Content Production Pipeline</h3>
          <p className="text-xs text-muted-foreground">
            Kelola produksi dari ide, shooting, editing, hingga siap post dalam satu board Kanban.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setGenerateModalOpen(true)} size="sm" variant="secondary">
            Generate
          </Button>
          <Button onClick={() => openNewModal()} size="sm">
            + Task Produksi
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Memuat board produksi&hellip;</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto pb-4">
          {STAGES.map((col) => {
            const colItems = items.filter((i) => i.stage === col.id)
            return (
              <div key={col.id} className="bg-muted/20 border rounded-xl p-3 flex flex-col min-h-[450px]">
                <div className="flex items-center justify-between pb-3 border-b mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-card">
                      {col.label}
                    </span>
                    <span className="text-xs font-bold text-muted-foreground">
                      {colItems.length}
                    </span>
                  </div>
                  <button
                    onClick={() => openNewModal(col.id as ProductionItem['stage'])}
                    className="text-xs text-muted-foreground hover:text-foreground font-bold px-1.5 py-0.5 rounded hover:bg-muted"
                  >
                    +
                  </button>
                </div>

                <div className="space-y-2.5 flex-1">
                  {colItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => openEditModal(item)}
                      className="p-3 bg-card rounded-lg border shadow-sm hover:border-primary/50 transition-all cursor-pointer space-y-2 group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <PlatformIcon platform={item.platform} className="size-3.5" />
                          <span className="text-[10px] uppercase font-bold text-muted-foreground">
                            {item.platform}
                          </span>
                        </div>
                        {item.priority !== 'normal' && (
                          <span
                            className={`text-[9px] font-bold uppercase px-1 rounded ${
                              item.priority === 'urgent'
                                ? 'bg-red-500 text-white'
                                : item.priority === 'high'
                                ? 'bg-amber-500 text-white'
                                : 'bg-blue-500 text-white'
                            }`}
                          >
                            {item.priority}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-semibold leading-snug group-hover:text-primary transition-colors">
                        {item.title}
                      </h4>

                      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t">
                        <span>{item.assignee ? item.assignee : 'Unassigned'}</span>
                        {item.assets?.length > 0 && (
                          <span className="text-primary font-medium">
                            {item.assets.length} asset
                          </span>
                        )}
                      </div>

                      {/* Schedule to Calendar button for "ready" stage */}
                      {item.stage === 'ready' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="w-full h-11 sm:h-8 text-xs mt-2"
                          onClick={(e) => {
                            e.stopPropagation()
                            openCalendar(item)
                          }}
                        >
                          <CalendarIcon className="size-3.5 mr-1" /> Jadwalkan ke Kalender
                        </Button>
                      )}
                    </div>
                  ))}
                  {colItems.length === 0 && (
                    <div className="h-24 flex items-center justify-center border border-dashed rounded-lg text-[11px] text-muted-foreground">
                      Kosong
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit / Create Modal */}
      <ContentFormModal
        clientId={clientId}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingItem={editingItem}
        defaultStage={defaultStage}
        onSuccess={fetchProductions}
        onDelete={handleDelete}
      />

      {/* Calendar Scheduling Dialog for Production Items */}
      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="size-4 text-primary" />
              Jadwalkan ke Kalender Konten
            </DialogTitle>
            <DialogDescription>
              Menjadwalkan task produksi &ldquo;<span className="font-medium">{calendarItem?.title}</span>&rdquo; ke Content Calendar.
            </DialogDescription>
          </DialogHeader>
          <PostDialog
            isOpen={calendarOpen}
            onClose={() => setCalendarOpen(false)}
            clientId={clientId}
            onSave={() => { fetchProductions(); setCalendarItem(null); }}
            initialTitle={calendarItem?.title}
            initialContent={calendarItem?.notes || ''}
            productionId={calendarItem?.id}
          />
        </DialogContent>
      </Dialog>

      {/* Generate Campaign Modal */}
      <Dialog open={generateModalOpen} onOpenChange={setGenerateModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generate Campaign</DialogTitle>
            <DialogDescription>
              AI akan membuat kampanye dan draft aset berdasarkan Brand Profile klien.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Topik Spesifik (Opsional)</Label>
              <Textarea 
                placeholder="Contoh: Fokus ke promo diskon akhir tahun..."
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value)}
                className="resize-none h-20 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Jumlah Ide Aset</Label>
              <select 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={genAssetCount} 
                onChange={(e) => setGenAssetCount(Number(e.target.value))}
              >
                <option value={1}>1 Ide Konten</option>
                <option value={2}>2 Ide Konten</option>
                <option value={3}>3 Ide Konten</option>
                <option value={4}>4 Ide Konten</option>
                <option value={5}>5 Ide Konten</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Platform Target</Label>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {['INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'LINKEDIN', 'YOUTUBE', 'TWITTER'].map(p => (
                  <label key={p} className="flex items-center gap-2 cursor-pointer border rounded p-2 hover:bg-muted/50">
                    <input 
                      type="checkbox" 
                      checked={genPlatforms.includes(p)}
                      onChange={(e) => {
                        if (e.target.checked) setGenPlatforms([...genPlatforms, p])
                        else setGenPlatforms(genPlatforms.filter(x => x !== p))
                      }}
                    />
                    <span>{p}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button onClick={handleAutoGenerate} disabled={isGenerating} className="w-full mt-4">
              {isGenerating && <Loader2 className="size-4 mr-2 animate-spin" />}
              Mulai Generate
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}