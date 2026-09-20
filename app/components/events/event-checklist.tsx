'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

type EventTask = {
  id: string
  title: string
  is_completed: boolean
  stage: 'pre' | 'day-of' | 'post'
}

export function EventChecklist({ eventId }: { eventId: string }) {
  const [tasks, setTasks] = useState<EventTask[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchTasks() {
      const { data, error } = await supabase
        .from('event_tasks')
        .select('id, title, is_completed, stage')
        .eq('event_id', eventId)
        .order('created_at')

      if (data && !error) {
        setTasks(data as EventTask[])
      }
      setLoading(false)
    }

    if (eventId) {
      fetchTasks()
    }
  }, [eventId])

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    // Optimistic UI update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: !currentStatus } : t))

    await supabase
      .from('event_tasks')
      .update({ is_completed: !currentStatus })
      .eq('id', taskId)
  }

  const renderStage = (stage: 'pre' | 'day-of' | 'post', label: string) => {
    const stageTasks = tasks.filter(t => t.stage === stage)

    if (stageTasks.length === 0 && !loading) {
      return (
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground">{label}</h4>
          <p className="text-sm text-muted-foreground">Tidak ada task.</p>
        </div>
      )
    }

    return (
      <div className="mb-6">
        <h4 className="text-sm font-semibold mb-3 text-muted-foreground">{label}</h4>
        <div className="space-y-3">
          {stageTasks.map(task => (
            <div key={task.id} className="flex items-center space-x-2">
              <Checkbox 
                id={`task-${task.id}`} 
                checked={task.is_completed}
                onCheckedChange={() => toggleTask(task.id, task.is_completed)}
              />
              <Label 
                htmlFor={`task-${task.id}`}
                className={`text-sm ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}
              >
                {task.title}
              </Label>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (loading) return <div className="text-sm text-muted-foreground p-4">Loading checklist...</div>

  return (
    <div className="p-4 border rounded-md bg-card">
      {renderStage('pre', 'Pre-Event')}
      {renderStage('day-of', 'Day-Of Event')}
      {renderStage('post', 'Post-Event')}
    </div>
  )
}
