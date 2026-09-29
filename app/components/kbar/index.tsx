'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarSearch,
  useRegisterActions,
  type Action
} from 'kbar';
import { Kbd } from '@/components/ui/kbd';
import { Icons } from '@/components/icons';
import { adminNavGroups, clientNavGroups } from '@/config/nav-config';
import RenderResults from './render-result';

export function KBar({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const actions = React.useMemo(() => {
    const navigateTo = (url: string) => {
      router.push(url);
    };

    const combinedGroups = [...adminNavGroups, ...clientNavGroups];
    const navActions: Action[] = [];

    combinedGroups.forEach((group) => {
      group.items.forEach((item) => {
        if (item.url && item.url !== '#') {
          const IconComponent = item.icon ? Icons[item.icon as keyof typeof Icons] : undefined;
          navActions.push({
            id: `nav-${item.url}`,
            name: item.title,
            shortcut: item.shortcut,
            keywords: `${item.title} ${group.label}`.toLowerCase(),
            section: group.label || 'Navigasi',
            subtitle: `Buka halaman ${item.title}`,
            icon: IconComponent ? <IconComponent className='size-4' /> : undefined,
            perform: () => navigateTo(item.url)
          });
        }
      });
    });

    return navActions;
  }, [router]);

  return (
    <KBarProvider actions={actions}>
      <KBarComponent>{children}</KBarComponent>
    </KBarProvider>
  );
}

function KBarComponent({ children }: { children: React.ReactNode }) {
  const { setTheme } = useTheme();

  const themeActions: Action[] = React.useMemo(
    () => [
      {
        id: 'theme-light',
        name: 'Ganti ke Mode Terang (Light)',
        keywords: 'light terang putih tema theme',
        section: 'Tema Visual',
        icon: <Icons.sun className='size-4' />,
        perform: () => setTheme('light')
      },
      {
        id: 'theme-dark',
        name: 'Ganti ke Mode Gelap (Dark)',
        keywords: 'dark gelap hitam tema theme',
        section: 'Tema Visual',
        icon: <Icons.moon className='size-4' />,
        perform: () => setTheme('dark')
      }
    ],
    [setTheme]
  );

  useRegisterActions(themeActions, [setTheme]);

  return (
    <>
      <KBarPortal>
        <KBarPositioner className='bg-black/40 backdrop-blur-xs fixed inset-0 z-99999 flex items-start! justify-center p-4! pt-[12vh]!'>
          <KBarAnimator className='bg-background text-foreground ring-border/50 relative mx-auto w-full max-w-[620px] overflow-hidden rounded-xl shadow-2xl ring-1'>
            <div className='bg-background sticky top-0 z-10 flex items-center border-b px-3.5'>
              <Icons.search className='size-4 shrink-0 text-muted-foreground mr-2.5' />
              <KBarSearch
                defaultPlaceholder='Ketik perintah atau cari halaman (misal: d d untuk Dashboard)...'
                className='placeholder:text-muted-foreground w-full border-none bg-transparent py-3.5 text-sm outline-none focus:ring-0'
              />
            </div>
            <div className='h-[340px] overflow-y-auto'>
              <RenderResults />
            </div>
            <div className='bg-muted/30 text-muted-foreground flex items-center justify-between border-t px-3.5 py-2 text-xs'>
              <div className='flex items-center gap-3'>
                <span className='flex items-center gap-1'>
                  <Kbd>↑</Kbd>
                  <Kbd>↓</Kbd> navigasi
                </span>
                <span className='flex items-center gap-1'>
                  <Kbd>↵</Kbd> buka
                </span>
                <span className='flex items-center gap-1'>
                  <Kbd>esc</Kbd> tutup
                </span>
              </div>
              <span className='text-[10px] text-muted-foreground/60 hidden sm:inline'>
                Shortcut 2-huruf aktif di mana saja
              </span>
            </div>
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </>
  );
}

export default KBar;
