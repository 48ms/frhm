import { ClientPlanningBoard } from '@/components/production/client-planning-board'

export const dynamic = 'force-dynamic'

export default async function PlanningPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  return (
    <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
      <ClientPlanningBoard clientId={id} />
    </div>
  )
}
