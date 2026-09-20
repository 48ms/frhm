import { createClient } from '@/lib/supabase/server'
import { AdminSkillsClient } from './page-client'

export const dynamic = 'force-dynamic'

export default async function SkillPacksPage() {
  const supabase = await createClient()

  const [{ data: packs }, { data: skills }, { data: links }] = await Promise.all([
    supabase.from('skill_packs').select('id, name, description, category, sort_order').order('sort_order'),
    supabase.from('skills').select('id, name, category'),
    supabase.from('pack_skills').select('pack_id, skill_id'),
  ])

  const skillById = new Map((skills ?? []).map((s) => [s.id, s]))
  
  // Convert Map to plain object for passing as props to client component
  const skillsByPackObj: Record<string, { id: string; name: string }[]> = {}
  for (const l of links ?? []) {
    const s = skillById.get(l.skill_id)
    if (!s) continue
    if (!skillsByPackObj[l.pack_id]) {
      skillsByPackObj[l.pack_id] = []
    }
    skillsByPackObj[l.pack_id].push({ id: s.id, name: s.name })
  }

  const totalSkills = (skills ?? []).length

  return <AdminSkillsClient packs={packs ?? []} skillsByPackObj={skillsByPackObj} totalSkills={totalSkills} />
}