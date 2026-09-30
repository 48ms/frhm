import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Icons } from '@/components/icons'

// Always render per-request , never cache RSC payload (avoids stale session/role state)
export const dynamic = 'force-dynamic'

export default async function WaitlistPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role) {
    redirect(profile.role === 'admin' ? '/admin/dashboard' : '/client/dashboard')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-muted/60 text-muted-foreground">
            <Icons.lock className="size-7" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight mb-3">Menunggu Akses</h1>
        <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
          Akun Anda telah terverifikasi, namun peran akses belum dikonfigurasi oleh tim.
          Silakan hubungi administrator untuk verifikasi lebih lanjut.
        </p>
        <div className="p-4 bg-muted/40 border rounded-xl text-xs text-muted-foreground text-left space-y-1.5 mb-6">
          <p><span className="text-foreground/70 font-medium">Email:</span> <span className="font-mono">{user.email}</span></p>
          <p><span className="text-foreground/70 font-medium">User ID:</span> <span className="font-mono">{user.id.slice(0, 8)}...</span></p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            href="/auth/login"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-input bg-background px-6 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Kembali ke Login
          </Link>
        </div>
      </div>
    </div>
  )
}
