import { KolCrmBoard } from '@/components/marketing/kol-crm-board'
import { PageContainer } from '@/components/layout/page-container'

export const metadata = {
  title: 'KOL & Vendor CRM | Frahma ERP',
  description: 'Kelola talent, tarif komersial, dan riwayat kolaborasi.',
}

export default function CRMPage() {
  return (
    <PageContainer
      pageTitle="KOL & Vendor CRM"
      pageDescription="Kelola daftar talent, influencer, tarif kerja sama, dan riwayat kolaborasi."
    >
      <KolCrmBoard />
    </PageContainer>
  )
}
