import { Skeleton } from "@/components/ui/skeleton"
import { PageContainer } from "@/components/layout/page-container"

export default function AiStudioLoading() {
  return (
    <PageContainer
      pageTitle="AI Creative Studio & Strategy Hub"
      pageDescription="Memuat instrumen kecerdasan buatan Frhm..."
      isLoading={false}
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full" />
          ))}
        </div>
        <div className="rounded-2xl border border-border/40 p-6 bg-card/60">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-24 w-full rounded-xl mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton key="s1" className="h-40 rounded-xl" />
            <Skeleton key="s2" className="h-40 rounded-xl" />
            <Skeleton key="s3" className="h-40 rounded-xl" />
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
