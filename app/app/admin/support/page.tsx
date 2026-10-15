import * as React from "react"
import { SupportView } from "@/components/support/support-view"

export const dynamic = "force-dynamic"

export const metadata = {
  title: "Support & Help Center | Frahma",
  description: "Pusat bantuan teknis, tiket prioritas, dan dokumentasi operasional platform Frahma.",
}

export default function SupportPage() {
  return (
    <React.Suspense
      fallback={<div className="p-8 text-muted-foreground">Memuat Pusat Dukungan...</div>}
    >
      <SupportView />
    </React.Suspense>
  )
}
