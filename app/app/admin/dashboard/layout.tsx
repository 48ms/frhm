import { PageContainer } from "@/components/layout/page-container"
import type { InfobarContent } from "@/components/ui/infobar"

const dashboardInfoContent: InfobarContent = {
  title: "Panduan Dashboard Overview",
  sections: [
    {
      title: "Metrik Utama & KPI Grid",
      badge: "Real-Time",
      icon: "chart",
      description:
        "Memantau jangkauan impresi, laju keterlibatan (engagement rate), dan aktivitas kanal sosial klien yang sedang aktif.",
    },
    {
      title: "Pipeline Publikasi Konten",
      badge: "Kalender",
      icon: "calendar",
      description:
        "Memperlihatkan jadwal tayang terdekat hari ini dan minggu ini. Anda dapat langsung mengedit atau menerbitkan draf dari widget ini.",
    },
    {
      title: "Hub Saluran Terhubung",
      badge: "Konektivitas",
      icon: "share",
      description:
        "Status sinkronisasi akun Instagram, TikTok, LinkedIn, dan Facebook. Memastikan token OAuth pihak ketiga selalu aktif.",
    },
    {
      title: "Pintasan Keyboard",
      badge: "Shortcut",
      icon: "command",
      description:
        "Tekan ⌘K / Ctrl+K untuk pencarian cepat, atau ⌘I / Ctrl+I untuk buka/tutup panel panduan ini.",
    },
  ],
}

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
      infoContent={dashboardInfoContent}
    >
      <div className="flex flex-col gap-6 w-full max-w-full">
        {hero}
        {kpis}
        
        {/* Two-column layout: Main (8 cols) + Connected Hub (4 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Chart + Bottom Cards (span 8) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
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
