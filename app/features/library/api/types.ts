export type AssetFileType = 'image' | 'video'

export interface Asset {
  id: string
  clientId: string
  url: string
  publicId: string
  fileType: AssetFileType
  tags: string[]
  sortOrder: number
  createdAt: string
}

export interface AssetListFilters {
  clientId: string
  fileType?: AssetFileType
  tag?: string
}

export interface AssetUploadResponse {
  asset: Asset
  success: boolean
  error?: string
}

export interface BatchResult {
  success: boolean
  affected: number
  error?: string
}
