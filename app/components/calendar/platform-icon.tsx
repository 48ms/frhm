import React from 'react'
import { Icons } from '@/components/icons'

const PLATFORM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  instagram: Icons.instagram,
  tiktok: Icons.tiktok,
  linkedin: Icons.linkedin,
  youtube: Icons.youtube,
  shorts: Icons.youtube,
  facebook: Icons.facebook,
  x: Icons.twitter,
  twitter: Icons.twitter,
}

export function PlatformIcon({ platform, className = 'size-4' }: { platform: string; className?: string }) {
  const Icon = PLATFORM_ICONS[platform?.toLowerCase()] ?? Icons.hub
  return <Icon className={className} />
}

