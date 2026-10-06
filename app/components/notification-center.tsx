'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type?: 'approval' | 'deliverable' | 'system';
  href?: string;
}

interface NotificationCenterProps {
  role?: 'admin' | 'client';
  initialCount?: number;
}

export function NotificationCenter({ role = 'admin', initialCount = 0 }: NotificationCenterProps) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<'all' | 'unread'>('all');

  // Faktual: Fitur notifikasi di database / realtime belum diimplementasikan, state mulai kosong
  const [notifications, setNotifications] = React.useState<NotificationItem[]>([]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const count = initialCount > 0 ? initialCount : unreadCount;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleItemClick = (item: NotificationItem) => {
    markAsRead(item.id);
    if (item.href) {
      router.push(item.href);
    }
  };

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant='ghost'
            size='icon'
            className='relative size-8 text-muted-foreground hover:text-foreground'
            aria-label='Pusat Notifikasi'
          />
        }
      >
        <Icons.notification className='size-4' />
        {count > 0 && (
          <span className="bg-[hsl(var(--admin-cobalt))] text-white absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold shadow-xs">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent
        align='end'
        className='w-[calc(100vw-2rem)] p-0 sm:w-[380px] shadow-xl rounded-xl border border-border/70 overflow-hidden'
        sideOffset={8}
      >
        <div className='flex items-center justify-between px-4 py-3 bg-muted/20'>
          <div className='flex items-center gap-2'>
            <h4 className='text-sm font-semibold text-foreground'>Notifikasi</h4>
            {count > 0 && (
              <Badge variant='outline' className='text-[10px] h-4.5 px-1.5 font-medium border-[hsl(var(--admin-outline-variant))] text-[hsl(var(--admin-on-surface))] bg-[hsl(var(--admin-surface-low))]'>
                {count} Baru
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className='text-xs text-muted-foreground hover:text-foreground font-medium transition-colors'
            >
              Tandai semua dibaca
            </button>
          )}
        </div>

        {/* Tab Filter */}
        <div className='flex items-center gap-1 border-b px-3 py-1.5 bg-background'>
          <button
            onClick={() => setFilter('all')}
            className={cn(
              'px-2.5 py-1 text-xs rounded-md transition-colors font-medium',
              filter === 'all'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Semua
          </button>
          <button
            onClick={() => setFilter('unread')}
            className={cn(
              'px-2.5 py-1 text-xs rounded-md transition-colors font-medium',
              filter === 'unread'
                ? 'bg-muted text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            Belum Dibaca ({unreadCount})
          </button>
        </div>

        <ScrollArea className='h-[300px]'>
          {filteredNotifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 px-4 text-center'>
              <Icons.notification className='size-8 text-muted-foreground/30 mb-2' />
              <p className='text-sm font-medium text-muted-foreground'>Tidak ada notifikasi</p>
              <p className='text-xs text-muted-foreground/70 mt-0.5'>
                Semua pembaruan sistem dan antrean telah dibaca.
              </p>
            </div>
          ) : (
            <div className='divide-y divide-border/40'>
              {filteredNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleItemClick(n)}
                  className={cn(
                    'flex items-start gap-3 p-3.5 cursor-pointer transition-colors hover:bg-muted/40 text-left',
                    !n.read && 'bg-brand-accent/5'
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 size-2 rounded-full shrink-0',
                      !n.read ? 'bg-brand-accent' : 'bg-transparent'
                    )}
                  />
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center justify-between gap-1'>
                      <p
                        className={cn(
                          'text-xs font-semibold truncate',
                          !n.read ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {n.title}
                      </p>
                      <span className='text-[10px] text-muted-foreground shrink-0'>
                        {n.timestamp}
                      </span>
                    </div>
                    <p className='text-xs text-muted-foreground line-clamp-2 mt-0.5'>
                      {n.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
