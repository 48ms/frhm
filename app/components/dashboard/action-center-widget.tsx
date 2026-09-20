'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2Icon, ClockIcon, AlertCircleIcon, CalendarIcon } from 'lucide-react'

export function ActionCenterWidget({ initialTasks }: { initialTasks: any[] }) {
  const [tasks, setTasks] = useState(initialTasks)
  const router = useRouter()

  const markDone = async (id: string) => {
    // Optimistic update
    const previous = tasks
    setTasks(tasks.map(t => t.id === id ? { ...t, status: 'completed' } : t))
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'mark_done' }),
      })
      if (!res.ok) throw new Error('mark_done failed')
      toast.success('Task ditandai selesai')
      // Keep server-rendered dashboard in sync (force-dynamic page)
      router.refresh()
    } catch {
      setTasks(previous) // rollback optimistic update
      toast.error('Gagal menandai task selesai')
    }
  }

  const reschedule = async (id: string) => {
    // Basic reschedule: bump due_date by 1 day
    const task = tasks.find(t => t.id === id)
    if (!task || !task.due_date) return

    const newDate = new Date(task.due_date)
    newDate.setDate(newDate.getDate() + 1)

    // Optimistic update
    const previous = tasks
    setTasks(tasks.map(t => t.id === id ? { ...t, due_date: newDate.toISOString() } : t))
    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'reschedule', due_date: newDate.toISOString() }),
      })
      if (!res.ok) throw new Error('reschedule failed')
      toast.success('Task dijadwalkan ulang (+1 hari)')
      router.refresh()
    } catch {
      setTasks(previous) // rollback optimistic update
      toast.error('Gagal menjadwalkan ulang task')
    }
  }

  const now = new Date()
  now.setHours(0, 0, 0, 0)
  
  const pendingTasks = tasks.filter(t => t.status !== 'completed' && t.due_date)
  
  const overdueTasks = pendingTasks.filter(t => {
    const dueDate = new Date(t.due_date)
    dueDate.setHours(0,0,0,0)
    return dueDate < now
  })
  
  const dueTodayTasks = pendingTasks.filter(t => {
    const dueDate = new Date(t.due_date)
    dueDate.setHours(0,0,0,0)
    return dueDate.getTime() === now.getTime()
  })

  return (
    <Card className="rounded-2xl border-brand-accent/20 bg-card shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2 font-bold">
            <AlertCircleIcon className="size-4 text-brand-accent" />
            Action Center
          </CardTitle>
          <CardDescription className="font-medium mt-1">
            Task yang harus segera diselesaikan
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Badge variant="destructive">{overdueTasks.length} Overdue</Badge>
          <Badge variant="default" className="bg-brand-accent">{dueTodayTasks.length} Due Today</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {pendingTasks.length === 0 ? (
          <div className="py-6 text-center text-muted-foreground">
            <CheckCircle2Icon className="size-8 mx-auto mb-2 text-brand-accent opacity-50" />
            <p className="text-sm">Semua task sudah selesai! 🎉</p>
          </div>
        ) : (
          <div className="space-y-4">
            {overdueTasks.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-destructive uppercase tracking-wider">Overdue</h4>
                {overdueTasks.map(task => (
                  <TaskItem key={task.id} task={task} onDone={markDone} onReschedule={reschedule} isOverdue />
                ))}
              </div>
            )}
            
            {dueTodayTasks.length > 0 && (
              <div className="space-y-2 mt-4">
                <h4 className="text-xs font-semibold text-brand-accent uppercase tracking-wider">Due Today</h4>
                {dueTodayTasks.map(task => (
                  <TaskItem key={task.id} task={task} onDone={markDone} onReschedule={reschedule} />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TaskItem({ task, onDone, onReschedule, isOverdue = false }: { task: any, onDone: (id: string) => void, onReschedule: (id: string) => void, isOverdue?: boolean }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border ${isOverdue ? 'border-destructive/30 bg-destructive/5' : 'border-border/50 bg-background/80'}`}>
      <div className="flex items-start gap-3">
        <ClockIcon className={`size-4 mt-0.5 ${isOverdue ? 'text-destructive' : 'text-brand-accent'}`} />
        <div>
          <p className="text-sm font-semibold leading-tight">{task.title}</p>
          <div className="flex gap-2 mt-1 items-center">
            {task.kols && (
              <Badge variant="outline" className="text-[10px]">{task.kols.name}</Badge>
            )}
            {task.content_items && (
              <span className="text-xs text-muted-foreground">{task.content_items.title}</span>
            )}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" className="size-8" onClick={() => onReschedule(task.id)} title="Reschedule (+1 Day)">
          <CalendarIcon className="size-3" />
        </Button>
        <Button variant="default" size="icon" className="size-8 bg-brand-accent" onClick={() => onDone(task.id)} title="Mark as Done">
          <CheckCircle2Icon className="size-3" />
        </Button>
      </div>
    </div>
  )
}
