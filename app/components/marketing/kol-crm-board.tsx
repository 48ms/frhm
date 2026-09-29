'use client'

import { useState, useEffect } from 'react'
import { useQueryState, parseAsString } from 'nuqs'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Icons } from '@/components/icons'
import { KolFormModal, KOL } from './kol-form-modal'
import { toast } from 'sonner'
import Link from 'next/link'

export function KolCrmBoard() {
  const [kols, setKols] = useState<KOL[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useQueryState(
    'q',
    parseAsString.withDefault('').withOptions({ shallow: true })
  )
  const [clientId, setClientId] = useQueryState(
    'client',
    parseAsString.withDefault('').withOptions({ shallow: true })
  )
  const [clients, setClients] = useState<{ id: string; name: string }[]>([])

  const [modalOpen, setModalOpen] = useState(false)
  const [editingKol, setEditingKol] = useState<KOL | null>(null)

  const supabase = createClient()

  // Load client list once (the CRM is global, but kols.client_id is NOT NULL).
  useEffect(() => {
    async function loadClients() {
      const { data } = await supabase
        .from('clients')
        .select('id, name')
        .order('name', { ascending: true })
      if (data) setClients(data)
    }
    loadClients()
  }, [supabase])

  const fetchKols = async () => {
    if (!clientId) return
    setLoading(true)
    const res = await fetch(`/api/admin/kols?client_id=${clientId}`)
    if (res.ok) {
      const data = await res.json()
      setKols(data.kols ?? [])
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchKols()
  }, [clientId])

  const handleOpenNew = () => {
    setEditingKol(null)
    setModalOpen(true)
  }

  const handleOpenEdit = (kol: KOL) => {
    setEditingKol(kol)
    setModalOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus KOL ini dari CRM?')) return
    const res = await fetch('/api/admin/kols', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    })
    if (res.ok) {
      setKols(kols.filter((k) => k.id !== id))
    } else {
      const err = await res.json()
      toast.error(err.error || 'Gagal menghapus KOL.')
    }
  }

  const filteredKols = kols.filter((k) => {
    const q = search.toLowerCase()
    return (
      k.name.toLowerCase().includes(q) ||
      (k.niche?.toLowerCase().includes(q) ?? false) ||
      (k.platforms?.some((p) => p.toLowerCase().includes(q)) ?? false)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold tracking-tight">KOL & Vendor CRM</h3>
          <p className="text-xs text-muted-foreground">
            Kelola database influencer, talent, dan vendor untuk keperluan kampanye.
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="w-full sm:w-48">
            <Label htmlFor="client-filter" className="sr-only">Klien</Label>
            <select
              id="client-filter"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">Pilih Klien...</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="relative w-full sm:w-64">
            <Icons.search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari nama atau niche..."
              className="pl-8 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={handleOpenNew} disabled={!clientId} className="h-9 whitespace-nowrap">
            <Icons.add className="size-4 mr-2" /> Tambah KOL
          </Button>
        </div>
      </div>

      {!clientId ? (
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            Pilih klien untuk melihat dan mengelola KOL.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Memuat data KOL...</div>
            ) : filteredKols.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                {search ? 'Tidak ada KOL yang cocok dengan pencarian.' : 'Belum ada data KOL. Silakan tambah baru.'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama / Username</TableHead>
                    <TableHead>Niche</TableHead>
                    <TableHead>Platform</TableHead>
                    <TableHead>Kontak</TableHead>
                    <TableHead>Rate Card</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKols.map((kol) => (
                    <TableRow key={kol.id}>
                      <TableCell className="font-medium">
                        <Link href={`/admin/crm/${kol.id}`} className="hover:text-primary hover:underline">
                          {kol.name}
                        </Link>
                      </TableCell>
                      <TableCell>{kol.niche || '-'}</TableCell>
                      <TableCell>
                        {kol.platforms && kol.platforms.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {kol.platforms.map((p) => (
                              <span
                                key={p}
                                className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium capitalize text-muted-foreground"
                              >
                                {p}
                              </span>
                            ))}
                          </div>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>{kol.contact_info || '-'}</TableCell>
                      <TableCell>
                        {kol.rate_card ? `IDR ${kol.rate_card.toLocaleString('id-ID')}` : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(kol)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <Icons.edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(kol.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Icons.trash className="h-4 w-4" />
                          <span className="sr-only">Hapus</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      <KolFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingKol={editingKol}
        clientId={clientId}
        onSuccess={fetchKols}
      />
    </div>
  )
}
