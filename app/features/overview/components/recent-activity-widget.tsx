import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { ActionCenterWidget } from "@/components/dashboard/action-center-widget"
import { Icons } from "@/components/icons"
import type { ActivitySlotData } from "../api/types"

interface RecentActivityWidgetProps {
  data: ActivitySlotData
}

export function RecentActivityWidget({ data }: RecentActivityWidgetProps) {
  const { tasks, recentDeliverables, activityItems } = data

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-border/40 shadow-sm bg-card/50 overflow-hidden">
        <ActionCenterWidget initialTasks={tasks} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-2xl border-border/40 shadow-sm bg-card/50 backdrop-blur-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Deliverable Terbaru
            </h3>
            <Link
              href="/admin/deliverables"
              className="text-xs font-semibold text-brand-accent hover:underline flex items-center gap-1"
            >
              Lihat semua <Icons.chevronRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="pt-0 flex-1">
            {recentDeliverables.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Icons.page className="size-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">
                  Belum ada deliverable.
                </p>
                <Link
                  href="/admin/deliverables/new"
                  className="mt-2 text-sm font-semibold text-brand-accent hover:underline"
                >
                  Buat yang pertama
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border/40">
                {recentDeliverables.map((d) => (
                  <Link
                    key={d.id}
                    href={`/admin/deliverables/${d.id}`}
                    className="-mx-4 flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50 group"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground group-hover:text-brand-accent transition-colors">
                        {d.title}
                      </p>
                      <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-0.5">
                        {d.type}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border/40 shadow-sm bg-card/50 backdrop-blur-sm flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Aktivitas Terbaru
            </h3>
            <Link
              href="/admin/audit"
              className="text-xs font-semibold text-brand-accent hover:underline flex items-center gap-1"
            >
              Audit log <Icons.chevronRight className="size-3" />
            </Link>
          </CardHeader>
          <CardContent className="pt-0 space-y-3.5 flex-1">
            {activityItems.length > 0 ? (
              activityItems.map((item) => (
                <div key={item.id || item.title} className="flex items-start gap-3.5 text-sm group">
                  <div className="mt-1 size-2 rounded-full bg-brand-accent/50 group-hover:bg-brand-accent group-hover:scale-125 transition-all" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      {item.description}
                    </p>
                  </div>
                  <time className="text-xs font-semibold text-muted-foreground tabular-nums whitespace-nowrap bg-muted/50 px-2 py-0.5 rounded-md">
                    {item.timeAgo}
                  </time>
                </div>
              ))
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center">
                <div className="size-12 rounded-full bg-muted flex items-center justify-center mb-3">
                  <Icons.history className="size-6 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground max-w-[200px]">
                  Belum ada aktivitas. Perubahan status deliverable akan tampil di sini.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
