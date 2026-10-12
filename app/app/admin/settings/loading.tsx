import { Skeleton } from "@/components/ui/skeleton"
import { PageContainer } from "@/components/layout/page-container"

export default function SettingsLoading() {
  return (
    <PageContainer
      pageTitle="Settings"
      pageDescription="Konfigurasi workspace, billing & akses"
      isLoading={false}
    >
      <div className="flex flex-col gap-6">
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-28 rounded-full" />
          ))}
        </div>
        <div className="rounded-xl border border-border/60 p-6 space-y-5 bg-card/50">
          <Skeleton className="h-5 w-48" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-64" />
                </div>
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}
