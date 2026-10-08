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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { socialQueries } from '@/features/social-accounts/api/queries';
import { dashboardQueries } from '@/features/dashboard/api/queries';
import { useActiveDashboard } from '@/components/dashboard-stitch/dashboard-data';

export function KBar({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setClientId } = useActiveDashboard();
  
  // Ambil data klien langsung via TanStack Query (AMAN dari useSearchParams bailout jika di luar searchParams context)
  const { data: rawClients } = useQuery({
    ...socialQueries.listClientsWithChannels(),
    staleTime: 60 * 1000,
  });

  const actions = React.useMemo(() => {
    const navigateTo = (url: string) => {
      router.push(url);
    };

    const combinedGroups = [...adminNavGroups, ...clientNavGroups];
    const navActions: Action[] = [];

    // 1. Navigation Actions
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

    // Dynamic Client Switcher Actions via URL searchParam mutation
    const clientActions: Action[] = (rawClients || []).map((client) => ({
      id: `client-${client.id}`,
      name: `Switch to Workspace: ${client.name}`,
      keywords: `switch client ${client.name}`.toLowerCase(),
      section: 'Workspaces',
      icon: <Icons.hub className='size-4' />,
      perform: () => {
        // AGENTS.md Aturan 4 (nuqs MUTLAK): state clientId WAJIB lewat
        // `useQueryState` (nuqs), bukan `new URLSearchParams` / `router.push`
        // manual. `shallow: true` default nuqs mencegah refetch server yang
        // tidak perlu → switch instan.
        // Prefetch profil dilakukan paralel agar tidak ada flash of zeros.
        void queryClient.prefetchQuery(dashboardQueries.profile(client.id));
        void setClientId(client.id);
      }
    }));

    return [...navActions, ...clientActions];
  }, [router, rawClients, queryClient, setClientId]);

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
        <KBarPositioner className='z-99999 backdrop-blur-md bg-black/40 animate-in fade-in duration-150'>
          <KBarAnimator className='relative mx-auto w-full max-w-[600px] overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-2xl backdrop-blur-2xl ring-1 ring-black/5 dark:ring-white/5'>
            {/* Search input */}
            <div className='sticky top-0 z-10 flex items-center gap-2.5 border-b border-border/40 bg-card/80 px-4 backdrop-blur-xl'>
              <Icons.search className='size-4 shrink-0 text-muted-foreground' />
              <KBarSearch
                defaultPlaceholder='Ketik perintah atau cari halaman (misal: d d untuk Dashboard)...'
                className='w-full border-none bg-transparent py-3.5 text-sm outline-none placeholder:text-muted-foreground/70 focus:ring-0'
              />
              <span className='shrink-0 rounded-md border border-border/60 bg-muted/50 px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground'>
                ESC
              </span>
            </div>

            {/* Results */}
            <div className='max-h-[340px] overflow-y-auto p-1.5'>
              <RenderResults />
            </div>

            {/* Footer hint bar */}
            <div className='flex items-center justify-between border-t border-border/40 bg-muted/20 px-3.5 py-2 text-xs text-muted-foreground'>
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
              <span className='hidden text-[10px] text-foreground/60 sm:inline'>
                FRHM Command
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
