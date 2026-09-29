'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { z } from 'zod'

const passwordSchema = z
  .object({
    password: z.string().min(6, 'Password minimal 6 karakter.'),
    confirm: z.string().min(6, 'Konfirmasi password minimal 6 karakter.'),
  })
  .refine((d) => d.password === d.confirm, {
    message: 'Konfirmasi password tidak cocok.',
    path: ['confirm'],
  })

type Phase = 'checking' | 'ready' | 'invalid' | 'done'

/**
 * Halaman tujuan setelah pengguna membuka tautan pemulihan dari email.
 *
 * PENTING: Supabase mengirim token pemulihan pada FRAGMENT URL (#access_token=…),
 * yang tidak pernah dikirim ke server. Karena itu halaman ini harus berjalan di
 * sisi klien dan menunggu `detectSessionInUrl` milik supabase-js menukar token
 * tersebut menjadi session sebelum form ditampilkan.
 */
export default function SetPasswordPage() {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('checking')
  const [linkError, setLinkError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Deteksi session pemulihan dari hash URL.
  useEffect(() => {
    const supabase = createClient()
    let active = true

    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''))
    const hashError = hash.get('error_description') || hash.get('error')
    if (hashError) {
      setLinkError('Tautan pemulihan tidak valid atau sudah kedaluwarsa.')
      setPhase('invalid')
      return
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return
      if (event === 'PASSWORD_RECOVERY' || session) setPhase('ready')
    })

    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      if (data.session) {
        setPhase('ready')
      } else {
        // Beri waktu detectSessionInUrl memproses hash, lalu nyatakan tidak valid.
        window.setTimeout(() => {
          if (active) setPhase((p) => (p === 'checking' ? 'invalid' : p))
        }, 2500)
      }
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const parsed = passwordSchema.safeParse({ password, confirm })
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Password tidak valid.')
      return
    }

    setLoading(true)
    const supabase = createClient()
    const { error: updateError } = await supabase.auth.updateUser({ password: parsed.data.password })

    if (updateError) {
      setLoading(false)
      setError(`Gagal mengubah password: ${updateError.message}`)
      return
    }

    setLoading(false)
    setPhase('done')

    // Arahkan sesuai role: admin ke dashboard admin, klien ke portal klien.
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()
      if (profile?.role === 'admin') router.push('/admin/dashboard')
      else router.push('/client/dashboard')
    } else {
      router.push('/auth/login')
    }
  }

  if (phase === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="mx-auto size-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Memverifikasi tautan pemulihan…</p>
        </div>
      </div>
    )
  }

  if (phase === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive font-bold text-xl">
            !
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Tautan Tidak Valid</h1>
          <p className="text-sm text-muted-foreground">
            {linkError ?? 'Tautan pemulihan tidak valid atau sudah kedaluwarsa. Silakan minta tautan baru.'}
          </p>
          <Link href="/auth/forgot-password" className="w-full">
            <Button className="w-full h-10 rounded-lg font-medium">Minta Tautan Baru</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (phase === 'done') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xl">
            ✓
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Password Berhasil Diubah</h1>
          <p className="text-sm text-muted-foreground">
            Password baru Anda sudah aktif. Anda akan dialihkan ke halaman dashboard.
          </p>
          <p className="text-xs text-muted-foreground">Mengalihkan…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xl mb-4">
            F
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Buat Password Baru</h1>
          <p className="text-sm text-muted-foreground">Masukkan password baru untuk akun Anda</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-medium text-muted-foreground">
              Password Baru
            </Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimal 6 karakter"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="h-10 rounded-lg border-input bg-background"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirm" className="text-xs font-medium text-muted-foreground">
              Konfirmasi Password Baru
            </Label>
            <Input
              id="confirm"
              type="password"
              placeholder="Ulangi password baru"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              className="h-10 rounded-lg border-input bg-background"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            isLoading={loading}
            className="w-full h-10 rounded-lg font-medium"
          >
            Simpan Password Baru
          </Button>
        </form>

        {error && (
          <div
            role="alert"
            className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive font-medium"
          >
            {error}
          </div>
        )}

        <div className="text-center pt-2">
          <Link
            href="/auth/login"
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            &larr; Kembali ke halaman Masuk
          </Link>
        </div>
      </div>
    </div>
  )
}
