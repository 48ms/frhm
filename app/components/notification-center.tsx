'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/animate-ui/components/radix/popover';
import { Tabs, TabsList, TabsTrigger } from '@/components/animate-ui/components/radix/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { motion, type Variants } from 'motion/react';
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
  initialNotifications?: NotificationItem[];
}

const notifListVariants: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
    },
  },
};

const notifItemVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 350,
      damping: 25,
    },
  },
};

export function NotificationCenter({
  role: _role = 'admin',
  initialCount = 0,
  initialNotifications,
}: NotificationCenterProps) {
  const router = useRouter();
  const [filter, setFilter] = React.useState<'all' | 'unread'>('all');

  // Faktual: state notifikasi tersinkronisasi murni dengan array notifikasi
  const [notifications, setNotifications] = React.useState<NotificationItem[]>(
    initialNotifications ?? []
  );
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  // Sinkronisasi data: jika notifications kosong, count adalah 0 (tidak ada mismatch)
  const count = notifications.length > 0 ? unreadCount : 0;

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
      <PopoverTrigger asChild>
        <Button
          variant='ghost'
          size='icon'
          className='relative size-8 text-muted-foreground hover:text-foreground'
          aria-label='Pusat Notifikasi'
        >
          <Icons.notification className='size-4' />
          {count > 0 && (
            <span className="bg-[hsl(var(--admin-cobalt))] text-primary-foreground absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-2xs font-bold shadow-xs">
              {count > 9 ? '9+' : count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='end'
        className='w-[calc(100vw-2rem)] p-0 sm:w-[380px] shadow-2xl rounded-2xl border border-border/40 overflow-hidden bg-card'
        sideOffset={8}
      >
        <div className='flex items-center justify-between px-4 py-3 bg-muted/20'>
          <div className='flex items-center gap-2'>
            <h4 className='text-sm font-semibold text-foreground'>Notifikasi</h4>
            {count > 0 && (
              <Badge variant='outline' className='text-2xs h-4.5 px-1.5 font-medium border-[hsl(var(--admin-outline-variant))] text-[hsl(var(--admin-on-surface))] bg-[hsl(var(--admin-surface-low))]'>
                {count} Baru
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs text-muted-foreground hover:text-foreground font-medium p-0 h-auto hover:bg-transparent"
            >
              Tandai semua dibaca
            </Button>
          )}
        </div>

        {/* Tab Filter */}
        <div className='border-b px-3 py-1.5 bg-background'>
          <Tabs value={filter} onValueChange={(v) => setFilter(v as 'all' | 'unread')}>
            <TabsList
              highlightClassName='rounded-md bg-muted text-foreground shadow-xs'
              className='p-0.5 bg-transparent border-0 gap-1 h-auto w-full justify-start'
            >
              <TabsTrigger
                value='all'
                className='px-2.5 py-1 text-xs rounded-md font-medium cursor-pointer data-[state=active]:text-foreground data-[state=active]:font-semibold min-h-11'
              >
                Semua
              </TabsTrigger>
              <TabsTrigger
                value='unread'
                className='px-2.5 py-1 text-xs rounded-md font-medium cursor-pointer data-[state=active]:text-foreground data-[state=active]:font-semibold min-h-11'
              >
                Belum Dibaca ({unreadCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className={cn(filteredNotifications.length === 0 ? 'h-auto' : 'h-[320px] max-h-[380px]')}>
          {mounted && filteredNotifications.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-10 px-4 text-center'>
              <div className='w-10 h-10 rounded-full bg-muted/70 flex items-center justify-center mx-auto mb-2 text-muted-foreground/60 shadow-2xs'>
                <Icons.notification className='size-5' />
              </div>
              <p className='text-sm font-semibold text-foreground'>Tidak ada notifikasi</p>
              <p className='text-xs text-muted-foreground mt-0.5 max-w-[260px] leading-relaxed'>
                Semua pembaruan sistem dan antrean telah dibaca.
              </p>
            </div>
          ) : (
            <motion.div
              variants={notifListVariants}
              initial='hidden'
              animate='show'
              className='divide-y divide-border/40'
            >
              {filteredNotifications.map((n) => (
                <motion.div
                  variants={notifItemVariants}
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
                      <span className='text-2xs text-muted-foreground shrink-0'>
                        {n.timestamp}
                      </span>
                    </div>
                    <p className='text-xs text-muted-foreground line-clamp-2 mt-0.5'>
                      {n.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
