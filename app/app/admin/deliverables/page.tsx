import { Suspense } from 'react'
import DeliverablesPage from './page-client'

export default function DeliverablesPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20" role="status" aria-label="Memuat daftar deliverable">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" aria-hidden="true" />
        <span className="sr-only">Memuat daftar deliverable...</span>
      </div>
    }>
      <DeliverablesPage />
    </Suspense>
  )
}