'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlusIcon, UserCheckIcon, Loader2Icon, Edit2Icon, Trash2Icon, KeyRoundIcon, UsersIcon } from 'lucide-react'

type User = {
  id: string
  email: string
  full_name: string | null
  role: 'admin' | 'client'
  client_id: string | null
  clients: { name: string } | null
  created_at: string
  last_sign_in_at?: string | null
}

type ClientOption = { id: string; name: string }

type UserForm = {
  email: string
  password: string
  full_name: string
  role: 'admin' | 'client'
  client_id: string | null
}

export default function AdminUsersPage() {
  const router = useRouter()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [clients, setClients] = useState<ClientOption[]>([])

  const [form, setForm] = useState<UserForm>({
    email: '',
    password: '',
    full_name: '',
    role: 'client',
    client_id: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [usersRes, clientsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/clients?all=true'),
      ])
      if (usersRes.ok) {
        const data = await usersRes.json()
        setUsers(data.users ?? [])
      }
      if (clientsRes.ok) {
        const data = await clientsRes.json()
        setClients((data.clients ?? []).map((c: { id: string; name: string }) => ({ id: c.id, name: c.name })))
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => {
    setEditing(null)
    setForm({ email: '', password: '', full_name: '', role: 'client', client_id: '' })
    setOpen(true)
  }

  const openEdit = (u: User) => {
    setEditing(u)
    setForm({
      email: u.email,
      password: '',
      full_name: u.full_name || '',
      role: u.role,
      client_id: u.client_id || '',
    })
    setOpen(true)
  }

  const handleSubmit = async () => {
    setErr(null)
    if (!form.email || (!form.password && !editing)) { setErr('Email & password wajib'); return }
    if (form.role === 'client' && !form.client_id) { setErr('Client wajib dipilih untuk role client'); return }

    setSaving(true)
    try {
      const url = editing ? `/api/admin/users/${editing.id}` : '/api/admin/users'
      const method = editing ? 'PATCH' : 'POST'
      const body = editing
        ? { full_name: form.full_name, role: form.role, client_id: form.role === 'client' ? form.client_id : null }
        : { ...form, client_id: form.role === 'client' ? form.client_id : null }

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Gagal menyimpan')
      setOpen(false)
      await load()
      router.refresh()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus user ini? Tindakan ini tidak bisa dibatalkan.')) return
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Gagal menghapus')
      await load()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Gagal hapus')
    }
  }

  const roleBadge = (role: string) => (
    <Badge variant="outline" className="gap-1.5 h-6 px-2 text-xs">
      {role === 'admin' ? <UserCheckIcon className="size-3" /> : <UsersIcon className="size-3" />}
      {role === 'admin' ? 'Admin' : 'Client'}
    </Badge>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Manajemen User</h1>
          <p className="text-sm text-muted-foreground">Kelola akun admin & client</p>
        </div>
        <Button onClick={openCreate}><PlusIcon className="size-4" /> Tambah User</Button>
      </div>

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 animate-pulse bg-muted/50 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="rounded-xl border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr className="text-left text-muted-foreground">
                  <th className="p-3 font-medium">Nama / Email</th>
                  <th className="p-3 font-medium">Role</th>
                  <th className="p-3 font-medium">Client</th>
                  <th className="p-3 font-medium">Dibuat</th>
                  <th className="p-3 font-medium">Login Terakhir</th>
                  <th className="p-3 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.length === 0 ? (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Belum ada user</td></tr>
                ) : users.map(u => (
                  <tr key={u.id} className="hover:bg-muted/30">
                    <td className="p-3">
                      <p className="font-medium">{u.full_name || u.email}</p>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </td>
                    <td className="p-3">{roleBadge(u.role)}</td>
                    <td className="p-3 text-muted-foreground">
                      {u.clients?.name || (u.role === 'admin' ? 'N/A' : 'Tanpa client')}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {u.last_sign_in_at
                        ? new Date(u.last_sign_in_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                        : 'Belum pernah'}
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(u)} title="Edit" aria-label={`Edit user ${u.full_name || u.email}`}>
                          <Edit2Icon className="size-4" />
                        </Button>
                        {
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(u.id)} className="text-destructive" title="Hapus" aria-label={`Hapus user ${u.full_name || u.email}`}>
                            <Trash2Icon className="size-4" />
                          </Button>
                        }
                        {u.role === 'client' && (
                          <Button variant="outline" size="sm" onClick={() => router.push(`/admin/clients/${u.client_id}?tab=reset`)} className="hidden sm:inline-flex h-11 rounded-xl">
                            <KeyRoundIcon className="size-3.5" /> Reset Pass
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit User' : 'Tambah User Baru'}</DialogTitle>
            <DialogDescription>{editing ? 'Perbarui data user' : 'Buat akun admin atau client baru'}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="u-email">Email *</Label>
              <Input id="u-email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="user@domain.com" disabled={!!editing} className="h-11" />
            </div>
            {!editing && (
              <div className="space-y-2">
                <Label htmlFor="u-password">Password *</Label>
                <Input id="u-password" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 karakter" className="h-11" />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="u-name">Nama Lengkap</Label>
              <Input id="u-name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Nama lengkap" className="h-11" />
            </div>
            <div className="space-y-2">
              <Label>Role *</Label>
              <div className="w-full">
                <Select value={form.role} onValueChange={v => setForm({ ...form, role: v as 'admin' | 'client' })}>
                  <SelectTrigger className="h-11 w-full"><SelectValue placeholder="Pilih role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="client">Client</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {form.role === 'client' && (
              <div className="space-y-2">
                <Label>Client *</Label>
                <div className="w-full">
                  <Select value={form.client_id ?? ''} onValueChange={v => setForm({ ...form, client_id: v || null })} disabled={clients.length === 0}>
                    <SelectTrigger className="h-11 w-full"><SelectValue placeholder={clients.length === 0 ? 'Buat client dulu' : 'Pilih client'} /></SelectTrigger>
                    <SelectContent>
                      {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                {clients.length === 0 && <p className="text-xs text-amber-600">Belum ada client. Buat di <a href="/admin/clients" className="underline">Manajemen Client</a>.</p>}
              </div>
            )}
            {err && <p className="text-sm text-destructive">{err}</p>}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="h-11 lg:h-8" onClick={() => setOpen(false)} disabled={saving}>Batal</Button>
            <Button className="h-11 lg:h-8" onClick={handleSubmit} disabled={saving}>
              {saving ? <Loader2Icon className="size-4 animate-spin" /> : (editing ? 'Simpan Perubahan' : 'Buat User')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}