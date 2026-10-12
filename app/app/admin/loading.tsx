import { Skeleton } from "@/components/ui/skeleton"
import { PageContainer } from "@/components/layout/page-container"

export default function AdminRootLoading() {
  return (
    <PageContainer
      pageTitle="Frhm Admin Dashboard"
      pageDescription="Memuat ringkasan operasional dan analitik client..."
      isLoading={false}
    >
      <div className="flex flex-col gap-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/60 p-4 space-y-3 bg-card/50">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border/60 p-6 space-y-4 bg-card/50">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </PageContainer>
  )
}
