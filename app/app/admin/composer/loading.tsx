import { Skeleton } from "@/components/ui/skeleton"
import { PageContainer } from "@/components/layout/page-container"

export default function ComposerLoading() {
  return (
    <PageContainer
      pageTitle="Content Composer"
      pageDescription="Menyusun konten & jadwal publikasi..."
      isLoading={false}
    >
      <div className="space-y-6 max-w-[1200px]">
        {/* Stepper skeleton */}
        <div className="p-6 rounded-2xl bg-card/50 border border-border/40">
          <div className="flex items-center justify-between relative">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex flex-col items-center gap-2 w-full">
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <div>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-2 w-20 hidden sm:block" />
                </div>
              </div>
            ))}
            <div className="absolute top-6 left-0 w-full h-[2px] bg-border/40 -z-10 px-[10%]" />
          </div>
        </div>

        {/* Editor area skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 p-6 rounded-2xl bg-card/50 border border-border/40 min-h-[500px] space-y-5">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <div className="flex gap-2 p-1 bg-muted/50 rounded-lg">
              <Skeleton className="flex-1 h-8 rounded-md" />
              <Skeleton className="flex-1 h-8 rounded-md" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-40 w-full rounded-lg" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-32" />
              <div className="h-32 rounded-xl border-2 border-dashed border-border/40 bg-muted/30" />
            </div>
          </div>

          {/* Sidebar skeleton */}
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 rounded-xl bg-card/50 border border-border/40 space-y-2">
                <div className="flex items-start gap-3">
                  <Skeleton className="w-8 h-8 rounded-lg shrink-0" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2.5 w-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
