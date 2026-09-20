'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PlusIcon, SearchIcon, EditIcon, Trash2Icon } from 'lucide-react'
import { KolFormModal, KOL } from './kol-form-modal'

export function KolCrmBoard() {
  const [kols, setKols] = useState<KOL[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const supabase = createClient()

  const [modalOpen, setModalOpen] = useState(false)
  const [editingKol, setEditingKol] = useState<KOL | null>(null)

  const fetchKols = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('kols')
      .select('*')
      .order('name', { ascending: true })

    if (data && !error) {
      setKols(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchKols()
  }, [supabase])

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
    const { error } = await supabase.from('kols').delete().eq('id', id)
    if (!error) {
      setKols(kols.filter((k) => k.id !== id))
    } else {
      alert('Gagal menghapus KOL.')
    }
  }

  const filteredKols = kols.filter((k) => 
    k.name.toLowerCase().includes(search.toLowerCase()) || 
    (k.niche && k.niche.toLowerCase().includes(search.toLowerCase()))
  )

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
          <div className="relative w-full sm:w-64">
            <SearchIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari nama atau niche..."
              className="pl-8 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button size="sm" onClick={handleOpenNew} className="h-9 whitespace-nowrap">
            <PlusIcon className="size-4 mr-2" /> Tambah KOL
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Memuat data KOL...</div>
          ) : filteredKols.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {search ? 'Tidak ada KOL yang cocok dengan pencarian.' : 'Belum ada data KOL. Silakan tambah baru.'}
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Nama / Username</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Niche</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Kontak</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Rate Card</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Aksi</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {filteredKols.map((kol) => (
                    <tr key={kol.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle font-medium">{kol.name}</td>
                      <td className="p-4 align-middle">{kol.niche || '-'}</td>
                      <td className="p-4 align-middle">{kol.contact_info || '-'}</td>
                      <td className="p-4 align-middle">
                        {kol.rate_card ? `IDR ${kol.rate_card.toLocaleString('id-ID')}` : '-'}
                      </td>
                      <td className="p-4 align-middle text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(kol)} className="h-8 w-8 text-muted-foreground hover:text-primary">
                          <EditIcon className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(kol.id)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                          <Trash2Icon className="h-4 w-4" />
                          <span className="sr-only">Hapus</span>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <KolFormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        editingKol={editingKol}
        onSuccess={fetchKols}
      />
    </div>
  )
}
