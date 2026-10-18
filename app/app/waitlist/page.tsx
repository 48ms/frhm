import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Icons } from '@/components/icons'
import Image from 'next/image'
import { PRODUCT_NAME } from '@/lib/config'
import { WaitlistActions } from './waitlist-actions'

// Always render per-request, never cache RSC payload (avoids stale session/role state)
export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Menunggu Akses',
  description: `Status persetujuan akun dan konfigurasi hak akses platform ${PRODUCT_NAME}.`,
}

export default async function WaitlistPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role, client_id, full_name, avatar_url')
    .eq('id', user.id)
    .single()

  if (profile?.role === 'admin') {
    redirect('/admin/dashboard')
  }

  if (profile?.role === 'client' && profile?.client_id) {
    redirect(`/client/dashboard?clientId=${profile.client_id}`)
  }

  const rawMeta = user.user_metadata || {}
  const fullName =
    profile?.full_name ||
    rawMeta.full_name ||
    rawMeta.name ||
    (user.email ? user.email.split('@')[0] : 'Pengguna')
  const avatarUrl = profile?.avatar_url || rawMeta.avatar_url || rawMeta.picture || null

  return (
    <div className='flex min-h-screen items-center justify-center bg-background px-4 py-8'>
      <div className='w-full max-w-md'>
        {/* Card */}
        <div className='rounded-2xl border bg-card p-6 text-center shadow-sm sm:p-8'>
          <div className='mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10 text-amber-500'>
            <Icons.clock className='size-7' />
          </div>

          <div className='mb-4 inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400'>
            <span className='size-2 animate-pulse rounded-full bg-amber-500' />
            <span>Menunggu Persetujuan Admin</span>
          </div>

          <h1 className='mb-2 text-2xl font-bold tracking-tight text-foreground'>
            Menunggu Verifikasi Peran
          </h1>
          <p className='mb-6 text-sm leading-relaxed text-muted-foreground'>
            Akun Anda berhasil terdaftar di platform {PRODUCT_NAME}. Administrator sedang meninjau dan
            menetapkan hak akses organisasi Anda.
          </p>

          <div className='mb-6 space-y-2.5 rounded-xl border bg-muted/40 p-4 text-left text-xs'>
            <div className='flex items-center gap-3 border-b border-border/40 pb-2.5'>
              {avatarUrl ? (
                <div className='relative size-9 shrink-0 overflow-hidden rounded-full border border-border/60'>
                  <Image src={avatarUrl} alt={fullName} fill className='object-cover' />
                </div>
              ) : (
                <div className='flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary'>
                  {fullName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className='min-w-0 flex-1'>
                <p className='truncate text-xs font-semibold text-foreground'>{fullName}</p>
                <p className='truncate text-[11px] text-muted-foreground'>{user.email}</p>
              </div>
            </div>

            <div className='flex items-center justify-between text-[11px]'>
              <span className='text-muted-foreground'>ID Pengguna</span>
              <span className='font-mono text-foreground/80'>{user.id.slice(0, 8)}...</span>
            </div>
            <div className='flex items-center justify-between text-[11px]'>
              <span className='text-muted-foreground'>Status Pendaftaran</span>
              <span className='font-medium text-amber-600 dark:text-amber-400'>
                Pending Role Binding
              </span>
            </div>
          </div>

          <WaitlistActions />
        </div>

        <p className='mt-4 text-center text-xs text-muted-foreground'>
          &copy; {new Date().getFullYear()} {PRODUCT_NAME}. All rights reserved.
        </p>
      </div>
    </div>
  )
}

