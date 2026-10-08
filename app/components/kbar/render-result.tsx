'use client';

import * as React from 'react';
import { KBarResults, useMatches } from 'kbar';
import ResultItem from './result-item';

export default function RenderResults() {
  const { results, rootActionId } = useMatches();

  if (!results.length) {
    return (
      <div className='text-muted-foreground flex h-full items-center justify-center px-4 text-center text-sm'>
        Tidak ada aksi atau menu yang cocok.
      </div>
    );
  }

  return (
    <KBarResults
      items={results}
      onRender={({ item, active }) =>
        typeof item === 'string' ? (
          <div className='px-3.5 pb-1 pt-3 text-[10px] font-bold tracking-wider text-muted-foreground/80 uppercase'>
            {item}
          </div>
        ) : (
          <ResultItem action={item} active={active} currentRootActionId={rootActionId ?? ''} />
        )
      }
    />
  );
}
