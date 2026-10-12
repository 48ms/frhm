'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from '@/components/ui/command'
import { Button } from '@/components/ui/button'
import { KbdCombo } from '@/components/spectrumui/kbd-key'
import { useCreateClient } from '@/components/client/create-client-provider'
import { Icons } from '@/components/icons'
import { cn } from '@/lib/utils'

type ClientHit = { id: string; name: string }

interface AdminCommandSearchProps {
  className?: string
}

// NOTE (fact): the /admin/deliverables* routes were removed in commit 3e36ff3,
// so this palette no longer offers deliverable search or deep links. Client
// results scope the shared dashboard via the ?clientId= query param (nuqs).
export function AdminCommandSearch({ className }: AdminCommandSearchProps) {
  const router = useRouter()
  const supabase = createClient()
  const { openCreateClient } = useCreateClient()
  const [open, setOpen] = useState(false)
  const [clients, setClients] = useState<ClientHit[]>([])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((o) => !o)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const load = useCallback(async () => {
    const { data: c } = await supabase.from('clients').select('id, name').order('name')
    setClients((c ?? []) as ClientHit[])
  }, [supabase])

  useEffect(() => { if (open) load() }, [open, load])

  const go = (path: string) => { setOpen(false); router.push(path) }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        aria-label="Cari client"
        className={cn(
          "h-9 w-full justify-start gap-2 rounded-full border-white/60 bg-[hsl(var(--admin-surface-lowest))]/70 pl-4 pr-3 text-muted-foreground shadow-sm backdrop-blur-sm sm:w-72",
          className
        )}
      >
        <Icons.search className="size-4" />
        <span className="text-sm">Cari...</span>
        <span className="ml-auto hidden sm:block">
          <KbdCombo keys="meta+k" listen={false} size="sm" />
        </span>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Cari client..." />
        <CommandList>
          <CommandEmpty>Tidak ada hasil.</CommandEmpty>

          <CommandGroup heading="Aksi">
            <CommandItem onSelect={() => { setOpen(false); openCreateClient() }}>
              <Icons.sparkles className="size-4 text-brand-accent" />
              Tambah Client Baru
            </CommandItem>
            <CommandItem onSelect={() => go('/admin/clients')}>
              <Icons.building2 className="size-4" />
              Kelola Client
            </CommandItem>
            <CommandItem onSelect={() => go('/admin/settings')}>
              <Icons.settings className="size-4" />
              Pengaturan Sistem
            </CommandItem>
          </CommandGroup>

          {clients.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Client">
                {clients.map((c) => (
                  <CommandItem key={c.id} value={`client ${c.name}`} onSelect={() => go(`/admin/dashboard?clientId=${c.id}`)}>
                    <Icons.building2 className="size-4" />
                    {c.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  )
}
