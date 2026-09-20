'use client'

import { useState, useEffect } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

type EventTask = {
  id: string
  title: string
  is_completed: boolean
  stage: 'pre' | 'day-of' | 'post'
}

interface EventChecklistProps {
  eventId: string
  clientId: string
}

export function EventChecklist({ eventId, clientId }: EventChecklistProps) {
  const [tasks, setTasks] = useState<EventTask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTasks() {
      const res = await fetch(`/api/admin/clients/${clientId}/event-tasks?event_id=${eventId}`)
      if (res.ok) {
        const data = await res.json()
        setTasks(data.tasks ?? [])
      }
      setLoading(false)
    }

    if (eventId && clientId) {
      fetchTasks()
    }
  }, [eventId, clientId])

  const toggleTask = async (taskId: string, currentStatus: boolean) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, is_completed: !currentStatus } : t))

    await fetch(`/api/admin/clients/${clientId}/event-tasks?task_id=${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_completed: !currentStatus }),
    })
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
