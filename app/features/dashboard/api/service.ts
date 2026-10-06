'use server'

import { createClient } from "@/lib/supabase/server"
import type { DashboardProfile } from "./types"

/**
 * Service Layer untuk Dashboard
 * Mengambil data analitik dan profil klien secara faktual dari PostgreSQL
 */

export async function getDashboardProfile(clientId: string): Promise<DashboardProfile | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("dashboard_profiles")
    .select("*")
    .eq("client_id", clientId)
    .single()
    
  // Catatan faktual: service ini dipanggil dari `useSuspenseQuery` saat render
  // (lihat components/dashboard-stitch/dashboard-data.ts). Jika kita `throw`,
  // React Query akan me-reject promise saat render dan memicu warning
  // "Cannot update a component (Router) while rendering". Karena itu kita
  // degrade gracefully: kembalikan null agar konsumen memakai fallback profile.
  if (error) {
    if (error.code === 'PGRST116') return null // Not found (belum ada row)
    // Error lain (mis. JWT/network) juga tidak boleh melempar dari render.
    console.error("[getDashboardProfile] Supabase error:", error.message)
    return null
  }

  return data as DashboardProfile
}
