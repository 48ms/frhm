'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Sparkles, Loader2, CheckCircle2, XCircle, Clock } from 'lucide-react'

type AutomationClient = {
  id: string
  name: string
  hasBrandProfile: boolean
}

type JobStatus = 'pending' | 'running' | 'success' | 'error'

export function GlobalAutomationsBoard({ initialClients }: { initialClients: AutomationClient[] }) {
  const [clients, setClients] = useState<AutomationClient[]>(initialClients)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const [topic, setTopic] = useState('')
  const [assetCount, setAssetCount] = useState(2)
  const [platforms, setPlatforms] = useState<string[]>(['INSTAGRAM', 'TIKTOK', 'FACEBOOK'])

  const [isRunning, setIsRunning] = useState(false)
  const [jobStatuses, setJobStatuses] = useState<Record<string, JobStatus>>({})
  const [jobLogs, setJobLogs] = useState<Record<string, string>>({})

  const toggleSelectAll = () => {
    const validClients = clients.filter(c => c.hasBrandProfile)
    if (selectedIds.length === validClients.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(validClients.map(c => c.id))
    }
  }

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(x => x !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  const handleStartBatch = async () => {
    if (selectedIds.length === 0) return alert('Pilih minimal 1 klien.')
    if (!confirm(`Mulai proses batch untuk ${selectedIds.length} klien? Proses ini akan memakan waktu.`)) return

    setIsRunning(true)
    
    // Reset statuses
    const newStatuses: Record<string, JobStatus> = {}
    const newLogs: Record<string, string> = {}
    selectedIds.forEach(id => {
      newStatuses[id] = 'pending'
      newLogs[id] = 'Menunggu antrean...'
    })
    setJobStatuses(newStatuses)
    setJobLogs(newLogs)

    // Process one by one
    for (const clientId of selectedIds) {
      setJobStatuses(prev => ({ ...prev, [clientId]: 'running' }))
      setJobLogs(prev => ({ ...prev, [clientId]: 'Memanggil AI... (butuh ~15 detik)' }))

      try {
        const res = await fetch(`/api/admin/clients/${clientId}/generate-campaign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            provider_id: 'google',
            topic,
            assetCount,
            platforms
          })
        })
        const json = await res.json()
        
        if (!res.ok) throw new Error(json.error || 'Gagal generate')
        
        setJobStatuses(prev => ({ ...prev, [clientId]: 'success' }))
        setJobLogs(prev => ({ ...prev, [clientId]: 'Berhasil! Kampanye tersimpan.' }))
      } catch (error: any) {
        setJobStatuses(prev => ({ ...prev, [clientId]: 'error' }))
        setJobLogs(prev => ({ ...prev, [clientId]: error.message }))
      }
    }

    setIsRunning(false)
    alert('Proses Batch selesai!')
  }

  const validClients = clients.filter(c => c.hasBrandProfile)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Kolom Kiri: Daftar Klien */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
          <div className="p-4 border-b bg-muted/20 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm">Pilih Klien</h3>
              <p className="text-xs text-muted-foreground">Klien harus memiliki Brand Profile untuk bisa digenerate.</p>
            </div>
            <Button variant="outline" size="sm" onClick={toggleSelectAll} disabled={isRunning || validClients.length === 0}>
              {selectedIds.length === validClients.length && validClients.length > 0 ? 'Deselect All' : 'Select All Valid'}
            </Button>
          </div>
          <div className="divide-y max-h-[600px] overflow-y-auto">
            {clients.map(client => {
              const isSelected = selectedIds.includes(client.id)
              const status = jobStatuses[client.id]
              const log = jobLogs[client.id]

              return (
                <div key={client.id} className={`p-4 flex items-center justify-between ${!client.hasBrandProfile ? 'opacity-50 bg-muted/10' : 'hover:bg-muted/5'}`}>
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox"
                      disabled={!client.hasBrandProfile || isRunning}
                      checked={isSelected}
                      onChange={() => toggleSelect(client.id)}
                      className="size-4 rounded border-gray-300"
                    />
                    <div>
                      <h4 className="font-medium text-sm">{client.name}</h4>
                      {!client.hasBrandProfile && (
                        <p className="text-xs text-destructive">Belum ada Brand Profile</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Status Indicator */}
                  {isSelected && status && (
                    <div className="flex items-center gap-2 text-xs text-right">
                      <span className="text-muted-foreground w-48 truncate">{log}</span>
                      {status === 'pending' && <Clock className="size-4 text-muted-foreground" />}
                      {status === 'running' && <Loader2 className="size-4 text-blue-500 animate-spin" />}
                      {status === 'success' && <CheckCircle2 className="size-4 text-green-500" />}
                      {status === 'error' && <XCircle className="size-4 text-red-500" />}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Kolom Kanan: Pengaturan */}
      <div className="space-y-4">
        <div className="bg-card border rounded-xl p-5 shadow-sm space-y-5">
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">Batch Configuration</h3>
            <p className="text-xs text-muted-foreground">Parameter ini akan diterapkan ke semua klien yang dipilih.</p>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Topik Spesifik (Opsional)</Label>
            <Textarea 
              placeholder="Contoh: Fokus ke edukasi produk bulan ini..."
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="resize-none h-20 text-sm"
              disabled={isRunning}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Jumlah Ide Aset (Per Klien)</Label>
            <select 
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:opacity-50"
              value={assetCount} 
              onChange={(e) => setAssetCount(Number(e.target.value))}
              disabled={isRunning}
            >
              {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} Ide Konten</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Platform Target</Label>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {['INSTAGRAM', 'TIKTOK', 'FACEBOOK', 'LINKEDIN', 'YOUTUBE', 'TWITTER'].map(p => (
                <label key={p} className={`flex items-center gap-2 cursor-pointer border rounded p-2 ${isRunning ? 'opacity-50' : 'hover:bg-muted/50'}`}>
                  <input 
                    type="checkbox" 
                    checked={platforms.includes(p)}
                    disabled={isRunning}
                    onChange={(e) => {
                      if (e.target.checked) setPlatforms([...platforms, p])
                      else setPlatforms(platforms.filter(x => x !== p))
                    }}
                  />
                  <span>{p}</span>
                </label>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleStartBatch} 
            disabled={isRunning || selectedIds.length === 0} 
            className="w-full mt-2"
          >
            {isRunning ? (
              <><Loader2 className="size-4 mr-2 animate-spin" /> Memproses...</>
            ) : (
              <><Sparkles className="size-4 mr-2" /> Start Batch Generation ({selectedIds.length})</>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
