import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { BenchmarkBoard } from "@/components/analytics/benchmark-board"
import { PageContainer } from "@/components/layout/page-container"
import { buttonVariants } from "@/components/ui/button"
import { Icons } from "@/components/icons"

export const dynamic = "force-dynamic"

export default async function BenchmarkPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login")

  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single()
  if (profile?.role !== "admin") redirect("/client/dashboard")

  return (
    <PageContainer
      pageTitle="Benchmarking Antar Klien"
      pageDescription="Bandingkan performa konten, engagement, dan konversi bisnis lintas brand klien"
      pageHeaderAction={
        <Link
          href="/admin/analytics"
          className={buttonVariants({ variant: "outline", size: "sm", className: "gap-2 text-xs" })}
        >
          <Icons.chevronLeft className="size-3.5" />
          Kembali ke Analytics
        </Link>
      }
    >
      <BenchmarkBoard />
    </PageContainer>
  )
}
