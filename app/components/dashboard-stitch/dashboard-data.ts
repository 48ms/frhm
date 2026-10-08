"use client"

import { useQueryState } from "nuqs"
import { useQuery } from "@tanstack/react-query"
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
  
  // Mengambil daftar clients. Server prefetcher (DashboardPrefetcher atau
  // prefetchQuery di tiap page) me-prefetch `socialKeys.clients()`.
  // PENTING (fakta): gunakan `useQuery` (BUKAN `useSuspenseQuery`) dengan
  // `placeholderData`. Alasan sama persis dengan query profile di bawah:
  // ketika key tidak ada di cache (misalnya halaman ini dirender di luar
  // DashboardPrefetcher, atau prefetch berjalan paralel belum selesai),
  // `useSuspenseQuery` memicu fetch SAAT RENDER -> memanggil Server Action
  // ('use server') saat render -> Next.js update Router saat render ->
  // warning React "Cannot update Router while rendering a different
  // component" + SSR gagal ("Server Functions cannot be called during
  // initial render... fetch waterfall"). `useQuery` + `placeholderData`
  // mengembalikan data instan tanpa suspend, fetch tambahan berjalan di
  // effect (setelah render).
  const { data: clientsData } = useQuery({
    ...socialQueries.listClientsWithChannels(),
    placeholderData: [],
  })
  const clients = clientsData ?? []
  
  // Memastikan fallback jika clientId tidak valid (atau dihapus)
  // Tidak ada lagi ID Sentinel 1111... — gunakan ID klien pertama yang sah
  const activeClientId = clients.some(c => c.id === clientId) 
    ? clientId 
    : clients[0]?.id
    
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
  
  // Fallback aman saat database belum memiliki row dashboard_profiles.
  // PENTING: nilai di sini HARUS netral (nol/kosong), bukan angka contoh.
  // Angka seperti velocity 98 / peak 99.4% adalah fabrikasi (R-17/R-38): saat
  // row belum ada, UI akan menampilkan metrik palsu seolah data nyata.
  // Skema 053 menetapkan DEFAULT 0 / '0%' , fallback ini harus konsisten.
  const defaultProfile: DashboardProfile = {
    id: "fallback",
    client_id: activeClientId,
    greeting: "Good day, Creator.",
    velocity: 0,
    peak_label: "Peak Performance",
    peak_value: "0%",
    charts: {
      "7d": { reach: "", engage: "" },
      "30d": { reach: "", engage: "" },
      "90d": { reach: "", engage: "" },
    },
    insights: [],
    metrics: [
      { label: "Total Reach", value: "0", delta: "N/A", trend: "neutral", spark: [0, 0, 0, 0, 0, 0] },
      { label: "Engagement Rate", value: "0%", delta: "N/A", trend: "neutral", spark: [0, 0, 0, 0, 0, 0] },
      { label: "Campaign Velocity", value: "0", delta: "N/A", trend: "neutral", spark: [0, 0, 0, 0, 0, 0] },
    ],
    updated_at: new Date().toISOString(),
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
