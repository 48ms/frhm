'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCreateClient } from '@/components/client/create-client-provider'
import { Building2Icon, FileTextIcon, PlusIcon, CheckCircle2Icon, AlertTriangleIcon } from 'lucide-react'

type Client = { id: string; name: string; contact_email: string | null; created_at: string }

export default function AdminClientsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { openCreateClient } = useCreateClient()

  const [clients, setClients] = useState<Client[]>([])
  const [pendingCounts, setPendingCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: cl } = await supabase
      .from('clients').select('id, name, contact_email, created_at').order('created_at', { ascending: false })
    setClients((cl ?? []) as Client[])

    const { data: dl } = await supabase
      .from('deliverables')
      .select('client_id, status')
      .eq('status', 'sent')
    const c: Record<string, number> = {}
    for (const d of dl ?? []) {
      c[d.client_id] = (c[d.client_id] ?? 0) + 1
    }
    setPendingCounts(c)
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  // Refresh the list whenever a client is created from anywhere (sidebar, palette, this page)
  useEffect(() => {
    const onCreated = () => {
      load()
      router.refresh()
    }
    window.addEventListener('client:created', onCreated)
    return () => window.removeEventListener('client:created', onCreated)
  }, [load, router])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Client</h1>
          <p className="text-sm text-muted-foreground">Semua client yang sedang dikerjakan</p>
        </div>
        <Button onClick={openCreateClient} className="h-11">
          <PlusIcon className="size-4" /> Client Baru
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-32 animate-pulse bg-zinc-100 dark:bg-zinc-800/50 rounded-2xl" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <Card className="border-none bg-zinc-50/50 dark:bg-zinc-900/20 backdrop-blur-sm shadow-inner">
          <CardContent className="py-16 text-center flex flex-col items-center justify-center">
            <div className="size-14 rounded-full bg-muted flex items-center justify-center mb-4 shadow-sm">
              <Building2Icon className="size-7 text-muted-foreground/60" />
            </div>
            <p className="font-medium text-foreground/80 mb-4">Belum ada client.</p>
            <Button className="h-11 rounded-xl bg-brand-accent hover:bg-brand-accent/90" onClick={openCreateClient}>
              <PlusIcon className="size-4 mr-2" /> Buat Client Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clients.map((c) => {
            const pending = pendingCounts[c.id] ?? 0
            return (
              <Link key={c.id} href={`/admin/clients/${c.id}`} className="block">
                <Card className="h-full border-transparent bg-background/80 backdrop-blur-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                  <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/50">
                    <div className="flex items-start gap-3">
                      <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-accent/10 text-brand-accent group-hover:bg-brand-accent group-hover:text-white transition-colors duration-300 shadow-sm">
                        <Building2Icon className="size-5" />
                      </div>
                      <div className="min-w-0 pt-1">
                        <CardTitle className="truncate text-base font-semibold group-hover:text-brand-accent transition-colors">{c.name}</CardTitle>
                        {c.contact_email && (
                          <CardDescription className="truncate text-xs tracking-wide">{c.contact_email}</CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-3">
                      {pending > 0 ? (
                        <Badge variant="destructive" className="gap-1.5 h-6 px-2 text-[11px] font-medium tracking-wide">
                          <AlertTriangleIcon className="size-3" /> {pending} menunggu review
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1.5 h-6 px-2 text-[11px] font-medium tracking-wide bg-brand-accent/10 text-brand-accent hover:bg-brand-accent/20">
                          <CheckCircle2Icon className="size-3" /> Siap kerjakan
                        </Badge>
                      )}
                      <span className="text-[11px] text-muted-foreground font-medium">
                        <FileTextIcon className="size-3 inline-block align-middle mr-1" />
                        {pending} pending
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
