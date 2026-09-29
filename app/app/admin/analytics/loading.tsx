import { Skeleton } from "@/components/ui/skeleton"
import { PageContainer } from "@/components/layout/page-container"

export default function AnalyticsLoading() {
  return (
    <PageContainer
      pageTitle="Analytics & Insights"
      pageDescription="Memuat data performa campaign dan korelasi konten..."
      isLoading={false}
    >
      <div className="flex flex-col gap-6">
        {/* Metric Cards Skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/60 p-4 space-y-3 bg-card/50">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>

        {/* Section Header Skeleton */}
        <div className="flex items-center justify-between mt-2">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-44" />
            <Skeleton className="h-3.5 w-60" />
          </div>
          <Skeleton className="h-8 w-40" />
        </div>

        {/* Campaign Cards Skeleton */}
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/60 p-5 space-y-4 bg-card/50">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-3 w-36" />
                </div>
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <div className="grid grid-cols-4 gap-4 pt-3 border-t border-border/40">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageContainer>
  )
}