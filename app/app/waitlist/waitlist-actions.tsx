'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Icons } from '@/components/icons'
import { toast } from 'sonner'

export function WaitlistActions() {
  const router = useRouter()
  const [checking, setChecking] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const supabase = createClient()

  const handleCheckStatus = async () => {
    setChecking(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase
          .from('users')
          .select('role, client_id')
          .eq('id', user.id)
          .single()

        if (profile?.role === 'admin') {
          toast.success('Akun telah disetujui sebagai Administrator! Mengalihkan...')
          router.push('/admin/dashboard')
          return
        }
        if (profile?.role === 'client' && profile?.client_id) {
          toast.success('Akun telah disetujui dan ditautkan ke klien! Mengalihkan...')
          router.push(`/client/dashboard?clientId=${profile.client_id}`)
          return
        }
      }
      toast.info('Akun Anda masih dalam antrean persetujuan admin.')
      router.refresh()
    } catch {
      toast.error('Gagal memeriksa status. Periksa koneksi internet Anda.')
    } finally {
      setChecking(false)
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await supabase.auth.signOut()
    } catch {
      // offline / non-fatal
    } finally {
      window.location.href = '/auth/signout'
    }
  }

  return (
    <div className='flex w-full flex-col gap-3 sm:flex-row'>
      <button
        type='button'
        onClick={() => void handleCheckStatus()}
        disabled={checking || signingOut}
        className='inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.98] disabled:opacity-60'
      >
        {checking ? (
          <>
            <Icons.spinner className='size-4 animate-spin' />
            <span>Memeriksa Status...</span>
          </>
        ) : (
          <>
            <Icons.refresh className='size-4' />
            <span>Periksa Status</span>
          </>
        )}
      </button>

      <button
        type='button'
        onClick={() => void handleSignOut()}
        disabled={checking || signingOut}
        className='inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:opacity-60'
      >
        {signingOut ? (
          <Icons.spinner className='size-4 animate-spin text-muted-foreground' />
        ) : (
          <Icons.logout className='size-4 text-muted-foreground' />
        )}
        <span>Keluar</span>
      </button>
    </div>
  )
}
