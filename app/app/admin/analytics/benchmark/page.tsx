import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BenchmarkBoard } from '@/components/analytics/benchmark-board'
import { ChartLine } from '@/registry/icons/chart-line'

export const dynamic = 'force-dynamic'

export default async function BenchmarkPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') redirect('/client/dashboard')

  return (
    <div className="flex flex-col gap-6 p-1">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ChartLine className="size-6 text-primary" />
          Benchmarking Antar Klien
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bandingkan performa konten, engagement, dan konversi bisnis lintas brand klien.
        </p>
      </div>
      <BenchmarkBoard />
    </div>
  )
}
