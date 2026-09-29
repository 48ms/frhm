'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { CreateClientWizard } from './create-client-dialog'

interface CreateClientContextType {
  openCreateClient: () => void
  closeCreateClient: () => void
}

/**
 * Default is a no-op so consumers that render outside the provider (e.g. the client
 * portal's AppSidebar, which has no create-client action) don't crash. Only the admin
 * layout wraps its tree in CreateClientProvider and gets the real dialog.
 */
const NOOP: CreateClientContextType = {
  openCreateClient: () => {},
  closeCreateClient: () => {},
}

const CreateClientContext = createContext<CreateClientContextType>(NOOP)

export function useCreateClient() {
  return useContext(CreateClientContext)
}

export function CreateClientProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  const openCreateClient = useCallback(() => setOpen(true), [])
  const closeCreateClient = useCallback(() => setOpen(false), [])

  return (
    <CreateClientContext.Provider value={{ openCreateClient, closeCreateClient }}>
      {children}
      <CreateClientWizard open={open} onOpenChange={setOpen} />
    </CreateClientContext.Provider>
  )
}
