import * as React from 'react';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <Icons.spinner
      data-slot='spinner'
      role='status'
      aria-label='Loading'
      className={cn('size-4 animate-spin', className)}
      {...props}
    />
  );
}

export { Spinner };
