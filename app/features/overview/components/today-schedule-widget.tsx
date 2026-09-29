import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Icons } from "@/components/icons"
import type { TodayScheduledPost } from "../api/types"

interface TodayScheduleWidgetProps {
  posts: TodayScheduledPost[]
}

export function TodayScheduleWidget({ posts }: TodayScheduleWidgetProps) {
  return (
    <Card className="rounded-2xl border-brand-accent/20 bg-brand-accent/5 shadow-sm">
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base flex items-center gap-2 font-bold">
            <Icons.calendar className="size-4 text-brand-accent" />
            Jadwal Tayang Hari Ini
          </CardTitle>
          <CardDescription className="font-medium mt-1">
            {posts.length
              ? `${posts.length} konten harus tayang hari ini`
              : "Tidak ada jadwal tayang hari ini"}
          </CardDescription>
        </div>
        <Link href="/admin/calendar">
          <Button
            variant="outline"
            size="sm"
            className="h-10 sm:h-9 gap-1 rounded-xl bg-background shadow-sm border-border/50 hover:border-brand-accent/50 hover:text-brand-accent transition-colors"
          >
            Kalender <Icons.chevronRight className="size-3" />
          </Button>
        </Link>
      </CardHeader>
      {posts.length > 0 && (
        <CardContent className="pt-0">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => {
              const time = new Date(post.scheduled_at).toLocaleTimeString("id-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })
              return (
                <div
                  key={post.id}
                  className="flex flex-col gap-2 rounded-xl border border-border/50 bg-background/80 shadow-sm p-4 hover:border-brand-accent/40 transition-colors group"
                >
                  <div className="flex items-center justify-between">
                    <Badge
                      variant="outline"
                      className="text-xs font-semibold tabular-nums text-muted-foreground group-hover:text-foreground"
                    >
                      {time}
                    </Badge>
                    <div className="flex items-center gap-1.5">
                      {Boolean(post.publish_retry_count && post.publish_retry_count > 0) && (
                        <Badge
                          variant="outline"
                          className="text-[10px] font-bold tracking-wide border-amber-500/40 bg-amber-500/10 text-amber-600"
                        >
                          Retry {post.publish_retry_count}/3
                        </Badge>
                      )}
                      <Badge
                        variant={post.status === "failed" ? "destructive" : "secondary"}
                        className="text-[10px] uppercase font-bold tracking-wider bg-brand-accent/10 text-brand-accent border-none"
                      >
                        {post.platform}
                      </Badge>
                    </div>
                  </div>
                  <div className="mt-1">
                    <p className="text-sm font-semibold leading-tight line-clamp-2">{post.title}</p>
                    <p className="text-xs text-muted-foreground mt-1.5 font-medium">
                      {post.client_name}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
