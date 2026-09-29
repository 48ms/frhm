import { PageContainer } from "@/components/layout/page-container"
import { DashboardStitchHero } from "@/components/dashboard-stitch/hero"
import { DashboardStitchKpis } from "@/components/dashboard-stitch/kpi-grid"
import { DashboardStitchChart } from "@/components/dashboard-stitch/performance-chart"
import { DashboardStitchPostPipeline } from "@/components/dashboard-stitch/post-pipeline"
import { DashboardStitchConnectedHub } from "@/components/dashboard-stitch/right-panel"

export const dynamic = "force-dynamic"

export default async function AdminDashboardStitchPage() {
  return (
    <main className="flex-1 p-6 lg:p-8 space-y-6 max-w-[1440px] mx-auto w-full">
      <DashboardStitchHero />
      <DashboardStitchKpis />

      {/* Two-column layout: Main (8 cols) + Connected Hub (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Chart + Bottom Cards (span 8) */}
        <div className="lg:col-span-8 space-y-6">
          <DashboardStitchChart />
          <DashboardStitchPostPipeline />
        </div>

        {/* Right: Connected Hub (span 4) */}
        <div className="lg:col-span-4">
          <DashboardStitchConnectedHub />
        </div>
      </div>
    </main>
  )
}
