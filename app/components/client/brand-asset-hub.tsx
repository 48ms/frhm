'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2Icon, FileIcon, TrashIcon, DownloadIcon } from 'lucide-react'

export function BrandAssetHub({ clientId }: { clientId: string }) {
  const [assets, setAssets] = useState<{ id: string; file_path: string; category: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [guidelines, setGuidelines] = useState('')
  const [savingGuide, setSavingGuide] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchAssets()
  }, [clientId])

  const fetchAssets = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('brand_assets')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
    
    if (data) {
      setAssets(data)
      const guideAsset = data.find(a => a.category === 'guidelines')
      if (guideAsset && guideAsset.guidelines) {
        setGuidelines(guideAsset.guidelines)
      }
    }
    setLoading(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const fileExt = file.name.split('.').pop()
    // crypto.randomUUID() instead of Math.random(): collision-safe, crypto-grade entropy
    const fileName = `${clientId}/${crypto.randomUUID()}.${fileExt}`
    
    const { error: uploadError } = await supabase.storage
      .from('brand_assets')
      .upload(fileName, file)

    if (!uploadError) {
      const res = await fetch('/api/client/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: clientId,
          category: 'file',
          file_path: fileName,
          file_type: file.type,
        })
      })
      if (res.ok) {
        fetchAssets()
      }
    }
    setUploading(false)
  }

  const handleSaveGuidelines = async () => {
    setSavingGuide(true)
    await fetch('/api/client/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        category: 'guidelines',
        guidelines
      })
    })
    fetchAssets()
    setSavingGuide(false)
  }

  const handleDelete = async (id: string) => {
    await fetch(`/api/client/assets?id=${id}`, { method: 'DELETE' })
    fetchAssets()
  }

  const getFileUrl = async (path: string): Promise<string | null> => {
    // Bucket is private — createSignedUrl is required, getPublicUrl returns a 404.
    const { data, error } = await supabase.storage.from('brand_assets').createSignedUrl(path, 3600)
    if (error) return null
    return data.signedUrl
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Brand Assets</CardTitle>
          <CardDescription>Upload logos, fonts, and other assets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Input type="file" onChange={handleFileUpload} disabled={uploading} className="w-full" />
            {uploading && <Loader2Icon className="animate-spin size-4 text-muted-foreground" />}
          </div>
          
          <div className="space-y-2 mt-4">
            {loading ? (
              <div className="flex justify-center p-4"><Loader2Icon className="animate-spin size-4" /></div>
            ) : (
              assets.filter(a => a.category !== 'guidelines').map((asset) => (
                <div key={asset.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="text-sm truncate">{asset.file_path.split('/').pop()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={async () => {
                      const url = await getFileUrl(asset.file_path)
                      if (url) window.open(url, '_blank')
                    }}>
                      <DownloadIcon className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(asset.id)}>
                      <TrashIcon className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))
            )}
            {assets.filter(a => a.category !== 'guidelines').length === 0 && !loading && (
              <p className="text-sm text-muted-foreground text-center py-4">Belum ada aset.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Brand Guidelines</CardTitle>
          <CardDescription>Catat warna HEX, tipografi, atau aturan brand</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Catatan Guidelines</Label>
            <Textarea 
              placeholder="Contoh: Primary Color: #FF0000, Font: Inter..." 
              value={guidelines}
              onChange={(e) => setGuidelines(e.target.value)}
              className="min-h-[150px]"
            />
          </div>
          <Button onClick={handleSaveGuidelines} disabled={savingGuide}>
            {savingGuide ? <Loader2Icon className="animate-spin mr-2 size-4" /> : null}
            Simpan Guidelines
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
