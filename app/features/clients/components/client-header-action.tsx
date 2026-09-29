'use client'

import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'
import { useCreateClient } from '@/components/client/create-client-provider'

export function ClientHeaderAction() {
  const { openCreateClient } = useCreateClient()

  return (
    <Button
      onClick={openCreateClient}
      size="sm"
      className="rounded-full bg-lum-cobalt text-xs font-bold text-white shadow-sm hover:bg-lum-cobalt-light hover:shadow-[0_8px_20px_-3px_rgba(35,51,231,0.5)]"
    >
      <Icons.add className="mr-1.5 size-4" />
      Klien Baru
    </Button>
  )
}
