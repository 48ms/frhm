'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Icons } from '@/components/icons'

export function WaitlistSignoutButton() {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSignOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
    } catch {
      // offline / non-fatal
    } finally {
      // Force navigation to /auth/signout to guarantee server cookies are wiped
      window.location.href = '/auth/signout'
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      disabled={loading}
      className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-input bg-background px-6 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60 cursor-pointer"
    >
      {loading ? (
        <>
          <Icons.spinner className="size-4 animate-spin text-muted-foreground" />
          <span>Mengalihkan ke Login...</span>
        </>
      ) : (
        <>
          <Icons.logout className="size-4 text-muted-foreground" />
          <span>Keluar & Kembali ke Login</span>
        </>
      )}
    </button>
  )
}
