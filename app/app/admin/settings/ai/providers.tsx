'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { PlusIcon, Trash2Icon, StarIcon, LoaderIcon, AlertTriangleIcon } from 'lucide-react'
import { motion, AnimatePresence } from "motion/react"

type Provider = {
  id: string
  label: string
  kind: 'gemini' | 'anthropic' | 'openai' | 'custom'
  model: string
  base_url: string | null
  has_key?: boolean
  is_default: boolean
}

const KINDS = [
  { value: 'gemini', label: 'Google Gemini', hint: 'generativelanguage.googleapis.com', model: 'gemini-2.0-flash' },
  { value: 'anthropic', label: 'Anthropic Claude', hint: 'api.anthropic.com', model: 'claude-sonnet-4-5' },
  { value: 'openai', label: 'OpenAI ChatGPT', hint: 'api.openai.com', model: 'gpt-4o' },
  { value: 'custom', label: 'Custom / 9router', hint: 'http://localhost:PORT', model: 'model-name' },
]

export function AiProviders() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const [label, setLabel] = useState('')
  const [kind, setKind] = useState('gemini')
  const [model, setModel] = useState('gemini-2.0-flash')
  const [baseUrl, setBaseUrl] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [isDefault, setIsDefault] = useState(true)

  const [testOut, setTestOut] = useState('')
  const [testing, setTesting] = useState(false)

  async function load() {
    setLoading(true)
    const r = await fetch('/api/admin/ai/providers')
    const j = await r.json()
    setProviders(j.providers ?? [])
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  function pickKind(v: string) {
    setKind(v)
    const k = KINDS.find((x) => x.value === v)
    if (k) setModel(k.model)
    setBaseUrl(v === 'custom' ? 'http://localhost:20128' : '')
  }

  async function save() {
    setSaving(true); setErr('')
    const r = await fetch('/api/admin/ai/providers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        label, kind, model, base_url: baseUrl || null, api_key: apiKey || null, is_default: isDefault,
      }),
    })
    const j = await r.json()
    setSaving(false)
    if (!r.ok) { setErr(j.error || 'Gagal menyimpan'); return }
    setOpen(false)
    setLabel(''); setApiKey(''); setKind('gemini'); setModel('gemini-2.0-flash'); setBaseUrl('')
    load()
  }

  async function makeDefault(id: string) {
    await fetch('/api/admin/ai/providers', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, is_default: true }),
    })
    load()
  }

  async function remove(id: string) {
    await fetch(`/api/admin/ai/providers?id=${id}`, { method: 'DELETE' })
    load()
  }

  async function testRun(p: Provider) {
    setTesting(true); setTestOut('')
    const r = await fetch('/api/admin/ai/run', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider_id: p.id,
        skill_id: 'caption-writer',
        client_id: '44b48931-a33e-470a-9f3e-9064ee46373f',
        brief: 'Tulis 1 caption Instagram untuk promo menu baru (tes koneksi, singkat saja).',
      }),
    })
    const j = await r.json()
    setTesting(false)
    setTestOut(r.ok ? (j.output || '(kosong)') : `Gagal: ${j.error}`)
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="flex items-start justify-between gap-3"
      >
        <div>
          <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Provider AI</h2>
          <p className="text-neutral-500 text-sm mt-1">
            Sumber model untuk menjalankan skill. Bisa Gemini, Claude, ChatGPT, atau endpoint sendiri (9router).
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="h-11 rounded-xl bg-neutral-900 dark:bg-neutral-50 text-white dark:text-neutral-900 hover:scale-105 transition-transform shadow-sm">
          <PlusIcon className="size-4 mr-2" /> Tambah Provider
        </Button>
      </motion.div>

      {loading ? (
        <div className="space-y-4" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="h-28 animate-pulse bg-neutral-100/50 dark:bg-neutral-800/50 rounded-3xl border border-neutral-200/50 dark:border-neutral-800/50" 
            />
          ))}
        </div>
      ) : providers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="border border-dashed border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-xl rounded-3xl p-10 text-center"
        >
          <div className="flex flex-col items-center justify-center gap-2 text-neutral-500">
            <AlertTriangleIcon className="size-8 text-neutral-300 dark:text-neutral-700 mb-2" />
            <p className="font-medium">Belum ada provider.</p>
            <p className="text-sm">Tambahkan minimal satu supaya skill bisa dijalankan.</p>
          </div>
        </motion.div>
      ) : (
        <motion.div layout className="grid gap-4 sm:grid-cols-2">
          <AnimatePresence mode="popLayout">
          {providers.map((p, index) => (
            <motion.div
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 30, delay: index * 0.05 }}
              key={p.id}
            >
              <div className="h-full flex flex-col bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl border border-neutral-200/50 dark:border-neutral-800/50 rounded-3xl p-5 sm:p-6 transition-all duration-300 hover:shadow-lg hover:border-neutral-300 dark:hover:border-neutral-700">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">{p.label}</h3>
                    {p.is_default && (
                      <Badge variant="secondary" className="gap-1.5 h-6 px-2.5 rounded-full text-xs font-medium">
                        <StarIcon className="size-3" /> Default
                      </Badge>
                    )}
                    {!p.has_key && p.kind !== 'custom' && (
                      <Badge variant="destructive" className="gap-1.5 h-6 px-2.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20">
                        <AlertTriangleIcon className="size-3" /> Tanpa API key
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    {!p.is_default && (
                      <Button variant="ghost" size="sm" onClick={() => makeDefault(p.id)} className="h-9 rounded-xl text-xs font-medium text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 bg-neutral-100/50 dark:bg-neutral-800/50 hover:bg-neutral-200/50 dark:hover:bg-neutral-700/50">
                        Jadikan default
                      </Button>
                    )}
                    <Button variant="ghost" size="icon-sm" onClick={() => remove(p.id)} className="h-9 w-9 rounded-xl text-neutral-400 hover:text-red-500 hover:bg-red-500/10" aria-label={`Hapus provider ${p.kind}`}>
                      <Trash2Icon className="size-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div className="font-mono text-xs text-neutral-500 bg-neutral-100/50 dark:bg-neutral-800/50 p-3 rounded-2xl border border-neutral-200/50 dark:border-neutral-700/50 break-all">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">{p.kind}</span><br/>
                    {p.model}
                    {p.base_url && <><br/><span className="opacity-70">{p.base_url}</span></>}
                  </div>
                </div>
                
                <div className="pt-5 mt-auto">
                  <Button variant="outline" size="sm" onClick={() => testRun(p)} disabled={testing} className="w-full h-10 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-50 dark:hover:bg-neutral-800 shadow-sm transition-all active:scale-[0.98]">
                    {testing ? <LoaderIcon className="size-4 animate-spin mr-2" /> : null} Tes jalankan skill
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
        </motion.div>
      )}

      {testOut && (
        <Card className="border rounded-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Hasil tes (skill: caption-writer)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted max-h-80 overflow-auto rounded-xl p-3 text-xs whitespace-pre-wrap">
              {testOut}
            </pre>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Tambah Provider AI</DialogTitle>
            <DialogDescription>
              API key disimpan di server dan tidak pernah dikirim ke browser.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nama</Label>
              <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="mis. Gemini saya" className="h-11 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all bg-neutral-50/50 dark:bg-neutral-900/50" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Jenis</Label>
                <Select value={kind} onValueChange={(v) => pickKind(v ?? 'gemini')}>
                  <SelectTrigger className="h-11 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all bg-neutral-50/50 dark:bg-neutral-900/50"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl shadow-lg">
                    {KINDS.map((k) => <SelectItem key={k.value} value={k.value} className="rounded-lg cursor-pointer">{k.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Model</Label>
                <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="gemini-2.0-flash" className="h-11 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all bg-neutral-50/50 dark:bg-neutral-900/50" />
              </div>
            </div>
            {kind === 'custom' && (
              <div className="space-y-2">
                <Label>Base URL <span className="text-neutral-400 font-normal ml-1">(endpoint kamu / 9router)</span></Label>
                <Input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="http://localhost:20128"
                  className="h-11 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all bg-neutral-50/50 dark:bg-neutral-900/50"
                />
                <p className="text-neutral-500 text-xs mt-1.5">
                  Endpoint dianggap OpenAI-compatible (<code>/v1/chat/completions</code>).
                </p>
              </div>
            )}
            <div className="space-y-2">
              <Label>API Key</Label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder={kind === 'custom' ? 'isi bila endpoint butuh key' : 'tempel API key di sini'}
                className="h-11 rounded-xl focus:ring-2 focus:ring-primary/20 transition-all bg-neutral-50/50 dark:bg-neutral-900/50 font-mono"
              />
            </div>
            <label className="flex items-center gap-3 text-sm font-medium mt-6 bg-neutral-50 dark:bg-neutral-800/30 p-4 rounded-2xl border border-neutral-100 dark:border-neutral-800 cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-800/50 transition-colors">
              <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="w-5 h-5 rounded-md accent-primary" />
              Jadikan provider default
            </label>
            {err && (
              <motion.p 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="text-red-500 text-sm font-medium flex items-center gap-1.5"
              >
                <AlertTriangleIcon className="size-4" /> {err}
              </motion.p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="h-11 rounded-xl">Batal</Button>
            <Button onClick={save} disabled={saving || !label || !model} className="h-11 rounded-xl">
              {saving ? <LoaderIcon className="size-4 animate-spin" /> : null} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}