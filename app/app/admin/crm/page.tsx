import { KolCrmBoard } from '@/components/marketing/kol-crm-board'

export const metadata = {
  title: 'KOL & Vendor CRM | Frahma ERP',
  description: 'Manage your talents, rates, and collaboration history.',
}

export default function CRMPage() {
  return (
    <div className="container mx-auto py-6">
      <KolCrmBoard />
    </div>
  )
}

