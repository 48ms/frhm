import { AdminCalendarClient } from './calendar-client'

export const dynamic = 'force-dynamic'

export default function AdminCalendarPage() {
  return (
    <div className="space-y-6">
      <AdminCalendarClient />
    </div>
  )
}
