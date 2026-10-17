import type { MetadataRoute } from 'next'
import { PRODUCT_NAME } from '@/lib/config'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${PRODUCT_NAME} — Digital Marketing Platform`,
    short_name: PRODUCT_NAME,
    description: 'Platform operasional pemasaran digital cerdas, otomatisasi jadwal multi-channel, dan persetujuan konten terpadu.',
    start_url: '/',
    display: 'standalone',
    background_color: '#090a0f',
    theme_color: '#12141c',
    icons: [
      {
        src: '/favicon.ico',
        sizes: 'any',
        type: 'image/x-icon',
      },
    ],
  }
}
