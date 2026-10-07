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
          'relative mx-1.5 flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors',
          active ? 'bg-accent text-accent-foreground font-medium' : 'text-foreground hover:bg-muted/50'
        )}
      >
        <div className='flex items-center gap-2.5 truncate'>
          {action.icon && <span className='shrink-0 opacity-80'>{action.icon}</span>}
          <div className='flex flex-col truncate'>
            <div className='truncate'>
              {ancestors.length > 0 &&
                ancestors.map((ancestor) => (
                  <React.Fragment key={ancestor.id}>
                    <span className='text-muted-foreground mr-1.5 text-xs'>{ancestor.name}</span>
                    <span className='mr-1.5 text-xs opacity-40'>&rsaquo;</span>
                  </React.Fragment>
                ))}
              <span>{action.name}</span>
            </div>
            {action.subtitle && (
              <span className='text-muted-foreground text-[11px] truncate'>{action.subtitle}</span>
            )}
          </div>
        </div>
        {action.shortcut?.length ? (
          <div className='grid grid-flow-col gap-1 shrink-0 ml-2'>
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
