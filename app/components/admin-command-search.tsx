'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator,
} from '@/components/ui/command'
import { StatusBadge } from '@/components/deliverable/status-badge'
import { Button } from '@/components/ui/button'
import { KbdCombo } from '@/components/spectrumui/kbd-key'
import { useCreateClient } from '@/components/client/create-client-provider'
import { SearchIcon, FileTextIcon, Building2Icon, PlusIcon, Settings2Icon, Sparkles } from 'lucide-react'

type DeliverableHit = { id: string; title: string; status: 'draft' | 'sent' | 'approved' | 'revision_requested' }
type ClientHit = { id: string; name: string }

export function AdminCommandSearch() {
  const router = useRouter()
  const supabase = createClient()
  const { openCreateClient } = useCreateClient()
  const [open, setOpen] = useState(false)
  const [deliverables, setDeliverables] = useState<DeliverableHit[]>([])
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
    const [{ data: d }, { data: c }] = await Promise.all([
      supabase.from('deliverables').select('id, title, status').order('updated_at', { ascending: false }).limit(50),
      supabase.from('clients').select('id, name').order('name'),
    ])
    setDeliverables((d ?? []) as DeliverableHit[])
    setClients((c ?? []) as ClientHit[])
  }, [supabase])

  useEffect(() => { if (open) load() }, [open, load])

  const go = (path: string) => { setOpen(false); router.push(path) }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        aria-label="Cari deliverable atau client"
        className="ml-auto h-11 sm:h-9 w-full justify-start gap-2 text-muted-foreground sm:w-64"
      >
        <SearchIcon className="size-4" />
        <span className="text-sm">Cari...</span>
        <span className="ml-auto hidden sm:block">
          <KbdCombo keys="meta+k" listen={false} size="sm" />
        </span>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Cari deliverable atau client..." />
        <CommandList>
          <CommandEmpty>Tidak ada hasil.</CommandEmpty>

          <CommandGroup heading="Aksi">
            <CommandItem onSelect={() => { setOpen(false); openCreateClient() }}>
              <Sparkles className="size-4 text-brand-accent" />
              Tambah Client Baru
            </CommandItem>
            <CommandItem onSelect={() => go('/admin/deliverables/new')}>
              <PlusIcon className="size-4" />
              Deliverable Baru
            </CommandItem>
            <CommandItem onSelect={() => go('/admin/clients')}>
              <Building2Icon className="size-4" />
              Kelola Client
            </CommandItem>
            <CommandItem onSelect={() => go('/admin/settings')}>
              <Settings2Icon className="size-4" />
              Pengaturan Sistem
            </CommandItem>
          </CommandGroup>

          {clients.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Client">
                {clients.map((c) => (
                  <CommandItem key={c.id} value={`client ${c.name}`} onSelect={() => go(`/admin/deliverables?client=${c.id}`)}>
                    <Building2Icon className="size-4" />
                    {c.name}
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}

          {deliverables.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Deliverable">
                {deliverables.map((d) => (
                  <CommandItem key={d.id} value={d.title} onSelect={() => go(`/admin/deliverables/${d.id}`)}>
                    <FileTextIcon className="size-4" />
                    <span className="flex-1 truncate">{d.title}</span>
                    <StatusBadge status={d.status} />
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
