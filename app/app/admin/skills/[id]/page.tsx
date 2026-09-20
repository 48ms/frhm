import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeftIcon, LayersIcon, FileTextIcon } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function SkillPackPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: pack } = await supabase
    .from('skill_packs')
    .select('id, name, description, category')
    .eq('id', id)
    .single()

  if (!pack) notFound()

  const { data: links } = await supabase
    .from('pack_skills')
    .select('skill_id')
    .eq('pack_id', id)

  const ids = (links ?? []).map((l) => l.skill_id)

  const { data: skills } = await supabase
    .from('skills')
    .select('id, name, description, category')
    .in('id', ids.length ? ids : ['__none__'])
    .order('category')

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/admin/skills"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-3.5" /> Semua Paket
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">{pack.name}</h1>
        <p className="text-sm text-muted-foreground mt-1">{pack.description}</p>
        <Badge variant="secondary" className="mt-2 gap-1.5 h-6 px-2 text-xs">
          <LayersIcon className="size-3" />
          {(skills ?? []).length} skill
        </Badge>
      </div>

      {(skills ?? []).length === 0 ? (
        <Card className="border border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
            <FileTextIcon className="size-10" />
            <p className="text-center">Paket ini belum punya skill.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(skills ?? []).map((s) => (
            <Card key={s.id} className="border transition-shadow hover:shadow-sm hover:border-primary/20">
              <CardContent className="flex items-center justify-between gap-4 p-4 sm:p-5">
                <div className="min-w-0">
                  <CardTitle className="font-semibold truncate">{s.name}</CardTitle>
                  <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground/70">
                    {s.category}
                  </CardDescription>
                  {s.description && (
                    <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}