import { BridgeConfig } from './bridge'

export const dynamic = 'force-dynamic'

export default function BridgeSettingsPage() {
  return (
    <div className="rounded-xl border bg-card p-6">
      <BridgeConfig />
    </div>
  )
}
