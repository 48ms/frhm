'use client';

import type { ActionId, ActionImpl } from 'kbar';
import * as React from 'react';
import { Kbd } from '@/components/ui/kbd';
import { cn } from '@/lib/utils';

const ResultItem = React.forwardRef(
  (
    {
      action,
      active,
      currentRootActionId
    }: {
      action: ActionImpl;
      active: boolean;
      currentRootActionId: ActionId;
    },
    ref: React.Ref<HTMLDivElement>
  ) => {
    const ancestors = React.useMemo(() => {
      if (!currentRootActionId) return action.ancestors;
      const index = action.ancestors.findIndex((ancestor) => ancestor.id === currentRootActionId);
      return action.ancestors.slice(index + 1);
    }, [action.ancestors, currentRootActionId]);

    return (
      <div
        ref={ref}
        className={cn(
          'relative mx-1.5 flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm transition-all duration-150',
          active
            ? 'bg-brand-accent/10 text-foreground font-semibold ring-1 ring-inset ring-brand-accent/25'
            : 'text-foreground/90 hover:bg-muted/60'
        )}
      >
        {/* Active indicator bar (kiri) — gaya modern minimalis */}
        {active && (
          <span
            aria-hidden
            className='absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-accent'
          />
        )}

        <div className='flex min-w-0 items-center gap-2.5'>
          {action.icon && (
            <span
              className={cn(
                'flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors',
                active ? 'bg-brand-accent/15 text-brand-accent' : 'bg-muted/70 text-muted-foreground'
              )}
            >
              {action.icon}
            </span>
          )}
          <div className='flex min-w-0 flex-col'>
            <div className='flex items-center truncate text-[13px] leading-tight'>
              {ancestors.length > 0 &&
                ancestors.map((ancestor) => (
                  <React.Fragment key={ancestor.id}>
                    <span className='mr-1.5 text-xs text-muted-foreground'>{ancestor.name}</span>
                    <span className='mr-1.5 text-xs opacity-40'>&rsaquo;</span>
                  </React.Fragment>
                ))}
              <span className='truncate'>{action.name}</span>
            </div>
            {action.subtitle && (
              <span className='mt-0.5 truncate text-[11px] text-muted-foreground'>
                {action.subtitle}
              </span>
            )}
          </div>
        </div>

        {action.shortcut?.length ? (
          <div className='ml-2 grid shrink-0 grid-flow-col gap-1'>
            {action.shortcut.map((sc, i) => (
              <Kbd key={sc + i} className='uppercase' title="antislop-exception R-04: Keyboard keys UI convention">{sc}</Kbd>
            ))}
          </div>
        ) : null}
      </div>
    );
  }
);

ResultItem.displayName = 'KBarResultItem';

export default ResultItem;
