/**
 * Cloudinary delivery-URL transforms.
 *
 * The stored `url` is the original asset. Deriving display URLs at render time
 * keeps the library light without ever re-uploading or mutating the original.
 *
 * Non-Cloudinary URLs (external links, other providers) are returned untouched,
 * so the component stays provider-agnostic.
 */

const CLOUDINARY_UPLOAD_SEGMENT = '/image/upload/'
const CLOUDINARY_VIDEO_SEGMENT = '/video/upload/'

export type TransformPreset = 'thumb' | 'card' | 'full'

const PRESETS: Record<TransformPreset, string> = {
  // Small square thumbnail for dense grids.
  thumb: 'c_fill,w_200,h_200,q_auto,f_auto',
  // Card-sized preview.
  card: 'c_fill,w_600,h_600,q_auto,f_auto',
  // Full-size preview for the detail lightbox.
  full: 'q_auto,f_auto',
}

function isCloudinary(url: string): boolean {
  return url.includes('res.cloudinary.com') || url.includes('/image/upload/') || url.includes('/video/upload/')
}

/**
 * Insert a transformation string into a Cloudinary delivery URL.
 * If the URL is not a Cloudinary asset, it is returned unchanged.
 */
export function withTransform(url: string, preset: TransformPreset): string {
  if (!url || !isCloudinary(url)) return url

  const segment = url.includes(CLOUDINARY_VIDEO_SEGMENT)
    ? CLOUDINARY_VIDEO_SEGMENT
    : CLOUDINARY_UPLOAD_SEGMENT

  const markerIndex = url.indexOf(segment)
  if (markerIndex === -1) return url

  const insertAt = markerIndex + segment.length
  const head = url.slice(0, insertAt)
  const tail = url.slice(insertAt)

  // Avoid stacking transforms if the URL already carries one.
  if (/^[a-z]_[^/]*\//.test(tail)) return url

  return `${head}${PRESETS[preset]}/${tail}`
}

/** A ready-to-use thumbnail URL for grid rendering. */
export function thumbnailUrl(url: string): string {
  return withTransform(url, 'thumb')
}

/** A larger preview URL for the detail lightbox. */
export function previewUrl(url: string): string {
  return withTransform(url, 'full')
}
