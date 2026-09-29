'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { z } from 'zod'

const emailSchema = z.object({
  email: z
    .string()
    .min(1, 'Email wajib diisi.')
    .email('Masukkan email yang valid, contoh: nama@email.com'),
})

/**
 * Petakan error Supabase ke pesan Indonesia yang ramah pengguna.
 * Kode umum: 429 rate-limit, 422 over-request, email_address_*.
 */
function describeError(err: { code?: string | null; message?: string | null }): string {
  const code = err.code ?? ''
  if (code === 'over_request_rate_limit') {
    return 'Terlalu banyak permintaan. Tunggu beberapa menit lalu coba lagi.'
  }
  if (code === 'email_address_invalid' || /invalid/i.test(err.message ?? '')) {
    return 'Alamat email tidak valid. Periksa kembali penulisannya.'
  }
  if (code === 'email_address_not_authorized') {
    return 'Email ini belum terdaftar atau tidak diizinkan.'
  }
  return `Gagal mengirim tautan: ${err.message ?? 'terjadi kesalahan'}`
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const supabase = createClient()

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)

    // Validasi sisi klien sebelum menyentuh Supabase.
    const parsed = emailSchema.safeParse({ email: email.trim() })
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Email tidak valid.')
      return
    }
    setFieldError(null)
    setLoading(true)

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${window.location.origin}/auth/set-password`,
    })

    if (resetError) {
      setError(describeError(resetError))
      setLoading(false)
      return
    }

    setMessage(
      'Tautan pemulihan password telah dikirim ke email Anda. Buka email dan ikuti tautannya untuk membuat password baru.',
    )
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary font-bold text-xl mb-4">
            F
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Pulihkan Password</h1>
          <p className="text-sm text-muted-foreground">
            Masukkan email terdaftar untuk menerima tautan pemulihan
          </p>
        </div>

        <form onSubmit={handleReset} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-medium text-muted-foreground">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="nama@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                if (fieldError) setFieldError(null)
              }}
              aria-invalid={!!fieldError}
              aria-describedby={fieldError ? 'email-error' : undefined}
              required
              className="h-10 rounded-lg border-input bg-background"
            />
            {fieldError && (
              <p id="email-error" className="text-xs font-medium text-destructive">
                {fieldError}
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={loading}
            isLoading={loading}
            className="w-full h-10 rounded-lg font-medium"
          >
            Kirim Tautan Pemulihan
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
        {message && (
          <div
            role="status"
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium"
          >
            {message}
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
