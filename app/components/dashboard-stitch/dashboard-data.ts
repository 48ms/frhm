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
      { label: "Data Insight", value: "N/A", sub: "Menunggu data" },
    ],
    metrics: [
      { label: "Total Reach", value: "0", delta: "N/A", trend: "neutral", spark: [0, 0, 0, 0, 0, 0] },
      { label: "Engagement Rate", value: "0%", delta: "N/A", trend: "neutral", spark: [0, 0, 0, 0, 0, 0] },
      { label: "Campaign Velocity", value: "0", delta: "N/A", trend: "neutral", spark: [0, 0, 0, 0, 0, 0] },
    ]
  }

  // PENTING (fakta): gunakan `useQuery` (BUKAN `useSuspenseQuery`) dengan
  // `placeholderData`. Server prefetcher me-prefetch key berbasis clientId dari URL,
  // sedangkan `activeClientId` di sini dihitung dari daftar klien asli DB (bisa
  // berbeda). Ketika key tidak cocok, `useSuspenseQuery` akan memicu fetch SAAT
  // RENDER -> memanggil Server Action ('use server') saat render -> Next.js
  // update Router saat render -> warning React "Cannot update Router while
  // rendering". `useQuery` + `placeholderData` mengembalikan data instan tanpa
  // suspend, dan fetch tambahan berjalan di effect (setelah render).
  const { data: profileData } = useQuery({
    ...dashboardQueries.profile(activeClientId),
    placeholderData: defaultProfile,
  })

  const profile = (profileData ?? defaultProfile) as DashboardProfile

  return { clientId: activeClientId, setClientId, client, profile, clients }
}
