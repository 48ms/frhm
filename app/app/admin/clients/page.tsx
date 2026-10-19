import { Suspense } from "react"
import type { Metadata } from "next"
import { dehydrate, HydrationBoundary } from "@tanstack/react-query"
import { getQueryClient } from "@/lib/query-client"
import { socialQueries } from "@/features/social-accounts/api/queries"
import { supportTicketQueries } from "@/features/support/api/queries"
import { PageContainer } from "@/components/layout/page-container"
import {
  ClientManager,
  ClientManagerSkeleton,
  AddClientHeaderButton,
  SupportTicketsHeaderButton,
  PendingUsersHeaderButton,
} from "@/components/client/client-manager"

import { clientsParamsCache } from "@/lib/searchparams"
import type { InfobarContent } from "@/components/ui/infobar"

export const dynamic = "force-dynamic"
export const revalidate = 60  // Cache 60 detik untuk clients list

export const metadata: Metadata = {
  title: "Client Workspaces",
  description: "Kelola portofolio klien, profil brand, dan workspace multi-tenant Frhm.",
}

const clientsInfoContent: InfobarContent = {
  title: "Panduan Client Workspaces",
  sections: [
    {
      title: "Workspace Portofolio Klien",
      badge: "Multi-Tenant",
      icon: "building",
      description:
        "Setiap kartu mewakili workspace brand klien yang terisolasi. Data kampanye, analitik, dan aset media tersimpan aman dengan PostgreSQL RLS.",
    },
    {
      title: "Brand Brain & Playbooks",
      badge: "AI Strategy",
      icon: "bot",
      description:
        "Klik tombol 'Brand Brain' pada kartu klien untuk menjalankan wawancara persona suara brand, target audiens, dan guardrails konten anti-slop.",
    },
    {
      title: "Akses & Undangan Klien",
      badge: "Portal Klien",
      icon: "users",
      description:
        "Klik 'Akses Klien' untuk mengundang perwakilan brand. Pengguna klien hanya dapat mengakses portal review konten mereka sendiri (/client/*).",
    },
    {
      title: "Integrasi Kanal Sosial",
      badge: "Media Sosial",
      icon: "share",
      description:
        "Hubungkan akun Instagram, TikTok, LinkedIn, atau Facebook milik klien agar draf kalender dapat langsung diterbitkan secara otomatis.",
    },
    {
      title: "Pintasan Keyboard",
      badge: "Shortcut",
      icon: "command",
      description:
        "Tekan ⌘K / Ctrl+K untuk pencarian klien cepat. Tekan ⌘I / Ctrl+I untuk membuka atau menutup panel panduan ini kapan saja.",
    },
  ],
}

export default async function ClientsPage(
  props: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }
) {
  const { q, onboarding } = clientsParamsCache.parse(await props.searchParams)
  const queryClient = getQueryClient()

  // 1. Server-side data prefetching (Aturan #3 TanStack Query v5)
  await Promise.all([
    queryClient.prefetchQuery(socialQueries.listClientsWithChannels()),
    queryClient.prefetchQuery(supportTicketQueries.listAll()),
  ])

  return (
    <PageContainer
      pageTitle="Client Workspaces"
      pageDescription="Kelola portofolio klien, profil brand, dan pengaturan workspace multi-tenant."
      infoContent={clientsInfoContent}
      pageHeaderAction={
        <div className="flex items-center gap-2.5">
          <PendingUsersHeaderButton />
          <SupportTicketsHeaderButton />
          <AddClientHeaderButton />
        </div>
      }
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<ClientManagerSkeleton />}>
          <ClientManager />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  )
}

