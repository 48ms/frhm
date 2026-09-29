'use client'

import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
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

import { PostDialog } from '@/components/calendar/post-dialog'
import { ContentFormModal } from './content-form-modal'
import { toast } from 'sonner'
import { Icons } from '@/components/icons'
import { Skeleton } from '@/components/ui/skeleton'
import { PlatformIcon } from '@/components/calendar/platform-icon'
import type { RealtimeChannel } from '@/lib/supabase/client'
import { getTaskSkillStages } from '@/lib/ai/task-context'
import {
  productionsQueryOptions,
  productionKeys,
  deleteProductionMutation,
} from '@/features/production/api/queries'

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

const AI_CAPABLE_STAGES = ['idea', 'script', 'editing', 'design', 'caption', 'review', 'ready']

export function ContentProductionBoard({ clientId }: { clientId: string }) {
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

  // AI task generation state
  const [aiTaskModalOpen, setAiTaskModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<ProductionItem | null>(null)
  const [selectedSkillIds, setSelectedSkillIds] = useState<string[]>([])
  const [availableSkills, setAvailableSkills] = useState<{ id: string; name: string }[]>([])
  const [isTaskGenerating, setIsTaskGenerating] = useState(false)

  const supabase = createClient()
  const channelRef = useRef<RealtimeChannel | null>(null)
  const queryClient = useQueryClient()

  const { data: items = [], isLoading: loading } = useQuery(
    productionsQueryOptions(clientId)
  )

  // Fetch AI drafts for display
  const { data: drafts = [] } = useQuery({
    queryKey: ['ai-drafts', clientId],
    queryFn: async () => {
      const { data } = await supabase
        .from('skill_outputs')
        .select('id, skill_id, title, content, stage, created_at, production_id')
        .eq('client_id', clientId)
        .eq('status', 'draft')
        .order('created_at', { ascending: false })
      return data ?? []
    },
    refetchInterval: 5000,
  })

  // Fetch scheduled posts so we can badge tasks that already have a calendar entry.
  const { data: scheduledPosts = [] } = useQuery({
    queryKey: ['scheduled-posts-for-board', clientId],
    queryFn: async () => {
      const { data } = await supabase
        .from('scheduled_posts')
        .select('id, production_id')
        .eq('client_id', clientId)
        .not('production_id', 'is', null)
      return data ?? []
    },
  })

  const deleteMutation = useMutation(deleteProductionMutation)

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: productionKeys.list(clientId) })
  }

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
      invalidate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal generate')
    } finally {
      setIsGenerating(false)
    }
  }

  // Task AI generation handler
  const handleTaskAiGenerate = async () => {
    if (!selectedTask || selectedSkillIds.length === 0) {
      toast.error('Pilih minimal satu skill')
      return
    }

    try {
      setIsTaskGenerating(true)
      const res = await fetch(`/api/admin/clients/${clientId}/tasks/${selectedTask.id}/ai-generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill_ids: selectedSkillIds })
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal generate')
      
      toast.success(`Berhasil generate ${json.ok_count}/${selectedSkillIds.length} skill`)
      setAiTaskModalOpen(false)
      setSelectedSkillIds([])
      invalidate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal generate')
    } finally {
      setIsTaskGenerating(false)
    }
  }

  // Move task to next stage after approve
  const handleApproveDraft = async (draft: any) => {
    if (!selectedTask) return
    
    const stageOrder = ['idea', 'script', 'shooting', 'editing', 'design', 'caption', 'review', 'ready']
    const currentIndex = stageOrder.indexOf(selectedTask.stage)
    if (currentIndex < 0 || currentIndex >= stageOrder.length - 1) {
      toast.error('Task sudah di stage terakhir atau tidak valid')
      return
    }
    
    const nextStage = stageOrder[currentIndex + 1]

    try {
      const res = await fetch('/api/admin/content-productions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedTask.id,
          stage: nextStage,
          notes: selectedTask.notes 
            ? `${selectedTask.notes}\n\n--- AI Draft Applied ---\n${draft.content}`
            : draft.content
        })
      })
      
      if (!res.ok) throw new Error('Failed to update task')
      
      // Mark draft as applied
      await supabase.from('skill_outputs').update({ status: 'approved' }).eq('id', draft.id)
      
      toast.success(`Task dipindahkan ke ${nextStage}`)
      setAiTaskModalOpen(false)
      setSelectedTask(null)
      invalidate()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal approve')
    }
  }

  // Fetch skills assigned to THIS client (client_skills), filtered to the task's stage.
  // Querying the global `skills` table would offer every skill in the library (100+)
  // and would let a client with no foundation generate anyway.
  useEffect(() => {
    if (!aiTaskModalOpen || !selectedTask) return

    const stages = getTaskSkillStages(selectedTask.stage)
    if (stages.length === 0) {
      setAvailableSkills([])
      return
    }

    let cancelled = false

    supabase
      .from('client_skills')
      .select('skill_id, skills!inner(id, name, stage)')
      .eq('client_id', clientId)
      .in('skills.stage', stages)
      .then(({ data }) => {
        if (cancelled) return
        const mapped = (data ?? [])
          .map((row) => {
            const s = row.skills as unknown as { id: string; name: string; stage: string } | null
            return s ? { id: s.id, name: s.name } : null
          })
          .filter((s): s is { id: string; name: string } => s !== null)
        setAvailableSkills(mapped)
        if (mapped.length === 1) setSelectedSkillIds([mapped[0].id])
      })

    return () => {
      cancelled = true
    }
  }, [aiTaskModalOpen, selectedTask, clientId, supabase])

  useEffect(() => {
    channelRef.current = supabase
      .channel('content-productions-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'content_productions' },
        (payload) => {
          const row = (payload.new ?? payload.old) as Record<string, unknown>
          if (row.client_id === clientId) {
            invalidate()
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channelRef.current!)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, supabase])

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

  // Derive a sensible default date for the scheduling dialog.
  const calendarInitialDate = (
    calendarItem?.due_date
      ? new Date(`${calendarItem.due_date}T00:00:00`)
      : undefined
  ) ?? new Date()


  const handleDelete = async (id: string) => {
    if (!confirm('Hapus task produksi ini?')) return
    try {
      await deleteMutation.mutateAsync(id)
      toast.success('Task produksi dihapus')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Gagal menghapus')
    }
  }

  const getDraftsForTask = (taskId: string) => 
    (drafts as any[]).filter(d => d.production_id === taskId)
  
  const isScheduled = (taskId: string) => 
    scheduledPosts.some((p) => p.production_id === taskId)

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
            <Icons.sparkles className="mr-2 h-4 w-4" />
            Generate Kampanye AI
          </Button>
          <Button onClick={() => openNewModal()} size="sm">
            + Task Produksi
          </Button>
        </div>
      </div>

      {loading ? (
        <div role="status" aria-live="polite" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 pb-4">
          <span className="sr-only">Memuat board produksi…</span>
          {STAGES.map((col) => (
            <div
              key={col.id}
              className="bg-muted/20 border rounded-xl p-3 flex flex-col gap-2.5"
              aria-hidden="true"
            >
              <div className="flex items-center justify-between pb-3 border-b">
                <Skeleton className="h-5 w-20 rounded" />
                <Skeleton className="h-5 w-6 rounded" />
              </div>
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded-lg" />
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto pb-4">
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
                    className="flex size-9 items-center justify-center rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
                    aria-label={`Tambah task baru di ${col.label}`}
                  >
                    <Icons.add className="size-4" aria-hidden="true" />
                  </button>
                </div>

                <div className="space-y-2.5 flex-1">
                  {colItems.map((item) => {
                    const taskDrafts = getDraftsForTask(item.id)
                    const hasReview = taskDrafts.length > 0
                    const canUseAI = AI_CAPABLE_STAGES.includes(item.stage)

                    return (
                      <button
                        key={item.id}
                        onClick={() => openEditModal(item)}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') openEditModal(item) }}
                        className="w-full p-3 bg-card rounded-lg border shadow-sm hover:border-primary/50 transition-all text-left cursor-pointer space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <PlatformIcon platform={item.platform} className="size-3.5" aria-hidden="true" />
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

                        {/* AI Review Badge */}
                        {hasReview && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full mt-1 text-xs h-7 border-dashed border-green-500/30 bg-green-500/10 text-green-700 hover:bg-green-500/20"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTask(item)
                              setAiTaskModalOpen(true)
                            }}
                          >
                            <Icons.circleCheck className="mr-1 h-3 w-3" />
                            Review AI Draft ({taskDrafts.length})
                          </Button>
                        )}

                        {/* Schedule to Calendar button for "ready" stage */}
                        {item.stage === 'ready' && (
                          <Button
                            size="sm"
                            variant={isScheduled(item.id) ? 'outline' : 'secondary'}
                            className={`w-full h-11 sm:h-8 text-xs mt-2 ${
                              isScheduled(item.id)
                                ? 'border-primary/30 text-primary hover:bg-primary/5'
                                : ''
                            }`}
                            onClick={(e) => {
                              e.stopPropagation()
                              openCalendar(item)
                            }}
                          >
                            <Icons.calendar className="size-3.5 mr-1" aria-hidden="true" />
                            {isScheduled(item.id) ? 'Sudah dijadwalkan' : 'Jadwalkan ke Kalender'}
                          </Button>
                        )}

                        {/* AI Assist Button */}
                        {canUseAI && !hasReview && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="w-full h-7 text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedTask(item)
                              setAiTaskModalOpen(true)
                            }}
                          >
                            <Icons.sparkles className="mr-1 h-3 w-3" />
                            Bantu AI
                          </Button>
                        )}
                      </button>
                    )
                  })}
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
        onSuccess={invalidate}
        onDelete={handleDelete}
      />

      <PostDialog
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        clientId={clientId}
        onSave={() => { invalidate(); setCalendarItem(null); }}
        initialTitle={calendarItem?.title}
        initialContent={calendarItem?.notes || ''}
        initialDate={calendarInitialDate}
        productionId={calendarItem?.id}
      />

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
              <Label htmlFor="gen-topic">Topik Spesifik (Opsional)</Label>
              <Textarea 
                id="gen-topic"
                placeholder="Contoh: Fokus ke promo diskon akhir tahun..."
                value={genTopic}
                onChange={(e) => setGenTopic(e.target.value)}
                className="resize-none h-20 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gen-asset-count">Jumlah Ide Aset</Label>
              <select 
                id="gen-asset-count"
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
              <fieldset className="grid grid-cols-2 gap-2 text-sm">
                <legend className="sr-only">Pilih platform target</legend>
                {['INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'LINKEDIN', 'YOUTUBE', 'TWITTER'].map(p => (
                  <label key={p} htmlFor={`gen-platform-${p}`} className="flex items-center gap-2 cursor-pointer border rounded p-2 hover:bg-muted/50 min-h-[44px]">
                    <input 
                      id={`gen-platform-${p}`}
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
              </fieldset>
            </div>
            <Button onClick={handleAutoGenerate} disabled={isGenerating} className="w-full mt-4">
              {isGenerating && <Icons.spinner className="size-4 mr-2 animate-spin" />}
              Mulai Generate
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Task AI Generation Modal */}
      <Dialog open={aiTaskModalOpen} onOpenChange={setAiTaskModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTask ? `Bantu AI - ${selectedTask.title}` : 'AI Assistant'}
            </DialogTitle>
            <DialogDescription>
              Pilih skill untuk membantu menyelesaikan task ini. Output akan disimpan sebagai draft untuk review.
            </DialogDescription>
          </DialogHeader>

          {selectedTask && (
            <div className="space-y-4 py-4">
              {/* Task Info */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-muted p-3 rounded-lg">
                <div>
                  <span className="text-muted-foreground">Platform:</span>
                  <span className="ml-2 capitalize font-medium">{selectedTask.platform}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Stage:</span>
                  <span className="ml-2 font-medium">{selectedTask.stage}</span>
                </div>
                {selectedTask.notes && (
                  <div className="col-span-2">
                    <span className="text-muted-foreground">Notes:</span>
                    <p className="mt-1 text-xs bg-background p-2 rounded border">{selectedTask.notes}</p>
                  </div>
                )}
              </div>

              {/* Skill Selection */}
              {availableSkills.length > 0 ? (
                <div className="space-y-2">
                  <Label>Pilih Skill</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                    {availableSkills.map((skill) => (
                      <Button
                        key={skill.id}
                        variant={selectedSkillIds.includes(skill.id) ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs justify-start h-10"
                        onClick={() => {
                          setSelectedSkillIds(prev =>
                            prev.includes(skill.id)
                              ? prev.filter(x => x !== skill.id)
                              : [...prev, skill.id]
                          )
                        }}
                      >
                        {skill.name}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Tidak ada skill yang tersedia untuk stage ini.
                </p>
              )}

              {/* Existing Drafts */}
              {getDraftsForTask(selectedTask.id).length > 0 && (
                <div className="space-y-2">
                  <Label>Draft Tersedia</Label>
                  <div className="border rounded-lg p-3 space-y-3 max-h-48 overflow-y-auto">
                    {getDraftsForTask(selectedTask.id).map((draft) => (
                      <div key={draft.id} className="border rounded p-3 text-xs space-y-2 bg-muted/30">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{draft.skill_id}</span>
                          <span className="text-muted-foreground">{new Date(draft.created_at).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="text-muted-foreground line-clamp-3">{draft.content}</div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="default"
                            className="text-xs h-7"
                            onClick={() => handleApproveDraft(draft)}
                          >
                            <Icons.check className="mr-1 h-3 w-3" />
                            Approve & Continue
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setAiTaskModalOpen(false)}>
              Batal
            </Button>
            <Button
              onClick={handleTaskAiGenerate}
              disabled={isTaskGenerating || selectedSkillIds.length === 0}
            >
              {isTaskGenerating ? (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Generate AI
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}