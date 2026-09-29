import type { Metadata } from 'next'
import { PRODUCT_NAME } from '@/lib/config'

// Auth pages are client components (they need form state), so metadata lives
// here in the server-side layout instead.
export const metadata: Metadata = {
  title: `Masuk | ${PRODUCT_NAME}`,
  description: `Masuk ke dashboard ${PRODUCT_NAME} untuk mengelola strategi konten dan feedback klien.`,
  robots: { index: false, follow: false },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return children
}
