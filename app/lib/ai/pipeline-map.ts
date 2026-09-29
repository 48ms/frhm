/**
 * Kanban → Skill-pipeline bridge.
 *
 * The dashboard has TWO orthogonal taxonomies and they must not be conflated:
 *
 *   1. `content_productions.stage` — the *production* workflow of a single piece of
 *      content (idea → script → shooting → editing → design → caption → review → ready).
 *      It answers "where is this asset in the making?".
 *
 *   2. `skills.stage` — the *capability* taxonomy of the skill library
 *      (foundation → plan → create → media → publish → grow → measure).
 *      It answers "which job-to-be-done does this skill do?".
 *      This is assigned by `scripts/sync_repo_skills.py` from the repo's own
 *      `site-taxonomy.json` + README chain — it is DERIVED from the repo, never hand-typed.
 *
 * The bridge below maps a Kanban column to the skill-pipeline stage(s) that can help.
 * It deliberately maps to STAGES, not to skill slugs: the skill list is then resolved
 * live from the DB (`skills.stage`), so when the repo gains or drops a skill the board
 * picks it up with zero code change. Hard-coding skill slugs here would duplicate the
 * DB, drift from the repo, and violate the repo's own "derived, never hand-typed" rule.
 *
 * A column with an empty list is human-only work (e.g. a physical shoot) — the UI must
 * show no AI affordance there rather than inventing one.
 */
export const KANBAN_STAGE_TO_SKILL_STAGES: Record<string, string[]> = {
  idea:     ['plan'],
  script:   ['create'],
  shooting: [],              // physical shoot — no skill applies
  editing:  ['media'],
  design:   ['media'],
  caption:  ['create', 'grow'],   // copy + hashtags/SEO
  review:   ['measure'],
  ready:    ['publish'],
}

/** Ordered skill-pipeline stages, mirroring `pipeline_stages.sort_order`. */
export const SKILL_STAGE_ORDER = [
  'foundation',
  'plan',
  'create',
  'media',
  'publish',
  'grow',
  'measure',
] as const

export type SkillStage = (typeof SKILL_STAGE_ORDER)[number]

/**
 * Resolve the skill-pipeline stages that can assist a given Kanban column.
 * Unknown columns fall back to an empty list (no AI affordance) — fail closed.
 */
export function skillStagesForKanbanColumn(column: string): string[] {
  return KANBAN_STAGE_TO_SKILL_STAGES[column] ?? []
}
