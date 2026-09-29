"use client"

import { Badge } from '@/components/ui/badge'
import { PlatformIcon } from '@/components/calendar/platform-icon'
import { ScheduledPost, PLATFORMS, STATUS_CONFIG } from '@/features/calendar/types'
import { timeStr, getDotColor } from '@/features/calendar/utils'

export function PostCard({
  post,
  onClick,
  layout = 'list',
  showTimeSuffix = false,
}: {
  post: ScheduledPost
  onClick?: () => void
  layout?: 'list' | 'compact'
  showTimeSuffix?: boolean
}) {
  const statusCfg = STATUS_CONFIG[post.status] ?? STATUS_CONFIG.scheduled
  const platformInfo = PLATFORMS[post.platform]

  const platformBadge = (
    <>
      <PlatformIcon platform={post.platform} className="size-4" />
      <span className="text-xs font-semibold capitalize">
        {platformInfo?.name ?? post.platform}
      </span>
    </>
  )

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border transition-all group ${
        post.is_placeholder
          ? 'border-purple-500/40 bg-purple-500/5 hover:border-purple-500/60'
          : 'border-border/80 hover:border-primary/50 bg-card hover:bg-muted/30'
      } ${layout === 'list' ? 'p-3 flex items-center gap-4' : 'p-3 flex flex-col gap-2'}`}
    >
      {layout === 'list' ? (
        <>
          <div className="flex items-center justify-center w-10 shrink-0">
            <span className={`size-4 rounded-full ${getDotColor(post)}`} />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            {platformBadge}
          </div>
          {showTimeSuffix && (
            <span className="text-xs text-muted-foreground">{timeStr(post.scheduled_at)} WIB</span>
          )}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors truncate">
              {post.is_placeholder ? (post.reserved_for ?? 'Slot tersedia') : post.title}
            </p>
            {(post.campaign_tag || post.priority) && (
              <div className="flex items-center gap-1.5 mt-0.5">
                {post.priority && post.priority !== 'normal' && (
                  <span className={`text-[9px] font-bold uppercase px-1 rounded-sm ${
                    post.priority === 'urgent' ? 'bg-red-500 text-white' :
                    post.priority === 'high' ? 'bg-amber-500 text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {post.priority}
                  </span>
                )}
                {post.campaign_tag && (
                  <span className="text-[10px] text-muted-foreground truncate">
                    {post.campaign_tag}
                  </span>
                )}
              </div>
            )}
          </div>
          {post.is_placeholder && (
            <Badge variant="secondary" className="ml-auto text-[10px] px-2 py-0 border-purple-500/30">
              Reserved
            </Badge>
          )}
          {!post.is_placeholder && (
            <Badge className={`ml-auto text-[10px] px-2 py-0.5 border ${statusCfg.badge}`}>
              {statusCfg.label}
            </Badge>
          )}
          {(post.production_id || post.skill_output_id) && (
            <div className="flex items-center gap-1 ml-2">
              {post.production_id && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                  Prod
                </Badge>
              )}
              {post.skill_output_id && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0">
                  Skill
                </Badge>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-2 w-full">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {platformBadge}
              {showTimeSuffix && (
                <span className="text-xs text-muted-foreground">• {timeStr(post.scheduled_at)} WIB</span>
              )}
              {post.is_placeholder && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 border-purple-500/30">
                  Reserved
                </Badge>
              )}
            </div>
            {!post.is_placeholder && (
              <Badge className={`text-[10px] px-2 py-0.5 border ${statusCfg.badge}`}>
                {statusCfg.label}
              </Badge>
            )}
          </div>
          <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">
            {post.is_placeholder ? (post.reserved_for ?? 'Slot tersedia') : post.title}
          </p>
          {post.is_placeholder && post.reserved_for && (
            <p className="text-[11px] text-purple-600 dark:text-purple-400">
              Untuk kampanye: {post.reserved_for}
            </p>
          )}
          {!post.is_placeholder && post.content && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {post.content}
            </p>
          )}
          {post.deliverables?.title && (
            <p className="text-[10px] text-muted-foreground/80 bg-muted px-2 py-1 rounded">
              Deliverable: {post.deliverables.title}
            </p>
          )}
        </div>
      )}
    </button>
  )
}
