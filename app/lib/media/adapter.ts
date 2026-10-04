/**
 * Media storage adapter — vendor-agnostic boundary.
 *
 * The rest of the app depends on this interface, never on a specific provider.
 * Swapping Cloudinary for S3, R2 or Supabase Storage means editing this file only.
 *
 * Fail-closed: when credentials are missing the adapter reports the failure instead of
 * inventing a fake success URL. A silent fallback would let the UI claim an upload
 * succeeded while nothing was stored.
 */

export type UploadResult =
  | { success: true; url: string; publicId: string }
  | { success: false; error: string }

export interface MediaAdapter {
  uploadFile(file: File | Buffer, folder: string): Promise<UploadResult>
  deleteFile(publicId: string): Promise<boolean>
  /** True when the provider has the configuration it needs to accept uploads. */
  isConfigured(): boolean
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET

class CloudinaryAdapter implements MediaAdapter {
  isConfigured(): boolean {
    return Boolean(CLOUD_NAME && UPLOAD_PRESET)
  }

  async uploadFile(file: File | Buffer, folder: string): Promise<UploadResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'Media storage is not configured. Set CLOUDINARY credentials before uploading.',
      }
    }

    try {
      const formData = new FormData()
      // Buffer is wrapped so server-side callers can upload too.
      const blob = file instanceof File ? file : new Blob([new Uint8Array(file)])
      formData.append('file', blob)
      formData.append('upload_preset', UPLOAD_PRESET as string)
      formData.append('folder', folder)

      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, {
        method: 'POST',
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) {
        return { success: false, error: data.error?.message ?? 'Upload rejected by the provider' }
      }

      return { success: true, url: data.secure_url, publicId: data.public_id }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Upload failed' }
    }
  }

  async deleteFile(publicId: string): Promise<boolean> {
    if (!this.isConfigured()) return false
    // Deletion needs a signed request; wired when the admin delete flow lands.
    void publicId
    return false
  }
}

export const mediaAdapter: MediaAdapter = new CloudinaryAdapter()
