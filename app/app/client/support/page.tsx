import * as React from "react"
import type { Metadata } from "next"
import { SupportView } from "@/components/support/support-view"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Agency Support Hotline | Frhm Partner Portal",
  description: "Pusat bantuan langsung, pengajuan tiket request mendesak, dan koordinasi dengan tim Frhm.",
}

export default function ClientSupportPage() {
  return (
    <React.Suspense
      fallback={<div className="p-8 text-muted-foreground text-sm">Memuat Hotline Bantuan...</div>}
    >
      <SupportView />
    </React.Suspense>
  )
}
