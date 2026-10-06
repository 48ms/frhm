import { PageContainer } from "@/components/layout/page-container"

export default function AdminDashboardLayout({
  children,
  hero,
  kpis,
  chart,
  pipeline,
  hub,
}: {
  children: React.ReactNode
  hero: React.ReactNode
  kpis: React.ReactNode
  chart: React.ReactNode
  pipeline: React.ReactNode
  hub: React.ReactNode
}) {
  return (
    <PageContainer
      pageTitle="Dashboard Overview"
      pageDescription="Pantau metrik, status akun, dan performa kampanye media sosial secara real-time."
    >
      <div className="space-y-6 w-full max-w-full">
        {hero}
        {kpis}
        
        {/* Two-column layout: Main (8 cols) + Connected Hub (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Chart + Bottom Cards (span 8) */}
          <div className="lg:col-span-8 space-y-6">
            {chart}
            {pipeline}
          </div>

          {/* Right: Connected Hub (span 4) */}
          <div className="lg:col-span-4">
            {hub}
          </div>
        </div>
      </div>
      {children}
    </PageContainer>
  )
}
