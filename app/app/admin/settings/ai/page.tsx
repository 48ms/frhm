import { AiProviders } from './providers'

export const dynamic = 'force-dynamic'

export default function AiSettingsPage() {
  return (
    <div className="rounded-xl border bg-card p-6">
      <AiProviders />
    </div>
  )
}
