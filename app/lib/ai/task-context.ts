/**
 * Task context injection for AI skill generation.
 *
 * Bridges the Kanban task (content_productions) with the skill pipeline (skills.stage).
 * When a user triggers AI generation from a task card, this helper builds a context
 * block that tells the skill exactly which production task it is working on, so the
 * output is directly applicable instead of generic.
 *
 * Deliberately structural (not importing the board's ProductionItem type): this runs
 * server-side and must not depend on a client component.
 */

import { skillStagesForKanbanColumn } from './pipeline-map'

/** The subset of a production task the prompt needs. */
export type TaskContext = {
  title: string
  platform: string
  stage: string
  priority: string
  notes: string | null
  assets: { name: string }[]
}

/** Max characters of free-text notes to inject, so a long card can't blow the prompt. */
const NOTES_LIMIT = 500

/**
 * Build a context prompt block from task data.
 * Used by the task-scoped AI route and any future task-scoped workflow.
 */
export function buildTaskContextPrompt(task: TaskContext): string {
  const notes = (task.notes ?? '').trim()
  const trimmedNotes = notes.length > NOTES_LIMIT ? `${notes.slice(0, NOTES_LIMIT)}…` : notes

  return [
    '--- TASK CONTEXT (the production task this work must serve) ---',
    `Title: ${task.title}`,
    `Platform: ${task.platform}`,
    `Current Stage: ${task.stage}`,
    `Priority: ${task.priority}`,
    `Notes: ${trimmedNotes || '(no notes)'}`,
    task.assets.length > 0
      ? `Assets already attached: ${task.assets.map((a) => a.name).join(', ')}`
      : 'Assets already attached: (none)',
    '--- END TASK CONTEXT ---',
  ].join('\n')
}

/**
 * Which skill-pipeline stages can assist a given Kanban column.
 * Empty array = no AI skill applies (e.g. a physical shoot) — UI must show no affordance.
 */
export function getTaskSkillStages(kanbanStage: string): string[] {
  return skillStagesForKanbanColumn(kanbanStage)
}

/** Whether a Kanban column can benefit from AI assistance at all. */
export function isTaskAiCapable(kanbanStage: string): boolean {
  return getTaskSkillStages(kanbanStage).length > 0
}
