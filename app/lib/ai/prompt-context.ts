import type { AdminCtx } from './server'

/**
 * The repo's own rulebook, injected into every AI prompt.
 *
 * The dashboard stores the repo verbatim (AGENTS.md ground truths in `repo_ground_truths`,
 * each skill's own limits in `skill_guardrails`). Storing them is not the same as obeying them —
 * until now the AI routes only *displayed* these rules in the UI and never put them in the
 * system prompt. This module is the single place that turns those stored rules into prompt text,
 * so all routes (chat, run, bulk-run, foundation) share one implementation instead of drifting.
 *
 * Sources, in the repo:
 *   - AGENTS.md → "Ground truths (do not contradict these anywhere)"
 *   - README.md → "Design principles"
 *   - every SKILL.md → `(verify-quarterly)` on volatile figures
 */

export type GroundTruth = { source: string; rule: string }

/** Load the five AGENTS.md ground truths, ordered as the repo writes them. */
export async function loadGroundTruths(
  supabase: AdminCtx['supabase']
): Promise<GroundTruth[]> {
  const { data } = await supabase
    .from('repo_ground_truths')
    .select('source, rule')
    .order('sort_order')
  return (data ?? []) as GroundTruth[]
}

/** Load a single skill's guardrails (scope / done / reads / consent / edge). */
export async function loadSkillGuardrails(
  supabase: AdminCtx['supabase'],
  skillId: string
): Promise<{ kind: string; heading: string; body: string }[]> {
  const { data } = await supabase
    .from('skill_guardrails')
    .select('kind, heading, body')
    .eq('skill_id', skillId)
  return (data ?? []) as { kind: string; heading: string; body: string }[]
}

/**
 * Load guardrails for several skills at once (one query, not N+1) and render each block with the
 * same renderer the single-skill path uses. Returns skill_id → block text (empty string when a
 * skill has no guardrails stored).
 */
export async function loadSkillGuardrailsBatch(
  supabase: AdminCtx['supabase'],
  skillIds: string[]
): Promise<Map<string, string>> {
  if (skillIds.length === 0) return new Map()
  const { data } = await supabase
    .from('skill_guardrails')
    .select('skill_id, kind, heading, body')
    .in('skill_id', skillIds)
  const bySkill = new Map<string, { kind: string; heading: string; body: string }[]>()
  for (const g of data ?? []) {
    const cur = bySkill.get(g.skill_id) ?? []
    cur.push({ kind: g.kind, heading: g.heading, body: g.body })
    bySkill.set(g.skill_id, cur)
  }
  const out = new Map<string, string>()
  for (const skillId of skillIds) {
    out.set(skillId, guardrailsBlock(bySkill.get(skillId) ?? []))
  }
  return out
}

/** Render the AGENTS.md ground truths as a prompt block. Empty string when none are stored. */
export function groundTruthsBlock(truths: GroundTruth[]): string {
  if (!truths.length) return ''
  return [
    '',
    '--- REPO GROUND TRUTHS (AGENTS.md — DO NOT CONTRADICT ANYWHERE) ---',
    ...truths.map((t) => `- [${t.source}] ${t.rule}`),
    '',
    'These are the repo\'s own ground truths. Never contradict them. If a request would break one,',
    'say so and route around it instead of complying.',
  ].join('\n')
}

/** Render a skill's guardrails as a prompt block. Empty string when none are stored. */
export function guardrailsBlock(
  guardrails: { kind: string; heading: string; body: string }[]
): string {
  if (!guardrails.length) return ''
  return [
    '',
    '--- GUARDRAILS (MUST FOLLOW — NEVER VIOLATE) ---',
    ...guardrails.map((g) => `## ${g.heading}\n${g.body}`),
    '',
    'You MUST NOT violate any of the above guardrails. Violating them means producing hallucinated',
    'or fabricated content.',
  ].join('\n')
}

/**
 * The verify-quarterly rule, verbatim from AGENTS.md / README design principle #6.
 * Appended to every prompt so the model marks volatile figures instead of stating them as timeless.
 */
export const VERIFY_QUARTERLY_RULE = [
  '',
  '--- VOLATILE FACTS (verify-quarterly) ---',
  'Platform specs and tool pricing are volatile. Whenever you state a figure that can go stale',
  '(reach multipliers, length caps, character limits, feature availability, tool pricing, legal',
  'terms), write it inline and tag it exactly like this: (verify-quarterly). Never present such a',
  'figure as timeless, and never invent one you cannot attribute. The tag is what lets the dashboard',
  'flag the artefact for a quarterly re-check.',
].join('\n')

/**
 * Scan an artefact for the literal `verify-quarterly` tag the repo uses.
 * Used to set `needs_verification` on stored rows — a machine-readable echo of the author's tag.
 */
export function hasVolatileFacts(text: string | null | undefined): boolean {
  if (!text) return false
  return /verify-quarterly/i.test(text)
}
