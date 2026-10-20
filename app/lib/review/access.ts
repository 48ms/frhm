import { createClient } from "@/lib/supabase/server"
import { createSupabaseServiceClient } from "@/lib/supabase/service"
import { verifyReviewToken } from "./token"

export async function authorizeReviewAccess(
  deliverableId: string,
  reviewToken?: string
): Promise<boolean> {
  if (!deliverableId) return false
  if (verifyReviewToken(deliverableId, reviewToken)) return true

  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return false

    const { data: profile } = await supabase
      .from("users")
      .select("role, client_id")
      .eq("id", user.id)
      .maybeSingle()

    if (!profile?.role) return false
    if (profile.role === "admin") return true
    if (profile.role !== "client" || !profile.client_id) return false

    const service = createSupabaseServiceClient()
    const { data: deliverable } = await service
      .from("deliverables")
      .select("client_id")
      .eq("id", deliverableId)
      .maybeSingle()

    return deliverable?.client_id === profile.client_id
  } catch {
    return false
  }
}
