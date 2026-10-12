import { Skeleton } from "@/components/ui/skeleton"
import { PageContainer } from "@/components/layout/page-container"

export default function AdminDashboardLoading() {
  return (
    <PageContainer
      pageTitle="Overview Dashboard"
      pageDescription="Memuat metrik utama dan aktivitas client..."
      isLoading={false}
    >
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/60 p-4 space-y-3 bg-card/50">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-3 w-36" />
            </div>
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-border/60 p-6 space-y-4 bg-card/50">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="rounded-xl border border-border/60 p-6 space-y-4 bg-card/50">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
