"use client"

import { useQueryState } from "nuqs"
import { useQuery, useSuspenseQuery } from "@tanstack/react-query"
import { dashboardQueries } from "@/features/dashboard/api/queries"
import { dashboardSearchParams } from "@/features/dashboard/lib/searchparams"
import { socialQueries } from "@/features/social-accounts/api/queries"
import type { DashboardProfile } from "@/features/dashboard/api/types"
import type { ClientWithChannels } from "@/features/social-accounts/api/types"

export function useActiveDashboard() {
  const [clientId, setClientId] = useQueryState(
    "clientId",
    dashboardSearchParams.clientId
  )
  
  // Mengambil daftar clients (diasumsikan client list sudah di-prefetch di server)
  const { data: clientsData } = useSuspenseQuery(socialQueries.listClientsWithChannels())
  const clients = clientsData || []
  
  // Memastikan fallback jika clientId tidak valid (atau dihapus)
  const activeClientId = clients.some(c => c.id === clientId) 
    ? clientId 
    : (clients[0]?.id ?? "11111111-1111-1111-1111-111111111111")
    
  const foundClient = clients.find(c => c.id === activeClientId)
  const client: ClientWithChannels = foundClient ?? {
    id: activeClientId,
    name: "New Client",
    contact_email: null,
    contact_phone: null,
    brand_profile: {
      who: "", audience: "", voice: "", pov: "", proof: "", guardrails: "", pillars: [],
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    channels: [],
  }
  
  // Fallback safe profile jika database belum memiliki row dashboard_profiles
  const defaultProfile: DashboardProfile = {
    id: "fallback",
    client_id: activeClientId,
    greeting: "Good day, Creator.",
    velocity: 98,
    peak_label: "Peak Performance",
    peak_value: "99.4%",
    charts: {
      "7d": { reach: "M0 50 L100 40 L200 60 L300 30", engage: "M0 70 L100 50 L200 40 L300 20" },
      "30d": { reach: "M0 50 L100 40 L200 60 L300 30", engage: "M0 70 L100 50 L200 40 L300 20" },
      "90d": { reach: "M0 50 L100 40 L200 60 L300 30", engage: "M0 70 L100 50 L200 40 L300 20" },
    },
    insights: [
      { label: "Short Reels Surge", value: "94-100", sub: "Top cohort" },
      { label: "Sentiment Index", value: "98.2%", sub: "Positive" },
    ],
    metrics: [
      { label: "Total Reach", value: "248.5K", delta: "+12.4%", trend: "up", spark: [20, 40, 30, 70, 50, 90] },
      { label: "Engagement Rate", value: "6.8%", delta: "+1.2%", trend: "up", spark: [10, 30, 50, 40, 80, 70] },
      { label: "Campaign Velocity", value: "98/100", delta: "+4.5%", trend: "up", spark: [50, 60, 40, 70, 90, 85] },
    ]
  }

  // PENTING (fakta): gunakan `useQuery` (BUKAN `useSuspenseQuery`) dengan
  // `initialData`. Server prefetcher me-prefetch key berbasis clientId dari URL,
  // sedangkan `activeClientId` di sini dihitung dari daftar klien asli DB (bisa
  // berbeda). Ketika key tidak cocok, `useSuspenseQuery` akan memicu fetch SAAT
  // RENDER -> memanggil Server Action ('use server') saat render -> Next.js
  // update Router saat render -> warning React "Cannot update Router while
  // rendering". `useQuery` + `initialData` mengembalikan data instan tanpa
  // suspend, dan fetch tambahan berjalan di effect (setelah render).
  const { data: profileData } = useQuery({
    ...dashboardQueries.profile(activeClientId),
    initialData: defaultProfile,
  })

  const profile = (profileData ?? defaultProfile) as DashboardProfile

  return { clientId: activeClientId, setClientId, client, profile, clients }
}
